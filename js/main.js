var dualmap = null;
var sidebar = null;

$(document).ready(() => {
    dualmap = new DualMap('map-container-leaflet', 'map-container-google', [
        {selector: '#btn-openstreetmap',    type: MapType.OPENSTREETMAP   },
        {selector: '#btn-opentopomap',      type: MapType.OPENTOPOMAP     },
        {selector: '#btn-stamen-terrain',   type: MapType.STAMEN_TERRAIN  },
        {selector: '#btn-google-roadmap',   type: MapType.GOOGLE_ROADMAP  },
        {selector: '#btn-google-satellite', type: MapType.GOOGLE_SATELLITE},
        {selector: '#btn-google-hybrid',    type: MapType.GOOGLE_HYBRID   },  
        {selector: '#btn-google-terrain',   type: MapType.GOOGLE_TERRAIN  },    
    ]);

    sidebar = new Sidebar("#sidebar", "#sidebar-controls", [
        '#btn-layers',  '#btn-markers', '#btn-lines', '#btn-tools', '#btn-info'
    ]);

    sidebar.set_map(dualmap);
});

function initialize_google_map() {
    dualmap.initialize_google_map();
}
