import {Coordinates} from "./coordinates.js";
import {MapType} from "./maptype.js";
import {MapWrapper} from "./map_wrapper.js";

/* global L */

export class LeafletWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
    }

    create_map_object (div_id) {
        const self = this;

        this.map = L.map(div_id);

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

        this.map.on('zoom', function () {
            if (self.active) {
                self.map_state.set_view(Coordinates.from_leaflet(self.map.getCenter()), self.map.getZoom(), self);
            }
        });

        this.map.on('move', function () {
            if (self.active) {
                self.map_state.set_view(Coordinates.from_leaflet(self.map.getCenter()), self.map.getZoom(), self);
            }
        });
    }

    set_map_type(map_type) {
        let layer = null;
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
                break;
        }

        if (layer && !this.map.hasLayer(layer)) {
            const self = this;
            this.layers.forEach((otherLayer) => {
                if (otherLayer != layer) {
                    self.map.removeLayer(otherLayer);
                }
            });
            this.map.addLayer(layer);
        }
    }

    set_map_view(center, zoom) {
        this.map.setView(center.to_leaflet(), zoom, {'animate': false});
    }

    invalidate_size() {
        this.map.invalidateSize();
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

        m.on('drag', () => {
            self.map_state.set_marker_coordinates(marker.id, Coordinates.from_leaflet(m.getLatLng()), null);
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
                    color: marker.color.to_hash_string(),
                    weight: 1,
                    interactive: false
                }).addTo(this.map);
            }
        } else if (m.circle) {
            this.map.removeLayer(m.circle);
            m.circle = null;
        }

        if (!marker.color.equals(m.last_color) || (marker.name !== m.last_name)) {
            m.setIcon(this.app.icon_factory.leaflet_icon(marker.name, marker.color));
        }
        if (m.circle && !marker.color.equals(m.last_color)) {
            m.circle.setStyle({color: marker.color.to_hash_string()});
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

    create_line_object(line) {
        const m = L.polyline([], {
            color: line.color.to_hash_string(),
            weight: 2
        }).addTo(this.map);

        m.last_color = line.color;

        this.lines.set(line.id, m);

        this.update_line_object(m, line);
    }

    update_line_object(m, line) {
        if (this.has_marker_object(line.marker1) && this.has_marker_object(line.marker2)) {
            const path = this.map_state.get_marker(line.marker1).coordinates.interpolate_geodesic_line(this.map_state.get_marker(line.marker2).coordinates, this.map_state.zoom);
            const leaflet_path = Coordinates.to_leaflet_path(path);
            m.setLatLngs(leaflet_path);
        } else {
            m.setLatLngs([]);
        }

        if (!line.color.equals(m.last_color)) {
            m.setStyle({
                color: line.color.to_hash_string()
            });
            m.last_color = line.color;
        }
    }

    delete_line_object(m) {
        this.map.removeLayer(m);
    }
}