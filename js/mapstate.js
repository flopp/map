class MapState {
    constructor() {
        this.updates_enabled = true;
        this.map_type = null;
        this.zoom = null;
        this.center = null;

        this.markers = [];
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
        if (!coordinates) {
            this.markers.push(new Marker(this.center));
        } else {
            this.markers.push(new Marker(coordinates));
        }
    }

    delete_marker(id) {
        this.markers = this.markers.filter((marker, index, arr) => {
            return marker.id != id;
        });
    }

    delete_all_markers() {
        this.markers = [];
    }
}