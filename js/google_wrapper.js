class GoogleWrapper extends MapStateObserver {
    constructor(div_id, app) {
        super(app.map_state);

        this.active = false;
        this.div_id = div_id;
        this.app = app;
        
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

        this.markers = new Map();

        const self = this;
        google.maps.event.addListener(this.map, 'center_changed', function () { self.view_changed(); });
        google.maps.event.addListener(this.map, 'zoom_changed', function () { self.view_changed(); });
    }

    activate() {
        switch (this.map_state.map_type) {
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
        
        this.update_state();
        
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    view_changed() {
        if (!this.active) {
            return;
        }
        this.map_state.set_view(Coordinates.from_google(this.map.getCenter()), this.map.getZoom(), this);
    }

    update_state() {
        const self = this;

        /* update view */
        this.map.setCenter(this.map_state.center.to_google());
        this.map.setZoom(this.map_state.zoom);

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if (self.markers.has(marker.id)) {
                self.update_marker_object(self.markers.get(marker.id), marker);
            } else {
                self.create_marker_object(marker);
            }
        });

        /* remove spurious markers */
        if (this.markers.size > this.map_state.markers.length) {
            const ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.id);
            });
            
            const deleted_ids = [];
            this.markers.forEach((marker, id, map) => {
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                self.delete_marker_object(self.markers.get(id));
                self.markers.delete(id)
            });
        }
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