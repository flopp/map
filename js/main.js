import {App} from "./app.js";

$(document).ready(() => {
    window.app = new App('map-container-leaflet', 'map-container-google', 'map-container-bing');
});

