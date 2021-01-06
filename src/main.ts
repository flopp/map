import {App} from './app';

function main(): void {
    (window as any).app = new App(
        'map-container-leaflet',
        'map-container-google'
    );
};

if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
