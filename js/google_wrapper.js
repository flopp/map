import {Coordinates} from "./coordinates.js";
import {MapType} from "./maptype.js";
import {MapWrapper} from "./map_wrapper.js";

/* global google */


export class GoogleWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
        this.automatic_event = false;
    }

    create_map_object (div_id) {
        const self = this;

        this.map = new google.maps.Map(
            document.getElementById(div_id), {
                clickableIcons: false,
                fullscreenControl: false,
                mapTypeControl: false,
                panControl: false,
                rotateControl: false,
                streetViewControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_TOP
                }
            }
        );

        google.maps.event.addListener(this.map, 'center_changed', () => {
            if (self.active && !self.automatic_event) {
                self.map_state.set_view(Coordinates.from_google(self.map.getCenter()), self.map.getZoom(), self);
            }
        });

        google.maps.event.addListener(this.map, 'zoom_changed', () => {
            if (self.active && !self.automatic_event) {
                self.map_state.set_view(Coordinates.from_google(self.map.getCenter()), self.map.getZoom(), self);
            }
        });

        google.maps.event.addListener(this.map, 'rightclick', (event) => {
            self.app.map_menu.showMap(event.pixel.x, event.pixel.y, Coordinates.from_google(event.latLng));
            return false;
        });
    }

    set_map_type(map_type) {
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

    set_map_view(center, zoom) {
        this.automatic_event = true;
        this.map.setCenter(center.to_google());
        this.map.setZoom(zoom);
        this.automatic_event = false;
    }

    create_marker_object(marker) {
        const self = this;

        const obj = new google.maps.Marker({
            position: marker.coordinates.to_google(),
            map: self.map,
            draggable: true,
        });

        obj.meta = {
            last_name: null,
            last_color: null,
            circle: null
        };

        google.maps.event.addListener(obj, "drag", () => {
            self.map_state.set_marker_coordinates(marker.get_id(), Coordinates.from_google(obj.getPosition()));
            if (obj.meta.circle) {
                obj.meta.circle.setCenter(obj.getPosition());
            }
        });

        google.maps.event.addListener(obj, "rightclick", (event) => {
            self.app.map_menu.showMarker(event.pixel.x, event.pixel.y, obj);
            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    update_marker_object(obj, marker) {
        const position = marker.coordinates.to_google();

        obj.setPosition(position);

        if (marker.radius > 0) {
            if (obj.meta.circle) {
                obj.meta.circle.setCenter(position);
                obj.meta.circle.setRadius(marker.radius);
            } else {
                obj.meta.circle = new google.maps.Circle({
                    center: position,
                    map: this.map,
                    strokeColor: marker.color.to_hash_string(),
                    strokeOpacity: 1,
                    strokeWeight: 1,
                    fillColor: marker.color.to_hash_string(),
                    fillOpacity: 0.2,
                    radius: marker.radius
                });
            }
        } else if (obj.meta.circle) {
            obj.meta.circle.setMap(null);
            obj.meta.circle = null;
        }

        if (!marker.color.equals(obj.meta.last_color) || (marker.name !== obj.meta.last_name)) {
            obj.setIcon(this.app.icon_factory.google_icon(marker.name, marker.color));
        }
        if (obj.meta.circle && !marker.color.equals(obj.meta.last_color)) {
            obj.meta.circle.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: marker.color.to_hash_string(),
                fillOpacity: 0.2
            });
        }

        obj.meta.last_color = marker.color;
        obj.meta.last_name = marker.name;
    }

    delete_marker_object(obj) {
        if (obj.meta.circle) {
            obj.meta.circle.setMap(null);
            obj.meta.circle = null;
        }
        obj.setMap(null);
    }

    create_line_object(line) {
        const obj = new google.maps.Polyline({
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
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                    },
                    offset: '100%'
                }
            ]
        });

        obj.meta = {
            last_color: line.color
        };

        this.lines.set(line.get_id(), obj);
        this.update_line_object(obj, line);
    }

    update_line_object(obj, line) {
        if (this.has_marker_object(line.marker1) && this.has_marker_object(line.marker2)) {
            obj.setPath([this.get_marker_object(line.marker1).getPosition(), this.get_marker_object(line.marker2).getPosition()]);
        } else {
            obj.setPath([]);
        }

        if (!line.color.equals(obj.meta.last_color)) {
            obj.setOptions({
                strokeColor: line.color.to_hash_string()
            });
            obj.meta.last_color = line.color;
        }
    }

    delete_line_object(m) {
        m.setMap(null);
    }
}
