class App {
    constructor(id_leaflet, id_google, map_type_activators) {
        var self = this;

        this.sidebar = null;

        map_type_activators.forEach((activator) => {
            $(activator.selector).click(() => {self.switch_map(activator.type); });
        });
        this.map_type_activators = map_type_activators;

        this.map_state = new MapState();
        this.map_state.set_zoom(13);
        this.map_state.set_center(new Coordinates(48, 8));
        this.map_type = MapType.OPENSTREETMAP;

        this.id_leaflet = id_leaflet;
        this.id_google = id_google;

        $('#' + this.id_google).hide();

        this.leaflet = new LeafletWrapper(id_leaflet, this.map_state);
        this.google = null;
        this.google_loading = false;

        this.switch_map(MapType.OPENSTREETMAP);
    }

    set_sidebar(sidebar) {
        this.sidebar = sidebar;
    }

    initialize_google_map() {
        this.show_google_div();
        this.google = new GoogleWrapper(this.id_google, this.map_state);
        this.google.activate();
        this.google_loading = false;
    }

    switch_map (type) {
        this.map_state.set_map_type(type);
        this.map_type_activators.forEach((activator) => {
            if (type == activator.type) {
                $(activator.selector).addClass("is-active");
            } else {
                $(activator.selector).removeClass("is-active");
            }
        });

        switch (type) {
            case MapType.OPENSTREETMAP:
            case MapType.OPENTOPOMAP:
            case MapType.STAMEN_TERRAIN:
                this.switch_to_leaflet();
                break;
            case MapType.GOOGLE_ROADMAP:
            case MapType.GOOGLE_SATELLITE:
            case MapType.GOOGLE_HYBRID:
            case MapType.GOOGLE_TERRAIN:
                this.switch_to_google();
                break;
            default:
                break;
        }
    }

    switch_to_leaflet () {
        if (this.google) {
            this.google.deactivate();
        }
        this.show_leaflet_div();
        this.leaflet.activate();
        this.leaflet.invalidate_size();
    }

    switch_to_google() {
        if (this.google_loading) {
            return;
        }
        
        this.leaflet.deactivate();

        if (this.google) {
            this.show_google_div();
            this.google.activate();
            return;
        }

        console.log("ON DEMAND LOADING OF THE GOOGLE MAPS API");
        this.google_loading = true;
    
        var url = "https://maps.googleapis.com/maps/api/js?key=" + GOOGLE_API_KEY + "&callback=initialize_google_map";
        $.getScript(url);
    }

    show_leaflet_div() {
        $('#' + this.id_google).hide();
        $('#' + this.id_leaflet).show();
    }

    show_google_div() {
        $('#' + this.id_leaflet).hide();
        $('#' + this.id_google).show();
    }

    update_geometry() {
        this.leaflet.invalidate_size();
    }

    update_state() {
        this.sidebar.update_state();
        this.leaflet.update_state();
        if (this.google) {
            this.google.update_state();
        }
    }

    locate_me() {
        var self = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location) => {
                    self.map_state.set_center(new Coordinates(location.coords.latitude, location.coords.longitude));
                    self.update_state();
                },
                (error) => {
                    alert(error.message);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        };
    }

    search_location(location_string) {
        if (location_string.length == 0) {
            return;
        }

        // TODO: try to parse location_string as coordinates first

        var self = this;
        var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + location_string;
        $.get(url)
            .done((data) => {
                if (data.length > 0) {
                    self.map_state.set_center(new Coordinates(data[0].lat, data[0].lon));
                    this.update_state();
                } else {
                    alert("Cannot find location");
                }
            })
            .fail(() => {
                alert("Contacting nominatimg server failed");
            });
    }

    add_marker() {
        this.map_state.add_marker(this.map_state.center);
        this.update_state();
    }

    delete_marker(id) {
        this.map_state.delete_marker(id);
        this.update_state();
    }

    delete_all_markers() {
        this.map_state.delete_all_markers();
        this.update_state();
    }
}
