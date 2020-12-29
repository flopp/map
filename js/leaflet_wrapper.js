import * as L from 'leaflet';

import {Coordinates} from './coordinates.js';
import {MapType} from './map_type.js';
import {MapWrapper} from './map_wrapper.js';

const from_coordinates = (c) => {
    return L.latLng(c.raw_lat, c.raw_lng);
};

const to_coordinates = (leaflet_latlng) => {
    return new Coordinates(leaflet_latlng.lat, leaflet_latlng.lng);
};

export class LeafletWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
        this.automatic_event = false;
        this.hillshading_enabled = false;
        this.hillshading_layer = null;
        this.german_npa_enabled = false;
        this.german_npa_layer = null;
    }

    create_map_object(div_id) {
        const self = this;

        this.map = L.map(div_id);

        this.layer_openstreetmap = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    'Map tiles by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 16,
                subdomains: 'abc',
            },
        );
        this.layer_opentopomap = L.tileLayer(
            'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    'Map tiles by <a href="http://opentopomap.org">OpenTopoMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 17,
                subdomains: 'abc',
            },
        );
        this.layer_stamen_terrain = L.tileLayer(
            'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
            {
                attribution:
                    'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 14,
                subdomains: 'abcd',
            },
        );
        this.layer_arcgis_worldimagery = L.tileLayer(
            'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution:
                    'Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
                maxZoom: 18,
            },
        );

        this.layers = [
            this.layer_openstreetmap,
            this.layer_opentopomap,
            this.layer_stamen_terrain,
            this.layer_arcgis_worldimagery,
        ];
        ['zoom', 'move'].forEach((event_name) => {
            self.map.on(event_name, () => {
                if (self.active && !self.automatic_event) {
                    self.app.map_state.set_view(
                        to_coordinates(self.map.getCenter()),
                        self.map.getZoom(),
                    );
                }
            });
        });

        this.map.on('contextmenu', (event) => {
            self.app.map_menu.showMap(
                self,
                event.containerPoint.x,
                event.containerPoint.y,
                to_coordinates(event.latlng),
            );
            return false;
        });
        ['zoom', 'move', 'mousedown'].forEach((event_name) => {
            self.map.on(event_name, () => {
                self.app.map_menu.hide();
            });
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
            case MapType.ARCGIS_WORLDIMAGERY:
                layer = this.layer_arcgis_worldimagery;
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
            layer.bringToBack();
        }
    }

    set_hillshading(enabled) {
        if (this.hillshading_enabled == enabled) {
            return;
        }

        this.hillshading_enabled = enabled;
        if (enabled) {
            if (!this.hillshading_layer) {
                this.hillshading_layer = L.tileLayer(
                    'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
                    {attribution: 'Hillshading by wmflabs.org', maxZoom: 15},
                );
            }
            this.map.addLayer(this.hillshading_layer);
        } else if (this.hillshading_layer) {
            this.map.removeLayer(this.hillshading_layer);
        }
    }

    set_german_npa(enabled) {
        if (this.german_npa_enabled == enabled) {
            return;
        }

        this.german_npa_enabled = enabled;
        if (enabled) {
            if (!this.german_npa_layer) {
                this.german_npa_layer = L.tileLayer.wms("http://geodienste.bfn.de/arcgis/services/bfn_sch/Schutzgebiet/MapServer/WMSServer", {
                    layers: ['Naturschutzgebiete'],
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.5,
                    attribution: "Yo!"
                });
            }
            this.map.addLayer(this.german_npa_layer);
        } else if (this.german_npa_layer) {
            this.map.removeLayer(this.german_npa_layer);
        }
    }

    set_map_view(center, zoom) {
        this.automatic_event = true;
        this.map.setView(from_coordinates(center), zoom, {animate: false});
        this.automatic_event = false;
    }

    invalidate_size() {
        this.map.invalidateSize();
    }

    create_marker_object(marker) {
        const self = this;

        const obj = L.marker(from_coordinates(marker.coordinates), {
            draggable: true,
            autoPan: true,
            icon: this.create_icon(marker),
        }).addTo(this.map);

        obj.meta = {
            last_name: marker.name,
            last_color: marker.color,
            circle: null,
        };

        obj.on('drag', () => {
            self.app.map_state.set_marker_coordinates(
                marker.get_id(),
                to_coordinates(obj.getLatLng()),
                null,
            );
            if (obj.meta.circle) {
                const center = to_coordinates(obj.getLatLng());
                const points = center
                    .geodesic_circle(marker.radius)
                    .map(from_coordinates);
                obj.meta.circle.setLatLngs(points);
            }
        });

        obj.on('contextmenu', (event) => {
            self.app.map_menu.showMarker(
                self,
                event.containerPoint.x,
                event.containerPoint.y,
                marker,
            );
            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    update_marker_object(obj, marker) {
        obj.setLatLng(from_coordinates(marker.coordinates));
        if (marker.radius > 0) {
            if (!obj.meta.circle) {
                obj.meta.circle = L.polygon([], {
                    color: marker.color.to_hash_string(),
                    weight: 1,
                    interactive: false,
                }).addTo(this.map);
            }
            obj.meta.circle.setLatLngs(
                marker.coordinates
                    .geodesic_circle(marker.radius)
                    .map(from_coordinates),
            );
        } else if (obj.meta.circle) {
            this.map.removeLayer(obj.meta.circle);
            obj.meta.circle = null;
        }

        if (
            !marker.color.equals(obj.meta.last_color) ||
            marker.name !== obj.meta.last_name
        ) {
            obj.setIcon(this.create_icon(marker));
        }
        if (obj.meta.circle && !marker.color.equals(obj.meta.last_color)) {
            obj.meta.circle.setStyle({color: marker.color.to_hash_string()});
        }

        obj.meta.last_color = marker.color;
        obj.meta.last_name = marker.name;
    }

    delete_marker_object(obj) {
        if (obj.meta.circle) {
            this.map.removeLayer(obj.meta.circle);
        }
        this.map.removeLayer(obj);
    }

    create_line_object(line) {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            return;
        }

        const obj = L.polyline([], {
            color: line.color.to_hash_string(),
            weight: 2,
            interactive: false,
        }).addTo(this.map);

        obj.meta = {
            last_color: line.color,
            arrow: L.polyline([], {
                color: line.color.to_hash_string(),
                weight: 2,
                interactive: false,
            }),
        };
        obj.meta.arrow.addTo(this.map);

        this.lines.set(line.get_id(), obj);

        this.update_line_object(obj, line);
    }

    arrow_head(p1, p2) {
        const compute_heading = (a, b) => ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90 + 360) %
            360;

        const headAngle = 60;
        const pixelSize = 10;
        const d2r = Math.PI / 180;
        const prevPoint = this.map.project(p1);
        const tipPoint = this.map.project(p2);
        if (
            Math.abs(prevPoint.x - tipPoint.x) <= 1 &&
            Math.abs(prevPoint.y - tipPoint.y) <= 1
        ) {
            return [];
        }
        const heading = compute_heading(prevPoint, tipPoint);
        const direction = -(heading - 90) * d2r;
        const radianArrowAngle = (headAngle / 2) * d2r;

        const headAngle1 = direction + radianArrowAngle;
        const headAngle2 = direction - radianArrowAngle;
        const arrowHead1 = L.point(
            tipPoint.x - pixelSize * Math.cos(headAngle1),
            tipPoint.y + pixelSize * Math.sin(headAngle1),
        );
        const arrowHead2 = L.point(
            tipPoint.x - pixelSize * Math.cos(headAngle2),
            tipPoint.y + pixelSize * Math.sin(headAngle2),
        );

        return [
            this.map.unproject(arrowHead1),
            p2,
            this.map.unproject(arrowHead2),
        ];
    }

    update_line_object(obj, line) {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            this.delete_line_object(obj);
            this.lines.delete(line.get_id());
            return;
        }

        const path = this.app.map_state
            .get_marker(line.marker1)
            .coordinates.interpolate_geodesic_line(
                this.app.map_state.get_marker(line.marker2).coordinates,
                this.app.map_state.zoom,
            );
        const leaflet_path = path.map(from_coordinates);
        obj.setLatLngs(leaflet_path);
        if (leaflet_path.length <= 1) {
            obj.meta.arrow.setLatLngs([]);
        } else {
            const last = leaflet_path[leaflet_path.length - 1];
            const last1 = leaflet_path[leaflet_path.length - 2];
            obj.meta.arrow.setLatLngs(this.arrow_head(last1, last));
        }

        if (!line.color.equals(obj.meta.last_color)) {
            obj.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.meta.arrow.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.meta.last_color = line.color;
        }
    }

    delete_line_object(obj) {
        this.map.removeLayer(obj.meta.arrow);
        this.map.removeLayer(obj);
    }

    create_icon(marker) {
        const icon = this.app.icon_factory.create_map_icon(
            marker.name,
            marker.color,
        );
        return L.icon({
            iconUrl: icon.url,
            iconSize: icon.size,
            iconAnchor: icon.anchor,
        });
    }
}
