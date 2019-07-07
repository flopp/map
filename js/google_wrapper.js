class GoogleWrapper {
    constructor(div_id, map_state) {
        this.active = false;
        this.div_id = div_id;
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

        var self = this;
        google.maps.event.addListener(this.map, 'center_changed', function () { self.view_changed(); });
        google.maps.event.addListener(this.map, 'zoom_changed', function () { self.view_changed(); });
    }

    activate() {
        this.set_map_type(this.map_state.map_type);
        this.map.setCenter(this.map_state.center.to_google());
        this.map.setZoom(this.map_state.zoom);

        this.active = true;
    }

    deactivate() {
        this.active = false;
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

    view_changed() {
        if (!this.active) {
            return;
        }
        this.map_state.set_center(Coordinates.from_google(this.map.getCenter()));
        this.map_state.set_zoom(this.map.getZoom());
    }
}