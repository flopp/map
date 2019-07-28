import {Coordinates} from "./coordinates.js";
import {MapType} from "./maptype.js";
import {MapWrapper} from "./map_wrapper.js";

/* global Microsoft */


export class BingWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
        this.automatic_event = false;
    }

    create_map_object (div_id) {
        const self = this;
        this.map = new Microsoft.Maps.Map(`#${div_id}`, {
            disableBirdseye: true,
            disableStreetside: true,
            showDashboard: false,
            showLocateMeButton: false,
            showMapTypeSelector: false,

        });

        Microsoft.Maps.Events.addHandler(this.map, 'viewchangeend', () => {
            if (self.active && !self.automatic_event) {
                self.map_state.set_view(Coordinates.from_bing(self.map.getCenter()), self.map.getZoom(), self);
            }
        });
    }

    set_map_type(map_type) {
        switch (map_type) {
            case MapType.BING_ROAD:
                this.map.setMapType(Microsoft.Maps.MapTypeId.road);
                break;
            case MapType.BING_AERIAL:
                this.map.setMapType(Microsoft.Maps.MapTypeId.aerial);
                break;
            default:
                break;
        }
    }

    set_map_view(center, zoom) {
        this.automatic_event = true;
        this.map.setView({center: center.to_bing(), zoom: zoom});
        this.automatic_event = false;
    }

    create_marker_object(marker) {
        const self = this;

        var m = new Microsoft.Maps.Pushpin(marker.coordinates.to_bing(), {
            draggable: true
        });

        this.map.entities.push(m);

        m.last_name = null;
        m.last_color = null;
        m.circle = null;

        Microsoft.Maps.Events.addHandler(m, "drag", function () {
            self.map_state.set_marker_coordinates(marker.get_id(), Coordinates.from_bing(m.getLocation()));
            /*
            if (m.circle) {
                m.circle.setCenter(m.getPosition());
            }
            */
        });

        this.markers.set(marker.get_id(), m);

        this.update_marker_object(m, marker);
    }

    update_marker_object(m, marker) {
        const position = marker.coordinates.to_bing();

        m.setLocation(position);

        /*
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
        */

        if (!marker.color.equals(m.last_color) || (marker.name !== m.last_name)) {
            const icon = this.app.icon_factory.bing_icon(marker.name, marker.color);
            m.setOptions({
                icon: icon.icon,
                anchor: icon.anchor
            });
        }
        /*
        if (m.circle && !marker.color.equals(m.last_color)) {
            m.circle.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: marker.color.to_hash_string(),
                fillOpacity: 0.2
            });
        }
        */

        m.last_color = marker.color;
        m.last_name = marker.name;
    }

    delete_marker_object(m) {
        /*
        if (m.circle) {
            m.circle.setMap(null);
            m.circle = null;
        }
        */
        this.map.entities.remove(m);
    }

    create_line_object(line) {
        /*
        var m = new google.maps.Polyline({
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

        m.last_color = line.color;

        this.lines.set(line.get_id(), m);
        this.update_line_object(m, line);
        */
    }

    update_line_object(m, line) {
        /*
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
        */
    }

    delete_line_object(m) {
        /*
        m.setMap(null);
        */
    }
}