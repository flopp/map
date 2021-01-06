import {ApiKeysDialog} from './api_keys_dialog';
import {Coordinates} from './coordinates';
import {GoogleWrapper} from './google_wrapper';
import {IconFactory} from './icon_factory';
import {Language} from './language';
import {LeafletWrapper} from './leaflet_wrapper';
import {LinkDialog} from './link_dialog';
import {MapMenu} from './map_menu';
import {MapState, MapStateChange} from './map_state';
import {MapType, isGoogle} from './map_type';
import {Marker} from './marker';
import {MultiMarkersDialog} from './multi_markers_dialog';
import {Notifications} from './notifications';
import {ProjectionDialog} from './projection_dialog';
import {Sidebar} from './sidebar';
import {getScript} from "./get_script";

export class App {
    private lang: Language;
    private notifications: Notifications;
    private google_maps_error: boolean;
    public google_loading: boolean;

    public map_state: MapState;
    public icon_factory: IconFactory;
    public api_keys_dialog: ApiKeysDialog;
    public projection_dialog: ProjectionDialog;
    public multi_markers_dialog: MultiMarkersDialog;
    public link_dialog: LinkDialog;
    public map_menu: MapMenu;
    public id_leaflet: string;
    public id_google: string;
    public sidebar: Sidebar;
    public leaflet: LeafletWrapper;
    public google: GoogleWrapper;

    constructor(id_leaflet: string, id_google: string) {
        this.lang = null;
        this.notifications = new Notifications();

        this.google_maps_error = false;

        this.console_filter();

        this.map_state = new MapState(this);

        this.lang = new Language(this);

        this.map_state.restore_from_url();
        this.map_state.restore();
        this.map_state.clear_storage();

        this.icon_factory = new IconFactory();
        this.api_keys_dialog = null;
        this.projection_dialog = new ProjectionDialog(this);
        this.multi_markers_dialog = new MultiMarkersDialog(this);
        this.link_dialog = new LinkDialog(this);
        this.map_menu = new MapMenu(this);

        this.id_leaflet = id_leaflet;
        this.id_google = id_google;

        (document.querySelector(`#${this.id_google}`) as HTMLElement).style.display = 'none';

        this.sidebar = new Sidebar('#sidebar', '#sidebar-controls', this);

        this.leaflet = new LeafletWrapper(id_leaflet, this);
        this.google = null;
        this.google_loading = false;

        this.reset_maps();
        this.switch_map(this.map_state.map_type);
    }

    public message(text: string): void {
        this.notifications.message(text, 'info');
    }

    public message_error(text: string): void {
        this.notifications.message(text, 'danger');
    }

    public reset_maps(): void {
        if (this.map_state.google_api_key !== '') {
            if (!this.has_google_maps()) {
                this.google_maps_error = false;
                this.sidebar.sidebar_layers.enable_google_layers();
            }
        } else {
            this.google_maps_error_raised();
        }
    }

    public has_google_maps(): boolean {
        return !this.google_maps_error;
    }

    public initialize_google_map(): void {
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

    public switch_map(type: string): void {
        if (this.google_maps_error) {
            switch (type) {
                case MapType.GOOGLE_ROADMAP:
                case MapType.GOOGLE_HYBRID:
                case MapType.GOOGLE_TERRAIN:
                    this.map_state.set_map_type(MapType.OPENSTREETMAP);
                    this.switch_to_leaflet();
                    return;
                case MapType.GOOGLE_SATELLITE:
                    this.map_state.set_map_type(MapType.ARCGIS_WORLDIMAGERY);
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
            case MapType.ARCGIS_WORLDIMAGERY:
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

    public switch_to_leaflet(): void {
        if (this.google) {
            this.google.deactivate();
        }
        this.show_leaflet_div();
        this.leaflet.activate();
        this.map_state.update_observers(MapStateChange.EVERYTHING);
        this.leaflet.invalidate_size();
    }

    public console_filter(): void {
        const console = window.console;
        if (!console) {
            return;
        }

        const self = this;
        // tslint:disable-next-line:no-unbound-method
        const original = console.error;
        console.error = (...args): void => {
            // show original message
            Reflect.apply(original, console, args);

            if (args[0] && typeof args[0] === 'string') {
                if (
                    args[0].indexOf('Google Maps JavaScript API error') >= 0 ||
                    args[0].indexOf('You are using this API without a key') >= 0 ||
                    args[0].indexOf('developers.google.com') >= 0
                ) {
                    console.warn(
                        'Intercepted error message from the Google Maps API. Disabling google maps.',
                    );
                    self.google_maps_error_raised();
                }
            }
        };
    }

    public google_maps_error_raised(): void {
        this.message_error(
            this.translate('messages.layer_disabled').replace('{1}', 'Google Maps'),
        );
        this.google_maps_error = true;
        this.sidebar.sidebar_layers.disable_google_layers();
        if (isGoogle(this.map_state.map_type)) {
            this.switch_map(MapType.OPENSTREETMAP);
        }
    }

    public switch_to_google(): void {
        const self = this;
        if (this.google_maps_error) {
            return;
        }
        if (this.google_loading) {
            return;
        }

        this.leaflet.deactivate();

        if (this.google) {
            this.show_google_div();
            this.google.activate();
            this.map_state.update_observers(MapStateChange.EVERYTHING);
            this.google.invalidate_size();
            return;
        }

        console.log('ON DEMAND LOADING OF THE GOOGLE MAPS API');
        const api_key = this.map_state.google_api_key;
        this.google_loading = true;
        const promise = new Promise<void>((resolve: (value?: void) => void, reject: (reason?: any) => void): void => {
            const callbackName = '__googleMapsApiOnLoadCallback';
            // Reject the promise after a timeout
            const timeoutId = setTimeout((): void => {
                // Set the on load callback to a no-op
                window[callbackName] = (): void => {
                    // empty
                };
                self.google_maps_error_raised();
                reject(new Error('Could not load the Google Maps API'));
            }, 10000);

            window[callbackName] = (): void => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                resolve();
                Reflect.deleteProperty(window, callbackName);
            };

            const url = `https://maps.googleapis.com/maps/api/js?key=${api_key}&callback=${callbackName}`;
            getScript(url, null);
        });

        promise
            .then((): void => {
                self.initialize_google_map();
            })
            .catch((error: any): void => {
                console.log('Error in promise');
                console.error(error);
                self.google_maps_error_raised();
            });
    }

    public show_leaflet_div(): void {
        (document.querySelector(`#${this.id_leaflet}`) as HTMLElement).style.display = 'block';
        (document.querySelector(`#${this.id_google}`) as HTMLElement).style.display = 'none';
    }

    public show_google_div(): void {
        (document.querySelector(`#${this.id_leaflet}`) as HTMLElement).style.display = 'none';
        (document.querySelector(`#${this.id_google}`) as HTMLElement).style.display = 'block';
    }

    public update_geometry(): void {
        this.leaflet.invalidate_size();
        if (this.google) {
            this.google.invalidate_size();
        }
    }

    public locate_me(): void {
        const self = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location: GeolocationPosition): void => {
                    self.map_state.set_center(
                        new Coordinates(
                            location.coords.latitude,
                            location.coords.longitude,
                        ),
                    );
                },
                (error: GeolocationPositionError): void => {
                    self.message_error(self.translate('messages.geolocation_error').replace('{1}', error.message));
                },
            );
        } else {
            self.message_error(self.translate('messages.geolocation_not_available'));
        }
    }

    public search_location(location_string: string): void {
        location_string = location_string.trim();
        if (location_string.length === 0) {
            return;
        }

        // try to parse "location_string" as coordinates
        const coordinates = Coordinates.from_string(location_string);
        if (coordinates) {
            this.map_state.set_center(coordinates);
            return;
        }

        // try to resolve "location_string" via a nominatim search
        const self = this;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${location_string}`;
        fetch(url)
            .then((response: Response): Promise<any> => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new TypeError("Response is not JSON");
                }
                return response.json();
            })
            .then((json_data): void => {
                if (json_data.length > 0) {
                    self.map_state.set_center(
                        new Coordinates(json_data[0].lat, json_data[0].lon)
                    );
                } else {
                    self.message_error(self.lang.translate('search.noresult'));
                }
            }).catch((error: any): void => {
                self.message_error(self.lang.translate('search.servererror').replace("{1}", error));
            });
    }

    public show_api_keys_dialog(): void {
        if (this.api_keys_dialog === null) {
            this.api_keys_dialog = new ApiKeysDialog(this);
        }
        this.api_keys_dialog.show();
    }

    public show_projection_dialog(marker: Marker): void {
        this.projection_dialog.show(marker);
    }

    public show_multi_markers_dialog(): void {
        this.multi_markers_dialog.show();
    }

    public show_link_dialog(): void {
        this.link_dialog.show();
    }

    public translate(key: string): string {
        if (this.lang === null) {
            return key;
        }
        return this.lang.translate(key);
    }
}
