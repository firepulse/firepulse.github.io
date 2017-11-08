'use strict';

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

Plotly.d3.json('./data/alerts.json', function (json) {
    console.log(json);
    createAlertsTable(json);
});

Plotly.d3.json('./data/charts.json', function (json) {
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
    Plotly.d3.json('./data/locations.geojson', function (json) {
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
