'use strict';

////////////////////////////////////////////////////////////////////////////////
// TOURJS //////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
var currentStep = -1;
var lastStep;

var createTour = function (options) {
    var tour = [];

    var steps = options.steps;
    delete options.steps;

    var tippyOptions = Object.assign({
        interactive: true,
        trigger: 'manual',
        html: function (el) {
            var t = document.getElementById("tour-template");
            var clone = document.importNode(t.content, true).firstElementChild;

            clone.querySelector("#tour-text").textContent = el.title;
            return clone;
        }
    }, options);

    steps.forEach(function (step) {
        const el = document.querySelector(step.element);
        el.setAttribute("title", step.text);

        tippyOptions.position = step.position;

        const tip = tippy(step.element, tippyOptions);
        const popper = tip.getPopperElement(el);

        tour.push({
            popper: popper,
            tip: tip,
            el: el
        })
    });

    lastStep = steps.length;
    return tour;
};

var showStep = function (step, tour) {
    var popper = tour[step].popper;
    var tip = tour[step].tip;
    var el = tour[step].el;

    el.scrollIntoView({
        behavior: 'smooth'
    });

    if (currentStep === 0) {
        popper.querySelector("#tour-prev").disabled = true;
    } else if (currentStep === lastStep - 1) {
        popper.querySelector("#tour-next").disabled = true;
    } else {
        popper.querySelector("#tour-next").disabled = false;
        popper.querySelector("#tour-prev").disabled = false;
    }

    tip.show(popper);
};

var hideStep = function (step, tour) {
    var popper = tour[step].popper;
    var tip = tour[step].tip;

    tip.hide(popper);
};

var advanceTour = function (tour) {
    if (currentStep < lastStep - 1) {
        if (currentStep > -1) hideStep(currentStep, tour);
        showStep(++currentStep, tour);
    } else if (currentStep === lastStep - 1) {
        hideStep(currentStep++, tour);
    }
};

var rewindTour = function (tour) {
    if (currentStep > 0) {
        if (currentStep < lastStep) hideStep(currentStep, tour);
        showStep(--currentStep, tour);
    } else if (currentStep === 0) {
        hideStep(currentStep--, tour);
    }
};

var resetTour = function (tour) {
    if ((currentStep > -1) && (currentStep < lastStep)) {
        hideStep(currentStep, tour);
    }
    currentStep = -1;
};

var startTour = function (tour) {
    resetTour(tour);
    advanceTour(tour);
};

$(document).on('click', '#tour-next', function () {
    advanceTour(tour);
});

$(document).on('click', '#tour-prev', function () {
    rewindTour(tour);
});

$(document).on('click', '#tour-exit', function () {
    resetTour(tour);
});
////////////////////////////////////////////////////////////////////////////////

var tour = createTour({
    hideOnClick: false,
    theme: 'light',
    arrow: true,
    steps: [{
            element: '#home',
            text: 'Our real-time, geospatial intelligence system gives you insights into the environment’s health and empower you to make informed decisions and mitigate risks immediately.',
            position: 'top'
        },
        {
            element: '#map',
            text: 'Pinpoint fires with precise geolocation and minimize damage to your assets. The firefighters will be able to know where the fire is spreading with real-time information.',
            position: 'left'
        },
        {
            element: '#charts',
            text: 'Continuous monitoring and precise prediction algorithms allows you to be proactive instead of reactive.',
            position: 'top'
        },
        {
            element: '#alerts',
            text: 'A fire alert is released when specific conditions are met. Firefighters can examine the analysis and determine when and how to respond',
            position: 'left'
        },
        {
            element: '#status',
            text: 'Each unit scans 24/7 and is equipped with a range of sensors that detect wildfires based on the environmental anomalies they produce.',
            position: 'left'
        },
        {
            element: '#analysis',
            text: 'Data fusion and AI enable you to turn all collected data into meaningful information. Analyze historical fire data to identify risk areas and plan fire mitigation strategies.',
            position: 'bottom'
        }
    ]
});

mapboxgl.accessToken = 'pk.eyJ1IjoieWFyb3giLCJhIjoiY2o5aWVvMWRiM2R5aDJxcXlvc2FmcWhzbSJ9.-rOTs9UnhWazfkt6nwWDyg';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: [-17.856083, 28.628639],
    zoom: 12.5
});

map.addControl(new mapboxgl.NavigationControl());
map.touchZoomRotate.disableRotation();
map.scrollZoom.disable();
map.dragRotate.disable();

var cluster = supercluster({
    radius: 30,
    maxZoom: 15,
    initial: function () {
        return {
            count: 0,
            risk_sum: 0,
            temp_sum: 0,
            prec_sum: 0,
            wind_sum: 0,
            humi_sum: 0
        };
    },
    map: function (properties) {
        return {
            count: 1,
            risk_sum: Number(properties.risk),
            temp_sum: Number(properties.temperature),
            prec_sum: Number(properties.precipIntensity),
            wind_sum: Number(properties.windSpeed),
            humi_sum: Number(properties.humidity),
        };
    },
    reduce: function (accumulated, properties) {
        accumulated.count += properties.count;

        accumulated.risk_sum += properties.risk_sum;
        accumulated.temp_sum += properties.temp_sum;
        accumulated.prec_sum += properties.prec_sum;
        accumulated.wind_sum += properties.wind_sum;
        accumulated.humi_sum += properties.humi_sum;

        accumulated.risk = accumulated.risk_sum / accumulated.count;
        accumulated.temperature = accumulated.temp_sum / accumulated.count;
        accumulated.precipIntensity = accumulated.prec_sum / accumulated.count;
        accumulated.windSpeed = accumulated.wind_sum / accumulated.count;
        accumulated.humidity = accumulated.humi_sum / accumulated.count;
    }
});

var clusterData, currentZoom, gd1, gd2, gd3, gd4, gd5;
var dialog = document.querySelector('#dialog');

if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
}

Plotly.d3.json('data/alerts.json', function (json) {
    console.log(json);
    createAlertsTable(json);
});

Plotly.d3.json('data/charts.json', function (json) {
    console.log(json);

    var layout = {
        showlegend: false,
        barmode: 'stack'
    };

    var trace1 = {
        x: json.xaxis,
        y: json.yaxis.risk_mean,
        type: 'scatter',
        name: 'Mean',
        line: {
            shape: 'spline',
            color: '#66BB6A'
        },
    };

    var trace2 = {
        x: json.xaxis,
        y: json.yaxis.risk_amax,
        type: 'bar',
        name: 'Max',
        marker: {
            color: '#FF8A65'
        }
    };

    gd1 = Plotly.d3.select("#chart-1").node();

    Plotly.newPlot(gd1, [trace1, trace2], layout, {
        displaylogo: false
    });

    var trace = {
        x: json.xaxis,
        y: json.yaxis.temperature_mean,
        type: 'scatter',
        line: {
            shape: 'spline',
            color: '#66BB6A'
        },
    };

    gd2 = Plotly.d3.select("#chart-2").node();

    Plotly.newPlot(gd2, [trace], {}, {
        displaylogo: false
    });

    var trace = {
        x: json.xaxis,
        y: json.yaxis.precipIntensity_mean,
        type: 'bar',
        marker: {
            color: '#FF8A65'
        }
    };

    gd3 = Plotly.d3.select("#chart-3").node();

    Plotly.newPlot(gd3, [trace], {}, {
        displaylogo: false
    });

    var trace1 = {
        x: json.xaxis,
        y: json.yaxis.windSpeed_mean,
        type: 'bar',
        name: 'Speed',
        marker: {
            color: '#66BB6A'
        },
    };

    var trace2 = {
        x: json.xaxis,
        y: json.yaxis.windGust_mean,
        type: 'bar',
        name: 'Gust',
        marker: {
            color: '#FF8A65'
        },
    };

    gd4 = Plotly.d3.select("#chart-4").node();

    Plotly.newPlot(gd4, [trace1, trace2], layout, {
        displaylogo: false
    });

    var trace = {
        x: json.xaxis,
        y: json.yaxis.humidity_mean,
        type: 'scatter',
        line: {
            shape: 'spline',
            color: '#66BB6A'
        },
    };

    gd5 = Plotly.d3.select("#chart-5").node();

    Plotly.newPlot(gd5, [trace], {}, {
        displaylogo: false
    });
});

map.on('load', function () {
    Plotly.d3.json('data/locations.geojson', function (json) {
        console.log(json);

        cluster.load(json.features);
        updateClusterData();

        map.addSource('locations', {
            type: 'geojson',
            data: clusterData,
            buffer: 1
        });

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'locations',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': {
                    property: 'risk',
                    type: 'exponential',
                    stops: [
                        [0, 'rgba(26,152,80, 0.25)'],
                        [20, 'rgb(145,207,96)'],
                        [40, 'rgb(217,239,139)'],
                        [60, 'rgb(254,224,139)'],
                        [80, 'rgb(252,141,89)'],
                        [100, 'rgb(215,48,39)']
                    ]
                },
                'circle-radius': {
                    property: 'count',
                    type: 'exponential',
                    stops: [
                        [10, 20],
                        [15, 60]
                    ]
                },
                'circle-blur': 0.5
            }
        }, 'waterway-label');

        map.addLayer({
            id: 'points',
            type: 'circle',
            source: 'locations',
            filter: ['!has', 'point_count'],
            paint: {
                'circle-color': {
                    property: 'risk',
                    type: 'exponential',
                    stops: [
                        [0, 'rgba(26,152,80, 0.25)'],
                        [20, 'rgb(145,207,96)'],
                        [40, 'rgb(217,239,139)'],
                        [60, 'rgb(254,224,139)'],
                        [80, 'rgb(252,141,89)'],
                        [100, 'rgb(215,48,39)']
                    ]
                },
                'circle-radius': 10
            }
        }, 'waterway-label');
    });

    startTour(tour);
});

map.on('mouseenter', 'clusters', function (e) {
    showPopup(e);
});

map.on('mouseenter', 'points', function (e) {
    showPopup(e);
});

map.on('mouseleave', 'clusters', function (e) {
    hidePopup(e);
});

map.on('mouseleave', 'points', function (e) {
    hidePopup(e);
});

map.on('click', 'clusters', function (e) {
    centerMap(e);
});

map.on('click', 'points', function (e) {
    centerMap(e);
});

map.on('zoom', function (e) {
    var newZoom = map.getZoom();

    if (Math.floor(newZoom) != Math.floor(currentZoom)) {
        currentZoom = newZoom;
        updateClusterData();
        map.getSource('locations').setData(clusterData);
    }
});

$(".mdl-tabs__tab").click(function () {
    resizePlots([gd1, gd2, gd3, gd4, gd5]);
});

$("#closeDialog").click(function () {
    dialog.close();
});

$("#alerts").on("click", "tr", function () {
    var unit = this.querySelector(".row-unit");
    var lat = parseFloat(unit.getAttribute("data-lat"));
    var lon = parseFloat(unit.getAttribute("data-lon"));

    map.flyTo({
        center: [lon, lat],
        zoom: 15
    });
});

$("#help").click(function () {
    startTour(tour);
    return false;
})

window.onresize = function () {
    resizePlots([gd1, gd2, gd3, gd4, gd5]);
};

var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

var updateClusterData = function () {
    currentZoom = Math.floor(map.getZoom());

    var bounds = map.getBounds();
    var bbox = [bounds.getWest(), bounds.getSouth(),
        bounds.getEast(), bounds.getNorth()
    ];

    clusterData = turf.featureCollection(cluster.getClusters(bbox, currentZoom));
};

var showPopup = function (e) {
    var t = document.getElementById("popup-template");
    var clone = document.importNode(t.content, true).firstElementChild;
    var feature = e.features[0];

    clone.querySelector("#risk-value").innerHTML = feature.properties.risk.toFixed() + '%';
    clone.querySelector("#temp-value").innerHTML = feature.properties.temperature.toFixed(2) + ' &#8451;';
    clone.querySelector("#prec-value").innerHTML = feature.properties.precipIntensity.toFixed(2) + ' mm/h';
    clone.querySelector("#wind-value").innerHTML = feature.properties.windSpeed.toFixed(2) + ' m/s';
    clone.querySelector("#humi-value").innerHTML = (feature.properties.humidity * 100).toFixed() + '%';

    map.getCanvas().style.cursor = 'pointer';
    popup.setLngLat(feature.geometry.coordinates)
        .setHTML(clone.outerHTML)
        .addTo(map);
};

var createAlertsTable = function (data) {
    var alerts = document.getElementById("alerts");
    var index = data.date;

    index.forEach(function (value, index) {
        var t = document.getElementById("row-template");
        var clone = document.importNode(t.content, true).firstElementChild;

        clone.querySelector(".row-unit").innerHTML = data.unit[index];
        clone.querySelector(".row-date").innerHTML = data.date[index];
        clone.querySelector(".row-risk").innerHTML = data.risk[index].toFixed(2) + '%';

        clone.querySelector(".row-unit").setAttribute("data-lat", data.lat[index]);
        clone.querySelector(".row-unit").setAttribute("data-lon", data.lon[index]);

        alerts.appendChild(clone);
    });
};

var hidePopup = function (e) {
    map.getCanvas().style.cursor = '';
    popup.remove();
};

var centerMap = function (e) {
    var feature = e.features[0];
    map.flyTo({
        center: feature.geometry.coordinates
    });

    console.log(feature.geometry.coordinates);
};

var openDialog = function () {
    dialog.showModal();
    return false;
};

var resizePlots = function (plots) {
    plots.forEach(function (plot) {
        Plotly.Plots.resize(plot);
    });
};
