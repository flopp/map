class LeafletWrapper {
    constructor(div_id, app, map_state) {
        this.active = false;
        this.div_id = div_id;
        this.app = app;
        this.map_state = map_state;
        this.map = L.map(this.div_id);

        this.layer_openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 16,
            subdomains: 'abc'
        });
        this.layer_opentopomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://opentopomap.org">OpenTopoMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 17,
            subdomains: 'abc'
        });
        this.layer_stamen_terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 14,
            subdomains: 'abcd'
        });

        this.layers = [
            this.layer_openstreetmap,
            this.layer_opentopomap,
            this.layer_stamen_terrain,
        ];


        this.markers = new Map();

        var self = this;
        this.map.on('zoom', function() { self.view_changed(); });
        this.map.on('move', function() { self.view_changed(); });
    }

    activate() {
        var layer = null;
        switch (this.map_state.map_type) {
            case MapType.OPENSTREETMAP:
                layer = this.layer_openstreetmap;
                break;
            case MapType.OPENTOPOMAP:
                layer = this.layer_opentopomap;
                break;
            case MapType.STAMEN_TERRAIN:
                layer = this.layer_stamen_terrain;
                break;
            default:
                break;
        }

        if (layer && !this.map.hasLayer(layer)) {
            var self = this;
            this.layers.forEach((otherLayer) => {
                if (otherLayer != layer) {
                    self.map.removeLayer(otherLayer);
                }
            })
            this.map.addLayer(layer);
        }
        
        this.update_state();
        
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    invalidate_size() {
        this.map.invalidateSize();
    }

    view_changed() {
        if (!this.active) {
            return;
        }
        this.map_state.set_center(Coordinates.from_leaflet(this.map.getCenter()));
        this.map_state.set_zoom(this.map.getZoom());
    }

    update_state() {
        var self = this;

        /* update view */
        this.map.setView(this.map_state.center.to_leaflet(), this.map_state.zoom, {'animate': false});

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if (self.markers.has(marker.id)) {
                var m = self.markers.get(marker.id);
                m.setLatLng(marker.coordinates.to_leaflet());
            } else {
                var m = L.marker(marker.coordinates.to_leaflet(), {draggable: true, autoPan: true});
                m.on('drag', (event) => {
                    self.app.move_marker(marker.id, Coordinates.from_leaflet(m.getLatLng()));    
                });
                self.markers.set(marker.id, m);
                m.addTo(self.map);
            }
        });

        /* remove spurious markers */
        if (this.markers.size > this.map_state.markers.length) {
            var ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.id);
            });
            
            var deleted_ids = [];
            this.markers.forEach((marker, id, map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                var m = self.markers.get(id);
                self.map.removeLayer(m);
                self.markers.delete(id)
            });
        }
    }
}