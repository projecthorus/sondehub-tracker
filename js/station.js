/* SondeHub Tracker Station Popup Functions
 *
 * Author: Luke Prior
 */

var launches_url = "https://api.v2.sondehub.org/sites";
var sites = null;

// Calculate the number of historical records for selected date range
// Set selectable months for selected year
function getSelectedNumber (station) {
    var popup = $("#popup" + station);
    var targetyear = popup.find("#yearList option:selected").val();
    var targetmonth = popup.find("#monthList option:selected").val();
    var count = 0;
    var data = stationHistoricalData[station];

    // Calculate count
    for (let year in data) {
        if (data.hasOwnProperty(year)) {
            if (year == targetyear || targetyear == "all") {
                for (let month in data[year]) {
                    if (data[year].hasOwnProperty(month)) {
                        if (month == targetmonth || targetmonth == "all" || targetyear == "all") {
                            count += data[year][month].length;
                        }
                    }
                }
            }
        }
    }

    // Update selected field & hide months if no data
    var months = ["all", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    popup.find('#yearList option').each(function() {
        if ($(this).is(':selected')) {
            $(this).attr("selected", "selected");
            var selectedYear = $(this).val();
            if (selectedYear != "all") {
                months = Object.keys(data[selectedYear]);
                months.push("all");
            }
        } else {
            $(this).attr("selected", false);
        }
    });

    popup.find('#monthList option').each(function() {
        if (!months.includes($(this).val())) {
            $(this).hide();
        } else {
            $(this).show();
        }
        if ($(this).is(':selected')) {
            $(this).attr("selected", "selected");
        } else {
            $(this).attr("selected", false);
        }
    });

    // Update popup
    popup.find("#launchCount").text(count);
}

// Get initial summary data for station, courtesy of TimMcMahon
function getHistorical (id, callback, continuation) {
    var prefix = 'launchsites/' + id + '/';
    var params = {
        Prefix: prefix,
    }; 

    if (typeof continuation !== 'undefined') {
        params.ContinuationToken = continuation;
    } else {
        tempLaunchData = {};
    }

    s3.makeUnauthenticatedRequest('listObjectsV2', params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            var tempSerials = [];
            for (var i = 0; i < data.Contents.length; i++) {
                // Sort data into year and month groups
                var date = data.Contents[i].Key.substring(prefix.length).substring(0,10);
                var year = date.substring(0,4);
                var month = date.substring(5,7);
                var serial = data.Contents[i].Key.substring(prefix.length+11).slice(0, -5);
                if (tempLaunchData.hasOwnProperty(year)) {
                    if (tempLaunchData[year].hasOwnProperty(month)) {
                        if (!tempSerials.includes(serial)) {
                            tempSerials.push(serial)
                            tempLaunchData[year][month].push(data.Contents[i].Key);
                        }
                    } else {
                        tempLaunchData[year][month] = [];
                        tempSerials = [];
                        tempSerials.push(serial)
                        tempLaunchData[year][month].push(data.Contents[i].Key);
                    }
                } else {
                    tempLaunchData[year] = {};
                    tempLaunchData[year][month] = [];
                    tempSerials = [];
                    tempSerials.push(serial)
                    tempLaunchData[year][month].push(data.Contents[i].Key);
                }
            }
            if (data.IsTruncated == true) {
                // Requests are limited to 1000 entries so multiple may be required
                getHistorical(id, callback, data.NextContinuationToken);
            } else {
                callback(tempLaunchData);
            }
        }
    });   
}

// Download summary data from AWS S3
function downloadHistorical (suffix) {
    var url = "https://sondehub-history.s3.amazonaws.com/" + suffix;
    var ajaxReq = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        tryCount : 0,
        retryLimit : 3, // Retry max of 3 times
        error : function(xhr, textStatus, errorThrown ) {
            if (textStatus == 'timeout') {
                this.tryCount++;
                if (this.tryCount <= this.retryLimit) {
                    //try again
                    $.ajax(this);
                    return;
                }
                return;
            }
        }
    });
    historicalAjax.push(ajaxReq);
    return ajaxReq;
}

// Draw historic summaries to map
function drawHistorical (data, station) {
    var landing = data[2];
    var serial = landing.serial;
    var time = landing.datetime;

    if (!historicalPlots[station].sondes.hasOwnProperty(serial)) {

        historicalPlots[station].sondes[serial] = {};

        // Using last known alt to detmine colour
        var minAlt = 0;
        var actualAlt = landing.alt;
        var maxAlt = 10000;

        if (actualAlt > maxAlt) {
            actualAlt = maxAlt;
        } else if (actualAlt < minAlt) {
            actualAlt = minAlt;
        }

        var normalisedAlt = ((actualAlt-minAlt)/(maxAlt-minAlt));
        var iconColour = ConvertRGBtoHex(evaluate_cmap(normalisedAlt, 'turbo'));

        // Check if we have recovery data for it
        var recovered = false;
        if (historicalPlots[station].data.hasOwnProperty("recovered")) {
            if (historicalPlots[station].data.recovered.hasOwnProperty(serial)) {
                var recovery_info = historicalPlots[station].data.recovered[serial];
                recovered = true;
            }
        }

        var popup = new L.popup({ autoClose: false, closeOnClick: false }).setContent(serial);

        if (!recovered) {
            var marker = L.circleMarker([landing.lat, landing.lon], {fillColor: "white", color: iconColour, weight: 3, radius: 5, fillOpacity:1});
        } else {
            var marker = L.circleMarker([landing.lat, landing.lon], {fillColor: "grey", color: iconColour, weight: 3, radius: 5, fillOpacity:1});
        }

        marker.bindPopup(popup);

        div = document.createElement('div');

        html = "<div style='line-height:16px;position:relative;'>";
        html += "<div>"+serial+" <span style=''>("+time+")</span></div>";
        html += "<hr style='margin:5px 0px'>";
        html += "<div><b>Last Position:&nbsp;</b>"+format_coordinates(landing.lat, landing.lon, serial)+"</div>";

        var imp = offline.get('opt_imperial');
        var text_alt = Number((imp) ? Math.floor(3.2808399 * parseInt(landing.alt)) : parseInt(landing.alt)).toLocaleString("us");
        text_alt += "&nbsp;" + ((imp) ? 'ft':'m');

        html += "<div><b>Altitude:&nbsp;</b>"+text_alt+"</div>";
        html += "<div><b>Time:&nbsp;</b>"+formatDate(stringToDateUTC(time))+"</div>";
        html += "<div><b>Sonde Type:&nbsp;</b><span class='landing_sonde_type'>Unknown</span></div>"

        html += "<hr style='margin:0px;margin-top:5px'>";

        html += "<div class='recovery_section' style='line-height:16px;position:relative;'>";
        html += "<div><b class='recovery_text'></b></div>";
        html += "<div><b>Reported at:&nbsp;</b><span class='recovery_time'></span></div>";
        html += "<div><b>Reported by:&nbsp;</b><span class='recovery_by'></span></div>";
        html += "<div><b>Notes:&nbsp;</b><span class='recovery_desc'></span></div>";
        html += "<hr style='margin:0px;margin-top:5px'>";
        html += "</div>";

        html += "<div><b>Show Full Flight Path:&nbsp;</b><a href='#' class='recovery_path'></a></div>";

        html += "<hr style='margin:0px;margin-top:5px'>";
        html += "<div style='font-size:11px;'>"
        html += "<div><b><span class='landing_uploader_callsign'></span></b></div>"
        html += "</div>";

        div.innerHTML = html;


        div.getElementsByClassName("recovery_path")[0].textContent = serial
        div.getElementsByClassName("recovery_path")[0].onclick = function(){
          showRecoveredMap(serial)
        }

        if (landing.hasOwnProperty("type")) {
            div.getElementsByClassName("landing_sonde_type")[0].textContent = landing.type;
        };

        if (landing.hasOwnProperty("uploader_callsign")) {
            div.getElementsByClassName("landing_uploader_callsign")[0].textContent = "Last received by: " + landing.uploader_callsign.toLowerCase();
        };

        if (recovered) {
            _recovered_text = recovery_info.recovered ? " Recovered" : "Not Recovered";

            // Override text is planned field exists and is true
            if(recovery_info.hasOwnProperty('planned')){
              if(recovery_info.planned == true){
                  _recovered_text = " Recovery Planned";
              }
            }
            div.getElementsByClassName("recovery_text")[0].textContent = recovery_info.serial + _recovered_text;
            div.getElementsByClassName("recovery_time")[0].textContent = formatDate(stringToDateUTC(recovery_info.datetime));
            div.getElementsByClassName("recovery_by")[0].textContent = recovery_info.recovered_by;
            div.getElementsByClassName("recovery_desc")[0].textContent = recovery_info.description;
        } else {
            div.getElementsByClassName("recovery_section")[0].style.display = "none";
        }

        popup.setContent(div);


        marker.addTo(map);
        marker.bringToBack();
        historicalPlots[station].sondes[serial].marker = marker;
    }
}

// Delete historic summaries from map
function deleteHistorical (station) {
    var popup = $("#popup" + station);
    var deleteHistorical = popup.find("#deleteHistorical");
    var historicalDelete = $("#historicalControlButton");

    deleteHistorical.hide();

    if (historicalPlots.hasOwnProperty(station)) {
        for (let serial in historicalPlots[station].sondes) {
            map.removeLayer(historicalPlots[station].sondes[serial].marker);
        }
    }

    delete historicalPlots[station];

    var otherSondes = false;

    for (station in historicalPlots) {
        if (historicalPlots.hasOwnProperty(station)) {
            if (Object.keys(historicalPlots[station].sondes).length > 1) {
                otherSondes = true;
            }
        }
    }

    if (!otherSondes) historicalDelete.hide();
}

// Delete all historic sondes from map
function deleteHistoricalButton() {
    var historicalDelete = $("#historicalControlButton");

    for (station in historicalPlots) {
        if (historicalPlots.hasOwnProperty(station)) {
            historicalPlots[station].data.drawing = false;
            for (let serial in historicalPlots[station].sondes) {
                map.removeLayer(historicalPlots[station].sondes[serial].marker);
            }
            // Hide delete historical button from popup
            var realpopup = launches.getLayer(stationMarkerLookup[station]).getPopup();
            var popup = $("#popup" + station);
            var deleteHistorical = popup.find("#deleteHistorical");
            deleteHistorical.hide();
            // Required if popup is closed
            if (!realpopup.isOpen()) {
                var tempContent = $(realpopup.getContent());
                tempContent.find("#deleteHistorical").hide();
                realpopup.setContent("<div id='popup" + station + "'>" + tempContent.html() + "</div>");
            }
        }
    }

    // Cancel any queued or ongoing historical requests
    for (i=0; i < historicalAjax.length; i++) {
        historicalAjax[i].abort();
    }

    historicalAjax = [];

    historicalPlots = {};

    historicalDelete.hide();

}

// Delete all launch site predictions from map
function deletePredictionButton() {
    var predictionDelete = $("#predictionControlButton");

    for (var marker in launchPredictions) {
        if (launchPredictions.hasOwnProperty(marker)) {
            for (var prediction in launchPredictions[marker]) {
                if (launchPredictions[marker].hasOwnProperty(prediction)) {
                    for (var object in launchPredictions[marker][prediction]) {
                        if (launchPredictions[marker][prediction].hasOwnProperty(object)) {
                            map.removeLayer(launchPredictions[marker][prediction][object]);
                        }
                    }
                }
            }
            // Hide delete historical prediction button from popup
            var realpopup = launches.getLayer(marker).getPopup();
            var popup = $("#popup" + markerStationLookup[marker]);
            var deletePrediction = popup.find("#predictionDeleteButton");
            deletePrediction.hide();
            // Required if popup is closed
            if (!realpopup.isOpen()) {
                var tempContent = $(realpopup.getContent());
                tempContent.find("#predictionDeleteButton").hide();
                realpopup.setContent("<div id='popup" + markerStationLookup[marker] + "'>" + tempContent.html() + "</div>");
            }
        }
    }

    launchPredictions = {};

    // Cancel any queued or ongoing launch site prediction requests
    for (i=0; i < predictionAjax.length; i++) {
        predictionAjax[i].abort();
    }

    predictionAjax = [];

    predictionDelete.hide();

}

// Master function to display historic summaries
function showHistorical (station, marker) {
    var popup = $("#popup" + station);
    var realpopup = launches.getLayer(marker).getPopup();
    var submit = popup.find("#submit");
    var submitLoading = popup.find("#submitLoading");
    var deleteHistorical = popup.find("#deleteHistorical");
    var targetyear = popup.find("#yearList option:selected").val();
    var targetmonth = popup.find("#monthList option:selected").val();

    submit.hide();
    submitLoading.show();
    deleteHistorical.hide();

    var sondes = [];
    var data = stationHistoricalData[station];

    // Generate list of serial URLs
    for (let year in data) {
        if (data.hasOwnProperty(year)) {
            if (year == targetyear || targetyear == "all") {
                for (let month in data[year]) {
                    if (data[year].hasOwnProperty(month)) {
                        if (month == targetmonth || targetmonth == "all" || targetyear == "all") {
                            sondes = sondes.concat(data[year][month]);
                        }
                    }
                }
            }
        }
    }

    // Generate date range for station
    dateNow = new Date();
    dateNow.setDate(dateNow.getDate() + 2);

    if (!historicalPlots.hasOwnProperty(station)) {
        historicalPlots[station] = {};
        historicalPlots[station].sondes = {};
        historicalPlots[station].data = {};
    }

    // Get station location to fetch recoveries
    if (!historicalPlots[station].data.hasOwnProperty("recovered")) {
        historicalPlots[station].data.recovered = {};

        var station_position = sites[station].position;
        var data_str = "lat=" + station_position[0] + "&lon=" + station_position[1] + "&distance=400000&last=0";

        $.ajax({
            type: "GET",
            url: recovered_sondes_url,
            data: data_str,
            dataType: "json",
            success: function(json) {
                for (var i = 0; i < json.length; i++) {
                    historicalPlots[station].data.recovered[json[i].serial] = json[i];
                }
                processHistorical()
            },
            error: function() {
                processHistorical();
            }
        });
    } else {
        processHistorical();
    }

    function processHistorical() {
        var historicalDelete = $("#historicalControlButton");
        historicalDelete.show();

        historicalPlots[station].data.drawing = true;

        for (let i = 0; i < sondes.length; i++) {
            downloadHistorical(sondes[i]).done(handleData).fail(handleError);
        }
    
        var completed = 0;
    
        function handleData(data) {
            completed += 1;
            try {
                drawHistorical(data, station);
            } catch(e) {};
            if (completed == sondes.length) {
                submit.show();
                submitLoading.hide();
                if (historicalPlots[station].data.drawing) deleteHistorical.show();
                // If modal is closed the contents needs to be forced updated
                if (!realpopup.isOpen()) {
                    realpopup.setContent("<div id='popup" + station + "'>" + popup.html() + "</div>");
                }
                historicalPlots[station].data.drawing = false;
            }
        }
    
        function handleError(error) {
            completed += 1;
            if (completed == sondes.length) {
                submit.show();
                submitLoading.hide();
                if (historicalPlots[station].data.drawing) deleteHistorical.show();
                // If modal is closed the contents needs to be forced updated
                if (!realpopup.isOpen()) {
                    realpopup.setContent("<div id='popup" + station + "'>" + popup.html() + "</div>");
                }
                historicalPlots[station].data.drawing = false;
            }
        }
    }
}

// Used to generate the content for station modal
function historicalLaunchViewer(station, marker) {
    var realpopup = launches.getLayer(marker).getPopup();
    var popup = $("#popup" + station);
    var historical = popup.find("#historical");
    function populateDropDown(data) {
        // Save data
        stationHistoricalData[station] = data;

        // Check if data exists
        if (Object.keys(data).length == 0) {
            historical.html("<br><hr style='margin-bottom:0;'><br>No historical data<br>");
            historical.show();
            historicalButton.show();
            historicalButtonLoading.hide();
            // If modal is closed the contents needs to be forced updated
            if (!realpopup.isOpen()) {
                realpopup.setContent("<div id='popup" + station + "'>" + popup.html() + "</div>");
            }
            return;
        }

        // Find latest year
        var latestYear = "0";
        var latestYears = Object.keys(data);
        for (var i=0; i < latestYears.length; i++) {
            if (parseInt(latestYears[i]) > parseInt(latestYear)) {
                latestYear = latestYears[i];
            }
        }

        // Generate year drop down
        var yearList = document.createElement("select");
        yearList.name = "year"
        yearList.id = "yearList";
        var option = document.createElement("option");
        option.value = "all";
        option.text = "All";
        yearList.appendChild(option);
        for (let year in data) {
            if (data.hasOwnProperty(year)) {
                var option = document.createElement("option");
                option.value = year;
                option.text = year;
                if (year == latestYear) {
                    option.setAttribute("selected", "selected");
                }
                yearList.appendChild(option);
            }
        }

        // Find latest month
        var latestMonth = "0";
        var latestMonths = Object.keys(data[latestYear]);
        for (var i=0; i < latestMonths.length; i++) {
            if (parseInt(latestMonths[i]) > parseInt(latestMonth)) {
                latestMonth = latestMonths[i];
            }
        }

        // Generate month drop down
        var monthList = document.createElement("select");
        monthList.name = "month"
        monthList.id = "monthList";
        var option = document.createElement("option");
        option.value = "all";
        option.text = "All";
        monthList.appendChild(option);
        var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        var monthsText = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        for (var i=0; i < months.length; i++) {
            var option = document.createElement("option");
            option.value = months[i];
            option.text = monthsText[i];
            if (months[i] == latestMonth) {
                option.setAttribute("selected", "selected");
            }
            monthList.appendChild(option);
        }
        

        // Calculate total launches
        var totalLaunches = 0;
        for (let year in data) {
            if (data.hasOwnProperty(year)) {
                for (let month in data[year]) {
                    if (data[year].hasOwnProperty(month)) {
                        totalLaunches += data[year][month].length;
                    }
                }
            }
        }
        
        // Generate HTML
        var popupContent = "<br><hr style='margin-bottom:0;'><br>Launches Selected: <span id='launchCount'>" + totalLaunches + "</span><br>";
        popupContent += "<form onchange='getSelectedNumber(\"" + station + "\")'><label for='year'>Year:</label>" + yearList.outerHTML;
        popupContent += "<label for='month'>Month:</label>" + monthList.outerHTML + "</form>";
        popupContent += "<br><button id='submit' onclick='return showHistorical(\"" + station + "\", \"" + marker + "\")'>Fetch</button><img id='submitLoading' style='width:60px;height:20px;display:none;' src='img/hab-spinner.gif' /><button id='deleteHistorical' style='display:none;' onclick='return deleteHistorical(\"" + station + "\")'>Delete</button>";
        historical.html(popupContent);
        historical.show();
        historicalButton.show();
        historicalButtonLoading.hide();
        // If modal is closed the contents needs to be forced updated
        if (!realpopup.isOpen()) {
            realpopup.setContent("<div id='popup" + station + "'>" + popup.html() + "</div>");
        }
        getSelectedNumber(station);
    }
    if (historical.is(":visible")) {
        // Don't regenerate if already in memory
        historical.hide();
    } else {
        if (stationHistoricalData.hasOwnProperty(station) && popup.find("#launchCount").length) {
            // Don't regenerate if already in memory
            historical.show();
        } else {
            var historicalButton = popup.find("#historicalButton");
            var historicalButtonLoading = popup.find("#historicalButtonLoading");
            historicalButton.hide();
            historicalButtonLoading.show();
            getHistorical(station, populateDropDown);
        }
    }
}

function launchSitePredictions(times, station, properties, marker, id) {
    var realpopup = launches.getLayer(marker).getPopup();
    var popup = $("#popup" + id);
    var predictionButton = popup.find("#predictionButton");
    var predictionButtonLoading = popup.find("#predictionButtonLoading");
    var predictionDeleteButton = popup.find("#predictionDeleteButton");

    predictionButton.hide();
    predictionButtonLoading.show();

    if (predictionDeleteButton.is(':visible')) {
        deletePredictions(marker, id);
        predictionDeleteButton.hide();
    }
    position = station.split(",");
    properties = properties.split(":");
    var now = new Date();
    if (times.length > 0) {
        times = times.split(",");
        var maxCount = 24
        var count = 0;
        var day = 0;
        var dates = [];
        while (day < 8) {
            for (var i = 0; i < times.length; i++) {
                var date = new Date();
                var time = times[i].split(":");
                if (time[0] != 0) {
                    date.setDate(date.getDate() + (7 + time[0] - date.getDay()) % 7);
                }
                date.setUTCHours(time[1]);
                date.setUTCMinutes(time[2]);
                date.setSeconds(0);
                date.setMilliseconds(0);
                // launch time 45 minutes before target time
                date.setMinutes( date.getMinutes() - 45 );
                while (date < now) {
                    if (time[0] == 0) {
                        date.setDate(date.getDate() + 1);
                    } else {
                        date.setDate(date.getDate() + 7);
                    }
                }
                if (day > 0) {
                    if (time[0] == 0) {
                        date.setDate(date.getDate() + day);
                    } else {
                        date.setDate(date.getDate() + (7*day));
                    }
                }
                if (count < maxCount) {
                    if (((date - now) / 36e5) < 170) {
                        if (!dates.includes(date.toISOString().split('.')[0]+"Z")) {
                            dates.push(date.toISOString().split('.')[0]+"Z");
                            count += 1;
                        }
                    }
                }
            }
            day += 1;
        }
        dates.sort();
    } else {
        var date = new Date();
        var dates = [];
        dates.push(date.toISOString().split('.')[0]+"Z");
    }
    var completed = 0;
    var predictionDelete = $("#predictionControlButton");
    predictionDelete.show();
    for (var i = 0; i < dates.length; i++) {
        var lon = ((360 + (position[1] % 360)) % 360);
        //var url = "https://predict.cusf.co.uk/api/v1/?launch_latitude=" + position[0] + "&launch_longitude=" + lon + "&launch_datetime=" + dates[i] + "&ascent_rate=" + properties[0] + "&burst_altitude=" + properties[2] + "&descent_rate=" + properties[1];
        var url = "https://api.v2.sondehub.org/tawhiri?launch_latitude=" + position[0] + "&launch_longitude=" + lon + "&launch_datetime=" + dates[i] + "&ascent_rate=" + properties[0] + "&burst_altitude=" + properties[2] + "&descent_rate=" + properties[1];
        showPrediction(url).done(handleData).fail(handleError);
    }
    function handleData(data) {
        completed += 1;
        plotPrediction(data, dates, marker, properties);
        if (completed == dates.length) {
            if (Object.keys(launchPredictions).length != 0) predictionDeleteButton.show();
            predictionButton.show();
            predictionButtonLoading.hide();
            if (!realpopup.isOpen()) {
                realpopup.setContent("<div id='popup" + id + "'>" + popup.html() + "</div>");
            }
        }
    }
    function handleError(error) {
        completed += 1;
        if (completed == dates.length) {
            if (Object.keys(launchPredictions).length != 0) predictionDeleteButton.show();
            predictionButton.show();
            predictionButtonLoading.hide();
            if (!realpopup.isOpen()) {
                realpopup.setContent("<div id='popup" + id + "'>" + popup.html() + "</div>");
            }
        }
    }
}

function plotPrediction (data, dates, marker, properties) {
    if (!launchPredictions.hasOwnProperty(marker)) {
        launchPredictions[marker] = {};
    }
    launchPredictions[marker][dates.indexOf(data.request.launch_datetime)+1] = {};
    plot = launchPredictions[marker][dates.indexOf(data.request.launch_datetime)+1];

    ascent = data.prediction[0].trajectory;
    descent = data.prediction[1].trajectory;
    var predictionPath = [];
    for (var i = 0; i < ascent.length; i++) {
        if (ascent[i].longitude > 180.0) {
            var longitude = ascent[i].longitude - 360.0;
        } else {
            var longitude = ascent[i].longitude;
        }
        predictionPath.push([ascent[i].latitude, longitude]);
    };
    for (var x = 0; x < descent.length; x++) {
        if (descent[x].longitude > 180.0) {
            var longitude = descent[x].longitude - 360.0;
        } else {
            var longitude = descent[x].longitude;
        }
        predictionPath.push([descent[x].latitude, longitude]);
    };
    var burstPoint = ascent[ascent.length-1];
    var landingPoint = descent[descent.length-1];

    plot.predictionPath = new L.polyline(predictionPath, {color: 'red'}).addTo(map);

    burstIconImage = host_url + markers_url + "balloon-pop.png";

    burstIcon = new L.icon({
        iconUrl: burstIconImage,
        iconSize: [20,20],
        iconAnchor: [10, 10],
    });

    if (burstPoint.longitude > 180.0) {
        var burstLongitude = burstPoint.longitude - 360.0;
    } else {
        var burstLongitude = burstPoint.longitude;
    }

    plot.burstMarker = new L.marker([burstPoint.latitude, burstLongitude], {
        icon: burstIcon
    }).addTo(map);

    var burstTime = new Date(burstPoint.datetime);
    var burstTooltip = "<b>Time: </b>" + burstTime.toLocaleString() + "<br><b>Altitude: </b>" + Math.round(burstPoint.altitude) + "m";
    plot.burstMarker.bindTooltip(burstTooltip, {offset: [5,0]});

    if (landingPoint.longitude > 180.0) {
        var landingLongitude = landingPoint.longitude - 360.0;
    } else {
        var landingLongitude = landingPoint.longitude;
    }

    plot.landingMarker = new L.marker([landingPoint.latitude, landingLongitude], {
        icon: new L.NumberedDivIcon({number: dates.indexOf(data.request.launch_datetime)+1})
    }).addTo(map);

    var landingTime = new Date(landingPoint.datetime);
    if (properties[3] != "" && properties[4] != "") {
        var landingTooltip = "<b>Time:</b> " + landingTime.toLocaleString() + "<br><b>Model Dataset:</b> " + data.request.dataset + 
        "<br><b>Model Assumptions:</b><br>- " + data.request.ascent_rate + "m/s ascent<br>- " + data.request.burst_altitude + "m burst altitude (" + properties[3] + " samples)<br>- " + data.request.descent_rate + "m/s descent (" + properties[4] + " samples)";
    } else {
        var landingTooltip = "<b>Time:</b> " + landingTime.toLocaleString() + "<br><b>Model Dataset:</b> " + data.request.dataset + 
        "<br><b>Model Assumptions:</b><br>- " + data.request.ascent_rate + "m/s ascent<br>- " + data.request.burst_altitude + "m burst altitude<br>- " + data.request.descent_rate + "m/s descent";
    }
    plot.landingMarker.bindTooltip(landingTooltip, {offset: [13,-28]});
}

function showPrediction(url) {
    var ajaxReq = $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
    });
    predictionAjax.push(ajaxReq);
    return ajaxReq;
}

function deletePredictions(marker, station) {
    var predictionDelete = $("#predictionControlButton");
    if (launchPredictions.hasOwnProperty(marker)) {
        for (var prediction in launchPredictions[marker]) {
            if (launchPredictions[marker].hasOwnProperty(prediction)) {
                for (var object in launchPredictions[marker][prediction]) {
                    if (launchPredictions[marker][prediction].hasOwnProperty(object)) {
                        map.removeLayer(launchPredictions[marker][prediction][object]);
                    }
                }
            }
        }
        delete launchPredictions[marker];
    }
    var popup = $("#popup" + station);
    var predictionDeleteButton = popup.find("#predictionDeleteButton");
    if (predictionDeleteButton.is(':visible')) {
        predictionDeleteButton.hide();
    }
    if (Object.keys(launchPredictions).length == 0) predictionDelete.hide();
}

function getLaunchSites() {
    $.ajax({
        type: "GET",
        url: launches_url,
        dataType: "json",
        success: function(json) {
            sites = json;
            generateLaunchSites();
        }
    });
}

function generateLaunchSites() {
    for (var key in sites) {
        if (sites.hasOwnProperty(key)) {
            var latlon = [sites[key].position[1], sites[key].position[0]];
            var sondesList = "";
            var popupContent = "<div id='popup" + key + "'>";
            var div = document.createElement('div');
            div.id = "popup" + key;
            var ascent_rate = 5;
            var descent_rate = 6;
            var burst_altitude = 26000;
            var burst_samples = "";
            var descent_samples = "";
            var marker = new L.circleMarker(latlon, {color: '#696969', fillColor: "white", radius: Math.min(map.getZoom(),8)});
            var popup = new L.popup({ autoClose: false, closeOnClick: false });
            marker.title = key;
            marker.bindPopup(popup);
            launches.addLayer(marker);

            // Match sonde codes
            if (sites[key].hasOwnProperty('rs_types')) {
                var sondes = sites[key].rs_types;
                for (var y = 0; y < sondes.length; y++) {
                    if (Array.isArray(sondes[y]) == false) {
                        sondes[y] = [sondes[y]];
                    }
                    if (sondeCodes.hasOwnProperty(sondes[y][0])) {
                        sondesList += sondeCodes[sondes[y][0]]
                        if (sondes[y].length > 1) {
                            sondesList += " (" + sondes[y][1] + " MHz)";
                        }
                    } else if (unsupportedSondeCodes.hasOwnProperty(sondes[y][0])) {
                        sondesList += unsupportedSondeCodes[sondes[y][0]];
                        sondesList += " (cannot track)";
                    } else {
                        sondesList += sondes[y][0] + " (unknown WMO code)";
                    }
                    if (y < sondes.length-1) {
                        sondesList += ", ";
                    }
                }
                if (sondes.includes("11") || sondes.includes("82")) { //LMS6
                    ascent_rate = 5;
                    descent_rate = 2.5;
                    burst_altitude = 33500;
                }
                popupContent += "<font style='font-size: 13px'>" + sites[key].station_name + "</font><br><br><b>Sondes launched:</b> " + sondesList;
            }
        
            // Generate prefilled suggestion form
            var popupLink = "https://docs.google.com/forms/d/e/1FAIpQLSfIbBSQMZOXpNE4VpK4BqUbKDPCWCDgU9QxYgmhh-JD-JGSsQ/viewform?usp=pp_url&entry.796606853=Modify+Existing+Site";
            popupLink += "&entry.749833526=" + key;
            if (sites[key].hasOwnProperty('station_name')) {
                popupLink += "&entry.675505431=" + sites[key].station_name.replace(/\s/g, '+');
            }
            if (sites[key].hasOwnProperty('position')) {
                popupLink += "&entry.1613779787=" + sites[key].position.reverse().toString();
            }
            if (sites[key].hasOwnProperty('alt')) {
                popupLink += "&entry.753148337=" + sites[key].alt;
            }
            if (sites[key].hasOwnProperty('ascent_rate')) {
                popupLink += "&entry.509146334=" + sites[key]["ascent_rate"];
            }
            if (sites[key].hasOwnProperty('burst_altitude')) {
                popupLink += "&entry.1897602989=" + sites[key]["burst_altitude"];
            }
            if (sites[key].hasOwnProperty('descent_rate')) {
                popupLink += "&entry.267462486=" + sites[key]["descent_rate"];
            }
            if (sites[key].hasOwnProperty('notes')) {
                popupLink += "&entry.197384117=" + sites[key]["notes"].replace(/\s/g, '+');
            }

            // Update prediction data if provided
            if (sites[key].hasOwnProperty('ascent_rate')) {
                ascent_rate = sites[key]["ascent_rate"];
            }
            if (sites[key].hasOwnProperty('descent_rate')) {
                descent_rate = sites[key]["descent_rate"];
            }
            if (sites[key].hasOwnProperty('burst_altitude')) {
                burst_altitude = sites[key]["burst_altitude"];
            }
            if (sites[key].hasOwnProperty('burst_samples')) {
                burst_samples = sites[key]["burst_samples"];
            }
            if (sites[key].hasOwnProperty('descent_samples')) {
                descent_samples = sites[key]["descent_samples"];
            }

            // Process launch schedule if provided
            if (sites[key].hasOwnProperty('times')) {
                popupContent += "<br><b>Launch schedule:</b>";
                for (var x = 0; x < sites[key]['times'].length; x++) {
                    popupContent += "<br>- ";
                    var day = sites[key]['times'][x].split(":")[0];
                    if (day == 0) {
                        popupContent += "Everyday at ";
                    } else if (day == 1) {
                        popupContent += "Monday at ";
                    } else if (day == 2) {
                        popupContent += "Tuesday at ";
                    } else if (day == 3) {
                        popupContent += "Wednesday at ";
                    } else if (day == 4) {
                        popupContent += "Thursday at ";
                    } else if (day == 5) {
                        popupContent += "Friday at ";
                    } else if (day == 6) {
                        popupContent += "Saturday at ";
                    } else if (day == 7) {
                        popupContent += "Sunday at ";
                    }
                    popupContent += sites[key]['times'][x].split(":")[1] + ":" + sites[key]['times'][x].split(":")[2] + " UTC";
                }
            }
                
            // Show notes if provided
            if (sites[key].hasOwnProperty('notes')) {
                popupContent += "<br><b>Notes:</b> " + sites[key]["notes"];
            }
                
            popupContent += "<br><b>Know when this site launches?</b> Contribute <a href='" + popupLink + "' target='_blank'>here</a>";

            // Generate view historical button
            popupContent += "<br><button id='historicalButton' onclick='historicalLaunchViewer(\"" + key + "\", \"" + launches.getLayerId(marker) + "\")' style='margin-bottom:0;'>Historical</button><img id='historicalButtonLoading' style='width:60px;height:20px;display:none;' src='img/hab-spinner.gif' />";

            // Create prediction button
            if (sites[key].hasOwnProperty('times')) {
                popupContent += "<button id='predictionButton' onclick='launchSitePredictions(\"" + sites[key]['times'].toString() + "\", \"" + latlon.toString() + "\", \"" + ascent_rate + ":" + descent_rate + ":" + burst_altitude + ":" + burst_samples + ":" + descent_samples + "\", \"" + launches.getLayerId(marker) + "\", \"" + key + "\")' style='margin-bottom:0;'>Generate Predictions</button><img id='predictionButtonLoading' style='width:60px;height:20px;display:none;' src='img/hab-spinner.gif' /><button id='predictionDeleteButton' onclick='deletePredictions(\"" + launches.getLayerId(marker) + "\", \"" + key + "\")' style='margin-bottom:0;display:none;'>Delete</button>";
            } else {
                popupContent += "<button id='predictionButton' onclick='launchSitePredictions(\"" + "\", \"" + latlon.toString() + "\", \"" + ascent_rate + ":" + descent_rate + ":" + burst_altitude + ":" + burst_samples + ":" + descent_samples + "\", \"" + launches.getLayerId(marker) + "\", \"" + key + "\")' style='margin-bottom:0;'>Instant Prediction</button><img id='predictionButtonLoading' style='width:60px;height:20px;display:none;' src='img/hab-spinner.gif' /><button id='predictionDeleteButton' onclick='deletePredictions(\"" + launches.getLayerId(marker) + "\", \"" + key + "\")' style='margin-bottom:0;display:none;'>Delete</button>";
            }

            popupContent += "<div id='historical' style='display:none;'></div>";

            div.innerHTML = popupContent;

            popup.setContent(div.innerHTML);

            var leafletID = launches.getLayerId(marker);

            stationMarkerLookup[key] = leafletID;
            markerStationLookup[leafletID] = key;
        }
    }
    if (focusID != 0) {
        gotoSite();
    }
}

// URL parameter redirect
function gotoSite() {
    if (sites != null) {
        if (sites.hasOwnProperty(focusID)) {
            var site = sites[focusID];
            var latlng = new L.LatLng(site["position"][0], site["position"][1]);
            map.setView(latlng, 9);
            for (var i in launches._layers) {
                marker = launches._layers
                if (marker[i].title == focusID) {
                    marker[i].openPopup();
                }
            }
        }
    }
}