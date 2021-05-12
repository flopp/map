/// /node_modules/@types/googlemaps/index.d.ts" />

import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {Line} from "./line";
import {MapType} from "./map_type";
import {MapWrapper} from "./map_wrapper";
import {Marker} from "./marker";
import {IOkapiCache, Opencaching} from "./opencaching";
import {encode_parameters} from "./utilities";

const from_coordinates = (c: Coordinates): google.maps.LatLng =>
    new google.maps.LatLng(c.raw_lat(), c.raw_lng());

const to_coordinates = (google_latlng: google.maps.LatLng): Coordinates =>
    new Coordinates(google_latlng.lat(), google_latlng.lng());

interface IMarkerObjDict {
    marker_obj: google.maps.Marker;
    circle_obj: google.maps.Circle|null;
    last_name: string|null;
    last_color: Color|null;
}

interface ILineObjDict {
    line_obj: google.maps.Polyline;
    last_color: Color;
}

interface IOpencachingMarker {
    marker_obj: google.maps.Marker;
    data: IOkapiCache;
}

export class GoogleWrapper extends MapWrapper {
    private automatic_event: boolean = false;
    private hill_shading_enabled: boolean = false;
    private hill_shading_layer: google.maps.MapType|null = null;
    private german_npa_enabled: boolean = false;
    private german_npa_layer: google.maps.MapType|null = null;
    private opencaching: Opencaching|null = null;
    private opencaching_markers: Map<string, IOpencachingMarker>;
    private readonly opencaching_icons: Map<string, google.maps.Icon>;
    private opencaching_popup: google.maps.InfoWindow|null = null;
    private map: google.maps.Map;

    public constructor(div_id: string, app: App) {
        super(div_id, app);
        this.opencaching_markers = new Map();
        this.opencaching_icons = new Map();
    }

    public create_map_object(div_id: string): void {
        this.map = new google.maps.Map(document.getElementById(div_id)!, {
            clickableIcons: false,
            fullscreenControl: false,
            mapTypeControl: false,
            panControl: false,
            rotateControl: false,
            streetViewControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP,
            },
            tilt: 0,
        });
        ["center_changed", "zoom_changed"].forEach((event_name: string): void => {
            google.maps.event.addListener(this.map, event_name, (): void => {
                if (this.active && !this.automatic_event) {
                    this.app.map_state.set_view(
                        to_coordinates(this.map.getCenter()),
                        this.map.getZoom(),
                    );
                }
            });
        });

        google.maps.event.addListener(this.map, "rightclick", (event: google.maps.MapMouseEvent): boolean => {
            const domEvent = (event.domEvent as MouseEvent);
            this.app.map_menu.showMap(
                this,
                domEvent.clientX,
                domEvent.clientY,
                to_coordinates(event.latLng),
            );
            return false;
        });
        [
            "click",
            "dragstart",
            "zoom_changed",
            "maptypeid_changed",
            "center_changed",
        ].forEach((event_name: string): void => {
            google.maps.event.addListener(this.map, event_name, (): void => {
                this.app.map_menu.hide();
            });
        });
    }

    public set_map_type(map_type: MapType): void {
        switch (map_type) {
            case MapType.GOOGLE_ROADMAP:
                this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                break;
            case MapType.GOOGLE_SATELLITE:
                this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                break;
            case MapType.GOOGLE_HYBRID:
                this.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                break;
            case MapType.GOOGLE_TERRAIN:
                this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
                break;
            default:
        }
    }

    public set_hill_shading(enabled: boolean): void {
        if (this.hill_shading_enabled === enabled) {
            return;
        }

        this.hill_shading_enabled = enabled;
        if (enabled) {
            if (this.hill_shading_layer === null) {
                this.hill_shading_layer = new google.maps.ImageMapType({
                    getTileUrl: (coord: google.maps.Point, zoom: number): string =>
                        `https://tiles.wmflabs.org/hillshading/${zoom}/${coord.x}/${coord.y}.png`,
                    tileSize: new google.maps.Size(256, 256),
                    name: "Hill-shading",
                    maxZoom: 15,
                });
            }
            this.map.overlayMapTypes.insertAt(0, this.hill_shading_layer);
        } else if (this.hill_shading_layer !== null) {
            this.remove_layer(this.hill_shading_layer);
        }
    }

    public set_german_npa(enabled: boolean): void {
        if (this.german_npa_enabled === enabled) {
            return;
        }

        this.german_npa_enabled = enabled;
        if (enabled) {
            if (this.german_npa_layer === null) {
                this.german_npa_layer = new google.maps.ImageMapType({
                    getTileUrl: (coord: google.maps.Point, zoom: number): string => {
                        const proj = this.map.getProjection()!;
                        const z_factor = 256 / Math.pow(2, zoom);
                        const top = proj.fromPointToLatLng(
                            new google.maps.Point(coord.x * z_factor, coord.y * z_factor),
                        );
                        const bottom = proj.fromPointToLatLng(
                            new google.maps.Point((coord.x + 1) * z_factor, (coord.y + 1) * z_factor),
                        );
                        const data: Record<string, string|number|boolean> = {
                            dpi: 96,
                            transparent: true,
                            format: "png32",
                            layers: "show:4",
                            BBOX: `${top.lng()},${bottom.lat()},${bottom.lng()},${top.lat()}`,
                            bboxSR: 4326,
                            imageSR: 102113,
                            size: "256,256",
                            f: "image",
                        };
                        return `https://geodienste.bfn.de/arcgis/rest/services/bfn_sch/Schutzgebiet/MapServer/export?${encode_parameters(data)}`;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    name: "German NPA",
                    alt: "Bundesamt für Naturschutz (BfN)",
                    opacity: 0.5,
                });
            }
            this.map.overlayMapTypes.insertAt(0, this.german_npa_layer);
        } else if (this.german_npa_layer !== null) {
            this.remove_layer(this.german_npa_layer);
        }
    }

    public set_opencaching(enabled: boolean): void {
        if (enabled) {
            if (this.opencaching === null) {
                this.opencaching = new Opencaching(
                    (caches: Map<string, IOkapiCache>): void => {
                        this.display_opencaching(caches);
                    },
                );
                this.opencaching_popup = new google.maps.InfoWindow();
                const bounds = this.map.getBounds();
                if (bounds !== null && bounds !== undefined) {
                    this.update_opencaching();
                } else {
                    google.maps.event.addListenerOnce(this.map, "idle", (): void => {
                        this.update_opencaching();
                    });
                }
            }
        } else if (this.opencaching !== null) {
            this.opencaching = null;

            if  (this.opencaching_popup !== null) {
                this.opencaching_popup.close();
                this.opencaching_popup = null;
            }

            this.opencaching_markers.forEach((element): void => {
                element.marker_obj.setMap(null);
            });
            this.opencaching_markers.clear();
        }
    }

    private remove_layer(layer: google.maps.MapType): void {
        let index = -1;
        this.map.overlayMapTypes.forEach((element: google.maps.MapType, i: number): void => {
            if (element.name! === layer.name!) {
                index = i;
            }
        });
        if (index >= 0) {
            this.map.overlayMapTypes.removeAt(index);
        }
    }

    public set_map_view(center: Coordinates, zoom: number): void {
        this.automatic_event = true;
        this.map.setCenter(from_coordinates(center));
        this.map.setZoom(zoom);
        this.automatic_event = false;
        google.maps.event.addListenerOnce(this.map, "idle", (): void => {
            this.update_opencaching();
        });
    }

    protected create_marker_object(marker: Marker): void {
        const obj: IMarkerObjDict = {
            marker_obj: new google.maps.Marker({
                position: from_coordinates(marker.coordinates),
                map: this.map,
                draggable: true,
            }),
            circle_obj: null,
            last_name: null,
            last_color: null,
        };

        google.maps.event.addListener(obj.marker_obj, "drag", (): void => {
            const the_obj = this.markers.get(marker.get_id());
            if (!the_obj) {
                return;
            }
            const pos = the_obj.marker_obj.getPosition();
            this.app.map_state.set_marker_coordinates(
                marker.get_id(),
                to_coordinates(pos),
            );
            if (the_obj.circle_obj) {
                the_obj.circle_obj.setCenter(pos);
            }
        });

        google.maps.event.addListener(obj.marker_obj, "rightclick", (event: google.maps.MapMouseEvent): boolean => {
            const domEvent = (event.domEvent as MouseEvent);
            this.app.map_menu.showMarker(
                this,
                domEvent.clientX,
                domEvent.clientY,
                marker,
            );
            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    protected update_marker_object(obj: IMarkerObjDict, marker: Marker): void {
        const position = from_coordinates(marker.coordinates);

        obj.marker_obj.setPosition(position);

        if (marker.radius > 0) {
            if (obj.circle_obj !== null) {
                obj.circle_obj.setCenter(position);
                obj.circle_obj.setRadius(marker.radius);
            } else {
                obj.circle_obj = new google.maps.Circle({
                    center: position,
                    map: this.map,
                    strokeColor: marker.color.to_hash_string(),
                    strokeOpacity: 1,
                    strokeWeight: 1,
                    fillColor: marker.color.to_hash_string(),
                    fillOpacity: 0.2,
                    radius: marker.radius,
                });
            }
        } else if (obj.circle_obj !== null) {
            obj.circle_obj.setMap(null);
            obj.circle_obj = null;
        }

        if (
            !marker.color.equals(obj.last_color) ||
            marker.name !== obj.last_name
        ) {
            obj.marker_obj.setIcon(this.create_icon(marker));
        }
        if (obj.circle_obj !== null && !marker.color.equals(obj.last_color)) {
            obj.circle_obj.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: marker.color.to_hash_string(),
                fillOpacity: 0.2,
            });
        }

        obj.last_color = marker.color;
        obj.last_name = marker.name;
    }

    public delete_marker_object(obj: IMarkerObjDict): void {
        if (obj.circle_obj !== null) {
            obj.circle_obj.setMap(null);
            obj.circle_obj = null;
        }
        obj.marker_obj.setMap(null);
    }

    public create_line_object(line: Line): void {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            return;
        }

        const obj = {
            line_obj: new google.maps.Polyline({
                map: this.map,
                path: [],
                geodesic: true,
                clickable: false,
                strokeColor: line.color.to_hash_string(),
                strokeOpacity: 1,
                strokeWeight: 2,
                icons: [
                    {
                        icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        },
                        offset: "100%",
                    },
                ],
            }),
            last_color: line.color,
        };

        this.lines.set(line.get_id(), obj);
        this.update_line_object(obj, line);
    }

    public update_line_object(obj: ILineObjDict, line: Line): void {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            this.delete_line_object(obj);
            this.lines.delete(line.get_id());
            return;
        }

        obj.line_obj.setPath([
            this.get_marker_object(line.marker1).marker_obj.getPosition(),
            this.get_marker_object(line.marker2).marker_obj.getPosition(),
        ]);

        if (!line.color.equals(obj.last_color)) {
            obj.line_obj.setOptions({
                strokeColor: line.color.to_hash_string(),
            });
            obj.last_color = line.color;
        }
    }

    public delete_line_object(obj: ILineObjDict): void {
        obj.line_obj.setMap(null);
    }

    public create_icon(marker: Marker): google.maps.Icon {
        const icon = this.app.icon_factory.create_map_icon(
            marker.name,
            marker.color,
        );
        return {
            url: icon.url,
            size: new google.maps.Size(icon.size[0], icon.size[1]),
            scaledSize: new google.maps.Size(icon.size[0], icon.size[1]),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(icon.anchor[0], icon.anchor[1]),
        };
    }

    public update_opencaching(): void {
        if (this.opencaching === null) {
            return;
        }

        const bounds = this.map.getBounds();
        if (bounds === null || bounds === undefined) {
            return;
        }

        this.opencaching.loadBbox(
            bounds.getNorthEast().lat(),
            bounds.getSouthWest().lat(),
            bounds.getSouthWest().lng(),
            bounds.getNorthEast().lng(),
        );
    }

    public display_opencaching(caches: Map<string, IOkapiCache>): void {
        this.opencaching_markers.forEach((element: IOpencachingMarker): void => {
            if (!caches.has(element.data.code)) {
                element.marker_obj.setMap(null);
            }
        });

        if (this.opencaching === null) {
            return;
        }

        const new_markers: Map<string, IOpencachingMarker> = new Map();
        caches.forEach((data: IOkapiCache, code: string): void => {
            if (!this.opencaching_markers.has(code)) {
                const m: IOpencachingMarker = {
                    marker_obj: new google.maps.Marker({
                        position: from_coordinates(Opencaching.parseLocation(data.location)),
                        icon: this.opencaching_icon(data.type),
                        map: this.map,
                        draggable: false,
                    }),
                    data,
                };
                m.marker_obj.setMap(this.map);
                google.maps.event.addListener(m.marker_obj, "click", (): void => {
                    if (this.opencaching_popup === null) {
                        return;
                    }
                    this.opencaching_popup.setContent(`<span>${data.type}</span><br /><b>${code}: ${data.name}</b><br /><a href="${data.url}" target="_blank">Link</a>`);
                    this.opencaching_popup.open(this.map, m.marker_obj);
                });
                new_markers.set(code, m);
            } else {
                new_markers.set(code, this.opencaching_markers.get(code)!);
            }
        });
        this.opencaching_markers = new_markers;
    }

    public opencaching_icon(type: string): google.maps.Icon {
        if (!this.opencaching_icons.has(type)) {
            const icon: google.maps.Icon = {
                url: Opencaching.type_icon(type),
                anchor: new google.maps.Point(12, 25),
            };
            this.opencaching_icons.set(type, icon);
        }
        return this.opencaching_icons.get(type)!;
    }
}
