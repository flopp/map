import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {Distance, DistanceFormat} from "./distance";
import {Line} from "./line";
import {MapType} from "./map_type";
import {MapWrapper} from "./map_wrapper";
import {Marker} from "./marker";

const from_coordinates = (c: Coordinates): L.LatLng => L.latLng(c.raw_lat(), c.raw_lng());

const to_coordinates = (leaflet_latlng: L.LatLng): Coordinates =>
    new Coordinates(leaflet_latlng.lat, leaflet_latlng.lng);

interface IMarkerObjDict {
    marker_obj: L.Marker;
    circle_obj: L.Polygon | null;
    last_name: string;
    last_color: Color;
}

interface ILineObjDict {
    line_obj: L.Polyline;
    arrow_obj: L.Polyline;
    midpoint_obj: L.Marker | null;
    midpoint_icon: L.DivIcon;
    last_color: Color;
}

export class LeafletWrapper extends MapWrapper {
    private automatic_event: boolean = false;
    private german_npa_enabled: boolean = false;
    private german_npa_layer: L.TileLayer | null = null;
    private map: L.Map;
    private layer_openstreetmap: L.TileLayer;
    private layer_opentopomap: L.TileLayer;
    private layer_stamen_terrain: L.TileLayer;
    private layer_humanitarian: L.TileLayer;
    private layer_arcgis_worldimagery: L.TileLayer;
    private layers: Map<string, L.TileLayer>;
    private midpoint_icon_css_classes: Map<string, string>;
    private styles: HTMLStyleElement;

    public constructor(div_id: string, app: App) {
        super(div_id, app);
        this.midpoint_icon_css_classes = new Map();
        this.styles = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild(this.styles);
    }

    public create_map_object(div_id: string): void {
        this.map = L.map(div_id, {
            worldCopyJump: true,
        });

        this.layer_openstreetmap = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map tiles by <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>, under <a href="https://creativecommons.org/licenses/by/3.0" target="_blank">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright" target="_blank">ODbL</a>.',
                maxZoom: 17,
                subdomains: "abc",
            },
        );
        this.layer_opentopomap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            attribution:
                'Map tiles by <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a>, under <a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA 3.0</a>. Data by <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright" target="_blank">ODbL</a>.',
            maxZoom: 17,
            subdomains: "abc",
        });
        this.layer_stamen_terrain = L.tileLayer(
            "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
            {
                attribution:
                    'Map tiles by <a href="https://stamen.com" target="_blank">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href=https://openstreetmap.org" target="_blank">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright" target="_blank">ODbL</a>.',
                maxZoom: 17,
                subdomains: "abcd",
            },
        );
        this.layer_humanitarian = L.tileLayer(
            "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            {
                attribution:
                    'Map tiles by the <a href="https://www.hotosm.org/updates/2013-09-29_a_new_window_on_openstreetmap_data" target="_blank">Humanitarian OSM Team</a>, under <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.fr" target="_blank">CC0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>. Hosted by <a href="https://www.openstreetmap.fr/mentions-legales/" target="_blank">OSM France</a>.',
                maxZoom: 17,
                subdomains: "abc",
            },
        );
        this.layer_arcgis_worldimagery = L.tileLayer(
            "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
                maxZoom: 18,
            },
        );

        this.layers = new Map();
        this.layers.set(MapType.OPENSTREETMAP, this.layer_openstreetmap);
        this.layers.set(MapType.OPENTOPOMAP, this.layer_opentopomap);
        this.layers.set(MapType.STAMEN_TERRAIN, this.layer_stamen_terrain);
        this.layers.set(MapType.HUMANITARIAN, this.layer_humanitarian);
        this.layers.set(MapType.ARCGIS_WORLDIMAGERY, this.layer_arcgis_worldimagery);

        ["zoom", "move"].forEach((event_name: string): void => {
            this.map.on(event_name, (): void => {
                if (this.active && !this.automatic_event) {
                    this.app.map_state.set_view(
                        to_coordinates(this.map.getCenter()),
                        this.map.getZoom(),
                    );
                }
            });
        });

        this.map.on("contextmenu", (event: L.LeafletMouseEvent): boolean => {
            this.app.map_menu.showMap(
                this,
                event.containerPoint.x,
                event.containerPoint.y,
                to_coordinates(event.latlng),
            );

            return false;
        });
        ["zoom", "move", "mousedown"].forEach((event_name: string): void => {
            this.map.on(event_name, (): void => {
                this.app.map_menu.hide();
            });
        });
    }

    public set_map_type(map_type: MapType): void {
        if (!this.layers.has(map_type)) {
            return;
        }
        const layer = this.layers.get(map_type)!;

        if (!this.map.hasLayer(layer)) {
            for (const otherLayer of this.layers.values()) {
                // tslint:disable-next-line: strict-comparisons
                if (otherLayer !== layer) {
                    this.map.removeLayer(otherLayer);
                }
            }
            this.map.addLayer(layer);
            layer.bringToBack();
        }
    }

    public set_german_npa(enabled: boolean): void {
        if (this.german_npa_enabled === enabled) {
            return;
        }

        this.german_npa_enabled = enabled;
        if (enabled) {
            if (this.german_npa_layer === null) {
                this.german_npa_layer = L.tileLayer.wms(
                    "https://geodienste.bfn.de/ogc/wms/schutzgebiet?",
                    {
                        layers: "Naturschutzgebiete",
                        format: "image/png",
                        transparent: true,
                        opacity: 0.5,
                        attribution: "Bundesamt für Naturschutz (BfN)",
                    },
                );
            }
            this.map.addLayer(this.german_npa_layer);
        } else if (this.german_npa_layer !== null) {
            this.map.removeLayer(this.german_npa_layer);
        }
    }

    public set_map_view(center: Coordinates, zoom: number): void {
        this.automatic_event = true;
        this.map.setView(from_coordinates(center), zoom, {animate: false});
        this.automatic_event = false;
    }

    public fit_objects(): void {
        let bounds: any | L.LatLngBounds = null;
        this.app.map_state.markers.forEach((marker: Marker): void => {
            const c = from_coordinates(marker.coordinates);
            if (bounds === null) {
                bounds = new L.LatLngBounds(c, c);
            } else {
                bounds.extend(c);
            }
        });

        if (bounds !== null) {
            this.map.fitBounds(bounds);
        }
    }

    public invalidate_size(): void {
        this.map.invalidateSize();
    }

    protected create_marker_object(marker: Marker): void {
        const obj: IMarkerObjDict = {
            marker_obj: L.marker(from_coordinates(marker.coordinates), {
                draggable: true,
                autoPan: true,
                icon: this.create_icon(marker),
            }),
            circle_obj: null,
            last_name: marker.name,
            last_color: marker.color,
        };
        obj.marker_obj.addTo(this.map);

        obj.marker_obj.on("drag", (): void => {
            this.app.map_state.set_marker_coordinates(
                marker.get_id(),
                to_coordinates(obj.marker_obj.getLatLng()),
            );
            const marker_obj = this.markers.get(marker.get_id()) as IMarkerObjDict;
            if (marker_obj.circle_obj !== null) {
                const center = to_coordinates(obj.marker_obj.getLatLng());
                const points = center.geodesic_circle(marker.radius).map(from_coordinates);
                marker_obj.circle_obj.setLatLngs(points);
            }
        });

        obj.marker_obj.on("contextmenu", (event: L.LeafletMouseEvent): boolean => {
            this.app.map_menu.showMarker(
                this,
                event.containerPoint.x,
                event.containerPoint.y,
                marker,
            );

            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    protected update_marker_object(obj: IMarkerObjDict, marker: Marker): void {
        obj.marker_obj.setLatLng(from_coordinates(marker.coordinates));
        if (marker.radius > 0) {
            if (obj.circle_obj === null) {
                obj.circle_obj = L.polygon([], {
                    color: marker.color.to_hash_string(),
                    weight: 1,
                    interactive: false,
                }).addTo(this.map);
            }
            obj.circle_obj.setLatLngs(
                marker.coordinates.geodesic_circle(marker.radius).map(from_coordinates),
            );
        } else if (obj.circle_obj !== null) {
            this.map.removeLayer(obj.circle_obj);
            obj.circle_obj = null;
        }

        if (!marker.color.equals(obj.last_color) || marker.name !== obj.last_name) {
            obj.marker_obj.setIcon(this.create_icon(marker));
        }
        if (obj.circle_obj !== null && !marker.color.equals(obj.last_color)) {
            obj.circle_obj.setStyle({color: marker.color.to_hash_string()});
        }

        obj.last_color = marker.color;
        obj.last_name = marker.name;
    }

    public delete_marker_object(obj: IMarkerObjDict): void {
        if (obj.circle_obj !== null) {
            this.map.removeLayer(obj.circle_obj);
        }
        this.map.removeLayer(obj.marker_obj);
    }

    public create_line_object(line: Line): void {
        if (!this.has_marker_object(line.marker1) || !this.has_marker_object(line.marker2)) {
            return;
        }

        const obj = {
            line_obj: L.polyline([], {
                color: line.color.to_hash_string(),
                weight: 2,
                interactive: false,
            }),
            arrow_obj: L.polyline([], {
                color: line.color.to_hash_string(),
                weight: 2,
                interactive: false,
            }),
            midpoint_obj: null,
            midpoint_icon: new L.DivIcon({className: "midpoint-icon", html: "n/a", iconSize: null!}),
            last_color: line.color,
        };

        obj.line_obj.addTo(this.map);
        obj.arrow_obj.addTo(this.map);

        this.lines.set(line.get_id(), obj);

        this.update_line_object(obj, line);
    }

    private arrow_head(p1: L.LatLng, p2: L.LatLng): L.LatLng[] {
        const compute_heading = (a: L.Point, b: L.Point): number =>
            ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90 + 360) % 360;

        const headAngle = 60;
        const pixelSize = 10;
        const d2r = Math.PI / 180;
        const zoom = this.map.getZoom();
        const prevPoint = this.map.project(p1, zoom);
        const tipPoint = this.map.project(p2, zoom);
        if (Math.abs(prevPoint.x - tipPoint.x) <= 1 && Math.abs(prevPoint.y - tipPoint.y) <= 1) {
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

        return [this.map.unproject(arrowHead1, zoom), p2, this.map.unproject(arrowHead2, zoom)];
    }

    public update_line_object(obj: ILineObjDict, line: Line): void {
        if (!this.has_marker_object(line.marker1) || !this.has_marker_object(line.marker2)) {
            this.delete_line_object(obj);
            this.lines.delete(line.get_id());

            return;
        }

        let midpoint_text = "";
        let midpoint: Coordinates|null = null;
        const marker1 = this.app.map_state.get_marker(line.marker1);
        const marker2 = this.app.map_state.get_marker(line.marker2);
        if (marker1 !== null && marker2 !== null) {
            const path = marker1.coordinates.interpolate_geodesic_line(
                marker2.coordinates,
                this.app.map_state.zoom!,
            );
            const leaflet_path = path.map(from_coordinates);
            obj.line_obj.setLatLngs(leaflet_path);
            if (leaflet_path.length <= 1) {
                obj.arrow_obj.setLatLngs([]);
            } else {
                const last = leaflet_path[leaflet_path.length - 1];
                const last1 = leaflet_path[leaflet_path.length - 2];
                obj.arrow_obj.setLatLngs(this.arrow_head(last1, last));
            }

            // compute midpoint
            const dist_bearing = marker1.coordinates.distance_bearing(marker2.coordinates);
            if (dist_bearing.distance > 0) {
                midpoint_text = (new Distance(dist_bearing.distance, DistanceFormat.m)).to_string(this.app.map_state.settings_line_distance_format); 
                midpoint = marker1.coordinates.project(dist_bearing.bearing, dist_bearing.distance / 2.0);
            }
        }

        if (midpoint !== null && this.app.map_state.settings_line_display_distance) {
            obj.midpoint_icon.options.html = midpoint_text;
            obj.midpoint_icon.options.className = this.create_midpoint_icon_css_class(line.color);
            if (obj.midpoint_obj !== null) {
                obj.midpoint_obj.setLatLng(from_coordinates(midpoint));
                obj.midpoint_obj.setIcon(obj.midpoint_icon);
            } else {
                obj.midpoint_obj = new L.Marker(from_coordinates(midpoint), {interactive: false, icon: obj.midpoint_icon});
                this.map.addLayer(obj.midpoint_obj);
            }
        } else {
            if (obj.midpoint_obj !== null) {
                this.map.removeLayer(obj.midpoint_obj);
                obj.midpoint_obj = null;
            }  
        }

        if (!line.color.equals(obj.last_color)) {
            obj.line_obj.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.arrow_obj.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.last_color = line.color;
        }
    }

    public delete_line_object(obj: ILineObjDict): void {
        this.map.removeLayer(obj.arrow_obj);
        this.map.removeLayer(obj.line_obj);
        if (obj.midpoint_obj !== null) {
            this.map.removeLayer(obj.midpoint_obj);
        }
    }

    public create_icon(marker: Marker): L.Icon {
        const icon = this.app.icon_factory.create_map_icon(marker.name, marker.color);

        return L.icon({
            iconUrl: icon.url,
            iconSize: L.point(icon.size[0], icon.size[1]),
            iconAnchor: L.point(icon.anchor[0], icon.anchor[1]),
        });
    }

    public create_midpoint_icon_css_class(color: Color): string {
        const colorS = color.to_string();
        if (this.midpoint_icon_css_classes.has(colorS)) {
            return this.midpoint_icon_css_classes.get(colorS)!;
        }

        const className = `midpoint-icon-${colorS}`;
        this.midpoint_icon_css_classes.set(colorS, className);
        
        const value = `
            font-size: 9px;
            border: 1px solid #${colorS};
            border-radius: 4px;
            text-align: center;
            color: #${color.text_color().to_string()};
            background: #${colorS};
            white-space: nowrap;
            padding-left: 0.5em;
            padding-right: 0.5em;
            margin-left: -25px;
            margin-top: -7px;
        `;

        this.styles.innerHTML += `.${className} \{${value}\}\n`;

        return className;
    }
}
