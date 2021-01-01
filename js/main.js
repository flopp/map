import {App} from './app.js';

const main = () => {
    window.app = new App(
        'map-container-leaflet',
        'map-container-google'
    );
};

if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
