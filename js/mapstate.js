const MapType = {
    OPENSTREETMAP: 0,        
    OPENTOPOMAP: 1,
    
    STAMEN_TERRAIN: 2,

    GOOGLE_ROADMAP: 3,
    GOOGLE_SATELLITE: 4,
    GOOGLE_HYBRID: 5,
    GOOGLE_TERRAIN: 6,
};

class MapState {
    constructor() {
        this.map_type = null;
        this.zoom = null;
        this.center = null;

        this.markers = [];
        this.markers_hash = new Map();

        this.observers = [];

        this.storage = new Storage();

        this.restore();
    }

    static string2maptype(s) {
        switch (s.toUpperCase()) {
            case "OPENSTREETMAP": return MapType.OPENSTREETMAP;
            case "OPENTOPOMAP": return MapType.OPENTOPOMAP;
            case "STAMEN_TERRAIN": return MapType.STAMEN_TERRAIN;
            case "GOOGLE_ROADMAP": return MapType.GOOGLE_ROADMAP;
            case "GOOGLE_SATELLITE": return MapType.GOOGLE_SATELLITE;
            case "GOOGLE_HYBRID": return MapType.GOOGLE_HYBRID;
            case "GOOGLE_TERRAIN": return MapType.GOOGLE_TERRAIN;
        }
        return MapType.STAMEN_TERRAIN;
    }

    static maptype2string(m) {
        switch (m) {
            case MapType.OPENSTREETMAP: return "OPENSTREETMAP";
            case MapType.OPENTOPOMAP: return "OPENTOPOMAP";
            case MapType.STAMEN_TERRAIN: return "STAMEN_TERRAIN";
            case MapType.GOOGLE_ROADMAP: return "GOOGLE_ROADMAP";
            case MapType.GOOGLE_SATELLITE: return "GOOGLE_SATELLITE";
            case MapType.GOOGLE_HYBRID: return "GOOGLE_HYBRID";
            case MapType.GOOGLE_TERRAIN: return "GOOGLE_TERRAIN";
        }
    }

    restore() {
        this.set_view(
            this.storage.get_coordinates("center", new Coordinates(48, 8)),
            this.storage.get_int("zoom", 13));
        this.set_map_type(MapState.string2maptype(
            this.storage.get("map_type", "STAMEN_TERRAIN")));
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

    set_map_type(map_type) {
        this.map_type = map_type;
        this.storage.set("map_type", MapState.maptype2string(this.map_type));
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
        this.update_observers(null);
    }

    delete_marker(id) {
        this.markers = this.markers.filter((marker, index, arr) => {
            return marker.id != id;
        });
        this.markers_hash.delete(id);
        this.update_observers(null);
    }

    delete_all_markers() {
        this.markers = [];
        this.markers_hash.clear();
        this.update_observers(null);
    }

    set_marker_coordinates(id, coordinates, sender) {
        this.markers_hash.get(id).coordinates = coordinates;
        this.update_observers(sender);
    }
}

class MapStateObserver {
    constructor(map_state) {
        this.map_state = map_state;
        map_state.register_observer(this);
    }

    update_state() {

    }
}