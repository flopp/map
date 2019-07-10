class App {
    constructor(id_leaflet, id_google, map_type_activators) {
        var self = this;

        map_type_activators.forEach((activator) => {
            $(activator.selector).click(() => {self.switch_map(activator.type); });
        });
        this.map_type_activators = map_type_activators;
        
        this.map_state = new MapState();
        this.map_state.set_view(new Coordinates(48, 8), 13);
        this.map_type = MapType.STAMEN_TERRAIN;
        
        this.icon_factory = new IconFactory();
        
        this.id_leaflet = id_leaflet;
        this.id_google = id_google;
        
        $('#' + this.id_google).hide();
        
        this.sidebar = new Sidebar("#sidebar", "#sidebar-controls", this);
        
        this.leaflet = new LeafletWrapper(id_leaflet, this);
        this.google = null;
        this.google_loading = false;

        this.switch_map(MapType.STAMEN_TERRAIN);
    }

    set_sidebar(sidebar) {
        this.sidebar = sidebar;
    }

    initialize_google_map() {
        this.show_google_div();
        this.google = new GoogleWrapper(this.id_google, this);
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

    locate_me() {
        var self = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location) => {
                    self.map_state.set_center(new Coordinates(location.coords.latitude, location.coords.longitude), null);
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
                    self.map_state.set_center(new Coordinates(data[0].lat, data[0].lon), null);
                } else {
                    alert("Cannot find location");
                }
            })
            .fail(() => {
                alert("Contacting nominatimg server failed");
            });
    }
}
