// init plot
plot = $.plot(plot_holder, {}, plot_options);
var updateLegendTimeout = null;
var polyMarker = null;

// updates legend with extrapolated values under the mouse position
function updateLegend(pos) {
    var legend = $(plot_holder + " .legendLabel");
    $(plot_holder + " .legend table").css({'background-color':"rgba(255,255,255,0.9)","pointer-events":"none"});
    legend.each(function() {
        $(this).css({'padding-left':'3px'});
    });


    var i, j, ij, pij, dataset = plot.getData();
    var outside = false;
    //var axes = plot.getAxes();

    if(dataset.length === 0) return;

    // this loop find the value for each series
    // and updates the legend
    //
    // here we don't snap to existing data point
    for (i = 0; i < dataset.length; ++i) {
        var series = dataset[i];
        var y;
        y = null;

        // Find the nearest points, x-wise

        if(series.data.length < 2 ||
           (i===1 && series.data[0][0] > pos.x)) {
            y = null;
        }
        else if (i !== 1 && pos.x > series.data[series.data.length-1][0]) {
            outside = true;
        }
        else {
            for (j = 0; j < series.data.length; ++j) {
                if (series.data[j][0] > pos.x) {
                    break;
                }
            }

            if(i === 0) ij = j;
            if(i === 1) {
                pij = (j >= series.data.length) ? j-1 : j;
            }

            if(series.noInterpolate === true) { y = series.data[((j===0)?j:j-1)][1]; }
            else {
                var p1 = (j===0) ? null : series.data[j-1];
                    p2 = series.data[j];

                if (p1 === null) {
                    y = p2[1];
                } else if (p2 === null || p2 === undefined) {
                    y = p1[1];
                } else {
                    y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
                }

                y = ((p1 && p1[1] === null) || (p2 && p2[1] === null)) ? null : y.toFixed(2);
            }
        }
        legend.eq(i).text(series.label.replace(/=.*/, "= " + y));
    }

    if(follow_vehicle !== null && vehicles[follow_vehicle].positions.length) {
        // adjust index for null data points
        var null_count = 0;

        if (!map.hasLayer(polyMarker) && polyMarker) {
            map.addLayer(polyMarker);
        }

        if(outside && pij !== undefined) {
            if(!polyMarker) {
                try {polyMarker = new L.Marker(vehicles[follow_vehicle].prediction_polyline[0].getLatLngs()[pij]).addTo(map);} catch (e) {};
            } else {
                try {polyMarker.setLatLng(vehicles[follow_vehicle].prediction_polyline[0].getLatLngs()[pij]);} catch (e) {};
            }
            
        }
        else {
            var data_ref = vehicles[follow_vehicle].graph_data[0];

            if(ij > data_ref.data.length / 2) {
                for(i = data_ref.data.length - 1; i > ij; i--) null_count += (data_ref.data[i][1] === null) ? 1 : 0;
                null_count = data_ref.nulls - null_count * 2;
            } else {
                for(i = 0; i < ij; i++) null_count += (data_ref.data[i][1] === null) ? 1 : 0;
                null_count *= 2;
            }

            // update position
            ij -= null_count + ((null_count===0||null_count===data_ref.nulls) ? 0 : 1);
            if(ij < 0) ij = 0;

            if(!polyMarker) {
                try {polyMarker = new L.Marker(vehicles[follow_vehicle].positions[ij]).addTo(map);} catch (e) {};
            } else {
                try {polyMarker.setLatLng(vehicles[follow_vehicle].positions[ij]);} catch (e) {};
            }
        }

        // set timebox
        var date = new Date(pos.x1);
        $('#timebox').removeClass('present').addClass('past');
        updateTimebox(date);
    }
}

var plot_crosshair_locked = false;

$(plot_holder).bind("click",  function (event) {
    if(plot_crosshair_locked) {
        plot_crosshair_locked = false;
    } else if(event.ctrlKey) {
        plot_crosshair_locked = true;
    }
});
// update legend values on mouse hover
$(plot_holder).bind("plothover",  function (event, pos, item) {
    if(plot_crosshair_locked) return;

    if (!updateLegendTimeout) {
        plot.lockCrosshair();
        plot.setCrosshair(pos);
        updateLegend(pos);
        updateLegendTimeout = setTimeout(function() { updateLegendTimeout = null; }, 40);
    }
});

// double click on the plot clears selection
$(plot_holder).bind("dblclick", function () {
    if(!follow_vehicle) return;

    if(plot_options.xaxis) {
        if(plot_options.xaxis.superzoom == 2) {
            delete plot_options.xaxis;
        }
        else {
            if(plot_options.xaxis.superzoom == 1) {
               if(!confirm("You are about to zoom out to the entire graph. It may hang your browser. Do you wish to continue?")) return;
            }
            plot_options.xaxis = {};
        }
    }

    updateGraph(follow_vehicle, false);
});

// limit range after selection
$(plot_holder).bind("plotselected", function (event, ranges) {
    if(typeof ranges.xaxis == 'undefined') return;

    if(plot_options.xaxis && plot_options.xaxis.superzoom) plot_options.xaxis.superzoom = 2;

    $.extend(true, plot_options, {
        xaxis: {
            min: ranges.xaxis.from,
            max: ranges.xaxis.to
        }
    });

    updateGraph(follow_vehicle, false);
});
