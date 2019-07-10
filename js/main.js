var app = null;

$(document).ready(() => {
    app = new App('map-container-leaflet', 'map-container-google');
});

function initialize_google_map() {
    app.initialize_google_map();
}
