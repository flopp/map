import {Coordinates} from './coordinates.js';
import {MapType} from './map_type.js';
import {MapWrapper} from './map_wrapper.js';

/* global L */

export class LeafletWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
        this.automatic_event = false;
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
                    self.map_state.set_view(
                        Coordinates.from_leaflet(self.map.getCenter()),
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
                Coordinates.from_leaflet(event.latlng),
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
        }
    }

    set_map_view(center, zoom) {
        this.automatic_event = true;
        this.map.setView(center.to_leaflet(), zoom, {animate: false});
        this.automatic_event = false;
    }

    invalidate_size() {
        this.map.invalidateSize();
    }

    create_marker_object(marker) {
        const self = this;

        const obj = L.marker(marker.coordinates.to_leaflet(), {
            draggable: true,
            autoPan: true,
            icon: self.app.icon_factory.leaflet_icon(marker.name, marker.color),
        }).addTo(this.map);

        obj.meta = {
            last_name: marker.name,
            last_color: marker.color,
            circle: null,
        };

        obj.on('drag', () => {
            self.map_state.set_marker_coordinates(
                marker.get_id(),
                Coordinates.from_leaflet(obj.getLatLng()),
                null,
            );
            if (obj.meta.circle) {
                const center = Coordinates.from_leaflet(obj.getLatLng());
                const points = Coordinates.to_leaflet_path(
                    center.geodesic_circle(marker.radius),
                );
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
        obj.setLatLng(marker.coordinates.to_leaflet());
        if (marker.radius > 0) {
            if (!obj.meta.circle) {
                obj.meta.circle = L.polygon([], {
                    color: marker.color.to_hash_string(),
                    weight: 1,
                    interactive: false,
                }).addTo(this.map);
            }
            obj.meta.circle.setLatLngs(
                Coordinates.to_leaflet_path(
                    marker.coordinates.geodesic_circle(marker.radius),
                ),
            );
        } else if (obj.meta.circle) {
            this.map.removeLayer(obj.meta.circle);
            obj.meta.circle = null;
        }

        if (
            !marker.color.equals(obj.meta.last_color) ||
            marker.name !== obj.meta.last_name
        ) {
            obj.setIcon(
                this.app.icon_factory.leaflet_icon(marker.name, marker.color),
            );
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

        const path = this.map_state
            .get_marker(line.marker1)
            .coordinates.interpolate_geodesic_line(
                this.map_state.get_marker(line.marker2).coordinates,
                this.map_state.zoom,
            );
        const leaflet_path = Coordinates.to_leaflet_path(path);
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
}
