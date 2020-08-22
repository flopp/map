import {Coordinates} from './coordinates.js';
import {MapType} from './map_type.js';
import {MapWrapper} from './map_wrapper.js';

/* global Microsoft */

export class BingWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
        this.automatic_event = false;
    }

    create_map_object(div_id) {
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
                self.map_state.set_view(
                    Coordinates.from_bing(self.map.getCenter()),
                    self.map.getZoom(),
                    self,
                );
            }
        });

        Microsoft.Maps.Events.addHandler(this.map, 'rightclick', (event) => {
            if (
                event.primitive &&
                event.primitive.meta &&
                event.primitive.meta.marker
            ) {
                self.app.map_menu.showMarker(
                    self,
                    event.getX() + self.width() / 2,
                    event.getY() + self.height() / 2,
                    event.primitive.meta.marker,
                );
            } else {
                self.app.map_menu.showMap(
                    self,
                    event.getX() + self.width() / 2,
                    event.getY() + self.height() / 2,
                    Coordinates.from_bing(event.location),
                );
            }
            return false;
        });
        ['viewchangestart', 'mousedown'].forEach((event_name) => {
            Microsoft.Maps.Events.addHandler(this.map, event_name, () => {
                self.app.map_menu.hide();
            });
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

        const obj = new Microsoft.Maps.Pushpin(marker.coordinates.to_bing(), {
            draggable: true,
        });

        this.map.entities.push(obj);

        obj.meta = {
            marker: marker,
            last_name: null,
            last_color: null,
            circle: null,
        };

        Microsoft.Maps.Events.addHandler(obj, 'drag', () => {
            self.map_state.set_marker_coordinates(
                marker.get_id(),
                Coordinates.from_bing(obj.getLocation()),
            );
            if (obj.meta.circle) {
                const center = Coordinates.from_bing(obj.getLocation());
                const points = Coordinates.to_bing_path(
                    center.geodesic_circle(marker.radius),
                );
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
            const points = Coordinates.to_bing_path(
                center.geodesic_circle(marker.radius),
            );
            obj.meta.circle.setLocations(points);
        } else if (obj.meta.circle) {
            this.map.entities.remove(this.meta.circle);
            obj.meta.circle = null;
        }

        if (
            !marker.color.equals(obj.meta.last_color) ||
            marker.name !== obj.meta.last_name
        ) {
            const icon = this.app.icon_factory.bing_icon(
                marker.name,
                marker.color,
            );
            obj.setOptions({
                icon: icon.icon,
                anchor: icon.anchor,
            });
        }

        if (obj.meta.circle && !marker.color.equals(obj.meta.last_color)) {
            obj.meta.circle.setOptions({
                strokeColor: marker.color.to_hash_string(),
                strokeThickness: 1,
                fillColor: this.rgba_color(marker.color, 0.2),
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
            strokeThickness: 2,
        });
        obj.meta = {
            line: line,
            last_color: line.color,
            arrow: new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(0, 0),
                {
                    visible: false,
                    anchor: new Microsoft.Maps.Point(16, 16),
                },
            ),
        };
        this.map.entities.push(obj.meta.arrow);
        this.map.entities.push(obj);
        this.lines.set(line.get_id(), obj);

        this.update_line_object(obj, line);
    }

    update_line_object(obj, line) {
        if (
            this.has_marker_object(line.marker1) &&
            this.has_marker_object(line.marker2)
        ) {
            const path = this.map_state
                .get_marker(line.marker1)
                .coordinates.interpolate_geodesic_line(
                    this.map_state.get_marker(line.marker2).coordinates,
                    this.map_state.zoom,
                );
            const bing_path = Coordinates.to_bing_path(path);

            obj.setLocations(bing_path);

            if (bing_path.length >= 2) {
                const last = bing_path[bing_path.length - 1];
                const last1 = bing_path[bing_path.length - 2];
                obj.meta.arrow.setLocation(last);
                const heading = Microsoft.Maps.SpatialMath.getHeading(
                    last1,
                    last,
                );
                obj.meta.arrow.setOptions({
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32">
                               <path d="M10.5 24 L16 16 21.5 24" style="stroke:${line.color.to_hash_string()};stroke-width:2px;fill:none;" transform="rotate(${heading}, 16, 16)"/>
                           </svg>`,
                    visible: true,
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
                strokeColor: line.color.to_hash_string(),
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
    }
}
