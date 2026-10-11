import {App} from "./app";
import {Color} from "./color";
import {Coordinates, CoordinatesFormat, parseCoordinatesFormat} from "./coordinates";
import {Distance, DistanceFormat, parseDistanceFormat} from "./distance";
import {ILineJson, Line, LineView} from "./line";
import {MapStateObserver} from "./map_state_observer";
import {MapType, maptype2string, string2maptype} from "./map_type";
import {IMarkerJson, Marker, MarkerView} from "./marker";
import {Storage} from "./storage";
import {parse_float, parse_int} from "./utilities";

export enum MapStateChange {
    NOTHING = 0,
    SIDEBAR = 1,
    MAPTYPE = 2,
    CENTER = 4,
    ZOOM = 8,
    VIEW = 12,
    MARKERS = 16,
    LINES = 32,
    LANGUAGE = 64,
    HILLSHADING = 128,
    EVERYTHING = 255,
}

interface IMarkerSettingsDict {
    coordinates_format: CoordinatesFormat;
    random_color: boolean;
    color: Color;
    radius: number;
    filled: boolean;
}
interface ILineSettingsDict {
    distance_format: DistanceFormat;
    random_color: boolean;
    color: Color;
}

export interface MarkerAttributes {
    name?: string;
    color?: Color;
    radius?: number;
}

export interface LineAttributes {
    marker1?: number;
    marker2?: number;
    color?: Color;
}

interface IMarkerUrlData {
    name: string;
    coordinates: Coordinates;
    color: Color;
    radius: number;
}

interface ILineUrlData {
    from: number;
    to: number;
    color: Color;
}

export interface MapStateFromUrl {
    center: Coordinates;
    zoom: number | null;
    map_type: MapType | null;
    hillshading: boolean;
    markers: IMarkerUrlData[];
    lines: ILineUrlData[];
}

export interface MapStateJsonMarker {
    id?: number;
    coordinates: Coordinates;
    name?: string;
    color?: Color;
    radius?: number;
}

export interface MapStateJsonLine {
    marker1?: number;
    marker2?: number;
    color?: Color;
}

export interface MapStateJsonImport {
    map_type?: MapType;
    center?: Coordinates;
    zoom?: number;
    german_npa?: boolean;
    hillshading?: boolean;
    settings?: {
        markers?: {
            coordinates_format?: CoordinatesFormat;
            random_color?: boolean;
            color?: Color;
            radius?: number;
            draggable?: boolean;
            filled?: boolean;
        };
        lines?: {
            distance_format?: DistanceFormat;
            random_color?: boolean;
            color?: Color;
            display_distance?: boolean;
        };
    };
    markers?: MapStateJsonMarker[];
    lines?: MapStateJsonLine[];
}

const is_record = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const has_property = (value: Record<string, unknown>, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(value, key);

const parse_json_integer = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
    }
    if (typeof value === "string" && /^[+-]?\d+$/.test(value)) {
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) ? parsed : null;
    }

    return null;
};

const parse_json_nonnegative_number = (value: unknown): number | null => {
    const parsed =
        typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number(value)
              : Number.NaN;

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parse_json_boolean = (value: unknown): boolean | null =>
    typeof value === "boolean" ? value : null;

const parse_json_color = (value: unknown): Color | null =>
    typeof value === "string" ? Color.from_string(value) : null;

export class MapState {
    public app: App;
    public language: string = "";
    public sidebar_open: string | null = null;
    public map_type: MapType | null = null;
    public zoom: number | null = null;
    public center: Coordinates | null = null;
    public german_npa: boolean = false;
    public hillshading: boolean = false;
    private _markers: Marker[] = [];
    private _markers_hash: Map<number, Marker>;
    private _lines: Line[] = [];
    private _lines_hash: Map<number, Line>;
    public settings_marker_coordinates_format: CoordinatesFormat = CoordinatesFormat.DM;
    public settings_marker_random_color: boolean = true;
    public settings_marker_color: Color = Color.default_color();
    public settings_marker_radius: number = 0;
    public settings_marker_draggable: boolean = false;
    public settings_marker_filled: boolean = true;
    public settings_line_distance_format: DistanceFormat = DistanceFormat.m;
    public settings_line_random_color: boolean = true;
    public settings_line_color: Color = Color.default_color();
    public settings_line_display_distance: boolean = true;
    public observers: MapStateObserver[] = [];
    public storage: Storage;

    public constructor(app: App) {
        this.app = app;
        this._markers_hash = new Map();
        this._lines_hash = new Map();
        this.storage = new Storage();
    }

    public get markers(): readonly MarkerView[] {
        return this._markers.slice();
    }

    public get lines(): readonly LineView[] {
        return this._lines.slice();
    }

    public has_markers_or_lines(): boolean {
        return this._markers.length > 0 || this._lines.length > 0;
    }

    public store(): void {
        this.storage.set("language", this.language);

        this.storage.set("sidebar_open", this.sidebar_open);
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.storage.set("map_type", maptype2string(this.map_type));
        this.storage.set_bool("german_npa", this.german_npa);
        this.storage.set_bool("hillshading", this.hillshading);
        this.storage.set("markers", this.get_marker_ids_string());
        this._markers.forEach((marker: Marker): void => {
            this.update_marker_storage(marker);
        });
        this.storage.set("lines", this.get_line_ids_string());
        this._lines.forEach((line: Line): void => {
            this.update_line_storage(line);
        });

        this.storage.set(
            "settings.marker.coordinates_format",
            this.settings_marker_coordinates_format,
        );
        this.storage.set_bool("settings.marker.random_color", this.settings_marker_random_color);
        this.storage.set_color("settings.marker.color", this.settings_marker_color);
        this.storage.set_float("settings.marker.radius", this.settings_marker_radius);
        this.storage.set_bool("settings.marker.draggable", this.settings_marker_draggable);
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);

        this.storage.set("settings.line.distance_format", this.settings_line_distance_format);
        this.storage.set_bool("settings.line.random_color", this.settings_line_random_color);
        this.storage.set_color("settings.line.color", this.settings_line_color);
        this.storage.set_bool(
            "settings.line.display_distance",
            this.settings_line_display_distance,
        );
    }

    public restore(): void {
        // Sidebar
        this.set_sidebar_open(this.storage.get("sidebar_open", null));

        // Map view
        this.set_view(
            this.storage.get_coordinates("center", new Coordinates(48, 8))!,
            this.storage.get_int("zoom", 13),
        );
        this.set_map_type(
            string2maptype(this.storage.get("map_type", maptype2string(MapType.OPENSTREETMAP))!)!,
        );
        this.set_german_npa(this.storage.get_bool("german_npa", false));
        this.set_hillshading(this.storage.get_bool("hillshading", false));

        // Markers
        const marker_ids: Map<number, number> = new Map();
        this.storage
            .get("markers", "")!
            .split(";")
            .forEach((id: string): void => {
                if (id === "") {
                    return;
                }
                const coordinates = this.storage.get_coordinates(`marker[${id}].coordinates`, null);
                const name = this.storage.get(`marker[${id}].name`, id)!;
                const color = this.storage.get_color(`marker[${id}].color`, new Color("FF0000"));
                const radius = this.storage.get_float(`marker[${id}].radius`, 0)!;
                if (coordinates !== null) {
                    const marker = new Marker(coordinates);
                    marker.update({name, color, radius});
                    this._markers.push(marker);
                    this._markers_hash.set(marker.get_id(), marker);
                    marker_ids.set(parseInt(id, 10), marker.get_id());
                }
            });

        // Lines
        this.storage
            .get("lines", "")!
            .split(";")
            .forEach((id: string): void => {
                if (id === "") {
                    return;
                }
                const old_marker1 = this.storage.get_int(`line[${id}].marker1`, -1);
                const old_marker2 = this.storage.get_int(`line[${id}].marker2`, -1);
                const color = this.storage.get_color(`line[${id}].color`, new Color("FF0000"));

                let marker1 = -1;
                if (marker_ids.has(old_marker1)) {
                    marker1 = marker_ids.get(old_marker1)!;
                }

                let marker2 = -1;
                if (marker_ids.has(old_marker2)) {
                    marker2 = marker_ids.get(old_marker2)!;
                }

                const line = new Line(marker1, marker2);
                line.update({color});
                this._lines.push(line);
                this._lines_hash.set(line.get_id(), line);
            });

        this.recompute_lines();

        // Settings
        const coordinates_format = parseCoordinatesFormat(
            this.storage.get("settings.marker.coordinates_format", "")!,
            this.settings_marker_coordinates_format,
        );
        this.set_default_marker_settings({
            coordinates_format,
            random_color: this.storage.get_bool("settings.marker.random_color", true),
            color: this.storage.get_color("settings.marker.color", new Color("FF0000")),
            radius: this.storage.get_float("settings.marker.radius", 0)!,
            filled: this.storage.get_bool("settings.marker.filled", true),
        });
        this.set_draggable_markers(this.storage.get_bool("settings.marker.draggable", false));

        // Settings
        const distance_format = parseDistanceFormat(
            this.storage.get("settings.marker.distance_format", "")!,
            this.settings_line_distance_format,
        );
        this.set_default_line_settings({
            distance_format,
            random_color: this.storage.get_bool("settings.line.random_color", true),
            color: this.storage.get_color("settings.line.color", new Color("FF0000")),
        });

        this.set_display_distance(this.storage.get_bool("settings.line.display_distance", true));

        // Language
        this.set_language(this.storage.get("language", "")!);
    }

    public clear_storage(): void {
        const ok_keys = new Set();
        ok_keys.add("version");
        ok_keys.add("language");
        ok_keys.add("center");
        ok_keys.add("zoom");
        ok_keys.add("map_type");
        ok_keys.add("german_npa");
        ok_keys.add("hillshading");
        ok_keys.add("sidebar_open");
        ok_keys.add("markers");
        this._markers.forEach((obj: Marker): void => {
            const id = obj.get_id();
            ok_keys.add(`marker[${id}].coordinates`);
            ok_keys.add(`marker[${id}].name`);
            ok_keys.add(`marker[${id}].color`);
            ok_keys.add(`marker[${id}].radius`);
        });
        ok_keys.add("lines");
        this._lines.forEach((obj: Line): void => {
            const id = obj.get_id();
            ok_keys.add(`line[${id}].marker1`);
            ok_keys.add(`line[${id}].marker2`);
            ok_keys.add(`line[${id}].color`);
        });
        ok_keys.add("settings.marker.coordinates_format");
        ok_keys.add("settings.marker.random_color");
        ok_keys.add("settings.marker.color");
        ok_keys.add("settings.marker.radius");
        ok_keys.add("settings.marker.draggable");
        ok_keys.add("settings.marker.filled");
        ok_keys.add("settings.line.distance_format");
        ok_keys.add("settings.line.random_color");
        ok_keys.add("settings.line.color");
        ok_keys.add("settings.line.display_distance");

        ok_keys.add("news.shown");
        ok_keys.add("i18nextLng");

        const bad_keys = this.storage
            .all_keys()
            .filter((key: string): boolean => !ok_keys.has(key));
        bad_keys.forEach((key: string): void => {
            console.log("bad key: ", key);
            this.storage.remove(key);
        });
    }

    public parse_url_state(): MapStateFromUrl | null {
        const params = new Map();
        window.location.search
            .substr(1)
            .split("&")
            .forEach((token: string): void => {
                const tokens = token.split("=", 2);
                if (tokens[0].length > 0) {
                    if (tokens.length === 1) {
                        params.set(tokens[0], "");
                    } else {
                        params.set(tokens[0], tokens[1]);
                    }
                }
            });

        let center: Coordinates | null = null;
        let zoom: number | null = null;
        let map_type: MapType | null = null;
        let hillshading = false;
        const markers: IMarkerUrlData[] = [];
        const marker_hash: Map<string, number> = new Map();
        const lines: ILineUrlData[] = [];

        params.forEach((value: string, key: string): void => {
            switch (key) {
                case "c":
                    center = Coordinates.from_string(value);
                    break;
                case "z":
                    zoom = parse_int(value);
                    break;
                case "t":
                    map_type = string2maptype(value);
                    if (map_type === null) {
                        switch (value) {
                            case "OSM":
                            case "OSM/DE":
                                map_type = MapType.OPENSTREETMAP;
                                break;
                            case "TOPO":
                                map_type = MapType.OPENTOPOMAP;
                                break;
                            default:
                                map_type = null;
                        }
                    }
                    break;
                case "h":
                    hillshading = value === "1";
                    break;
                case "m":
                    value.split("*").forEach((token: string): void => {
                        // A:47.984967:7.908317:1000:markerA:ff0000
                        const tokens = token.split(":");
                        if (tokens.length < 3 || tokens.length > 6) {
                            return;
                        }
                        const id = tokens[0];
                        const lat: number | null = parse_float(tokens[1]);
                        const lon: number | null = parse_float(tokens[2]);
                        let radius: number | null = 0;
                        if (tokens.length > 3) {
                            if (tokens[3] !== "") {
                                radius = parse_float(tokens[3]);
                            }
                        }
                        let name = id;
                        if (tokens.length > 4) {
                            name = this.decode(tokens[4]);
                        }
                        let color: Color | null = Color.random_from_palette();
                        if (tokens.length > 5) {
                            color = Color.from_string(tokens[5]);
                        }

                        if (
                            id.length > 0 &&
                            lat !== null &&
                            lon !== null &&
                            radius !== null &&
                            color !== null
                        ) {
                            marker_hash.set(id, markers.length);
                            markers.push({
                                name,
                                coordinates: new Coordinates(lat, lon),
                                color,
                                radius,
                            });
                        }
                    });
                    break;
                case "d":
                    value.split("*").forEach((token: string): void => {
                        // From:to:color
                        const tokens = token.split(":");
                        if (tokens.length < 2 || tokens.length > 3) {
                            return;
                        }

                        let from = null;
                        if (tokens[0].length === 0) {
                            from = -1;
                        } else if (marker_hash.has(tokens[0])) {
                            from = marker_hash.get(tokens[0])!;
                        }
                        let to = null;
                        if (tokens[1].length === 0) {
                            to = -1;
                        } else if (marker_hash.has(tokens[1])) {
                            to = marker_hash.get(tokens[1])!;
                        }
                        let color = Color.from_string("#ff0000");
                        if (tokens.length > 2) {
                            color = Color.from_string(tokens[2]);
                        }

                        if (from !== null && to !== null && color !== null) {
                            lines.push({from, to, color});
                        }
                    });
                    break;
                default:
                    console.log(`ignoring unsupported url parameter: ${key}=${value}`);
            }
        });

        if (center === null && markers.length === 0) {
            return null;
        }

        if (center === null) {
            let lat = 0;
            let lon = 0;
            markers.forEach((marker: IMarkerUrlData): void => {
                lat += marker.coordinates.lat();
                lon += marker.coordinates.lng();
            });
            center = new Coordinates(lat / markers.length, lon / markers.length);
        }

        return {center, zoom, map_type, hillshading, markers, lines};
    }

    public apply_url_state(url_state: MapStateFromUrl): void {
        this._markers = [];
        this._markers_hash.clear();
        Marker.reset_ids();

        url_state.markers.forEach((data: IMarkerUrlData): void => {
            const marker = new Marker(data.coordinates);
            marker.update({name: data.name, color: data.color, radius: data.radius});
            this._markers.push(marker);
            this._markers_hash.set(marker.get_id(), marker);
        });
        Marker.reset_ids(this._markers.length);

        this._lines = [];
        this._lines_hash.clear();
        Line.reset_ids();
        url_state.lines.forEach((data: ILineUrlData): void => {
            const marker1 =
                data.from >= 0 && data.from < this._markers.length
                    ? this._markers[data.from].get_id()
                    : -1;
            const marker2 =
                data.to >= 0 && data.to < this._markers.length
                    ? this._markers[data.to].get_id()
                    : -1;
            const line = new Line(marker1, marker2);
            line.update({color: data.color});
            this._lines.push(line);
            this._lines_hash.set(line.get_id(), line);
        });
        Line.reset_ids(this._lines.length);

        this.center = url_state.center;
        if (url_state.zoom !== null) {
            this.zoom = url_state.zoom;
        }
        if (url_state.map_type !== null) {
            this.map_type = url_state.map_type;
        }
        this.hillshading = url_state.hillshading;

        this.clear_storage();
        this.store();
        this.update_observers(MapStateChange.EVERYTHING);
    }

    public restore_from_url(): void {
        const url_state = this.parse_url_state();
        if (url_state !== null) {
            this.apply_url_state(url_state);
        }
    }

    public encode_coordinates(coordinates: Coordinates): string {
        const lat = coordinates
            .lat()
            .toFixed(6)
            .replace(/\.?0+$/, "");
        const lng = coordinates
            .lng()
            .toFixed(6)
            .replace(/\.?0+$/, "");

        return `${lat}:${lng}`;
    }

    public encode_radius(radius: number): string {
        if (radius === 0) {
            return "";
        }

        return radius.toFixed(1).replace(/\.?0+$/, "");
    }

    public create_link(): string {
        const base = window.location.href.split("?")[0].split("#")[0];
        const markers = this._markers
            .map(
                (m: Marker): string =>
                    `${m.get_id()}:${this.encode_coordinates(m.coordinates)}:${this.encode_radius(m.radius)}:${this.encode(m.name)}:${m.color.to_string()}`,
            )
            .join("*");
        const lines = this._lines
            .map((obj: Line): string => `${obj.marker1}:${obj.marker2}:${obj.color.to_string()}`)
            .join("*");

        const hillshading = this.hillshading ? "&h=1" : "";

        return `${base}?c=${this.encode_coordinates(this.center!)}&z=${this.zoom}&t=${this.map_type}&m=${markers}&d=${lines}${hillshading}`;
    }

    public decode(s: string): string {
        return decodeURIComponent(s);
    }

    public encode(s: string): string {
        return encodeURIComponent(s)
            .replace(new RegExp(/\*/, "g"), "%2A")
            .replace(new RegExp(/:/, "g"), "%3A");
    }

    public register_observer(observer: MapStateObserver): void {
        this.observers.push(observer);
    }

    public update_observers(changes: number, marker_id: number = -1): void {
        let updatedChanges = changes;
        if ((changes & (MapStateChange.MARKERS | MapStateChange.LINES)) !== 0) {
            if (this.recompute_lines()) {
                updatedChanges = changes | MapStateChange.LINES;
            }
        }
        this.observers.forEach((observer: MapStateObserver): void => {
            observer.update_state(updatedChanges, marker_id);
        });
    }

    public recompute_lines(): boolean {
        let changed = false;
        this._lines.forEach((line: Line): void => {
            const marker1 = this.get_marker(line.marker1);
            const marker2 = this.get_marker(line.marker2);
            let length: Distance | null = null;
            let bearing: number | null = null;
            if (marker1 !== null && marker2 !== null) {
                const db = marker1.coordinates.distance_bearing(marker2.coordinates);
                if (line.length === null) {
                    changed = true;
                    length = new Distance(db.distance, DistanceFormat.m);
                } else if (db.distance !== line.length.m()) {
                    changed = true;
                    length = new Distance(db.distance, DistanceFormat.m);
                } else {
                    length = line.length;
                }
                if (db.distance < 1) {
                    if (line.bearing !== null) {
                        changed = true;
                    }
                } else if (db.bearing !== line.bearing) {
                    changed = true;
                    bearing = db.bearing;
                } else {
                    bearing = line.bearing;
                }
            } else if (line.length !== null || line.bearing !== null) {
                changed = true;
            }

            if (marker1 === null && line.marker1 >= 0) {
                changed = true;
                line.update({marker1: -1});
            }
            if (marker2 === null && line.marker2 >= 0) {
                changed = true;
                line.update({marker2: -1});
            }
            line.update_measurements(length, bearing);
        });

        return changed;
    }

    public set_language(language: string): void {
        if (language.toLowerCase().startsWith("de")) {
            this.language = "de";
        } else if (language.toLowerCase().startsWith("fr")) {
            this.language = "fr";
        } else {
            this.language = "en";
        }
        if (language !== this.language) {
            console.log(`Normalizing language settings: "${language}" => "${this.language}"`);
        }
        this.storage.set("language", this.language);
        this.update_observers(MapStateChange.LANGUAGE);
    }

    public set_sidebar_open(section: string | null): void {
        this.sidebar_open = section;
        this.storage.set("sidebar_open", section);
        this.update_observers(MapStateChange.SIDEBAR);
    }

    public set_map_type(map_type: MapType | null): void {
        this.map_type = map_type;
        this.storage.set("map_type", maptype2string(this.map_type));
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_german_npa(enabled: boolean): void {
        this.german_npa = enabled;
        this.storage.set_bool("german_npa", this.german_npa);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_hillshading(enabled: boolean): void {
        this.hillshading = enabled;
        this.storage.set_bool("hillshading", this.hillshading);
        this.update_observers(MapStateChange.HILLSHADING);
    }

    public set_view(center: Coordinates, zoom: number): void {
        this.center = center;
        this.zoom = zoom;
        this.storage.set_coordinates("center", this.center);
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(MapStateChange.VIEW);
    }

    public set_zoom(zoom: number): void {
        this.zoom = zoom;
        this.storage.set_int("zoom", this.zoom);
        this.update_observers(MapStateChange.ZOOM);
    }

    public set_center(coordinates: Coordinates): void {
        this.center = coordinates;
        this.storage.set_coordinates("center", this.center);
        this.update_observers(MapStateChange.CENTER);
    }

    public add_marker(
        coordinates: Coordinates | null,
        attributes: MarkerAttributes = {},
    ): MarkerView {
        return this.add_markers([
            {coordinates: coordinates === null ? this.center! : coordinates, attributes},
        ])[0];
    }

    public add_markers(
        entries: readonly {coordinates: Coordinates; attributes?: MarkerAttributes}[],
    ): MarkerView[] {
        const added: Marker[] = entries.map(
            (entry: {coordinates: Coordinates; attributes?: MarkerAttributes}): Marker => {
                const marker = new Marker(entry.coordinates);
                marker.update({
                    color:
                        entry.attributes?.color ??
                        (!this.settings_marker_random_color
                            ? this.settings_marker_color
                            : undefined),
                    radius: entry.attributes?.radius ?? this.settings_marker_radius,
                    name: entry.attributes?.name,
                });

                this._markers.push(marker);
                this._markers_hash.set(marker.get_id(), marker);
                this.update_marker_storage(marker);

                return marker;
            },
        );
        if (added.length === 0) {
            return added;
        }

        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
        added.forEach((): void => {
            this.app.message(this.app.translate("messages.marker_created"));
        });

        return added;
    }

    public get_marker(id: number): MarkerView | null {
        const marker = this._markers_hash.get(id);
        if (marker === undefined) {
            return null;
        }

        return marker;
    }

    public delete_marker(id: number): void {
        this._markers = this._markers.filter(
            (marker: Marker, _index: number, _arr: Marker[]): boolean => marker.get_id() !== id,
        );
        this._markers_hash.delete(id);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS, id);
    }

    public delete_all_markers(): void {
        Marker.reset_ids();
        this._markers = [];
        this._markers_hash.clear();
        this.storage.set("markers", null);
        this.update_observers(MapStateChange.MARKERS);
    }

    public update_marker(
        id: number,
        attributes: MarkerAttributes & {coordinates?: Coordinates},
    ): void {
        const marker = this._markers_hash.get(id);
        if (marker === undefined) {
            console.log("bad marker id", id);

            return;
        }

        let changed = false;
        if (
            attributes.coordinates !== undefined &&
            !attributes.coordinates.equals(marker.coordinates)
        ) {
            marker.update({coordinates: attributes.coordinates});
            changed = true;
        }
        if (attributes.name !== undefined && attributes.name !== marker.name) {
            marker.update({name: attributes.name});
            changed = true;
        }
        if (attributes.color !== undefined && !attributes.color.equals(marker.color)) {
            marker.update({color: attributes.color});
            changed = true;
        }
        if (attributes.radius !== undefined && attributes.radius !== marker.radius) {
            marker.update({radius: attributes.radius});
            changed = true;
        }
        if (changed) {
            this.update_marker_storage(marker);
            this.update_observers(MapStateChange.MARKERS, id);
        }
    }

    public set_marker_coordinates(id: number, coordinates: Coordinates): void {
        this.update_marker(id, {coordinates});
    }

    public set_marker_name(id: number, name: string): void {
        this.update_marker(id, {name});
    }

    public set_marker_color(id: number, color: Color): void {
        this.update_marker(id, {color});
    }

    public set_marker_radius(id: number, radius: number): void {
        this.update_marker(id, {radius});
    }

    private update_marker_storage(marker: Marker): void {
        const id = marker.get_id();
        this.storage.set_coordinates(`marker[${id}].coordinates`, marker.coordinates);
        this.storage.set(`marker[${id}].name`, marker.name);
        this.storage.set_color(`marker[${id}].color`, marker.color);
        this.storage.set_float(`marker[${id}].radius`, marker.radius);
    }

    public get_marker_ids_string(): string {
        return this._markers.map((m: Marker): string => `${m.get_id()}`).join(";");
    }

    public sort_markers_by_name(): void {
        this._markers.sort((a: Marker, b: Marker): number => a.name.localeCompare(b.name));
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public sort_markers_by_distance(): void {
        if (this.center === null) {
            return;
        }

        const distances = new Map();
        this._markers.forEach((marker: Marker): void => {
            distances.set(marker.marker_id, marker.coordinates.distance(this.center!));
        });
        this._markers.sort(
            (a: Marker, b: Marker): number =>
                distances.get(a.marker_id) - distances.get(b.marker_id),
        );
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public reorder_markers(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this._markers.splice(new_index, 0, this._markers.splice(old_index, 1)[0]);
        this.storage.set("markers", this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public add_line(attributes: LineAttributes = {}): LineView {
        const line = new Line(attributes.marker1 ?? -1, attributes.marker2 ?? -1);
        line.update({
            color:
                attributes.color ??
                (!this.settings_line_random_color ? this.settings_line_color : undefined),
        });

        this._lines.push(line);
        this._lines_hash.set(line.get_id(), line);
        this.update_line_storage(line);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);

        this.app.message(this.app.translate("messages.line_created"));

        return line;
    }

    public get_line(id: number): LineView | null {
        const line = this._lines_hash.get(id);
        if (line === undefined) {
            return null;
        }

        return line;
    }

    public delete_line(id: number): void {
        this._lines = this._lines.filter(
            (line: Line, _index: number, _arr: Line[]): boolean => line.get_id() !== id,
        );
        this._lines_hash.delete(id);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);
    }

    public delete_all_lines(): void {
        Line.reset_ids();
        this._lines = [];
        this._lines_hash.clear();
        this.storage.set("lines", null);
        this.update_observers(MapStateChange.LINES);
    }

    public update_line(id: number, attributes: LineAttributes): void {
        const line = this._lines_hash.get(id);
        if (line === undefined) {
            console.log("bad line id", id);

            return;
        }

        let changed = false;
        const updates: LineAttributes = {};
        if (attributes.marker1 !== undefined && line.marker1 !== attributes.marker1) {
            updates.marker1 = attributes.marker1;
            changed = true;
        }
        if (attributes.marker2 !== undefined && line.marker2 !== attributes.marker2) {
            updates.marker2 = attributes.marker2;
            changed = true;
        }
        if (attributes.color !== undefined && !attributes.color.equals(line.color)) {
            updates.color = attributes.color;
            changed = true;
        }
        if (changed) {
            line.update(updates);
            this.update_line_storage(line);
            this.update_observers(MapStateChange.LINES);
        }
    }

    public set_line_marker1(id: number, marker_id: number): void {
        this.update_line(id, {marker1: marker_id});
    }

    public set_line_marker2(id: number, marker_id: number): void {
        this.update_line(id, {marker2: marker_id});
    }

    public set_line_color(id: number, color: Color): void {
        this.update_line(id, {color});
    }

    private update_line_storage(line: Line): void {
        const id = line.get_id();
        this.storage.set_int(`line[${id}].marker1`, line.marker1);
        this.storage.set_int(`line[${id}].marker2`, line.marker2);
        this.storage.set_color(`line[${id}].color`, line.color);
    }

    public get_line_ids_string(): string {
        return this._lines.map((line: Line): string => String(line.get_id())).join(";");
    }

    public reorder_lines(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this._lines.splice(new_index, 0, this._lines.splice(old_index, 1)[0]);
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);
    }

    public show_line(line: LineView): void {
        const marker1 = this.get_marker(line.marker1);
        const marker2 = this.get_marker(line.marker2);

        if (marker1 !== null) {
            if (marker2 !== null && line.marker1 !== line.marker2) {
                const distance_bearing = marker1.coordinates.distance_bearing(marker2.coordinates);
                const center = marker1.coordinates.project(
                    distance_bearing.bearing,
                    distance_bearing.distance * 0.5,
                );
                this.set_center(center);
            } else {
                this.set_center(marker1.coordinates);
            }
        } else if (marker2 !== null) {
            this.set_center(marker2.coordinates);
        } else {
            // Nothing
        }
    }

    public set_default_marker_settings(settings: IMarkerSettingsDict): void {
        this.settings_marker_coordinates_format = settings.coordinates_format;
        this.storage.set(
            "settings.marker.coordinates_format",
            this.settings_marker_coordinates_format,
        );

        this.settings_marker_random_color = settings.random_color;
        this.storage.set_bool("settings.marker.random_color", this.settings_marker_random_color);

        this.settings_marker_color = settings.color;
        this.storage.set_color("settings.marker.color", this.settings_marker_color);

        this.settings_marker_radius = settings.radius;
        this.storage.set_float("settings.marker.radius", this.settings_marker_radius);

        this.settings_marker_filled = settings.filled;
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);

        this.update_observers(MapStateChange.MARKERS);
    }

    public set_draggable_markers(value: boolean): void {
        this.settings_marker_draggable = value;
        this.storage.set_bool("settings.marker.draggable", this.settings_marker_draggable);
        this.update_observers(MapStateChange.MARKERS);
    }

    public draggable_markers(): boolean {
        return this.settings_marker_draggable;
    }

    public set_filled_markers(value: boolean): void {
        this.settings_marker_filled = value;
        this.storage.set_bool("settings.marker.filled", this.settings_marker_filled);
        this.update_observers(MapStateChange.MARKERS);
    }

    public filled_markers(): boolean {
        return this.settings_marker_filled;
    }

    public set_default_line_settings(settings: ILineSettingsDict): void {
        this.settings_line_distance_format = settings.distance_format;
        this.storage.set("settings.line.distance_format", this.settings_line_distance_format);

        this.settings_line_random_color = settings.random_color;
        this.storage.set_bool("settings.line.random_color", this.settings_line_random_color);

        this.settings_line_color = settings.color;
        this.storage.set_color("settings.line.color", this.settings_line_color);

        this.update_observers(MapStateChange.LINES);
    }

    public set_display_distance(d: boolean): void {
        this.settings_line_display_distance = d;
        this.storage.set_bool(
            "settings.line.display_distance",
            this.settings_line_display_distance,
        );

        this.update_observers(MapStateChange.LINES);
    }

    public to_gpx(): string {
        const data: string[] = [];
        data.push('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>');
        data.push(
            '<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns="http://www.topografix.com/GPX/1/1" creator="Flopp\'s Map - http://flopp.net/" xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd  http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www.garmin.com/xmlschemas/WaypointExtensionv1.xsd" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">',
        );
        data.push("    <metadata>");
        data.push("        <name>Export from Flopp's Map (flopp.net)</name>");
        data.push("    </metadata>");

        this._markers.forEach((marker: Marker): void => {
            data.push(marker.to_gpx());
        });

        this._lines.forEach((line: Line): void => {
            data.push(line.to_gpx(this));
        });

        data.push("</gpx>");

        return data.join("\n");
    }

    public from_gpx(data: string, clear: boolean): void {
        let xml: null | Document = null;
        try {
            const parser = new DOMParser();
            xml = parser.parseFromString(data, "text/xml");
        } catch (_e) {
            this.app.message_error(this.app.translate("sidebar.tools.import-gpx-bad-file"));

            return;
        }

        const markerIdMap = new Map<number, number>();
        markerIdMap.set(-1, -1);

        const markers: Marker[] = [];
        let badWaypoints = 0;
        const waypoints: Element[] = Array.from(xml.getElementsByTagName("wpt"));
        waypoints.forEach((waypoint: Element, index: number): void => {
            let name = "";
            let color: Color | null = null;
            let radius = 0;

            const nameEl = waypoint.getElementsByTagName("name");
            if (nameEl.length > 0) {
                name = nameEl[0].textContent;
            }
            name = name.trim();
            if (name.length === 0) {
                name = `GPX WAYPOINT ${index}`;
            }

            const descEl = waypoint.getElementsByTagName("desc");
            if (descEl.length > 0) {
                [...descEl[0].textContent.matchAll(/color="([^"]+)"/g)].forEach(
                    (match: string[]): void => {
                        const c = Color.from_string(match[1]);
                        if (c !== null) {
                            color = c;
                        }
                    },
                );
            }

            const radiusEl = waypoint.getElementsByTagName("wptx1:Proximity");
            if (radiusEl.length > 0) {
                const r = parse_float(radiusEl[0].textContent);
                if (r !== null && r >= 0) {
                    radius = r;
                }
            }

            const latS = waypoint.getAttribute("lat");
            if (latS === null) {
                badWaypoints += 1;

                return;
            }
            const lat = parse_float(latS);
            if (lat === null || lat < -90 || lat > 90) {
                badWaypoints += 1;

                return;
            }
            const lonS = waypoint.getAttribute("lon");
            if (lonS === null) {
                badWaypoints += 1;

                return;
            }
            const lon = parse_float(lonS);
            if (lon === null) {
                badWaypoints += 1;

                return;
            }

            const marker = new Marker(
                new Coordinates(lat, lon),
                clear ? markers.length : undefined,
            );
            const marker_attributes: MarkerAttributes = {
                name,
                radius,
            };
            if (color !== null) {
                marker_attributes.color = color;
            } else if (!this.settings_marker_random_color) {
                marker_attributes.color = this.settings_marker_color;
            }
            markerIdMap.set(markers.length, marker.marker_id);
            marker.update(marker_attributes);
            markers.push(marker);
        });

        const lines: Line[] = [];
        let badLines = 0;
        Array.from(xml.getElementsByTagName("trk")).forEach(
            (trk: Element, _index: number): void => {
                let name = "";
                const nameEl = trk.getElementsByTagName("name");
                if (nameEl.length > 0) {
                    name = nameEl[0].textContent;
                }
                const m = name.match(/^\s*LINE:(-1|\d+):(-1|\d+):([0-9a-f]{6})\s*$/i);
                if (m === null) {
                    badLines += 1;

                    return;
                }

                const m1 = parse_int(m[1]);
                const m2 = parse_int(m[2]);
                if (m1 === null || !markerIdMap.has(m1) || m2 === null || !markerIdMap.has(m2)) {
                    badLines += 1;

                    return;
                }

                const line = new Line(
                    markerIdMap.get(m1)!,
                    markerIdMap.get(m2)!,
                    clear ? lines.length : undefined,
                );
                line.update({color: Color.from_string(m[3])!});
                lines.push(line);
            },
        );
        this.app.message(
            this.app.translate(
                "sidebar.tools.import-gpx-markers",
                `${markers.length}`,
                `${lines.length}`,
                `${badWaypoints}`,
                `${badLines}`,
            ),
        );

        if (clear) {
            this.delete_all_lines();
            this.delete_all_markers();
        }

        markers.forEach((marker: Marker): void => {
            this._markers.push(marker);
            this._markers_hash.set(marker.get_id(), marker);
            this.update_marker_storage(marker);
        });
        if (clear) {
            Marker.reset_ids(markers.length);
        }
        this.storage.set("markers", this.get_marker_ids_string());

        lines.forEach((line: Line): void => {
            this._lines.push(line);
            this._lines_hash.set(line.get_id(), line);
            this.update_line_storage(line);
        });
        if (clear) {
            Line.reset_ids(lines.length);
        }
        this.storage.set("lines", this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES | MapStateChange.MARKERS);

        this.app.leaflet.fit_objects();
    }

    public to_json(): object {
        const data = {
            maptype: this.map_type,
            center: this.center!.to_string_D(),
            zoom: this.zoom,
            german_npa: this.german_npa,
            hillshading: this.hillshading,
            settings: {
                markers: {
                    coordinates_format: this.settings_marker_coordinates_format,
                    random_color: this.settings_marker_random_color,
                    color: this.settings_marker_color.to_hash_string(),
                    radius: this.settings_marker_radius,
                    draggable: this.settings_marker_draggable,
                    filled: this.settings_marker_filled,
                },
                lines: {
                    distance_format: this.settings_line_distance_format,
                    random_color: this.settings_line_random_color,
                    color: this.settings_line_color.to_hash_string(),
                    display_distance: this.settings_line_display_distance,
                },
            },
            markers: [] as IMarkerJson[],
            lines: [] as ILineJson[],
        };

        this._markers.forEach((marker: Marker): void => {
            data.markers.push(marker.to_json());
        });
        this._lines.forEach((line: Line): void => {
            data.lines.push(line.to_json());
        });

        return data;
    }

    public static parse_json(data: unknown): MapStateJsonImport | null {
        if (!is_record(data)) {
            return null;
        }

        const parsed: MapStateJsonImport = {};
        if (has_property(data, "maptype")) {
            if (typeof data.maptype !== "string") {
                return null;
            }
            const map_type = string2maptype(data.maptype);
            if (map_type === null) {
                return null;
            }
            parsed.map_type = map_type;
        }
        if (has_property(data, "zoom")) {
            const zoom = parse_json_integer(data.zoom);
            if (zoom === null) {
                return null;
            }
            parsed.zoom = zoom;
        }
        if (has_property(data, "center")) {
            if (typeof data.center !== "string") {
                return null;
            }
            const center = Coordinates.from_string(data.center);
            if (center === null) {
                return null;
            }
            parsed.center = center;
        }
        if (has_property(data, "german_npa")) {
            const german_npa = parse_json_boolean(data.german_npa);
            if (german_npa === null) {
                return null;
            }
            parsed.german_npa = german_npa;
        }
        if (has_property(data, "hillshading")) {
            const hillshading = parse_json_boolean(data.hillshading);
            if (hillshading === null) {
                return null;
            }
            parsed.hillshading = hillshading;
        }

        if (has_property(data, "settings")) {
            if (!is_record(data.settings)) {
                return null;
            }
            const settings: NonNullable<MapStateJsonImport["settings"]> = {};
            if (has_property(data.settings, "markers")) {
                if (!is_record(data.settings.markers)) {
                    return null;
                }
                const marker_settings: NonNullable<typeof settings.markers> = {};
                const raw = data.settings.markers;
                if (has_property(raw, "coordinates_format")) {
                    if (typeof raw.coordinates_format !== "string") {
                        return null;
                    }
                    const value = raw.coordinates_format.toUpperCase();
                    if (!Object.values(CoordinatesFormat).includes(value as CoordinatesFormat)) {
                        return null;
                    }
                    marker_settings.coordinates_format = value as CoordinatesFormat;
                }
                if (has_property(raw, "random_color")) {
                    const value = parse_json_boolean(raw.random_color);
                    if (value === null) {
                        return null;
                    }
                    marker_settings.random_color = value;
                }
                if (has_property(raw, "color")) {
                    const value = parse_json_color(raw.color);
                    if (value === null) {
                        return null;
                    }
                    marker_settings.color = value;
                }
                if (has_property(raw, "radius")) {
                    const value = parse_json_nonnegative_number(raw.radius);
                    if (value === null) {
                        return null;
                    }
                    marker_settings.radius = value;
                }
                if (has_property(raw, "draggable")) {
                    const value = parse_json_boolean(raw.draggable);
                    if (value === null) {
                        return null;
                    }
                    marker_settings.draggable = value;
                }
                if (has_property(raw, "filled")) {
                    const value = parse_json_boolean(raw.filled);
                    if (value === null) {
                        return null;
                    }
                    marker_settings.filled = value;
                }
                settings.markers = marker_settings;
            }
            if (has_property(data.settings, "lines")) {
                if (!is_record(data.settings.lines)) {
                    return null;
                }
                const line_settings: NonNullable<typeof settings.lines> = {};
                const raw = data.settings.lines;
                if (has_property(raw, "distance_format")) {
                    if (typeof raw.distance_format !== "string") {
                        return null;
                    }
                    const value = raw.distance_format.toLowerCase();
                    if (!Object.values(DistanceFormat).includes(value as DistanceFormat)) {
                        return null;
                    }
                    line_settings.distance_format = value as DistanceFormat;
                }
                if (has_property(raw, "random_color")) {
                    const value = parse_json_boolean(raw.random_color);
                    if (value === null) {
                        return null;
                    }
                    line_settings.random_color = value;
                }
                if (has_property(raw, "color")) {
                    const value = parse_json_color(raw.color);
                    if (value === null) {
                        return null;
                    }
                    line_settings.color = value;
                }
                if (has_property(raw, "display_distance")) {
                    const value = parse_json_boolean(raw.display_distance);
                    if (value === null) {
                        return null;
                    }
                    line_settings.display_distance = value;
                }
                settings.lines = line_settings;
            }
            parsed.settings = settings;
        }

        if (has_property(data, "markers")) {
            if (!Array.isArray(data.markers)) {
                return null;
            }
            const markers: MapStateJsonMarker[] = [];
            const imported_ids = new Set<number>();
            for (const raw_marker of data.markers) {
                if (!is_record(raw_marker) || !has_property(raw_marker, "coordinates")) {
                    return null;
                }
                if (typeof raw_marker.coordinates !== "string") {
                    return null;
                }
                const coordinates = Coordinates.from_string(raw_marker.coordinates);
                if (coordinates === null) {
                    return null;
                }
                const marker: MapStateJsonMarker = {coordinates};
                if (has_property(raw_marker, "marker_id")) {
                    const id = parse_json_integer(raw_marker.marker_id);
                    if (id === null || imported_ids.has(id)) {
                        return null;
                    }
                    marker.id = id;
                    imported_ids.add(id);
                }
                if (has_property(raw_marker, "name")) {
                    if (typeof raw_marker.name !== "string") {
                        return null;
                    }
                    marker.name = raw_marker.name;
                }
                if (has_property(raw_marker, "color")) {
                    const color = parse_json_color(raw_marker.color);
                    if (color === null) {
                        return null;
                    }
                    marker.color = color;
                }
                if (has_property(raw_marker, "radius")) {
                    const radius = parse_json_nonnegative_number(raw_marker.radius);
                    if (radius === null) {
                        return null;
                    }
                    marker.radius = radius;
                }
                markers.push(marker);
            }
            parsed.markers = markers;
        }

        if (has_property(data, "lines")) {
            if (!Array.isArray(data.lines)) {
                return null;
            }
            const lines: MapStateJsonLine[] = [];
            for (const raw_line of data.lines) {
                if (!is_record(raw_line)) {
                    return null;
                }
                const line: MapStateJsonLine = {};
                for (const endpoint of ["marker1", "marker2"] as const) {
                    if (has_property(raw_line, endpoint)) {
                        const id = parse_json_integer(raw_line[endpoint]);
                        if (id === null || id < -1) {
                            return null;
                        }
                        line[endpoint] = id;
                    }
                }
                if (has_property(raw_line, "color")) {
                    const color = parse_json_color(raw_line.color);
                    if (color === null) {
                        return null;
                    }
                    line.color = color;
                }
                lines.push(line);
            }
            parsed.lines = lines;
        }

        return parsed;
    }

    public apply_json(data: MapStateJsonImport): void {
        if (data.map_type !== undefined) {
            this.map_type = data.map_type;
        }
        if (data.zoom !== undefined) {
            this.zoom = data.zoom;
        }
        if (data.center !== undefined) {
            this.center = data.center;
        }
        if (data.german_npa !== undefined) {
            this.german_npa = data.german_npa;
        }
        if (data.hillshading !== undefined) {
            this.hillshading = data.hillshading;
        }

        if (data.settings?.markers !== undefined) {
            const settings = data.settings.markers;
            if (settings.coordinates_format !== undefined) {
                this.settings_marker_coordinates_format = settings.coordinates_format;
            }
            if (settings.random_color !== undefined) {
                this.settings_marker_random_color = settings.random_color;
            }
            if (settings.color !== undefined) {
                this.settings_marker_color = settings.color;
            }
            if (settings.radius !== undefined) {
                this.settings_marker_radius = settings.radius;
            }
            if (settings.draggable !== undefined) {
                this.settings_marker_draggable = settings.draggable;
            }
            if (settings.filled !== undefined) {
                this.settings_marker_filled = settings.filled;
            }
        }
        if (data.settings?.lines !== undefined) {
            const settings = data.settings.lines;
            if (settings.distance_format !== undefined) {
                this.settings_line_distance_format = settings.distance_format;
            }
            if (settings.random_color !== undefined) {
                this.settings_line_random_color = settings.random_color;
            }
            if (settings.color !== undefined) {
                this.settings_line_color = settings.color;
            }
            if (settings.display_distance !== undefined) {
                this.settings_line_display_distance = settings.display_distance;
            }
        }

        const marker_ids = new Map<number, number>();
        if (data.markers !== undefined) {
            const markers: Marker[] = [];
            Marker.reset_ids();
            data.markers.forEach((entry: MapStateJsonMarker): void => {
                const marker = new Marker(entry.coordinates);
                if (entry.id !== undefined) {
                    marker_ids.set(entry.id, marker.get_id());
                }
                marker.update({
                    name: entry.name,
                    color: entry.color,
                    radius: entry.radius,
                });
                markers.push(marker);
            });
            Marker.reset_ids(markers.length);
            this._markers = markers;
            this._markers_hash = new Map(
                markers.map((marker: Marker): [number, Marker] => [marker.get_id(), marker]),
            );
        }

        if (data.lines !== undefined) {
            const lines: Line[] = [];
            Line.reset_ids();
            data.lines.forEach((entry: MapStateJsonLine): void => {
                const marker1 =
                    entry.marker1 !== undefined && marker_ids.has(entry.marker1)
                        ? marker_ids.get(entry.marker1)!
                        : -1;
                const marker2 =
                    entry.marker2 !== undefined && marker_ids.has(entry.marker2)
                        ? marker_ids.get(entry.marker2)!
                        : -1;
                const line = new Line(marker1, marker2);
                line.update({color: entry.color});
                lines.push(line);
            });
            Line.reset_ids(lines.length);
            this._lines = lines;
            this._lines_hash = new Map(
                lines.map((line: Line): [number, Line] => [line.get_id(), line]),
            );
        }

        this.recompute_lines();
        this.store();
        this.update_observers(MapStateChange.EVERYTHING);
    }

    public from_json(data: unknown): boolean {
        const parsed = MapState.parse_json(data);
        if (parsed === null) {
            return false;
        }
        this.apply_json(parsed);

        return true;
    }
}
