import {Coordinates} from "./coordinates.js";
import {Line} from "./line.js";
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

        this.lines = [];
        this.lines_hash = new Map();

        this.observers = [];

        this.storage = new Storage();

        this.restore();
    }

    store() {
        const self = this;
        this.storage.set("sidebar_open", this.sidebar_open);
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.storage.set("map_type", maptype2string(this.map_type));
        this.storage.set("markers", this.get_marker_ids_string());
        this.markers.forEach((marker) => {
            self.storage.set(`marker;${marker.id};name`, marker.name);
            self.storage.set(`marker;${marker.id};color`, marker.color);
            self.storage.set(`marker;${marker.id};radius`, marker.radius);
            self.storage.set_coordinates(`marker;${marker.id};coordinates`, marker.coordinates);
        });
        this.storage.set("lines", this.get_line_ids_string());
        this.lines.forEach((line) => {
            self.storage.set(`line;${line.id};marker1`, line.marker1);
            self.storage.set(`line;${line.id};marker2`, line.marker2);
            self.storage.set(`line;${line.id};color`, line.color);
        });
    }

    restore() {
        const self = this;

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
        const marker_ids = new Map();
        this.storage.get("markers", "").split(";").forEach((id) => {
            if (id === "") {
                return;
            }
            const coordinates = self.storage.get_coordinates(`marker;${id};coordinates`, null);
            const name        = self.storage.get(`marker;${id};name`, id);
            const color       = self.storage.get(`marker;${id};color`, "FF0000");
            const radius      = self.storage.get_float(`marker;${id};radius`, 0);
            if (coordinates) {
                const marker = new Marker(coordinates);
                marker.name = name;
                marker.color = color;
                marker.radius = radius;
                self.markers.push(marker);
                self.markers_hash.set(marker.id, marker);
                marker_ids.set(id, marker.id);
            }
        });

        // lines
        this.storage.get("lines", "").split(";").forEach((id) => {
            if (id === "") {
                return;
            }
            const old_marker1 = self.storage.get(`line;${id};marker1`, -1);
            const old_marker2 = self.storage.get(`line;${id};marker2`, -1);
            const color       = self.storage.get(`line;${id};color`, "FF0000");

            let marker1 = marker_ids.get(old_marker1);
            if (marker1 === null) {
                marker1 = -1;
            }

            let marker2 = marker_ids.get(old_marker2);
            if (marker2 === null) {
                marker2 = -1;
            }

            const line = new Line(marker1, marker2);
            line.color = color;
            self.lines.push(line);
            self.lines_hash.set(line.id, line);
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

    add_line() {
        const line = new Line(-1, -1);
        this.lines.push(line);
        this.lines_hash.set(line.id, line);
        this.storage.set(`line;${line.id};marker1`, line.marker1);
        this.storage.set(`line;${line.id};marker2`, line.marker2);
        this.storage.set(`line;${line.id};color`, line.color);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(null);
    }

    get_line(id) {
        return this.lines_hash.get(id);
    }

    delete_line(id) {
        this.lines = this.lines.filter((lines, _index, _arr) => {
            return lines.id != id;
        });
        this.lines_hash.delete(id);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(null);
    }

    delete_all_lines() {
        Line.reset_ids();
        this.lines = [];
        this.lines_hash.clear();
        this.storage.set("lines", null);
        this.update_observers(null);
    }

    set_line_marker1(id, marker_id, sender) {
        this.lines_hash.get(id).marker1 = marker_id;
        this.storage.set_coordinates(`line;${id};marker1`, marker_id);
        this.update_observers(sender);
    }
    set_line_marker2(id, marker_id, sender) {
        this.lines_hash.get(id).marker2 = marker_id;
        this.storage.set_coordinates(`line;${id};marker2`, marker_id);
        this.update_observers(sender);
    }
    set_line_color(id, color, sender) {
        this.lines_hash.get(id).color = color;
        this.storage.set(`line;${id};color`, color);
        this.update_observers(sender);
    }

    get_line_ids_string() {
        return this.lines.map(line => line.id).join(";");
    }

    to_json() {
        const data = {
            "maptype": this.map_type,
            "center": this.center.to_string_D(),
            "zoom": this.zoom,
            "markers": [],
            "lines": []
        };

        this.markers.forEach((marker) => {
            data.markers.push(marker.to_json());
        });
        this.lines.forEach((line) => {
            data.lines.push(line.to_json());
        });
        return data;
    }

    from_json(data) {
        const self = this;

        if ("maptype" in data) {
            const map_type = string2maptype(data.maptype);
            if (map_type) {
                this.map_type = map_type;
            }
        }
        if ("zoom" in data) {
            const zoom = parseInt(data.zoom, 10);
            if (zoom !== null) {
                this.zoom = zoom;
            }
        }
        if ("center" in data) {
            const center = Coordinates.from_string(data.center);
            if (center !== null) {
                this.center = center;
            }
        }

        const marker_ids = new Map();
        if (("markers" in data) && Array.isArray(data.markers)) {
            this.markers = [];
            this.markers_hash.clear();
            Marker.reset_ids();
            data.markers.forEach((m) => {
                let id = null;
                let coordinates = null;
                let name = null;
                let color = null;
                let radius = null;
                if ("id" in m) {
                    id = parseInt(m.id, 10);
                }
                if ("coordinates" in m) {
                    coordinates = Coordinates.from_string(m.coordinates);
                }
                if ("name" in m) {
                    name = String(m.name);
                }
                if ("color" in m) {
                    if (RegExp('^[0-9A-Fa-f]{6}$').test(m.color)) {
                        color = m.color;
                    }
                }
                if ("radius" in m) {
                    radius = parseFloat(m.radius);
                }

                if (coordinates) {
                    const marker = new Marker(coordinates);
                    self.markers.push(marker);
                    self.markers_hash.set(marker.id, marker);
                    marker_ids.set(id, marker.id);

                    if (name) {
                        marker.name = name;
                    }
                    if (color) {
                        marker.color = color;
                    }
                    if (radius !== null) {
                        marker.radius = radius;
                    }
                }
            });
        }

        if (("lines" in data) && Array.isArray(data.lines)) {
            this.lines = [];
            this.lines_hash.clear();
            Line.reset_ids();
            data.lines.forEach((l) => {
                let old_marker1 = -1;
                let old_marker2 = -1;
                let color = null;
                if ("marker1" in l) {
                    old_marker1 = parseInt(l.marker1, 10);
                }
                if ("marker2" in l) {
                    old_marker2 = parseInt(l.marker2, 10);
                }
                if ("color" in l) {
                    if (RegExp('^[0-9A-Fa-f]{6}$').test(l.color)) {
                        color = l.color;
                    }
                }

                let marker1 = marker_ids.get(old_marker1);
                if (marker1 === null) {
                    marker1 = -1;
                }

                let marker2 = marker_ids.get(old_marker2);
                if (marker2 === null) {
                    marker2 = -1;
                }
                const line = new Line(marker1, marker2);
                if (color) {
                    line.color = color;
                }

                self.lines.push(line);
                self.lines_hash.set(line.id, line);
            });
        }

        this.store();
        this.update_observers(null);
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