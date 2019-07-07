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

    get_center() {
        return this.center;
    }
    set_center(coordinates) {
        if (!this.updates_enabled) {
            return;
        }
        this.center = coordinates;
    }

    add_marker() {
        var marker = new Marker(this.center);
        this.markers.push(marker);
    }

    delete_all_markers() {
        this.markers = [];
    }

    apply_to_leaflet(leaflet_map) {
        leaflet_map.setView(this.center.to_leaflet(), this.zoom, {'animate': false});
    }

    apply_to_google(google_map) {
        google_map.setCenter(this.center.to_google());
        google_map.setZoom(this.zoom);
    }
}