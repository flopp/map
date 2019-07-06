class DualMap {
    constructor(id_leaflet, id_google, map_type_activators) {
        var self = this;

        map_type_activators.forEach((activator) => {
            $(activator.selector).click(() => {self.switch_map(activator.type); });
        });
        this.map_type_activators = map_type_activators;

        this.map_state = new MapState();
        this.map_state.set_zoom(13);
        this.map_state.set_center(48, 8);
        this.map_type = null;

        this.id_leaflet = id_leaflet;
        this.id_google = id_google;

        $('#' + this.id_google).hide();

        this.map_leaflet = L.map(this.id_leaflet);

        this.leaflet_layer_openstreetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 16,
            subdomains: 'abc'
        });
        this.leaflet_layer_opentopomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map tiles by <a href="http://opentopomap.org">OpenTopoMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 17,
            subdomains: 'abc'
        });
        this.leaflet_layer_stamen_terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 14,
            subdomains: 'abcd'
        });

        this.leaflet_layers = [
            this.leaflet_layer_openstreetmap,
            this.leaflet_layer_opentopomap,
            this.leaflet_layer_stamen_terrain,
        ];
    
        this.map_state.apply_to_leaflet(this.map_leaflet);

        var self = this;
        this.map_leaflet.on('zoom', function() { self.leaflet_view_changed(); });
        this.map_leaflet.on('move', function() { self.leaflet_view_changed(); });
        
        this.set_leaflet_map_type(MapType.OPENSTREETMAP);
        this.map_google_loading = false;
        this.map_google = null;
    }

    load_google_map (type) {
        if (this.map_google_loading) {
            return;
        }
        if (this.map_google) {
            this.map_state.disable();
            this.show_google_div();
            this.map_state.apply_to_google(this.map_google);
            this.map_state.enable();
            this.set_google_map_type(type)
            return;
        }

        console.log("ON DEMAND LOADING OF THE GOOGLE MAPS API");
        this.map_google_loading = true;
    
        this.map_type = type;
        var url = "https://maps.googleapis.com/maps/api/js?key=" + GOOGLE_API_KEY + "&callback=initialize_google_map";
        $.getScript(url);
    }

    initialize_google_map() {
        this.show_google_div();

        this.map_google = new google.maps.Map(
            document.getElementById(this.id_google), {
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

        this.map_state.disable();
        this.map_state.apply_to_google(this.map_google);
        this.map_state.enable();

        var self = this;
        google.maps.event.addListener(this.map_google, 'center_changed', function () { self.google_view_changed(); });
        google.maps.event.addListener(this.map_google, 'zoom_changed', function () { self.google_view_changed(); });
        this.set_google_map_type(this.map_type);
        this.map_google_loading = false;
    }

    switch_map (type) {
        switch (type) {
            case MapType.OPENSTREETMAP:
            case MapType.OPENTOPOMAP:
            case MapType.STAMEN_TERRAIN:
                this.switch_to_leaflet(type);
                break;
            case MapType.GOOGLE_ROADMAP:
            case MapType.GOOGLE_SATELLITE:
            case MapType.GOOGLE_HYBRID:
            case MapType.GOOGLE_TERRAIN:
                this.switch_to_google(type);
                break;
            default:
                break;
        }
    }

    switch_to_leaflet (type) {
        if ($('#' + this.id_leaflet).is(":visible")) {
            this.set_leaflet_map_type(type);
            return;
        }

        this.map_state.disable();
        this.show_leaflet_div();
        this.map_state.apply_to_leaflet(this.map_leaflet);
        this.map_leaflet.invalidateSize();
        this.map_state.enable();
        this.set_leaflet_map_type(type);
    }

    set_leaflet_map_type(type) {
        this.map_type = type;
        this.map_type_activators.forEach((activator) => {
            if (type == activator.type) {
                $(activator.selector).addClass("is-active");
            } else {
                $(activator.selector).removeClass("is-active");
            }
        });
        
        var layer = null;
        switch (type) {
            case MapType.OPENSTREETMAP:
                layer = this.leaflet_layer_openstreetmap;
                break;
            case MapType.OPENTOPOMAP:
                layer = this.leaflet_layer_opentopomap;
                break;
            case MapType.STAMEN_TERRAIN:
                layer = this.leaflet_layer_stamen_terrain;
                break;
            default:
                break;
        }

        if (!layer) {
            return;
        }

        if (this.map_leaflet.hasLayer(layer)) {
            return;
        }

        var self = this;
        this.leaflet_layers.forEach((otherLayer) => {
            if (otherLayer != layer) {
                self.map_leaflet.removeLayer(otherLayer);
            }
        })
        this.map_leaflet.addLayer(layer);
    }

    set_google_map_type(type) {
        if (!this.map_google) {
            return;
        }

        this.map_type = type;
        this.map_type_activators.forEach((activator) => {
            if (type == activator.type) {
                $(activator.selector).addClass("is-active");
            } else {
                $(activator.selector).removeClass("is-active");
            }
        });

        switch (type) {
            case MapType.GOOGLE_ROADMAP:
                this.map_google.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                break;
            case MapType.GOOGLE_SATELLITE:
                this.map_google.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                break;
            case MapType.GOOGLE_HYBRID:
                this.map_google.setMapTypeId(google.maps.MapTypeId.HYBRID);
                break;
            case MapType.GOOGLE_TERRAIN:
                this.map_google.setMapTypeId(google.maps.MapTypeId.TERRAIN);
                break;
            default:
                break;
        }
    }

    switch_to_google(type) {
        if ($('#' + this.id_google).is(":visible")) {
            this.set_google_map_type(type);
            return;
        }
        this.load_google_map(type);
    }

    show_leaflet_div() {
        $('#' + this.id_google).hide();
        $('#' + this.id_leaflet).show();
    }

    show_google_div() {
        $('#' + this.id_leaflet).hide();
        $('#' + this.id_google).show();
    }

    leaflet_view_changed(event) {
        var center = this.map_leaflet.getCenter();
        this.map_state.set_center(center.lat, center.lng);
        this.map_state.set_zoom(this.map_leaflet.getZoom());
    }

    google_view_changed() {
        var center = this.map_google.getCenter();
        this.map_state.set_center(center.lat(), center.lng());
        this.map_state.set_zoom(this.map_google.getZoom());
    }

    update_geometry() {
        this.map_leaflet.invalidateSize();
    }

    add_marker() {
        this.map_state.add_marker();
    }

    delete_all_markers() {
        this.map_state.delete_all_markers();
    }
}
