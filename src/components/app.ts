import {Coordinates} from "./coordinates";
import {getScript} from "./get_script";
import {IconFactory} from "./icon_factory";
import {Language} from "./language";
import {LeafletWrapper} from "./leaflet_wrapper";
import {LinkDialog} from "./link_dialog";
import {MapMenu} from "./map_menu";
import {MapState, MapStateChange} from "./map_state";
import {MapType} from "./map_type";
import {Marker} from "./marker";
import {MultiMarkersDialog} from "./multi_markers_dialog";
import {NewsDialog} from "./news_dialog";
import {Notifications} from "./notifications";
import {ProjectionDialog} from "./projection_dialog";
import {Sidebar} from "./sidebar";

export class App {
    private readonly _lang: Language | null = null;
    private readonly notifications: Notifications;
    
    public map_state: MapState;
    public icon_factory: IconFactory;
    public projection_dialog: ProjectionDialog;
    public multi_markers_dialog: MultiMarkersDialog;
    public link_dialog: LinkDialog;
    public map_menu: MapMenu;
    public id_leaflet: string;
    public sidebar: Sidebar;
    public leaflet: LeafletWrapper;
    public news_dialog: NewsDialog;
    
    public constructor(id_leaflet: string) {
        this.notifications = new Notifications();

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
        this.news_dialog = new NewsDialog(this);

        this.id_leaflet = id_leaflet;

        this.sidebar = new Sidebar(this);

        this.leaflet = new LeafletWrapper(id_leaflet, this);

        this.reset_maps();
        this.switch_map(this.map_state.map_type);

        this.news_dialog.maybeShow();
    }

    public message(text: string): void {
        this.notifications.message(text, "info");
    }

    public message_error(text: string): void {
        this.notifications.message(text, "danger");
    }

    public reset_maps(): void {
    }


    public switch_map(type: MapType | null): void {
        this.map_state.set_map_type(type);

        switch (type) {
            case MapType.OPENSTREETMAP:
            case MapType.OPENTOPOMAP:
            case MapType.STAMEN_TERRAIN:
            case MapType.HUMANITARIAN:
            case MapType.ARCGIS_WORLDIMAGERY:
                this.switch_to_leaflet();
                break;
            default:
        }
    }

    public switch_to_leaflet(): void {
        this.show_leaflet_div();
        this.leaflet.activate();
        this.map_state.update_observers(MapStateChange.EVERYTHING);
        this.leaflet.invalidate_size();
    }

    public show_leaflet_div(): void {
        (document.querySelector(`#${this.id_leaflet}`) as HTMLElement).style.display = "block";
    }

    public update_geometry(): void {
        this.leaflet.invalidate_size();
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

    public copyClipboard(text: string, success_message: string, error_message: string): void {
        navigator.clipboard.writeText(text).then(
            () => {
                this.message(success_message);
            },
            () => {
                this.message_error(error_message);
            },
        );
    }
}
