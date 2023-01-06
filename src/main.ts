import {App} from "./components/app";
import "./styles/styles.scss";

const main = (): void => {
    // Remove "display:none" from body
    document.body.style.display = "block";
    (window as any).app = new App("map-container-leaflet");
};

console.log(document.readyState);
if (document.readyState === "loading") {
    console.log("add event listener");
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}
