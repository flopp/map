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
            });

        google.maps.event.addListener(this.map, 'center_changed', function () {
            if (self.active && !self.automatic_event) {
                self.map_state.set_view(Coordinates.from_google(self.map.getCenter()), self.map.getZoom(), self);
            }
        });

        google.maps.event.addListener(this.map, 'zoom_changed', function () {
            if (self.active && !self.automatic_event) {
                self.map_state.set_view(Coordinates.from_google(self.map.getCenter()), self.map.getZoom(), self);
            }
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

        const m = new google.maps.Marker({
            position: marker.coordinates.to_google(),
            map: self.map,
            draggable: true,
        });

        m.last_name = null;
        m.last_color = null;
        m.circle = null;

        google.maps.event.addListener(m, "drag", function () {
            self.map_state.set_marker_coordinates(marker.id, Coordinates.from_google(m.getPosition()));
            if (m.circle) {
                m.circle.setCenter(m.getPosition());
            }
        });

        this.markers.set(marker.id, m);

        this.update_marker_object(m, marker);
    }

    update_marker_object(m, marker) {
        const position = marker.coordinates.to_google();

        m.setPosition(position);

        if (marker.radius > 0) {
            if (m.circle) {
                m.circle.setCenter(position);
                m.circle.setRadius(marker.radius);
            } else {
                m.circle = new google.maps.Circle({
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
        } else if (m.circle) {
            m.circle.setMap(null);
            m.circle = null;
        }

        if (!marker.color.equals(m.last_color) || (marker.name !== m.last_name)) {
            m.setIcon(this.app.icon_factory.google_icon(marker.name, marker.color));
        }
        if (m.circle && !marker.color.equals(m.last_color)) {
            m.circle.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: marker.color.to_hash_string(),
                fillOpacity: 0.2
            });
        }

        m.last_color = marker.color;
        m.last_name = marker.name;
    }

    delete_marker_object(m) {
        if (m.circle) {
            m.circle.setMap(null);
            m.circle = null;
        }
        m.setMap(null);
    }

    create_line_object(line) {
        var m = new google.maps.Polyline({
            map: this.map,
            path: [],
            geodesic: true,
            strokeColor: line.color.to_hash_string(),
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        m.last_color = line.color;

        this.lines.set(line.id, m);
        this.update_line_object(m, line);
    }

    update_line_object(m, line) {
        if (this.has_marker_object(line.marker1) && this.has_marker_object(line.marker2)) {
            m.setPath([this.get_marker_object(line.marker1).getPosition(), this.get_marker_object(line.marker2).getPosition()]);
        } else {
            m.setPath([]);
        }

        if (!line.color.equals(m.last_color)) {
            m.setOptions({
                strokeColor: line.color.to_hash_string()
            });
            m.last_color = line.color;
        }
    }

    delete_line_object(m) {
        m.setMap(null);
    }
}