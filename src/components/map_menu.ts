import {App} from "./app.js";
import {Coordinates} from "./coordinates.js";
import {Marker} from "./marker";
import {MapWrapper} from "./map_wrapper.js";

export class MapMenu {
    public app: App;
    public menu: HTMLElement;
    public addMarker: HTMLElement;
    public deleteMarker: HTMLElement;
    public projection: HTMLElement;
    public centerMap: HTMLElement;
    public marker: Marker;
    public coordinates: Coordinates;

    constructor(app: App) {
        const self = this;
        this.app = app;
        this.menu = document.querySelector('#map-contextmenu');
        this.addMarker = document.querySelector('#map-contextmenu-add-marker');
        this.deleteMarker = document.querySelector('#map-contextmenu-delete-marker');
        this.projection = document.querySelector('#map-contextmenu-projection');
        this.centerMap = document.querySelector('#map-contextmenu-center-map');
        this.marker = null;
        this.coordinates = null;

        this.addMarker.addEventListener('click', (): boolean => {
            self.hide();
            self.app.map_state.add_marker(self.coordinates);
            return false;
        });

        this.deleteMarker.addEventListener('click', (): boolean => {
            self.hide();
            if (self.marker) {
                self.app.map_state.delete_marker(self.marker.get_id());
                self.marker = null;
            }
            return false;
        });

        this.projection.addEventListener('click', (): boolean => {
            self.hide();
            if (self.marker) {
                self.app.show_projection_dialog(self.marker);
            }
            return false;
        });

        this.centerMap.addEventListener('click', (): boolean => {
            self.hide();
            if (self.coordinates) {
                self.app.map_state.set_center(self.coordinates);
            } else if (self.marker) {
                self.app.map_state.set_center(self.marker.coordinates);
            }
            return false;
        });

        this.hide();
    }

    public hide(): void {
        this.menu.style.display = 'none';
    }

    public showMap(wrapper: MapWrapper, x: number, y: number, coordinates: Coordinates): void {
        this.addMarker.style.display = 'block';
        this.deleteMarker.style.display = 'none';
        this.projection.style.display = 'none';
        this.centerMap.style.display = 'block';

        this.marker = null;
        this.coordinates = coordinates;

        this.show(wrapper, x, y);
    }

    public showMarker(wrapper: MapWrapper, x: number, y: number, marker: Marker): void {
        this.addMarker.style.display = 'none';
        this.deleteMarker.style.display = 'block';
        this.projection.style.display = 'block';
        this.centerMap.style.display = 'block';

        this.marker = marker;
        this.coordinates = null;

        this.show(wrapper, x, y);
    }

    public show(wrapper: MapWrapper, x: number, y: number): void {
        this.menu.style.top = `${Math.min(y, wrapper.height() - this.menu.clientHeight)}px`;
        this.menu.style.left = `${Math.min(x, wrapper.width() - this.menu.clientWidth)}px`;
        this.menu.style.display = 'block';
    }
}
