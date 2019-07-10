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
    }

    set_view(center, zoom, sender) {
        this.center = center;
        this.zoom = zoom;
        this.update_observers(sender);
    }

    set_zoom(zoom, sender) {
        this.zoom = zoom;
        this.update_observers(sender);
    }

    set_center(coordinates, sender) {
        this.center = coordinates;
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