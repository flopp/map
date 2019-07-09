class GoogleWrapper {
    constructor(div_id, app, map_state) {
        this.active = false;
        this.div_id = div_id;
        this.app = app;
        this.map_state = map_state;
        
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
        this.map_state.set_center(Coordinates.from_google(this.map.getCenter()));
        this.map_state.set_zoom(this.map.getZoom());
    }

    update_state() {
        const self = this;

        /* update view */
        this.map.setCenter(this.map_state.center.to_google());
        this.map.setZoom(this.map_state.zoom);

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if (self.markers.has(marker.id)) {
                const m = self.markers.get(marker.id);
                m.setPosition(marker.coordinates.to_google());
            } else {
                const m = new google.maps.Marker({
                    position: marker.coordinates.to_google(),
                    map: self.map,
                    draggable: true
                });
                google.maps.event.addListener(m, "drag", function () {
                    self.app.move_marker(marker.id, Coordinates.from_google(m.getPosition()));
                });
                self.markers.set(marker.id, m);
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
                const m = self.markers.get(id);
                m.setMap(null);
                self.markers.delete(id)
            });
        }
    }
}