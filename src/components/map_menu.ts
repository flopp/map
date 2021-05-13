import {App} from "./app.js";
import {Coordinates} from "./coordinates.js";
import {MapWrapper} from "./map_wrapper.js";
import {Marker} from "./marker";
import {create_element} from "./utilities";

export class MapMenu {
    public app: App;
    public menu: HTMLElement;
    public addMarker: HTMLElement;
    public deleteMarker: HTMLElement;
    public projection: HTMLElement;
    public marker: Marker|null = null;
    public coordinates: Coordinates|null = null;

    public constructor(app: App) {
        this.app = app;

        this.menu = create_element("div", ["dropdown-menu"], {role: "menu"});
        document.getElementsByTagName("body")[0].appendChild(this.menu);
        const content = create_element("div", ["dropdown-content"]);
        this.menu.appendChild(content);

        this.addMarker = create_element("a", ["dropdown-item"], {"data-i18n": "menu.add-marker"});
        content.appendChild(this.addMarker);
        this.addMarker.addEventListener("click", (): boolean => {
            this.hide();
            this.app.map_state.add_marker(this.coordinates);

            return false;
        });

        this.deleteMarker = create_element("a", ["dropdown-item"], {"data-i18n": "menu.delete-marker"});
        content.appendChild(this.deleteMarker);
        this.deleteMarker.addEventListener("click", (): boolean => {
            this.hide();
            if (this.marker !== null) {
                this.app.map_state.delete_marker(this.marker.get_id());
                this.marker = null;
            }

            return false;
        });

        this.projection = create_element("a", ["dropdown-item"], {"data-i18n": "menu.waypoint-projection"});
        content.appendChild(this.projection);
        this.projection.addEventListener("click", (): boolean => {
            this.hide();
            if (this.marker !== null) {
                this.app.show_projection_dialog(this.marker);
            }

            return false;
        });

        const centerMap = create_element("a", ["dropdown-item"], {"data-i18n": "menu.center-map"});
        content.appendChild(centerMap);
        centerMap.addEventListener("click", (): boolean => {
            this.hide();
            if (this.coordinates !== null) {
                this.app.map_state.set_center(this.coordinates);
            } else if (this.marker !== null) {
                this.app.map_state.set_center(this.marker.coordinates);
            }

            return false;
        });

        this.hide();
    }

    public hide(): void {
        this.menu.style.display = "none";
    }

    public showMap(wrapper: MapWrapper, x: number, y: number, coordinates: Coordinates): void {
        this.addMarker.style.display = "block";
        this.deleteMarker.style.display = "none";
        this.projection.style.display = "none";

        this.marker = null;
        this.coordinates = coordinates;

        this.show(wrapper, x, y);
    }

    public showMarker(wrapper: MapWrapper, x: number, y: number, marker: Marker): void {
        this.addMarker.style.display = "none";
        this.deleteMarker.style.display = "block";
        this.projection.style.display = "block";

        this.marker = marker;
        this.coordinates = null;

        this.show(wrapper, x, y);
    }

    public show(wrapper: MapWrapper, x: number, y: number): void {
        this.menu.style.top = `${Math.min(y, wrapper.height() - this.menu.clientHeight)}px`;
        this.menu.style.left = `${Math.min(x, wrapper.width() - this.menu.clientWidth)}px`;
        this.menu.style.display = "block";
    }
}
