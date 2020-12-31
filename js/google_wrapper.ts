import {App} from "./app.js"
import {Coordinates} from './coordinates';
import {Line} from "./line";
import {MapType} from './map_type';
import {MapWrapper} from './map_wrapper';
import {Marker} from './marker';
import {encode_parameters} from './utilities';

/* global google */

const from_coordinates = (c: Coordinates): any => {
    return new google.maps.LatLng(c.raw_lat(), c.raw_lng());
};

const to_coordinates = (google_latlng: any): Coordinates => {
    return new Coordinates(google_latlng.lat(), google_latlng.lng());
};

export class GoogleWrapper extends MapWrapper {
    private automatic_event: boolean;
    private hillshading_enabled: boolean;
    private hillshading_layer: any;
    private german_npa_enabled: boolean;
    private german_npa_layer: any;
    private map: any;

    constructor(div_id: string, app: App) {
        super(div_id, app);
        this.automatic_event = false;
        this.hillshading_enabled = false;
        this.hillshading_layer = null;
        this.german_npa_enabled = false;
        this.german_npa_layer = null;
    }

    public create_map_object(div_id: string): void {
        const self = this;

        this.map = new google.maps.Map(document.getElementById(div_id), {
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
        ['center_changed', 'zoom_changed'].forEach((event_name: string): void => {
            google.maps.event.addListener(this.map, event_name, (): void => {
                if (self.active && !self.automatic_event) {
                    self.app.map_state.set_view(
                        to_coordinates(self.map.getCenter()),
                        self.map.getZoom(),
                    );
                }
            });
        });

        google.maps.event.addListener(this.map, 'rightclick', (event: any): boolean => {
            self.app.map_menu.showMap(
                self,
                event.pixel.x,
                event.pixel.y,
                to_coordinates(event.latLng),
            );
            return false;
        });
        [
            'click',
            'dragstart',
            'zoom_changed',
            'maptypeid_changed',
            'center_changed',
        ].forEach((event_name: string): void => {
            google.maps.event.addListener(self.map, event_name, (): void => {
                self.app.map_menu.hide();
            });
        });
    }

    public set_map_type(map_type: string): void {
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
                break;
        }
    }

    public set_hillshading(enabled: boolean): void {
        if (this.hillshading_enabled === enabled) {
            return;
        }

        this.hillshading_enabled = enabled;
        if (enabled) {
            if (!this.hillshading_layer) {
                this.hillshading_layer = new google.maps.ImageMapType({
                    getTileUrl: (coord: any, zoom: number): string => {
                        return `https://tiles.wmflabs.org/hillshading/${zoom}/${coord.x}/${coord.y}.png`;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    name: 'Hillshading',
                    maxZoom: 15,
                });
            }
            this.map.overlayMapTypes.insertAt(0, this.hillshading_layer);
        } else if (this.hillshading_layer) {
            this.map.overlayMapTypes.removeAt(
                this.map.overlayMapTypes.indexOf(this.hillshading_layer),
            );
        }
    }

    public set_german_npa(enabled: boolean): void {
        const self = this;

        if (this.german_npa_enabled === enabled) {
            return;
        }

        this.german_npa_enabled = enabled;
        if (enabled) {
            if (!this.german_npa_layer) {
                this.german_npa_layer = new google.maps.ImageMapType({
                    getTileUrl: (coord: any, zoom: number): string => {
                        const proj = self.map.getProjection();
                        const zfactor = 256 / Math.pow(2, zoom);
                        const top = proj.fromPointToLatLng(
                            new google.maps.Point(coord.x * zfactor, coord.y * zfactor)
                        );
                        const bot = proj.fromPointToLatLng(
                            new google.maps.Point((coord.x + 1) * zfactor, (coord.y + 1) * zfactor)
                        );
                        const data = {
                            dpi: 96,
                            transparent: true,
                            format: "png32",
                            layers: "show:4",
                            BBOX: top.lng() + "," + bot.lat() + "," + bot.lng() + "," + top.lat(),
                            bboxSR: 4326,
                            imageSR: 102113,
                            size: "256,256",
                            f: "image"
                        };
                        return `https://geodienste.bfn.de/arcgis/rest/services/bfn_sch/Schutzgebiet/MapServer/export?${encode_parameters(data)}`;
                    },
                    tileSize: new google.maps.Size(256, 256),
                    name: 'German NPA',
                    alt: "Bundesamt für Naturschutz (BfN)",
                    opacity: 0.5
                });
            }
            this.map.overlayMapTypes.insertAt(0, this.german_npa_layer);
        } else if (this.german_npa_layer) {
            this.map.overlayMapTypes.removeAt(
                this.map.overlayMapTypes.indexOf(this.german_npa_layer),
            );
        }
    }

    public set_map_view(center: Coordinates, zoom: number): void {
        this.automatic_event = true;
        this.map.setCenter(from_coordinates(center));
        this.map.setZoom(zoom);
        this.automatic_event = false;
    }

    protected create_marker_object(marker: Marker): void {
        const self = this;

        const obj = {
            marker_obj: new google.maps.Marker({
                position: from_coordinates(marker.coordinates),
                map: self.map,
                draggable: true,
            }),
            circle_obj: null,
            last_name: null,
            last_color: null,
        };

        google.maps.event.addListener(obj.marker_obj, 'drag', (): void => {
            self.app.map_state.set_marker_coordinates(
                marker.get_id(),
                to_coordinates(obj.marker_obj.getPosition()),
            );
            if (obj.circle_obj) {
                obj.circle_obj.setCenter(obj.marker_obj.getPosition());
            }
        });

        google.maps.event.addListener(obj.marker_obj, 'rightclick', (event: any): boolean => {
            self.app.map_menu.showMarker(
                self,
                event.pixel.x + self.width() / 2,
                event.pixel.y + self.height() / 2,
                marker,
            );
            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    protected update_marker_object(obj: any, marker: Marker): void {
        const position = from_coordinates(marker.coordinates);

        obj.marker_obj.setPosition(position);

        if (marker.radius > 0) {
            if (obj.circle_obj) {
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
        } else if (obj.circle_obj) {
            obj.circle_obj.setMap(null);
            obj.circle_obj = null;
        }

        if (
            !marker.color.equals(obj.last_color) ||
            marker.name !== obj.last_name
        ) {
            obj.marker_obj.setIcon(this.create_icon(marker));
        }
        if (obj.circle_obj && !marker.color.equals(obj.last_color)) {
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

    public delete_marker_object(obj: any): void {
        if (obj.circle_obj) {
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
                strokeOpacity: 1.0,
                strokeWeight: 2,
                icons: [
                    {
                        icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        },
                        offset: '100%',
                    },
                ],
            }),
            last_color: line.color,
        };

        this.lines.set(line.get_id(), obj);
        this.update_line_object(obj, line);
    }

    public update_line_object(obj: any, line: Line): void {
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

    public delete_line_object(obj: any): void {
        obj.line_obj.setMap(null);
    }

    public create_icon(marker: Marker): any {
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
}
