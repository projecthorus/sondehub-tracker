/* SondeHub Tracker Format Incoming Data
 *
 * Author: Luke Prior
 */

function formatData(data, live) {
    var response = {};
    response.positions = {};
    var dataTemp = [];
    if (live) { // Websockets
        if (!data.length) { // handle single sonde
            data = {"entry": data};
        }
        for (let entry in data) {
            data[entry].serial = encodeURIComponent(data[entry].serial);
            var dataTempEntry = {};
            var station = data[entry].uploader_callsign;
            dataTempEntry.callsign = {};
            //check if other stations also received this packet
            if (vehicles.hasOwnProperty(data[entry].serial)) {
                if (data[entry].datetime == vehicles[data[entry].serial].curr_position.gps_time) {
                    for (let key in vehicles[data[entry].serial].curr_position.callsign) {
                        if (vehicles[data[entry].serial].curr_position.callsign.hasOwnProperty(key)) {
                            if (key != station) {
                                dataTempEntry.callsign[key] = {};
                                if (vehicles[data[entry].serial].curr_position.callsign[key].hasOwnProperty("snr")) {
                                    dataTempEntry.callsign[key].snr = vehicles[data[entry].serial].curr_position.callsign[key].snr;
                                }
                                if (vehicles[data[entry].serial].curr_position.callsign[key].hasOwnProperty("rssi")) {
                                    dataTempEntry.callsign[key].rssi = vehicles[data[entry].serial].curr_position.callsign[key].rssi;
                                }
                                if (vehicles[data[entry].serial].curr_position.callsign[key].hasOwnProperty("frequency")) {
                                    dataTempEntry.callsign[key].frequency = vehicles[data[entry].serial].curr_position.callsign[key].frequency;
                                }
                            }
                        }
                    }
                }
            }
            dataTempEntry.callsign[station] = {};
            if (data[entry].snr) {
                dataTempEntry.callsign[station].snr = data[entry].snr;
            }
            if (data[entry].rssi) {
                dataTempEntry.callsign[station].rssi = data[entry].rssi;
            }
            if (data[entry].frequency) {
                dataTempEntry.callsign[station].frequency = data[entry].frequency;
            }
            dataTempEntry.gps_alt = data[entry].alt;
            dataTempEntry.gps_lat = data[entry].lat;
            dataTempEntry.gps_lon = data[entry].lon;

            // Discard positions with null values.
            if (dataTempEntry.gps_lat == 0 && dataTempEntry.gps_lon == 0) {
                continue;
            }

            if (data[entry].heading) {
                dataTempEntry.gps_heading = data[entry].heading;
            }
            dataTempEntry.gps_time = data[entry].datetime;
            dataTempEntry.server_time = data[entry].datetime;
            dataTempEntry.vehicle = data[entry].serial;
            dataTempEntry.position_id = data[entry].serial + "-" + data[entry].datetime;
            dataTempEntry.data = {};
            if (data[entry].batt) {
                dataTempEntry.data.batt = data[entry].batt;
            }
            if (data[entry].burst_timer) {
                dataTempEntry.data.burst_timer = data[entry].burst_timer;
            }
            if (data[entry].frequency) {
                dataTempEntry.data.frequency = data[entry].frequency;
            }
            if (data[entry].tx_frequency) {
                dataTempEntry.data.frequency_tx = data[entry].tx_frequency;
            }
            if (data[entry].hasOwnProperty("humidity")) {
                dataTempEntry.data.humidity = data[entry].humidity;
            }
            if (data[entry].hasOwnProperty("pressure")) {
                dataTempEntry.data.pressure = data[entry].pressure;
            }
            if (data[entry].sats) {
                dataTempEntry.data.sats = data[entry].sats;

                // Drop frames where sats = 0! We do not want to be handling invalid positions.
                if (dataTempEntry.data.sats == 0){
                    continue;
                }
            }
            if (data[entry].hasOwnProperty("temp")) {
                dataTempEntry.data.temperature_external = data[entry].temp;
            }
            // RS41 specific stuff
            if (data[entry].hasOwnProperty("rs41_mainboard")) {
                dataTempEntry.data.rs41_mainboard = data[entry].rs41_mainboard;
            }
            // Removed showing mainboard firmware, not really valuable

            if (data[entry].type) {
                dataTempEntry.data.type = data[entry].type;
                dataTempEntry.type = data[entry].type;
            }
            if (data[entry].subtype) {
                dataTempEntry.data.type = data[entry].subtype;
                dataTempEntry.type = data[entry].subtype;
            }

            if (data[entry].manufacturer) {
                // Instead of adding a separate manufacturer field, prefix the type with it.
                if (dataTempEntry.data.type) {
                    dataTempEntry.data.type = data[entry].manufacturer + " " + dataTempEntry.data.type;
                }
            }

            if (data[entry].xdata) {
                dataTempEntry.data.xdata = data[entry].xdata;

                if (data[entry].hasOwnProperty("pressure")) {
                    xdata_pressure = data[entry].pressure;
                } else {
                    xdata_pressure = 1100.0;
                }
                
                var tempXDATA = parseXDATA(data[entry].xdata, xdata_pressure);
                for (let field in tempXDATA) {
                    if (tempXDATA.hasOwnProperty(field)) {
                        if (field == "xdata_instrument") {
                            dataTempEntry.data.xdata_instrument = tempXDATA.xdata_instrument.join(', ');
                        } else {
                            dataTempEntry.data[field] = tempXDATA[field];
                        }
                    }
                }
            }
            if (data[entry].serial.toLowerCase() != "xxxxxxxx") {
                dataTemp.push(dataTempEntry);
            }
        }
    } else if (data.length == null) { // Elasticsearch
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (typeof data[key] === 'object') {
                    for (let i in data[key]) {
                        data[key][i].serial = encodeURIComponent(data[key][i].serial); // hack for xss prevention
                        var dataTempEntry = {};
                        var station = data[key][i].uploader_callsign;
                        dataTempEntry.callsign = {};
                        dataTempEntry.callsign[station] = {};
                        if (data[key][i].snr) {
                            dataTempEntry.callsign[station].snr = data[key][i].snr;
                        }
                        if (data[key][i].rssi) {
                            dataTempEntry.callsign[station].rssi = data[key][i].rssi;
                        }
                        if (data[key][i].frequency) {
                            dataTempEntry.callsign[station].frequency = data[key][i].frequency;
                        }
                        dataTempEntry.gps_alt = data[key][i].alt;
                        dataTempEntry.gps_lat = data[key][i].lat;
                        dataTempEntry.gps_lon = data[key][i].lon;

                        // Discard positions with null values.
                        if (dataTempEntry.gps_lat == 0 && dataTempEntry.gps_lon == 0) {
                            continue;
                        }

                        if (data[key][i].heading) {
                            dataTempEntry.gps_heading = data[key][i].heading;
                        }
                        dataTempEntry.gps_time = data[key][i].datetime;
                        dataTempEntry.server_time = data[key][i].datetime;
                        dataTempEntry.vehicle = data[key][i].serial;
                        dataTempEntry.position_id = data[key][i].serial + "-" + data[key][i].datetime;
                        dataTempEntry.data = {};
                        if (data[key][i].batt) {
                            dataTempEntry.data.batt = data[key][i].batt;
                        }
                        if (data[key][i].burst_timer) {
                            dataTempEntry.data.burst_timer = data[key][i].burst_timer;
                        }
                        if (data[key][i].frequency) {
                            dataTempEntry.data.frequency = data[key][i].frequency;
                        }
                        if (data[key][i].tx_frequency) {
                            dataTempEntry.data.frequency_tx = data[key][i].tx_frequency;
                        }
                        if (data[key][i].hasOwnProperty("humidity")) {
                            dataTempEntry.data.humidity = data[key][i].humidity;
                        }

                        if (data[key][i].hasOwnProperty("pressure")) {
                            dataTempEntry.data.pressure = data[key][i].pressure;
                        }
                        if (data[key][i].sats) {
                            dataTempEntry.data.sats = data[key][i].sats;

                            // Drop frames where sats = 0! We do not want to be handling invalid positions.
                            if (dataTempEntry.data.sats == 0){
                                continue;
                            }
                        }
                        if (data[key][i].hasOwnProperty("temp")) {
                            dataTempEntry.data.temperature_external = data[key][i].temp;
                        }
                        if (data[key][i].type) {
                            dataTempEntry.data.type = data[key][i].type;
                            dataTempEntry.type = data[key][i].type;
                        }
                        if (data[key][i].subtype) {
                            dataTempEntry.data.type = data[key][i].subtype;
                            dataTempEntry.type = data[key][i].subtype;
                        }

                        if (data[key][i].manufacturer) {
                            // Instead of adding a separate manufacturer field, prefix the type with it.
                            if (dataTempEntry.data.type) {
                                dataTempEntry.data.type = data[key][i].manufacturer + " " + dataTempEntry.data.type;
                            }
                        }

                        // RS41 specific stuff
                        if (data[key][i].hasOwnProperty("rs41_mainboard")) {
                            dataTempEntry.data.rs41_mainboard = data[key][i].rs41_mainboard;
                        }
                        // Removed showing mainboard firmware, not really valuable

                        // XDATA Handling
                        if (data[key][i].xdata) {
                            dataTempEntry.data.xdata = data[key][i].xdata;
                            if (data[key][i].hasOwnProperty("pressure")) {
                                xdata_pressure = data[key][i].pressure;
                            } else {
                                xdata_pressure = 1100.0;
                            }
                            var tempXDATA = parseXDATA(data[key][i].xdata, xdata_pressure);
                            for (let field in tempXDATA) {
                                if (tempXDATA.hasOwnProperty(field)) {
                                    if (field == "xdata_instrument") {
                                        dataTempEntry.data.xdata_instrument = tempXDATA.xdata_instrument.join(', ');
                                    } else {
                                        dataTempEntry.data[field] = tempXDATA[field];
                                    }
                                }
                            }
                        }
                        if (data[key][i].serial.toLowerCase() != "xxxxxxxx") {
                            dataTemp.push(dataTempEntry);
                        }
                    }
                }
            }
        }
    } else { // AWS
        for (var i = data.length - 1; i >= 0; i--) {
            data[i].serial = encodeURIComponent(data[i].serial); // hack for xss prevention
            if (data[i].hasOwnProperty('subtype') && data[i].subtype == "SondehubV1") { // SondeHub V1
                var dataTempEntry = {};
                var station = data[i].uploader_callsign;
                dataTempEntry.callsign = {};
                dataTempEntry.callsign[station] = {};
                dataTempEntry.gps_alt = parseFloat(data[i].alt);
                dataTempEntry.gps_lat = parseFloat(data[i].lat);
                dataTempEntry.gps_lon = parseFloat(data[i].lon);
                dataTempEntry.gps_time = data[i].time_received;
                dataTempEntry.server_time = data[i].time_received;
                dataTempEntry.vehicle = data[i].serial;
                dataTempEntry.position_id = data[i].serial + "-" + data[i].time_received;
                dataTempEntry.data = {};
                if (data[i].humidity) {
                    dataTempEntry.data.humidity = parseFloat(data[i].humidity);
                }
                if (data[i].temp) {
                    dataTempEntry.data.temperature_external = parseFloat(data[i].temp);
                }
                dataTemp.push(dataTempEntry);
            } else { // SondeHub V2
                var dataTempEntry = {};
                var station = data[i].uploader_callsign;
                dataTempEntry.callsign = {};
                dataTempEntry.callsign[station] = {};
                if (data[i].snr) {
                    dataTempEntry.callsign[station].snr = data[i].snr;
                }
                if (data[i].rssi) {
                    dataTempEntry.callsign[station].rssi = data[i].rssi;
                }
                if (data[i].frequency) {
                    dataTempEntry.callsign[station].frequency = data[i].frequency;
                }
                dataTempEntry.gps_alt = data[i].alt;
                dataTempEntry.gps_lat = data[i].lat;
                dataTempEntry.gps_lon = data[i].lon;

                // Discard positions with null values.
                if (dataTempEntry.gps_lat == 0 && dataTempEntry.gps_lon == 0) {
                    continue;
                }

                if (data[i].heading) {
                    dataTempEntry.gps_heading = data[i].heading;
                }
                dataTempEntry.gps_time = data[i].datetime;
                dataTempEntry.server_time = data[i].datetime;
                dataTempEntry.vehicle = data[i].serial;
                dataTempEntry.position_id = data[i].serial + "-" + data[i].datetime;
                dataTempEntry.data = {};
                if (data[i].batt) {
                    dataTempEntry.data.batt = data[i].batt;
                }
                if (data[i].burst_timer) {
                    dataTempEntry.data.burst_timer = data[i].burst_timer;
                }
                if (data[i].frequency) {
                    dataTempEntry.data.frequency = data[i].frequency;
                }
                if (data[i].tx_frequency) {
                    dataTempEntry.data.frequency_tx = data[i].tx_frequency;
                }
                if (data[i].hasOwnProperty("humidity")) {
                    dataTempEntry.data.humidity = data[i].humidity;
                }
                if (data[i].manufacturer) {
                    dataTempEntry.data.manufacturer = data[i].manufacturer;
                }
                if (data[i].hasOwnProperty("pressure")) {
                    dataTempEntry.data.pressure = data[i].pressure;
                }
                if (data[i].sats) {
                    dataTempEntry.data.sats = data[i].sats;
                    
                    // Drop frames where sats = 0! We do not want to be handling invalid positions.
                    if (dataTempEntry.data.sats == 0){
                        continue;
                    }
                }
                if (data[i].hasOwnProperty("temp")) {
                    dataTempEntry.data.temperature_external = data[i].temp;
                }
                if (data[i].type && data[i].type == "payload_telemetry") { // SondeHub V1.5 data?
                    var comment = data[i].comment.split(" ");
                    if (v1types.hasOwnProperty(comment[0])) {
                        dataTempEntry.data.type = v1types[comment[0]];
                        dataTempEntry.type = v1types[comment[0]];
                        if (v1manufacturers.hasOwnProperty(dataTempEntry.type)) {
                            // dataTempEntry.data.manufacturer = v1manufacturers[dataTempEntry.type];
                            dataTempEntry.data.type = v1manufacturers[dataTempEntry.type] + " " + dataTempEntry.data.type;
                        }
                    }
                    dataTempEntry.data.frequency = comment[2];
                } else if (data[i].type) {
                    dataTempEntry.data.type = data[i].type;
                    dataTempEntry.type = data[i].type;
                }
                if (data[i].subtype) {
                    dataTempEntry.data.type = data[i].subtype;
                    dataTempEntry.type = data[i].subtype;
                }

                if (data[i].manufacturer) {
                    // Instead of adding a separate manufacturer field, prefix the type with it.
                    if (dataTempEntry.data.type) {
                        dataTempEntry.data.type = data[i].manufacturer + " " + dataTempEntry.data.type;
                    }
                }

                // RS41 specific stuff
                if (data[i].hasOwnProperty("rs41_mainboard")) {
                    dataTempEntry.data.rs41_mainboard = data[i].rs41_mainboard;
                }
                // Removed showing mainboard firmware, not really valuable

                // XDATA Handling
                if (data[i].xdata) {
                    dataTempEntry.data.xdata = data[i].xdata;
                    if (data[i].hasOwnProperty("pressure")) {
                        xdata_pressure = data[i].pressure;
                    } else {
                        xdata_pressure = 1100.0;
                    }
                    var tempXDATA = parseXDATA(data[i].xdata, xdata_pressure);
                    for (let field in tempXDATA) {
                        if (tempXDATA.hasOwnProperty(field)) {
                            if (field == "xdata_instrument") {
                                dataTempEntry.data.xdata_instrument = tempXDATA.xdata_instrument.join(', ');
                            } else {
                                dataTempEntry.data[field] = tempXDATA[field];
                            }
                        }
                    }
                }
                dataTemp.push(dataTempEntry);
            }
        }
    }
    response.positions.position = dataTemp;
    response.fetch_timestamp = Date.now();
    return response;
}