import {App} from "./components/app";
import "./styles/styles.scss";

const main = (): void => {
    (window as any).app = new App("map-container-leaflet");
};

if (document.readyState === "loading") {
    console.log("add event listener");
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}
