var map;
var ajaxRequest;
var plotlist;

function initmap() {
  // set up AJAX request
  ajaxRequest=GetXmlHttpObject();
  if (ajaxRequest==null) {
	  alert ("This browser does not support HTTP Request");
	  return;
  }

  // set up base layer(s) and marker layer(s)

  // create the tile layers with correct attribution

  var osmAttrib = 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
  var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 20, attribution: osmAttrib});		

  var osmdeAttrib = osmAttrib + '; Map Tiles &copy; <a href="http://www.openstreetmap.de">OpenStreetMap Deutschland</a>, CC-BY-SA';
  var osmdeUrl = 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png';
  var osmde = new L.TileLayer(osmdeUrl, {minZoom: 6, maxZoom: 20, attribution: osmdeAttrib});

  var esriAttrib = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
  var esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  var esri = new L.TileLayer(esriUrl, {minZoom: 6, maxZoom: 20, attribution: esriAttrib});

  // overlays
  
  locsec = new L.geoJson(null, {
            style: function(feature) {
//             return {color: feature.properties.color};
              return {color: 'red'};
            },
    
            onEachFeature: function(feature, layer) {
              layer.bindPopup('Mehr Information hier: <br /><b>' + feature.properties.link + '</b>');
              layer.bindTooltip('LocSecGebiet: ' + feature.properties.locsec, {sticky: true, direction: 'top'});
              layer.on('mouseover', function () { this.setStyle({color: 'green'}); });
              layer.on('mouseout', function () { locsec.resetStyle(this);});
            },
  });
  
  // set up the map with initial zoom, center and visible layers

  map = new L.Map('map', {center: [51.5, 9.93], zoom: 6, layers: [osmde, locsec]}); // germany total

  // set up the layers control for all layers

  var baseLayers = {"Deutscher Stil": osmde, "Original Mapnik": osm, "Satellit": esri};
  var overlays   = {"LocSec-Gebiete": locsec};
  var layerswitcher = new L.control.layers(baseLayers, overlays);
  layerswitcher.addTo(map);

  // set up GeoSearch-Control

  var geosearch = new L.Control.GeoSearch({provider: new L.GeoSearch.Provider.OpenStreetMap(),
                           position: 'topcenter',
                           showMarker: true});
  geosearch.addTo(map);

  // additional controls (scale etc.)

  L.control.mousePosition({emptystring: '--.----- : --.-----'}).addTo(map);
  L.control.scale({metric: true, imperial: false, updateWhenIdle: true}).addTo(map);
  L.control.scale({metric: false, imperial: true, updateWhenIdle: true}).addTo(map);

  // terminator: polyline for day and night visualization

  var t = L.terminator();
  // t.addTo(map);
  layerswitcher.addOverlay(t, "Nachtanzeige");
  setInterval(function(){updateTerminator(t)}, 5000);
  function updateTerminator(t) {
    var t2 = L.terminator();
    t.setLatLngs(t2.getLatLngs());
    t.redraw();
  }

  // filelayer: Darstellung von geoJSON/GPX/KML

  L.Control.FileLayerLoad.LABEL = '<i class="fa fa-folder-open"></i>';
  var filelayer = L.Control.fileLayerLoad({
      fitBounds: true,
      layerOptions: { style: {color:'blue'},
                      fileSizeLimit: 4096,
                      pointToLayer: function (data, latlng) {
                                      return L.circleMarker(latlng, {style: {color: 'red'}});
                      },
                      onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.link) {
                          layer.bindPopup('Mehr Information hier<br /><b>' + feature.properties.link + '</b>');
                        }
                        if (feature.properties && feature.properties.locsec) {
                          layer.bindTooltip('LocSecGebiet: ' + feature.properties.locsec, {sticky: true, direction: 'top'});
                        }
                      },
                    },
  });
  filelayer.addTo(map);

  filelayer.loader.on('data:loaded', function (e) {
    // Add to map layer switcher
    layerswitcher.addOverlay(e.layer, e.filename);
  });
  
  filelayer.loader.on('data:error', function (e) {
    // Do something usefull with the error!
    console,error(e);
  });

  // initiate markers and polygons

  askForLocsecs();
}

// functions to get the markers (see: switch2osm.org/using_tiles/...)

function GetXmlHttpObject() {
	if (window.XMLHttpRequest) { return new XMLHttpRequest(); }
	if (window.ActiveXObject)  { return new ActiveXObject("Microsoft.XMLHTTP"); }
	return null;
}

// request the locsec layer

function askForLocsecs() {
	ajaxRequest.open('GET', 'locsec-all.geojson', true);
	ajaxRequest.setRequestHeader('Content-Type', 'application/json');
	ajaxRequest.onload = function() {
	  if (ajaxRequest.status == 200) {
	    locsec.addData(JSON.parse(ajaxRequest.responseText));
	  }
	};
	ajaxRequest.send();
}

