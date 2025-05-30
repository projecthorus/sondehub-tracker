// detect if mobile
var is_mobile = false;

(function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) is_mobile = true;})(navigator.userAgent||navigator.vendor||window.opera);

// hash url
var history_supported = (typeof history !== 'undefined');

function lhash_update(history_step) {
    history_step = !!history_step;

    var url = document.location.href.split("#",1)[0];
    var hash = "";

    // generate hash
    hash += "mt=" + selectedLayer;
    hash += "&mz=" + map.getZoom();

    if(!/^[a-z0-9]{32}$/ig.exec(wvar.query)) {
        hash += "&qm=" + wvar.mode.replace(/ /g, '_');
    }

    if(follow_vehicle === null || manual_pan) {
        var latlng = map.getCenter();
        hash += "&mc=" + roundNumber(latlng.lat, 5) +
                "," + roundNumber(latlng.lng, 5);
    }

    if(follow_vehicle !== null) {
        hash += "&f=" + follow_vehicle;
    }

    if(wvar.query !== "") {
        hash += "&q=" + wvar.query;
        $("header .search input[type='text']").val(wvar.query);
    }

    // other vars
    if(wvar.nyan) {
        hash += "&nyan=1";
    }

    if(wvar.nena) {
        hash += "&nena=1";
    }
    if(wvar.box) { // We just need something to change so we can trigger the back button correctly
        hash += "&box="+wvar.box;
    }

    hash = encodeURI(hash);
    // set state
    if(history_supported) {
        if(!history_step) {
            history.replaceState(null, null, url + "#!" + hash);
        } else {
            history.pushState(null, null, url + "#!" + hash);
        }
    } else {
        document.location.hash = "!" + hash;
    }
}

// wvar detection
var wvar = {
    enabled: false,
    vlist: true,
    graph: true,
    graph_exapnded: false,
    focus: "",
    mode: (is_mobile) ? modeDefaultMobile : modeDefault,
    zoom: true,
    query: "",
    nyan: false,
    nena: false,
    site: 0,
    box: ""
};


function load_hash(no_refresh) {
    no_refresh = (no_refresh === null);
    var hash = window.location.hash.slice(2);

    if(hash === "") return;

    var parms = hash.split('&');
    var refresh = false;
    var refocus = false;

    // defaults
    manual_pan = false;

    var def = {
        mode: wvar.mode,
        zoom: true,
        focus: "",
        query: "",
        nyan: false,
        nena: false,
        box: ""
    };

    parms.forEach(function(v) {
        v = v.split('=');
        k = v[0];
        v = decodeURIComponent(v[1]);

        switch(k) {
            case "mt":
                if( baseMaps.hasOwnProperty(v) && map) {
                    map.removeLayer(baseMaps[selectedLayer]);
                    selectedLayer = v;
                    map.addLayer(baseMaps[v]);
                }
                break;
            case "mz":
                if (map){
                    map.setZoom(parseInt(v));
                }
                break;
            case "mc":
                def.zoom = false;
                manual_pan = true;
                v = v.split(',');
                var latlng = new L.LatLng(v[0], v[1]);
                if (map){
                    map.panTo(latlng);
                }
                break;
            case "f":
                v = v.toUpperCase();
                refocus = (follow_vehicle != v);
                follow_vehicle = v;
                def.focus = v;
                break;
            case "qm":
                def.mode = v.replace(/_/g, ' ');
                if(modeList.indexOf(def.mode) == -1) def.mode = (is_mobile) ? modeDefaultMobile : modeDefault;
                break;
            case "q":
                v = v.toUpperCase();
                def.query = v;
                $("header .search input[type='text']").val(v);
                break;
            case "nyan":
                def[k] = !!parseInt(v);
                break;
            case "nena":
                def[k] = !!parseInt(v);
                break;
            case "site":
                focusID = v;
                gotoSite(v);
                break;
            case "box":
                def[k] = v;
                break;
        }
    });

    // check if we should force refresh
    ['mode','query','nyan','nena'].forEach(function(k) {
        if(wvar[k] != def[k]) refresh = true;
    });



    $.extend(true, wvar, def);
    if(map){
        if (!def["box"]){
            $(".flatpage").hide()
        } else {
            $(".flatpage").hide()
            $("#"+def["box"]).show()
        }
        checkSize();
        wvar["box"]= def["box"];

        // force refresh
        if(!no_refresh) {
        if(refresh) {
            zoomed_in = false;
            clean_refresh(wvar.mode, true);
        }
        else if(refocus) {
            $(".row.active").removeClass('active');
            $(".vehicle"+vehicles[wvar.focus].uuid).addClass('active');
            followVehicle(wvar.focus, manual_pan, true);
        }
        }

        lhash_update();
    }
}
window.onhashchange = load_hash;

var params = window.location.search.substring(1).split('&');

for(var idx in params) {
    var line = params[idx].split('=');
    if(line.length < 2) continue;

    switch(line[0]) {
        case "embed":
            if(line[1] == "1") {
                wvar.enabled = true;
                if(!is_mobile) wvar.mode = 'All';
            }
            break;
        case "hidelist": if(line[1] == "1") wvar.vlist = false; break;
        case "hidegraph": if(line[1] == "1") wvar.graph = false; break;
        case "expandgraph": if(line[1] == "1") wvar.graph_expanded = true; break;
        case "filter":
            wvar.query = decodeURIComponent(line[1]);
            $("header .search input[type='text']").val(wvar.query);
            break;
        case "nyan": wvar.nyan = true; break;
        case "nena": wvar.nena = true; break;
        case "focus": wvar.focus = decodeURIComponent(line[1]); break;
        case "docid": wvar.docid = line[1]; break;
        case "mode": wvar.mode = decodeURIComponent(line[1]); break;
    }
}

// loads the tracker interface
function trackerInit() {
    // update current position if we geolocation is available
    if(currentPosition) updateCurrentPosition(currentPosition.lat, currentPosition.lon);

    
    
    if (currentPosition && manual_pan == false){
        coords = [currentPosition.lat, currentPosition.lon]
        zoomLevel = 9;
        map.setView(coords, zoomLevel, {animate: false});
    }
    $('#loading,#settingsbox,#aboutbox,#chasebox').hide(); // welcome screen
    $('header,#main').show(); // interface elements
    checkSize();

    // if we there is enough screen space open aboutbox on startup
    if(!is_mobile && !offline.get('opt_nowelcome') && $(window).width() > 900) $('.nav li.about').click();


    if(is_mobile || wvar.enabled) $(".nav .wvar").hide();

    if(!is_mobile) {
        $.getScript("js/_jquery.flot.js", function() {
            $.getScript("js/plot_config.js", function() { checkSize(); if(!map) load(); });
        });
        if(wvar.graph) $('#telemetry_graph').attr('style','');

        return;
    }
    lhash_update(true);
}

// load the app after a 3s timeout
var initTimer = setTimeout(trackerInit, 3000);

var listScroll;
var GPS_ts = null;
var GPS_lat = null;
var GPS_lon = null;
var GPS_alt = null;
var GPS_speed = null;
var CHASE_enabled = null;
var CHASE_listenerSent = false;
var CHASE_timer = 0;
var callsign = "";

function checkSize() {
    // we are in landscape mode
    w = window.innerWidth;

    // this is hacky fix for off by 1px that makes the vechicle list disappear
    wrect = document.body.getBoundingClientRect();
    // chrome seems to calculate the body bounding box differently from every other browser
    if (!!window.chrome) {
        w_fix = (w >= wrect.width) ? 1 : 0;
    } else {
        w_fix = (w === Math.floor(wrect.width)) ? 0 : 1;
    }

    w = (w < 320) ? 320 :  w; // absolute minimum 320px
    h = window.innerHeight;
    //h = (h < 300) ? 300 :  h; // absolute minimum 320px minus 20px for the iphone bar
    hh = $('header').height();

    ph = 0;

    if(w > 900 && $('.flatpage:visible').length) {
        $('.flatpage').addClass('topanel');
        ph = $('.flatpage:visible').width()+30;
    } else {
        $('.flatpage.topanel').removeClass('topanel');
    }

    $("#mapscreen,.flatpage").height(h-hh-5);

    sw = (wvar.vlist) ? 260 : 0;

    $('.container').width(w-20);

    if($('.landscape:visible').length) {
        $('#main').height(h-hh-5);
        if($('#telemetry_graph .graph_label').hasClass('active')) {
            $('#map').height(h-hh-5-200);
        } else {
            $('#map').height(h-hh-5);
        }
        $('body,#loading').height(h);
        $('#mapscreen,#map,#telemetry_graph,#telemetry_graph .holder').width(w-sw-ph-w_fix);
        $('#main').width(sw);
    } else { // portrait mode
        //if(h < 420) h = 420;
        var mh = (wvar.vlist) ? 150 : 0;

        $('body,#loading').height(h);
        $('#map,#mapscreen').height(h-hh-5-mh);
        $('#map,#mapscreen').width(w);
        $('#main').height(mh); // 180px is just enough to hold one expanded vehicle
        $('#main').width(w);
    }

    // this should hide the address bar on mobile phones, when possible
    window.scrollTo(0,1);

    if(map) map.invalidateSize();
}

window.onresize = checkSize;
window.onchangeorientation = checkSize;


// functions

function positionUpdateError(error) {
    switch(error.code)
    {
        case error.PERMISSION_DENIED:
            $('#sw_chasecar').removeClass('on').addClass('off');
            break;
        default:
        break;
    }
}

var positionUpdateHandle = function(position) {
    if(CHASE_enabled && !CHASE_listenerSent) {
        if(offline.get('opt_station')) {
            ChaseCar.putListenerInfo(callsign);
            CHASE_listenerSent = true;
        }
    }

    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    var alt = (position.coords.altitude) ? position.coords.altitude : 0;
    var accuracy = (position.coords.accuracy) ? position.coords.accuracy : 0;
    var speed = (position.coords.speed) ? position.coords.speed : 0;

    // constantly update 'last updated' field, and display friendly time since last update
    if(!GPS_ts) {
        GPS_ts = parseInt(position.timestamp/1000);

        setInterval(function() {
            var delta_ts = parseInt(Date.now()/1000) - GPS_ts;

            // generate friendly timestamp
            var hours = Math.floor(delta_ts / 3600);
            var minutes = Math.floor(delta_ts / 60) % 60;
            var ts_str = (delta_ts >= 60) ?
                                ((hours)?hours+'h ':'') +
                                ((minutes)?minutes+'m':'') +
                                ' ago'
                            : 'just now';
            $('#cc_timestamp').text(ts_str);
        }, 30000);

        $('#cc_timestamp').text('just now');
    }

    // save position and update only if different is available
    if(CHASE_timer < (new Date()).getTime() &&
        (
        GPS_lat != lat ||
        GPS_lon != lon ||
        GPS_alt != alt ||
        GPS_speed != speed
        )
    )
    {
        GPS_lat = lat;
        GPS_lon = lon;
        GPS_alt = alt;
        GPS_speed = speed;
        GPS_ts = parseInt(position.timestamp/1000);
        $('#cc_timestamp').text('just now');

        // update look angles once we get position
        if(follow_vehicle !== null && vehicles[follow_vehicle] !== undefined) {
            update_lookangles(follow_vehicle);
        }

        if(CHASE_enabled) {
            ChaseCar.updatePosition(callsign, position);
            CHASE_timer = (new Date()).getTime() + 15000;
        }
    }


    // add/update marker on the map (sondehub.js)
    updateCurrentPosition(lat, lon);

    // round the coordinates
    lat = parseInt(lat * 10000)/10000;  // 4 decimal places (11m accuracy at equator)
    lon = parseInt(lon * 10000)/10000;  // 4 decimal places
    speed = parseInt(speed * 10)/10;        // 1 decimal place
    accuracy = parseInt(accuracy);
    alt = parseInt(alt);

    // dispaly them in the top right corner
    $('#app_name b').html(lat + '<br/>' + lon);

    // update chase car interface
    $('#cc_lat').text(lat);
    $('#cc_lon').text(lon);
    $('#cc_alt').text(alt + " m");
    $('#cc_accuracy').text(accuracy + " m");
    $('#cc_speed').text(speed + " m/s");
        

};

var twoZeroPad = function(n) {
    n = String(n);
    return (n.length<2) ? '0'+n : n;
};

// updates timebox
var updateTimebox = function(date) {
    var elm = $("#timebox");
    var a,b,c,d,e,f,g,z;

    a = date.getUTCFullYear();
    b = twoZeroPad(date.getUTCMonth()+1); // months 0-11
    c = twoZeroPad(date.getUTCDate());
    e = twoZeroPad(date.getUTCHours());
    f = twoZeroPad(date.getUTCMinutes());
    g = twoZeroPad(date.getUTCSeconds());

    elm.find(".current").text("UTC: "+a+'-'+b+'-'+c+' '+e+':'+f+':'+g);

    a = date.getFullYear();
    b = twoZeroPad(date.getMonth()+1); // months 0-11
    c = twoZeroPad(date.getDate());
    e = twoZeroPad(date.getHours());
    f = twoZeroPad(date.getMinutes());
    g = twoZeroPad(date.getSeconds());
    z = date.getTimezoneOffset() / -60;

    elm.find(".local").text("Local: "+a+'-'+b+'-'+c+' '+e+':'+f+':'+g+" "+((z<0)?"-":"+")+z);
};

var format_time_friendly = function(start, end) {
    var dt = Math.floor((end - start) / 1000);;
    if(dt < 0) return null;

    if(dt < 60) return dt + 's';
    else if(dt < 3600) return Math.floor(dt/60)+'m';
    else if(dt < 86400) {
        dt = Math.floor(dt/60);
        return Math.floor(dt/60)+'h '+(dt % 60)+'m';
    } else {
        dt = Math.floor(dt/3600);
        return Math.floor(dt/24)+'d '+(dt % 24)+'h';
    }
};

var format_coordinates = function(lat, lon, name) {
    var coords_text;
    var ua =  navigator.userAgent.toLowerCase();
    var span = document.createElement('span')
    var a = document.createElement("a")
    span.appendChild(a)
    // determine how to link the coordinates to a native app, if on a mobile device
    if(ua.indexOf('iphone') > -1) {
        a.href = 'maps://?q='+lat+','+lon
    } else if(ua.indexOf('android') > -1) {
        a.href = 'geo:'+lat+','+lon+'?q='+lat+','+lon+'('+name+')'
    } else {
        a.href = 'https://www.google.com/maps/search/?api=1&query='+lat+','+lon
        a.target="_blank"
        a.rel="noopener noreferrer"
    }
    a.innerText = roundNumber(lat, 5) + ', ' + roundNumber(lon, 5)

    return span.innerHTML;
};

// runs every second
var updateTime = function(date) {
    // update timebox
    var elm = $("#timebox.present");
    if(elm.length > 0) updateTimebox(date);

    // update friendly delta time fields
    elm = $(".friendly-dtime");
    if(elm.length > 0) {
        var now = new Date().getTime();

        elm.each(function(k,v) {
            var e = $(v);
            if(e.attr('data-timestamp') === undefined) return;
            var ts = e.attr('data-timestamp');
            var str = format_time_friendly(ts, now);
            if(str) e.text(str + ' ago');
        });
    }
};

$(window).ready(function() {
    // refresh timebox
    setInterval(function() {
        updateTime(new Date());
    }, 1000);

    // resize elements if needed
    checkSize();

    // add inline scroll to vehicle list
    listScroll = new IScroll('#main', {
        hScrollbar: false,
        hScroll: false,
        snap: false,
        mouseWheel: true,
        scrollbars: true,
        scrollbarClass: 'scrollStyle',
        shrinkScrollbars: 'scale',
        tap: true,
        click: true,
        disableMouse: false,
        disableTouch: false,
        disablePointer: false,
    });

    $('#telemetry_graph').on('click', '.graph_label', function() {
        var e = $(this), h;
        if(e.hasClass('active')) {
            e.removeClass('active');
            h = $('#map').height() + $('#telemetry_graph').height();

            plot_open = false;
        } else {
            e.addClass('active');
            h = $('#map').height() - $('#telemetry_graph').height();

            plot_open = true;
        }
        $('#map').stop(null,null).animate({'height': h}, function() {
            if(map) map.invalidateSize();

            if(plot_open &&
               follow_vehicle !== null &&
               (follow_vehicle != graph_vehicle || vehicles[follow_vehicle].graph_data_updated)) updateGraph(follow_vehicle, true);
        });
    });

    // expand graph on startup, if nessary
    if(wvar.graph_expanded) $('#telemetry_graph .graph_label').click();

    $("#main").on('click','.row .data .vbutton.path', function(event) {
        event.stopPropagation();

        var elm = $(this);
        var name = elm.attr('data-vcallsign');

        if(elm.hasClass("active")) {
            elm.removeClass('active');
            set_polyline_visibility(name, false);
        }
        else {
            elm.addClass('active');
            set_polyline_visibility(name, true);
        }
    });

    // reset nite-overlay and timebox when mouse goes out of the graph box
    $("#telemetry_graph").on('mouseout','.holder', function() {
        if(plot_crosshair_locked) return;

        updateGraph(null, true);
    });

    // hand cursor for dragging the vehicle list
    $("#main").on("mousedown", ".row", function () {
        $("#main").addClass("drag");
    });
    $("body").on("mouseup", function () {
        $("#main").removeClass("drag");
    });

    // follow vehicle by clicking on data
    $('#main').on('click', '.row .data', function() {
        var e = $(this).parent();

        followVehicle(e.attr('data-vcallsign'));
    });

    // expand/collapse data when header is clicked
    $('#main').on('click', '.row .header', function() {
        var e = $(this).parent();
        if(e.hasClass('active')) {
            // collapse data for selected vehicle
            e.removeClass('active');
            e.find('.data').hide();

            listScroll.refresh();

            // disable following only we are collapsing the followed vehicle
            if(follow_vehicle !== null && follow_vehicle == e.attr('data-vcallsign')) {
                stopFollow();
            }
        } else {
            // expand data for selected vehicle
            e.addClass('active');
            e.find('.data').show();

            listScroll.refresh();

            // auto scroll when expanding an item
            if($('.portrait:visible').length) {
                var eName = "." + e.parent().attr('class') + " ." + e.attr('class').match(/vehicle\d+/)[0];
                listScroll.scrollToElement(eName);
            }

            // pan to selected vehicle
            followVehicle(e.attr('data-vcallsign'));
        }
    });

    // menu interface options
    $('.nav')
    .on('click', 'li', function() {
        var e = $(this);
        var name = e.attr('class').replace(" last","");

        // makes the menu buttons act like a switch
        if($("#"+name+"box").is(':visible')) name = 'home';

        var box = $("#"+name+"box");

        if(box.is(':hidden')) {
            $('.flatpage, #homebox').hide();
            box.show().scrollTop(0);

            // if(name == 'about' && !$('#motd').hasClass('inited')) {
            //     $('#motd').addClass('inited');

            //     $.getJSON("//spacenear.us/tracker/datanew.php?type=info", function(data) {
            //         if('html' in data) $('#motd').html(data.html.replace(/\\/g,''));
            //     });

            //     var iframe = box.find('iframe');
            //     var src = iframe.attr('data-src');
            //     iframe.attr('src', src);
            // }

            // analytics
            var pretty_name;
            switch(name) {
                case "home": pretty_name = "Map"; break;
                case "chasecar": pretty_name = "Chase Car"; break;
                default: pretty_name = name[0].toUpperCase() + name.slice(1);
            }
        }
        var visible_box = $(".flatpage:visible");
        if (visible_box.length > 0){
            wvar.box = visible_box[0].id
        } else {
            wvar.box = null
        }

        lhash_update(true);
        checkSize();
    });

    // toggle functionality for switch button
    $("#sw_chasecar").click(function() {
        var e = $(this);
        var field = $('#cc_callsign');

        // turning the switch off
        if(e.hasClass('on')) {
            field.removeAttr('disabled');
            e.removeClass('on').addClass('off');

            CHASE_enabled = null;
            //CHASE_enabled = false;

            // blue man reappers :)
            if(currentPosition && currentPosition.marker) map.addLayer(currentPosition.marker);
        // turning the switch on
        } else {
            if(callsign == null || callsign.length < 3) { alert('Please enter a valid callsign, at least 3 characters'); return; }
            if(!callsign.match(/^[a-zA-Z0-9\_\-]+$/)) { alert('Invalid characters in callsign (use only a-z,0-9,-,_)'); return; }

            field.attr('disabled','disabled');
            e.removeClass('off').addClass('on');

            // push listener doc to SondeHub
            // this gets a station on the map, under the car marker
            // im still not sure its nessesary
            if(!CHASE_listenerSent) {
                if(offline.get('opt_station')) {
                    ChaseCar.putListenerInfo(callsign);
                    CHASE_listenerSent = true;
                }
            }
            // if already have a position push it to SondeHub
            if(GPS_ts) {
                ChaseCar.updatePosition(callsign, { coords: { latitude: GPS_lat, longitude: GPS_lon, altitude: GPS_alt, speed: GPS_speed }});
            }

            CHASE_enabled = true;

            // hide the blue man
            if(currentPosition && currentPosition.marker) map.removeLayer(currentPosition.marker);
        }
    });

    // Functions for the payload recovery feature
    // Logic to switch the recovery OK button
    $("#sw_recovery_ok").click(function() {
        var e = $(this);

        // turning the switch off
        if(e.hasClass('on')) {
            e.removeClass('on').addClass('off');
        // turning the switch on
        } else {
            e.removeClass('off').addClass('on');
            // Remove any planned recovery check.
            $("#sw_recovery_planned").removeClass('on').addClass('off');
        }
    });
    // Logic to switch the recovery Planned button
    $("#sw_recovery_planned").click(function() {
        var e = $(this);

        // turning the switch off
        if(e.hasClass('on')) {
            e.removeClass('on').addClass('off');

        // turning the switch on
        } else {
            e.removeClass('off').addClass('on');
            // Set recovery OK to false.
            $("#sw_recovery_ok").removeClass('on').addClass('off');
        }
    });
    // Logic to switch the use car position button
    $("#sw_use_car_pos").click(function() {
        var e = $(this);

        // turning the switch off
        if(e.hasClass('on')) {
            e.removeClass('on').addClass('off');
        // turning the switch on
        } else {
            e.removeClass('off').addClass('on');
        }
    });

    // remember callsign as a cookie
    $("#cc_callsign").on('change keyup', function() {
        callsign = $(this).val().trim();
        offline.set('callsign', callsign); // put in localStorage
        CHASE_listenerSent = false;
        $('#recovery_callsign').val(callsign);
    });

    $("#recovery_callsign").on('change keyup', function() {
        callsign = $(this).val().trim();
        offline.set('callsign', callsign); // put in localStorage
        CHASE_listenerSent = false;
        $('#cc_callsign').val(callsign);
    });


    // load value from localStorage
    callsign = offline.get('callsign');
    $('#cc_callsign').val(callsign);
    $('#recovery_callsign').val(callsign);

    // settings page

    // list of all switches
    var opts = [
        "#sw_layers_aprs",
        "#sw_offline",
        "#sw_station",
        "#sw_imperial",
        "#sw_haxis_hours",
        "#sw_daylight",
        "#sw_hide_receivers",
        "#sw_hide_recoveries",
        "#sw_hide_chase",
        "#sw_hide_timebox",
        "#sw_hilight_vehicle",
        '#sw_hide_horizon',
        '#sw_hide_titles',
        '#sw_layers_launches',
        '#sw_selective_sidebar',
        "#sw_nowelcome",
        "#sw_interpolate",
    ];

    // applies functionality when switches are toggled
    $(opts.join(',')).click(function() {
        var e = $(this);
        var name = e.attr('id').replace('sw', 'opt');
        var on;

        if(e.hasClass('on')) {
            e.removeClass('on').addClass('off');
            on = 0;
        } else {
            e.removeClass('off').addClass('on');
            on = 1;
        }

        // remember choice
        offline.set(name, on);

        // execute functionality
        switch(name) {
            case "opt_hilight_vehicle":
                if(on) focusVehicle(follow_vehicle);
                else focusVehicle(null, true);
                break;
            case "opt_imperial":
                if (map_scale){
                    map_scale.remove()
                }
                // we need to remove and add the zoom controls so they  end up in the same position
                zoom_controls.remove()
                if (on) {
                    map_scale = L.control.scale({position:'bottomright', imperial:true, metric:false}).addTo(map);
                } else {
                    map_scale = L.control.scale({position:'bottomright', imperial:false}).addTo(map);
                }
                zoom_controls.addTo(map);

            case "opt_haxis_hours":
                refreshUI();
                break;
            case "opt_daylight":
                if(on) { 
                    nite.addTo(map);
                    niteupdate = setInterval(function() {
                        nite.setTime();
                    }, 60000); // Every minute
                } else { 
                    nite.remove();
                    clearInterval(nite);
                }
                break;
            case "opt_hide_receivers":
                if(on) {
                    updateReceivers([],single=false);
                    //clearTimeout(periodical_listeners);
                    receiversHidden = true;
                }
                else {
                    receiversHidden = false;
                    refreshReceivers();
                }
                break;
            case "opt_hide_recoveries":
                    if(on) {
                        updateRecoveries([]);
                        clearTimeout(periodical_recoveries);
                    }
                    else {
                        refreshRecoveries();
                    }
                    break;
            case "opt_hide_chase":
                if(on) {
                    chaseCarsHidden = true;
                    //clearTimeout(periodical_listeners);
                    deleteChase();
                } else {
                    chaseCarsHidden = false;
                    refreshNewReceivers(true);
                }
                break;
            case "opt_hide_timebox":
                var elm = $("#timebox");
                if(on) {
                    elm.removeClass('past').removeClass('present').hide();
                    $('#lookanglesbox').css({top:'7px'});
                } else {
                    elm.addClass('present').show();
                    $('#lookanglesbox').css({top:'40px'});
                }
                break;
            case "opt_hide_horizon":
                if(on) {
                    showHorizonRings();
                }
                else {
                    hideHorizonRings();
                }
                break;
            case "opt_hide_titles":
                if(on) {
                    hideTitles();
                }
                else {
                    showTitles();
                }
                break;
            case "opt_layers_aprs":
                if(on) map.overlayMapTypes.setAt("1", overlayAPRS);
                else map.overlayMapTypes.setAt("1", null);
                break;
            case "opt_selective_sidebar":
                sidebar_update();
                break;
            case "opt_layers_launches":
                if(on) {
                    map.removeLayer(launches);
                } else {
                    map.addLayer(launches);
                }
                break;
            case "opt_interpolate":
                if(on) { graph_gap_size = graph_gap_size_max; }
                else { graph_gap_size = graph_gap_size_default; }
                clean_refresh(wvar.mode, true, false);
                break;
        }
    });

    // set the switch, based on the remembered choice
    for(var k in opts) {
        var switch_id = opts[k];
        var opt_name = switch_id.replace("#sw_", "opt_");

        if(offline.get(opt_name)) $(switch_id).removeClass('off').addClass('on');
    }

    // We are able to get GPS position on idevices, if the user allows
    // The position is displayed in top right corner of the screen
    // This should be very handly for in the field tracking
    //setTimeout(function() {updateCurrentPosition(50.27533, 3.335166);}, 5000);
    if(navigator.geolocation) {
        // if we have geolocation services, show the locate me button
        // the button pans the map to the user current location
        //if(is_mobile && !wvar.enabled) $(".chasecar").show();
        // Enable the chase-car option for all browsers, not just mobile ones.
        $(".chasecar").show();
        $("#locate-me,#app_name").attr('style','').click(function() {
            if(currentPosition) {
                // disable following of vehicles
                stopFollow();
                // open map
                $('.nav .home').click();
                // pan map to our current location
                map.panTo(new L.LatLng(currentPosition.lat, currentPosition.lon));
            } else {
                alert("No position available");
            }
        });

        navigator.geolocation.getCurrentPosition(positionUpdateHandle);
        if(navigator.geolocation) navigator.geolocation.watchPosition(positionUpdateHandle, positionUpdateError);
    }

    // weather feature

    // list of overlays
    var overlayList = [
        ['Global', [
            ['rainviewer', 'RainViewer'],
            ['rainviewer-coverage', 'RainViewer Coverage'],
        ]],
        ['North America', [
            ['nexrad-n0q-900913', 'NEXRAD Base Reflectivity'],
            ['goes-ir-4km-900913', 'GOES NA Infrared ~4km'],
            ['goes-wv-4km-900913', 'GOES NA Water Vapor ~4km'],
            ['goes-vis-1km-900913', 'GOES NA Visible ~1km'],
            ['q2-n1p-900913', 'Q2 1 Hour Precipitation'],
            ['q2-p24h-900913', 'Q2 24 Hour Precipitation'],
            ['q2-p48h-900913', 'Q2 48 Hour Precipitation'],
            ['q2-p72h-900913', 'Q2 72 Hour Precipitation'],
            ['q2-hsr-900913', 'MRMS Hybrid-Scan Reflectivity Composite.']
        ]]
    ];

    // generate the list of switches for each overlay
    var elm = $("#weatherbox .slimContainer");
    var j;
    for(j in overlayList) {
        var region = overlayList[j][0];
        var switches = overlayList[j][1];

        elm.append("<h4>"+region+"</h4><hr>");

        var i;
        for(i in switches) {
            var id = switches[i][0];
            var name = switches[i][1];

            var html = '<div class="row option">' +
                     '<span><b>'+name+'</b></span>' +
                     '<div class="switch off" id="sw_weather_'+id+'">' +
                     '<span class="thumb"></span>' +
                     '<input type="checkbox" id="opt_weather_'+id+'">' +
                     '</div>' +
                     '</div>';

            elm.append(html);
        }
    }

    var weatherLayer;

    // the magic that makes the switches do things
    elm.find(".switch").click(function() {
        var e = $(this);
        var name = e.attr('id').replace('sw', 'opt');
        var id = name.replace("opt_weather_","");
        var on;

        try {
            map.removeLayer(weatherLayer);
        } catch (err) {};

        try {
            map.removeLayer(RainRadar);
        } catch (err) {};

        try {
            map.removeLayer(RainRadarCoverage);
        } catch (err) {};


        if(e.hasClass('on')) {
            e.removeClass('on').addClass('off');
            on = 0;
        } else {
            // only one overlay at a time
            $("#weatherbox .switch").removeClass('on').addClass('off');
            e.removeClass('off').addClass('on');
            on = 1;
        }

        if(on) {
            if (id == "rainviewer") {
                RainRadar.addTo(map);
            } else if (id == "rainviewer-coverage") {
                RainRadarCoverage.addTo(map);
            } else {
                weatherLayer = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/' + id + '/{z}/{x}/{y}.png?' + (new Date()).getTime(), {
                    opacity: 0.6,
                    attribution: '&copy; <a href="https://mesonet.agron.iastate.edu/">Iowa Environmental Mesonet</a>'
                }).addTo(map);
            }
        }
   });

   $("header .search form").on('submit', function(e) {
       e.preventDefault();

       var text = $("header .search input[type='text']").val().toUpperCase();
       $("header .search input[type='text']")[0].value = text; // update field in case it wasn't already uppercase

       if(text === wvar.query) return;

       // when running an empty search, it's probably best to reset the query mode

       wvar.query = text;
       stopFollow();
       zoomed_in = false;
       if (sondePrefix.indexOf(wvar.query) > -1) {
        wvar.zoom = false;
       } else {
        wvar.zoom = true;
       }

       // Insert the serial number into the recovery reporting serial number textbox
       $("#pr_serial").val(text);

       clean_refresh(wvar.mode, true, true);
   });
});


function check_version(){
    const updateRequest = new Request("/js/version.json");
    fetch(updateRequest)
        .then(function(response){ return response.json()})
        .then(function(response){
            if (response['version'] != document.body.dataset.version) {
                
                caches.keys().then(function(names) { // wipe cache for fresh reload
                    for (let name of names)
                        caches.delete(name);
                });

                window.clearInterval(update_check)
                reload_timer = window.setTimeout(update_site, response['refresh']*1000)
                reload_end_time = new Date().getTime() +response['refresh']*1000
                update_countdown();
                countdown_interval = setInterval(update_countdown, 100);
                document.getElementById("reload_warning").style.display = "block";
            }
        })
}
function update_site(){

    window.location.reload(true)
}

function update_countdown(){
    var date = new Date(0);
    time_remaining = (reload_end_time - new Date().getTime())/1000
    date.setSeconds(time_remaining);
    var timeString = date.toISOString().substring(11, 19); // hacky
    document.getElementById("reload_timer").innerText = timeString;
}

check_version()
update_check = setInterval(check_version, 15 * 60 * 1000)
load_hash();
startAjax();
load();