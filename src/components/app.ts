import {ApiKeysDialog} from "./api_keys_dialog";
import {Coordinates} from "./coordinates";
import {getScript} from "./get_script";
import {GoogleWrapper} from "./google_wrapper";
import {IconFactory} from "./icon_factory";
import {Language} from "./language";
import {LeafletWrapper} from "./leaflet_wrapper";
import {LinkDialog} from "./link_dialog";
import {MapMenu} from "./map_menu";
import {MapState, MapStateChange} from "./map_state";
import {isGoogle, MapType} from "./map_type";
import {Marker} from "./marker";
import {MultiMarkersDialog} from "./multi_markers_dialog";
import {Notifications} from "./notifications";
import {ProjectionDialog} from "./projection_dialog";
import {Sidebar} from "./sidebar";

export class App {
    private readonly _lang: Language | null = null;
    private readonly notifications: Notifications;
    private google_maps_error: boolean = false;
    public google_loading: boolean = false;

    public map_state: MapState;
    public icon_factory: IconFactory;
    public api_keys_dialog: ApiKeysDialog | null = null;
    public projection_dialog: ProjectionDialog;
    public multi_markers_dialog: MultiMarkersDialog;
    public link_dialog: LinkDialog;
    public map_menu: MapMenu;
    public id_leaflet: string;
    public id_google: string;
    public sidebar: Sidebar;
    public leaflet: LeafletWrapper;
    public google: GoogleWrapper | null = null;

    public constructor(id_leaflet: string, id_google: string) {
        this.notifications = new Notifications();

        this.console_filter();

        this.map_state = new MapState(this);

        this._lang = new Language(this);

        this.map_state.restore_from_url();
        this.map_state.restore();
        this.map_state.clear_storage();

        this.icon_factory = new IconFactory();
        this.projection_dialog = new ProjectionDialog(this);
        this.multi_markers_dialog = new MultiMarkersDialog(this);
        this.link_dialog = new LinkDialog(this);
        this.map_menu = new MapMenu(this);

        this.id_leaflet = id_leaflet;
        this.id_google = id_google;

        (document.getElementById(this.id_google) as HTMLElement).style.display = "none";

        this.sidebar = new Sidebar(this);

        this.leaflet = new LeafletWrapper(id_leaflet, this);

        this.reset_maps();
        this.switch_map(this.map_state.map_type);
    }

    public message(text: string): void {
        this.notifications.message(text, "info");
    }

    public message_error(text: string): void {
        this.notifications.message(text, "danger");
    }

    public reset_maps(): void {
        if (this.map_state.google_api_key !== "") {
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

    public switch_map(type: MapType | null): void {
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
            case MapType.HUMANITARIAN:
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
        }
    }

    public switch_to_leaflet(): void {
        if (this.google !== null) {
            this.google.deactivate();
        }
        this.show_leaflet_div();
        this.leaflet.activate();
        this.map_state.update_observers(MapStateChange.EVERYTHING);
        this.leaflet.invalidate_size();
    }

    public console_filter(): void {
        const console = window.console;

        // tslint:disable-next-line:no-unbound-method
        const original = console.error;
        console.error = (...args: any[]): void => {
            // Show original message
            Reflect.apply(original, console, args);

            if (args[0] && typeof args[0] === "string") {
                if (
                    args[0].indexOf("Google Maps JavaScript API error") >= 0 ||
                    args[0].indexOf("You are using this API without a key") >= 0 ||
                    args[0].indexOf("developers.google.com") >= 0
                ) {
                    console.warn(
                        "Intercepted error message from the Google Maps API:",
                        args[0],
                        "=> disabling google maps",
                    );
                    this.google_maps_error_raised();
                }
            }
        };
    }

    public google_maps_error_raised(): void {
        this.message_error(this.translate("messages.layer_disabled", "Google Maps"));
        this.google_maps_error = true;
        this.sidebar.sidebar_layers.disable_google_layers();
        if (isGoogle(this.map_state.map_type)) {
            this.switch_map(MapType.OPENSTREETMAP);
        }
    }

    public switch_to_google(): void {
        if (this.google_maps_error) {
            return;
        }
        if (this.google_loading) {
            return;
        }

        this.leaflet.deactivate();

        if (this.google !== null) {
            this.show_google_div();
            this.google.activate();
            this.map_state.update_observers(MapStateChange.EVERYTHING);
            this.google.invalidate_size();

            return;
        }

        console.log("ON DEMAND LOADING OF THE GOOGLE MAPS API");
        const api_key = this.map_state.google_api_key;
        this.google_loading = true;
        const promise = new Promise<void>(
            (resolve: () => void, reject: (reason: any) => void): void => {
                const callbackName = "__googleMapsApiOnLoadCallback";
                // Reject the promise after a timeout
                const timeoutId = setTimeout((): void => {
                    // Set the on load callback to a no-op
                    (window as any).__googleMapsApiOnLoadCallback = (): void => {
                        // Empty
                    };
                    this.google_maps_error_raised();
                    reject(new Error("Could not load the Google Maps API"));
                }, 10000);

                (window as any).__googleMapsApiOnLoadCallback = (): void => {
                    // tslint:disable-next-line: strict-type-predicates
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }
                    resolve();
                    Reflect.deleteProperty(window, callbackName);
                };

                const url = `https://maps.googleapis.com/maps/api/js?key=${api_key}&callback=${callbackName}`;
                getScript(url);
            },
        );

        promise
            .then((): void => {
                this.initialize_google_map();
            })
            .catch((error: any): void => {
                console.log("Error in promise");
                console.error(error);
                this.google_maps_error_raised();
            });
    }

    public show_leaflet_div(): void {
        (document.querySelector(`#${this.id_leaflet}`) as HTMLElement).style.display = "block";
        (document.querySelector(`#${this.id_google}`) as HTMLElement).style.display = "none";
    }

    public show_google_div(): void {
        (document.querySelector(`#${this.id_leaflet}`) as HTMLElement).style.display = "none";
        (document.querySelector(`#${this.id_google}`) as HTMLElement).style.display = "block";
    }

    public update_geometry(): void {
        this.leaflet.invalidate_size();
        if (this.google !== null) {
            this.google.invalidate_size();
        }
    }

    public locate_me(): void {
        // tslint:disable-next-line: strict-boolean-expressions
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (location: GeolocationPosition): void => {
                    this.map_state.set_center(
                        new Coordinates(location.coords.latitude, location.coords.longitude),
                    );
                },
                (error: GeolocationPositionError): void => {
                    this.message_error(this.translate("messages.geolocation_error", error.message));
                },
            );
        } else {
            this.message_error(this.translate("messages.geolocation_not_available"));
        }
    }

    public search_location(location_string: string): void {
        const trimmed = location_string.trim();
        if (trimmed.length === 0) {
            return;
        }

        // Try to parse "location_string" as coordinates
        const coordinates = Coordinates.from_string(trimmed);
        if (coordinates !== null) {
            this.map_state.set_center(coordinates);

            return;
        }

        // Try to resolve "location_string" via a nominatim search
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${trimmed}`;
        fetch(url)
            .then(
                (response: Response): Promise<any> => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    const contentType = response.headers.get("content-type");
                    if (contentType === null || !contentType.includes("application/json")) {
                        throw new TypeError("Response is not JSON");
                    }

                    return response.json();
                },
            )
            .then((json_data): void => {
                if (json_data.length > 0) {
                    this.map_state.set_center(new Coordinates(json_data[0].lat, json_data[0].lon));
                } else {
                    this.message_error(this.translate("search.no-result"));
                }
            })
            .catch((error: any): void => {
                this.message_error(this.translate("search.server-error", error));
            });
    }

    public show_api_keys_dialog(): void {
        if (this.api_keys_dialog === null) {
            this.api_keys_dialog = new ApiKeysDialog(this);
        }
        this.api_keys_dialog.show();
    }

    public show_projection_dialog(marker: Marker): void {
        this.projection_dialog.showMarker(marker);
    }

    public show_multi_markers_dialog(): void {
        this.multi_markers_dialog.show();
    }

    public show_link_dialog(): void {
        this.link_dialog.show();
    }

    public translate(key: string, ...args: string[]): string {
        if (this._lang === null) {
            return key;
        }

        const translated = this._lang.translate(key);
        let s = translated;
        for (let i: number = 1; i <= args.length; i += 1) {
            const pattern: string = `{${i}}`;
            if (s.indexOf(pattern) >= 0) {
                s = s.replace(pattern, args[i - 1]);
            } else {
                console.log(
                    `App.translate(${key}): cannot find pattern '${pattern}' in '${translated}'`,
                );
            }
        }

        return s;
    }
}
