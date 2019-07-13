class LeafletWrapper extends MapStateObserver {
    constructor(div_id, app) {
        super(app.map_state);

        this.active = false;
        this.div_id = div_id;
        this.app = app;
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

        const self = this;
        this.map.on('zoom', function() { self.view_changed(); });
        this.map.on('move', function() { self.view_changed(); });
    }

    activate() {
        let layer = null;
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
            const self = this;
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
        this.map_state.set_view(Coordinates.from_leaflet(this.map.getCenter()), this.map.getZoom(), this);
    }

    update_state() {
        const self = this;

        /* update view */
        this.map.setView(this.map_state.center.to_leaflet(), this.map_state.zoom, {'animate': false});

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if (self.markers.has(marker.id)) {
                self.update_marker_object(self.markers.get(marker.id), marker);
            } else {
                self.create_marker_object(marker);
            }
        });

        /* remove spurious markers */
        if (this.markers.size > this.map_state.markers.length) {
            const ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.id);
            });
            
            const deleted_ids = [];
            this.markers.forEach((marker, id, map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                self.delete_marker_object(self.markers.get(id));
                self.markers.delete(id)
            });
        }
    }

    create_marker_object(marker) {
        const self = this;

        const m = L.marker(marker.coordinates.to_leaflet(), {
            draggable: true, 
            autoPan: true, 
            icon: self.app.icon_factory.leaflet_icon(marker.name, marker.color)
        }).addTo(this.map);

        m.last_name = marker.name;
        m.last_color = marker.color;
        m.circle = null;
        
        m.on('drag', (event) => {
            self.map_state.set_marker_coordinates(marker.id, Coordinates.from_leaflet(m.getLatLng()), self);
            if (m.circle) {
                m.circle.setLatLng(m.getLatLng());
            }
        });
        this.markers.set(marker.id, m);

        this.update_marker_object(m, marker);
    }

    update_marker_object(m, marker) {
        m.setLatLng(marker.coordinates.to_leaflet());
        if (marker.radius > 0) {
            if (m.circle) {
                m.circle.setLatLng(marker.coordinates.to_leaflet());
                m.circle.setRadius(marker.radius);
            } else {
                m.circle = L.circle(marker.coordinates.to_leaflet(), {
                    radius: marker.radius,
                    color: "#" + marker.color,
                    weight: 1,
                    interactive: false
                }).addTo(this.map);
            }
        } else if (m.circle) {
            this.map.removeLayer(m.circle);
            m.circle = null;
        }

        if ((marker.color !== m.last_color) || (marker.name !== m.last_name)) {
            m.setIcon(this.app.icon_factory.leaflet_icon(marker.name, marker.color));
        }
        if (m.circle && (marker.color !== m.last_color)) {
            m.circle.setStyle({color: "#" + marker.color});
        }

        m.last_color = marker.color;
        m.last_name = marker.name;
    }

    delete_marker_object(m) {
        if (m.circle) {
            this.map.removeLayer(m.circle);
        }
        this.map.removeLayer(m);
    }
}