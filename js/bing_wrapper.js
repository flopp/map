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

<<<<<<< HEAD
        var obj = new Microsoft.Maps.Pushpin(marker.coordinates.to_bing(), {
            draggable: true
        });

        this.map.entities.push(obj);

        obj.meta = {
            last_name: null,
            last_color: null,
            circle: null
        };

        Microsoft.Maps.Events.addHandler(obj, "drag", function () {
            self.map_state.set_marker_coordinates(marker.get_id(), Coordinates.from_bing(obj.getLocation()));
            if (obj.meta.circle) {
                const center = Coordinates.from_bing(obj.getLocation());
                const points = Coordinates.to_bing_path(center.geodesic_circle(marker.radius));
                obj.meta.circle.setLocations(points);
            }
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    update_marker_object(obj, marker) {
        const position = marker.coordinates.to_bing();

        obj.setLocation(position);

        if (marker.radius > 0) {
            if (!obj.meta.circle) {
                obj.meta.circle = new Microsoft.Maps.Polygon([]);
                this.map.entities.push(obj.meta.circle);
            }
            const center = marker.coordinates;
            const points = Coordinates.to_bing_path(center.geodesic_circle(marker.radius));
            obj.meta.circle.setLocations(points);
        } else if (obj.meta.circle) {
            this.map.entities.remove(this.meta.circle);
            obj.meta.circle = null;
        }

        if (!marker.color.equals(obj.meta.last_color) || (marker.name !== obj.meta.last_name)) {
            const icon = this.app.icon_factory.bing_icon(marker.name, marker.color);
            obj.setOptions({
=======
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
>>>>>>> 922e610e969115c8ad04be6ec898dec57d5c9a8b
                icon: icon.icon,
                anchor: icon.anchor
            });
        }
<<<<<<< HEAD

        if (obj.meta.circle && !marker.color.equals(obj.meta.last_color)) {
            obj.meta.circle.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeThickness: 1,
                fillColor: this.rgba_color(marker.color, 0.2)
            });
        }

        obj.meta.last_color = marker.color;
        obj.meta.last_name = marker.name;
    }

    delete_marker_object(obj) {
        if (obj.meta.circle) {
            this.map.entities.remove(obj.meta.circle);
            obj.meta.circle = null;
        }
        this.map.entities.remove(obj);
    }

    create_line_object(line) {
        const obj = new Microsoft.Maps.Polyline([], {
            strokeColor: line.color.to_hash_string(),
            strokeThickness: 2
        });
        obj.meta = {
            last_color: line.color,
            arrow: new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(0, 0), {
                visible: false,
                anchor: new Microsoft.Maps.Point(16, 16)
            })
        };
        this.map.entities.push(obj.meta.arrow);
        this.map.entities.push(obj);
        this.lines.set(line.get_id(), obj);

        this.update_line_object(obj, line);
    }

    update_line_object(obj, line) {
        if (this.has_marker_object(line.marker1) && this.has_marker_object(line.marker2)) {
            const path = this.map_state.get_marker(line.marker1).coordinates.interpolate_geodesic_line(this.map_state.get_marker(line.marker2).coordinates, this.map_state.zoom);
            const bing_path = Coordinates.to_bing_path(path);

            obj.setLocations(bing_path);

            if (bing_path.length >= 2) {
                const last = bing_path[bing_path.length - 1];
                const last1 = bing_path[bing_path.length - 2];
                obj.meta.arrow.setLocation(last);
                const heading = Microsoft.Maps.SpatialMath.getHeading(last1, last);
                obj.meta.arrow.setOptions({
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32">
                               <path d="M10.5 24 L16 16 21.5 24" style="stroke:${line.color.to_hash_string()};stroke-width:2px;fill:none;" transform="rotate(${heading}, 16, 16)"/>
                           </svg>`,
                    visible: true
                });
            } else {
                obj.meta.arrow.setOptions({visible: false});
            }
        } else {
            obj.setLocations([]);
            obj.meta.arrow.setOptions({visible: false});
        }

        if (!line.color.equals(obj.meta.last_color)) {
            obj.setOptions({
                strokeColor: line.color.to_hash_string()
            });
            obj.meta.last_color = line.color;
        }
    }

    delete_line_object(m) {
        this.map.entities.remove(m.meta.arrow);
        m.meta.arrow = null;
        this.map.entities.remove(m);
    }

    rgba_color(color, alpha) {
        const c = Microsoft.Maps.Color.fromHex(color.to_hash_string());
        c.a = alpha;
        return c;
=======
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
>>>>>>> 922e610e969115c8ad04be6ec898dec57d5c9a8b
    }
}