class MapState {
    constructor() {
        this.updates_enabled = true;
        this.map_type = null;
        this.zoom = null;
        this.center = null;

        this.markers = [];
        this.markers_hash = new Map();
    }

    enable() {
        this.updates_enabled = true;
    }

    disable() {
        this.updates_enabled = false;
    }

    set_map_type(map_type) {
        this.map_type = map_type;
    }

    set_zoom(zoom) {
        if (!this.updates_enabled) {
            return;
        }
        this.zoom = zoom;
    }

    set_center(coordinates) {
        if (!this.updates_enabled) {
            return;
        }
        this.center = coordinates;
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
    }

    delete_marker(id) {
        this.markers = this.markers.filter((marker, index, arr) => {
            return marker.id != id;
        });
        this.markers_hash.delete(id);
    }

    delete_all_markers() {
        this.markers = [];
        this.markers_hash.clear();
    }

    set_marker_coordinates(id, coordinates) {
        this.markers_hash.get(id).coordinates = coordinates;
    }
}