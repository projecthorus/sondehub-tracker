/* SondeHub ChaseCar lib
 * Uploads geolocation for chase cars to SondeHub
 *
 * Author: Rossen Gerogiev
 * Requires: jQuery
 * 
 * Updated to SondeHub v2 by Mark Jessop
 */

ChaseCar = {
    db_uri: "https://api.v2.sondehub.org/listeners",   // Sondehub API
    recovery_uri: "https://api.v2.sondehub.org/recovered",
};

// Updated SondeHub position upload function.
// Refer PUT listeners API here: https://generator.swagger.io/?url=https://raw.githubusercontent.com/projecthorus/sondehub-infra/main/swagger.yaml
// @callsign string
// @position object (geolocation position object)
ChaseCar.updatePosition = function(callsign, position) {
    if(!position || !position.coords) return;

    // Set altitude to zero if not provided.
    _position_alt = ((!!position.coords.altitude) ? position.coords.altitude : 0);

    var _doc = {
        "software_name": "SondeHub Tracker",
        "software_version": document.body.dataset.version,
        "uploader_callsign": callsign,
        "uploader_position": [position.coords.latitude, position.coords.longitude, _position_alt],
        "uploader_antenna": "Mobile Station",
        "uploader_contact_email": "none@none.com",
        "mobile": true
    };

    // push the doc to sondehub
    $.ajax({
            type: "PUT",
            url: ChaseCar.db_uri,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(_doc),
    });
};


ChaseCar.markRecovered = function(){

    // Distance limits reinstated 2021-12-04
    _run_checks = true;
    _range_limit = 500000; // 200 km

    // Get the serial number to be marked recovered
    _serial = $("#pr_serial").val().trim();

    _notes = $("#pr_notes").val().trim();

    // Check it exists.
    if(_serial.includes("chase") && _run_checks){
        $('#pr_last_report').text("Invalid sonde callsign.");
        return;
    }

    _callsign = $("#cc_callsign").val().trim();
    if (_callsign == "" || _callsign == undefined || _callsign.length == 0)
    {
        $('#pr_last_report').text("Enter a callsign in the chase-car section above!");
        return;
    }

    _recov_lat = 0.0;
    _recov_lon = 0.0;
    _recov_alt = 0.0;

    if(!vehicles.hasOwnProperty(_serial)){
        // Sonde is not on the map, so we need to use the chaser position.
        if($("#sw_use_car_pos").hasClass('on')){
            _recov_lat = parseFloat($('#cc_lat').text());
            _recov_lon = parseFloat($('#cc_lon').text());

            if (_recov_lat == 0.0 && _recov_lon == 0.0){
                $('#pr_last_report').text("Location Reporting must be enabled to use chase-car position!");
                return;
            }

        } else {
            $('#pr_last_report').text("Sonde not on map, either search for it in the search box (top left), or select 'Use Car Position' and try again.");
            return;
        }

    } else {
        // Sonde is on the map, so run some additional checks.
        _recov_lat = vehicles[_serial].curr_position['gps_lat'];
        _recov_lon = vehicles[_serial].curr_position['gps_lon'];

        // Now get the last position of the sonde.
        _sonde = {
            'lat':_recov_lat,
            'lon':_recov_lon,
            'alt':0.0
        };

        // Now get the chaser position.
        _chaser = {
            'lat': parseFloat($('#cc_lat').text()),
            'lon': parseFloat($('#cc_lon').text()),
            'alt': 0.0
        };

        // Calculate the distance from the sonde
        _lookangles = calculate_lookangles(_chaser, _sonde);

        if( (_lookangles.range > _range_limit ) && _run_checks){
            $('#pr_last_report').text("Outside distance limit (500km).");
            return;
        }

        if($("#sw_use_car_pos").hasClass('on')){
            _recov_lat = parseFloat($('#cc_lat').text());
            _recov_lon = parseFloat($('#cc_lon').text());
        }
    }


    var _doc = {
        "serial": _serial,
        "lat": _recov_lat,
        "lon": _recov_lon,
        "alt": 0.0,
        "recovered": $("#sw_recovery_ok").hasClass('on'),
        "recovered_by": _callsign,
        "description": _notes
    };

    // Yes this is not the right way to do this...
    // .. but it adds an extra bit of check.
    var res = grecaptcha.getResponse();
    if (res == "" || res == undefined || res.length == 0)
    {
        $('#pr_last_report').text("Do Recaptcha first!");
        return;
    }

    $('#pr_last_report').text("Submitting report...");

    $.ajax({
        type: "PUT",
        url: ChaseCar.recovery_uri,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify(_doc),
    }).done(function(data) {
        $('#pr_last_report').text("Reported OK!");
    })
    .fail(function(jqXHR, textStatus, error) {
        try {
            _fail_resp = JSON.parse(jqXHR.responseText);
            $('#pr_last_report').text(_fail_resp.message);
        } catch(err) {
            $('#pr_last_report').text("Failed to report.");
        }
    })

}