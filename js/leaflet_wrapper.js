class LeafletWrapper {
    constructor(div_id, map_state) {
        this.active = false;
        this.div_id = div_id;
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

        var self = this;
        this.map.on('zoom', function() { self.view_changed(); });
        this.map.on('move', function() { self.view_changed(); });
    }

    activate() {
        this.map.setView(this.map_state.get_center().to_leaflet(), this.map_state.zoom, {'animate': false});
        this.set_map_type(this.map_state.map_type);

        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    invalidate_size() {
        this.map.invalidateSize();
    }

    set_map_type(map_type) {
        var layer = null;
        switch (map_type) {
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
                return;
        }

        if (!layer) {
            return;
        }
    
        if (this.map.hasLayer(layer)) {
            return;
        }

        var self = this;
        this.layers.forEach((otherLayer) => {
            if (otherLayer != layer) {
                self.map.removeLayer(otherLayer);
            }
        })
        this.map.addLayer(layer);
    }

    view_changed() {
        if (!this.active) {
            return;
        }
        this.map_state.set_center(Coordinates.from_leaflet(this.map.getCenter()));
        this.map_state.set_zoom(this.map.getZoom());
    }
}