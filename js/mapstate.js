class MapState {
    constructor() {
        this.updates_enabled = true;
        this.zoom = null;
        this.center_lat = null;
        this.center_lon = null;

        this.markers = [];
    }

    enable() {
        this.updates_enabled = true;
    }

    disable() {
        this.updates_enabled = false;
    }

    set_zoom(zoom) {
        if (!this.updates_enabled) {
            return;
        }
        this.zoom = zoom;
    }

    set_center(lat, lon) {
        if (!this.updates_enabled) {
            return;
        }
        this.center_lat = lat;
        this.center_lon = lon;
    }

    add_marker() {
        this.markers.push({lat: this.center_lat, lon: this.center_lon});
    }

    delete_all_markers() {
        this.markers = [];
    }

    apply_to_leaflet(leaflet_map) {
        leaflet_map.setView(L.latLng(this.center_lat, this.center_lon), this.zoom, {'animate': false});
    }

    apply_to_google(google_map) {
        google_map.setCenter(new google.maps.LatLng(this.center_lat, this.center_lon));
        google_map.setZoom(this.zoom);
    }
}