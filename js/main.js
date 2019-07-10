var app = null;

$(document).ready(() => {
    app = new App('map-container-leaflet', 'map-container-google', [
        {selector: '#btn-openstreetmap',    type: MapType.OPENSTREETMAP   },
        {selector: '#btn-opentopomap',      type: MapType.OPENTOPOMAP     },
        {selector: '#btn-stamen-terrain',   type: MapType.STAMEN_TERRAIN  },
        {selector: '#btn-google-roadmap',   type: MapType.GOOGLE_ROADMAP  },
        {selector: '#btn-google-satellite', type: MapType.GOOGLE_SATELLITE},
        {selector: '#btn-google-hybrid',    type: MapType.GOOGLE_HYBRID   },
        {selector: '#btn-google-terrain',   type: MapType.GOOGLE_TERRAIN  },
    ]);
});

function initialize_google_map() {
    app.initialize_google_map();
}
