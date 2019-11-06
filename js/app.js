import {ApiKeysDialog} from "./api_keys_dialog.js";
import {BingWrapper} from "./bing_wrapper.js";
import {Coordinates} from "./coordinates.js";
import {GoogleWrapper} from "./google_wrapper.js";
import {IconFactory} from "./icon_factory.js";
import {LeafletWrapper} from "./leaflet_wrapper.js";
import {LinkDialog} from "./link_dialog.js";
import {MapState, MapStateChange} from "./mapstate.js";
import {MapType} from "./maptype.js";
import {MultiMarkersDialog} from "./multi_markers_dialog.js";
import {Notifications} from "./notifications.js";
import {ProjectionDialog} from "./projection_dialog.js";
import {Sidebar} from "./sidebar.js";

/* global BING_API_KEY GOOGLE_API_KEY */


export class App {
    constructor(id_leaflet, id_google, id_bing) {
        this.notifications = new Notifications();

        this.google_maps_error = false;
        this.bing_maps_error = false;

        this.console_filter();

        this.map_state = new MapState(this);
        this.map_state.restore_from_url();
        this.map_state.restore();
        this.map_state.clear_storage();

        this.icon_factory = new IconFactory();
        this.api_keys_dialog = null;
        this.projection_dialog = new ProjectionDialog(this);
        this.multi_markers_dialog = new MultiMarkersDialog(this);
        this.link_dialog = new LinkDialog(this);

        this.id_leaflet = id_leaflet;
        this.id_google = id_google;
        this.id_bing = id_bing;

        $(`#${this.id_google}`).hide();
        $(`#${this.id_bing}`).hide();

        this.sidebar = new Sidebar("#sidebar", "#sidebar-controls", this);

        this.leaflet = new LeafletWrapper(id_leaflet, this);
        this.google = null;
        this.google_loading = false;
        this.bing = null;
        this.bing_loading = false;

        if ((this.map_state.google_api_key !== "") && (((typeof GOOGLE_API_KEY) == "undefined") || (GOOGLE_API_KEY.length < 32))) {
            this.google_maps_error = true;
            this.sidebar.sidebar_layers.disable_google_layers();
            this.message_error("Google Maps layers disabled due to missing API key.");
        }
        if ((this.map_state.bing_api_key !== "") && (((typeof BING_API_KEY) == "undefined") || (BING_API_KEY.length < 32))) {
            this.bing_maps_error = true;
            this.sidebar.sidebar_layers.disable_bing_layers();
            this.message_error("Bing Maps layers disabled due to missing API key.");
        }

        this.switch_map(this.map_state.map_type);
    }

    message(text) {
        this.notifications.message(text, "info");
    }

    message_error(text) {
        this.notifications.message(text, "danger");
    }

    has_google_maps() {
        return !this.google_maps_error;
    }

    has_bing_maps() {
        return !this.bing_maps_error;
    }

    initialize_google_map() {
        if (this.google_maps_error) {
            this.switch_map(MapType.OPENSTREETMAP);
            return;
        }

        this.show_google_div();
        this.google = new GoogleWrapper(this.id_google, this);

        this.google.activate();
        this.map_state.update_observers(MapStateChange.EVERYTHING);
        this.google_loading = false;
    }

    initialize_bing_map() {
        if (this.bing_maps_error) {
            this.switch_map(MapType.OPENSTREETMAP);
            return;
        }

        /* global Microsoft */
        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialMath', () => {
            this.show_bing_div();
            this.bing = new BingWrapper(this.id_bing, this);

            this.bing.activate();
            this.map_state.update_observers(MapStateChange.EVERYTHING);
            this.bing_loading = false;
        });
    }

    switch_map (type) {
        if (this.google_maps_error) {
            switch (type) {
                case MapType.GOOGLE_ROADMAP:
                case MapType.GOOGLE_SATELLITE:
                case MapType.GOOGLE_HYBRID:
                case MapType.GOOGLE_TERRAIN:
                    this.map_state.set_map_type(MapType.OPENSTREETMAP);
                    this.switch_to_leaflet();
                    return;
                default:
            }
        }

        if (this.bing_maps_error) {
            switch (type) {
                case MapType.BING_ROAD:
                case MapType.BING_AERIAL:
                    this.map_state.set_map_type(MapType.OPENSTREETMAP);
                    this.switch_to_leaflet();
                    return;
                default:
            }
        }

        this.map_state.set_map_type(type);

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
            case MapType.BING_ROAD:
            case MapType.BING_AERIAL:
                this.switch_to_bing();
                break;
            default:
                break;
        }
    }

    switch_to_leaflet () {
        if (this.google) {
            this.google.deactivate();
        }
        if (this.bing) {
            this.bing.deactivate();
        }
        this.show_leaflet_div();
        this.leaflet.activate();
        this.map_state.update_observers(MapStateChange.EVERYTHING);
        this.leaflet.invalidate_size();
    }

    console_filter() {
        const console = window.console;
        if (!console) {
            return;
        }

        const self = this;
        const original = console.error;
        console.error = (...args) => {
            // show original message
            Reflect.apply(original, console, args);

            if (args[0] && ((typeof args[0]) == "string")) {
                if ((args[0].indexOf("Google Maps JavaScript API error") >= 0) ||
                    (args[0].indexOf("You are using this API without a key") >= 0) ||
                    (args[0].indexOf("developers.google.com") >= 0)) {
                    console.warn("Intercepted error message from the Google Maps API. Disabling google maps.");
                    self.google_maps_error_raised();
                }
            }
        };
    }

    google_maps_error_raised() {
        this.message_error("Google Maps layers disabled due to invalid API key or some API error.");
        this.google_maps_error = true;
        this.sidebar.sidebar_layers.disable_google_layers();
        this.switch_map(MapType.OPENSTREETMAP);
    }

    bing_maps_error_raised() {
        this.message_error("Bing Maps layers disabled due to invalid API key or some API error.");
        this.bing_maps_error = true;
        this.sidebar.sidebar_layers.disable_bing_layers();
        this.switch_map(MapType.OPENSTREETMAP);
    }

    switch_to_google() {
        const self = this;
        if (this.google_maps_error) {
            return;
        }
        if (this.google_loading) {
            return;
        }

        this.leaflet.deactivate();
        if (this.bing) {
            this.bing.deactivate();
        }

        if (this.google) {
            this.show_google_div();
            this.google.activate();
            this.map_state.update_observers(MapStateChange.EVERYTHING);
            this.google.invalidate_size();
            return;
        }

        console.log("ON DEMAND LOADING OF THE GOOGLE MAPS API");
        this.google_loading = true;
        const promise = new Promise((resolve, reject) => {
            const callbackName = '__googleMapsApiOnLoadCallback';
            // Reject the promise after a timeout
            const timeoutId = setTimeout(function () {
                // Set the on load callback to a no-op
                window[callbackName] = () => {};
                self.google_maps_error_raised();
                reject(new Error('Could not load the Google Maps API'));
            }, 10000);

            window[callbackName] = () => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                resolve();
                Reflect.deleteProperty(window, callbackName);
            };

            const url = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=${callbackName}`;
            $.getScript(url);
        });

        promise.then(() => {
            self.initialize_google_map();
        }).catch((error) => {
            console.log("Error in promise");
            console.error(error);
            self.google_maps_error_raised();
        });
    }

    switch_to_bing() {
        const self = this;
        if (this.bing_maps_error) {
            return;
        }
        if (this.bing_loading) {
            return;
        }

        this.leaflet.deactivate();
        if (this.google) {
            this.google.deactivate();
        }


        if (this.bing) {
            this.show_bing_div();
            this.bing.activate();
            this.map_state.update_observers(MapStateChange.EVERYTHING);
            this.bing.invalidate_size();
            return;
        }

        console.log("ON DEMAND LOADING OF THE BING MAPS API");
        this.bing_loading = true;
        const promise = new Promise((resolve, reject) => {
            const callbackName = '__bingMapsApiOnLoadCallback';
            // Reject the promise after a timeout
            const timeoutId = setTimeout(function () {
                // Set the on load callback to a no-op
                window[callbackName] = () => {};
                self.bing_maps_error_raised();
                reject(new Error('Could not load the Bing Maps API'));
            }, 10000);

            window[callbackName] = () => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                resolve();
                Reflect.deleteProperty(window, callbackName);
            };
            const url = `https://www.bing.com/api/maps/mapcontrol?key=${BING_API_KEY}&callback=${callbackName}`;
            $.getScript(url);
        });

        promise.then(() => {
            self.initialize_bing_map();
        }).catch((error) => {
            console.log("Error in promise");
            console.error(error);
            self.bing_maps_error_raised();
        });
    }

    show_leaflet_div() {
        $('#' + this.id_leaflet).show();
        $('#' + this.id_google).hide();
        $('#' + this.id_bing).hide();
    }

    show_google_div() {
        $('#' + this.id_leaflet).hide();
        $('#' + this.id_google).show();
        $('#' + this.id_bing).hide();
    }

    show_bing_div() {
        $('#' + this.id_leaflet).hide();
        $('#' + this.id_google).hide();
        $('#' + this.id_bing).show();
    }

    update_geometry() {
        this.leaflet.invalidate_size();
        if (this.google) {
            this.google.invalidate_size();
        }
        if (this.bing) {
            this.bing.invalidate_size();
        }
    }

    locate_me() {
        const self = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location) => {
                    self.map_state.set_center(new Coordinates(location.coords.latitude, location.coords.longitude), null);
                },
                (error) => {
                    self.message_error(error.message);
                }
            );
        } else {
            self.message_error("Geolocation services are not available.");
        }
    }

    search_location(location_string) {
        if (location_string.length == 0) {
            return;
        }

        // try to parse "location_string" as coordinates
        const coordinates = Coordinates.from_string(location_string);
        if (coordinates) {
            this.map_state.set_center(coordinates, null);
            return;
        }

        // try to resolve "location_string" via a nominatim search
        const self = this;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${location_string}`;
        $.get(url)
            .done((data) => {
                if (data.length > 0) {
                    self.map_state.set_center(new Coordinates(data[0].lat, data[0].lon), null);
                } else {
                    self.message_error("Cannot find a matching location.");
                }
            })
            .fail(() => {
                self.message_error("Failed to contact 'Nominatim' server.");
            });
    }

    show_api_keys_dialog() {
        if (this.api_keys_dialog === null) {
            this.api_keys_dialog = new ApiKeysDialog(this);
        }
        this.api_keys_dialog.show();
    }

    show_projection_dialog(marker) {
        this.projection_dialog.show(marker);
    }

    show_multi_markers_dialog() {
        this.multi_markers_dialog.show();
    }

    show_link_dialog() {
        this.link_dialog.show();
    }
}

