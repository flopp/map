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

    constructor(app: App) {
        const self = this;
        this.app = app;

        this.menu = create_element("div", ["dropdown-menu"], {role: "menu"});
        document.getElementsByTagName("body")[0].appendChild(this.menu);
        const content = create_element("div", ["dropdown-content"]);
        this.menu.appendChild(content);

        this.addMarker = create_element("a", ["dropdown-item"], {"data-i18n": "menu.add-marker"});
        content.appendChild(this.addMarker);
        this.addMarker.addEventListener("click", (): boolean => {
            self.hide();
            self.app.map_state.add_marker(self.coordinates);
            return false;
        });

        this.deleteMarker = create_element("a", ["dropdown-item"], {"data-i18n": "menu.delete-marker"});
        content.appendChild(this.deleteMarker);
        this.deleteMarker.addEventListener("click", (): boolean => {
            self.hide();
            if (self.marker !== null) {
                self.app.map_state.delete_marker(self.marker.get_id());
                self.marker = null;
            }
            return false;
        });

        this.projection = create_element("a", ["dropdown-item"], {"data-i18n": "menu.waypoint-projection"});
        content.appendChild(this.projection);
        this.projection.addEventListener("click", (): boolean => {
            self.hide();
            if (self.marker !== null) {
                self.app.show_projection_dialog(self.marker);
            }
            return false;
        });

        const centerMap = create_element("a", ["dropdown-item"], {"data-i18n": "menu.center-map"});
        content.appendChild(centerMap);
        centerMap.addEventListener("click", (): boolean => {
            self.hide();
            if (self.coordinates !== null) {
                self.app.map_state.set_center(self.coordinates);
            } else if (self.marker !== null) {
                self.app.map_state.set_center(self.marker.coordinates);
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
