class GoogleWrapper extends MapWrapper {
    constructor(div_id, app) {
        super(div_id, app);
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
            if (self.active) {
                self.map_state.set_view(Coordinates.from_google(self.map.getCenter()), self.map.getZoom(), self);
            }
        });

        google.maps.event.addListener(this.map, 'zoom_changed', function () {
            if (self.active) {
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
        this.map.setCenter(center.to_google());
        this.map.setZoom(zoom);
    }

    create_marker_object(marker) {
        const self = this;

        const m = new google.maps.Marker({
            position: marker.coordinates.to_google(),
            map: self.map,
            draggable: true,
            icon: self.app.icon_factory.google_icon(marker.name, marker.color),
        });
        
        m.last_name = marker.name;
        m.last_color = marker.color;
        m.circle = null;

        google.maps.event.addListener(m, "drag", function () {
            self.map_state.set_marker_coordinates(marker.id, Coordinates.from_google(m.getPosition()), self);
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
                    strokeColor: "#" + marker.color,
                    strokeOpacity: 1,
                    fillColor: "#" + marker.color,
                    fillOpacity: 0.2,
                    strokeWeight: 1,
                    radius: marker.radius
                });
            }
        } else if (m.circle) {
            m.circle.setMap(null);
            m.circle = null;
        }

        if ((marker.color !== m.last_color) || (marker.name !== m.last_name)) {
            m.setIcon(this.app.icon_factory.google_icon(marker.name, marker.color));
        }
        if (m.circle && (marker.color !== m.last_color)) {
            m.circle.setOptions({strokeColor: "#" + marker.color, fillColor: "#" + marker.color});
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
}