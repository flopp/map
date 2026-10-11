import {App} from "./components/app";
import "./styles/styles.scss";

const main = (): void => {
    // Remove "display:none" from body
    document.body.style.display = "block";
    (window as any).app = new App("map-container-leaflet");

    if (location.hash === '#disable-umami') {
        localStorage.setItem('umami.disabled', 'true');
        alert('Umami is now DISABLED in this browser.');
    }
    if (location.hash === '#enable-umami') {
        localStorage.removeItem('umami.disabled');
        alert('Umami is now ENABLED in this browser.');
    }
};

console.log(document.readyState);
if (document.readyState === "loading") {
    console.log("add event listener");
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}
