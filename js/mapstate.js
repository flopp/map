import {Coordinates} from "./coordinates.js";
import {Marker} from "./marker.js";
import {Storage} from "./storage.js";
import {MapType, maptype2string, string2maptype} from "./maptype.js";

export class MapState {
    constructor() {
        this.sidebar_open = null;

        this.map_type = null;
        this.zoom = null;
        this.center = null;

        this.markers = [];
        this.markers_hash = new Map();

        this.observers = [];

        this.storage = new Storage();

        this.restore();
    }

    restore() {
        // sidebar
        this.set_sidebar_open(
            this.storage.get("sidebar_open", null));

        // map view
        this.set_view(
            this.storage.get_coordinates("center", new Coordinates(48, 8)),
            this.storage.get_int("zoom", 13));
        this.set_map_type(string2maptype(
            this.storage.get("map_type", maptype2string(MapType.STAMEN_TERRAIN))));

        // markers
        this.storage.get("markers", "").split(";").forEach((id) => {
            const coordinates = this.storage.get_coordinates(`marker;${id};coordinates`, null);
            const name        = this.storage.get(`marker;${id};name`, id);
            const color       = this.storage.get(`marker;${id};color`, "FF0000");
            const radius      = this.storage.get_float(`marker;${id};radius`, 0);
            if (coordinates) {
                const marker = new Marker(coordinates);
                marker.name = name;
                marker.color = color;
                marker.radius = radius;
                this.markers.push(marker);
                this.markers_hash.set(marker.id, marker);
            }
        });
    }

    register_observer(observer) {
        this.observers.push(observer);
    }

    update_observers(sender) {
        this.observers.forEach((observer) => {
            if (observer !== sender) {
                observer.update_state();
            }
        });
    }

    set_sidebar_open(section) {
        this.sidebar_open = section;
        this.storage.set("sidebar_open", section);
        this.update_observers(null);
    }

    set_map_type(map_type) {
        this.map_type = map_type;
        this.storage.set("map_type", maptype2string(this.map_type));
        this.update_observers(null);
    }

    set_view(center, zoom, sender) {
        this.center = center;
        this.zoom = zoom;
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(sender);
    }

    set_zoom(zoom, sender) {
        this.zoom = zoom;
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(sender);
    }

    set_center(coordinates, sender) {
        this.center = coordinates;
        this.storage.set_coordinates("center", this.center);
        this.update_observers(sender);
    }

    add_marker(coordinates) {
        var marker = null;
        if (!coordinates) {
            marker = new Marker(this.center);
        } else {
            marker = new Marker(coordinates);
        }
        this.markers.push(marker);
        this.markers_hash.set(marker.id, marker);
        this.storage.set(`marker;${marker.id};name`, marker.name);
        this.storage.set(`marker;${marker.id};color`, marker.color);
        this.storage.set(`marker;${marker.id};radius`, marker.radius);
        this.storage.set_coordinates(`marker;${marker.id};coordinates`, marker.coordinates);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(null);
    }

    get_marker(id) {
        return this.markers_hash.get(id);
    }

    delete_marker(id) {
        this.markers = this.markers.filter((marker, _index, _arr) => {
            return marker.id != id;
        });
        this.markers_hash.delete(id);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(null);
    }

    delete_all_markers() {
        Marker.reset_ids();
        this.markers = [];
        this.markers_hash.clear();
        this.storage.set("markers", null);
        this.update_observers(null);
    }

    set_marker_coordinates(id, coordinates, sender) {
        this.markers_hash.get(id).coordinates = coordinates;
        this.storage.set_coordinates(`marker;${id};coordinates`, coordinates);
        this.update_observers(sender);
    }
    set_marker_name(id, name, sender) {
        this.markers_hash.get(id).name = name;
        this.storage.set(`marker;${id};name`, name);
        this.update_observers(sender);
    }
    set_marker_color(id, color, sender) {
        this.markers_hash.get(id).color = color;
        this.storage.set(`marker;${id};color`, color);
        this.update_observers(sender);
    }
    set_marker_radius(id, radius, sender) {
        this.markers_hash.get(id).radius = radius;
        this.storage.set(`marker;${id};radius`, radius);
        this.update_observers(sender);
    }

    get_marker_ids_string() {
        return this.markers.map(m => m.id).join(";");
    }

    to_json() {
        const data = {
            "maptype": this.map_type,
            "center": this.center.to_string_D(),
            "zoom": this.zoom,
            "markers": []
        };

        this.markers.forEach((m) => {
            data.markers.push(m.to_json());
        });

        return data;
    }
}

export class MapStateObserver {
    constructor(map_state) {
        this.map_state = map_state;
        map_state.register_observer(this);
    }

    update_state() {
        throw new Error('not implemented');
    }
}