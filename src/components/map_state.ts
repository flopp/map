import {App} from './app';
import {Color} from './color';
import {Coordinates, CoordinatesFormat, parseCoordinatesFormat} from './coordinates';
import {Distance, DistanceFormat, parseDistanceFormat} from './distance';
import {Line, LineJson} from './line';
import {MapStateObserver} from "./map_state_observer";
import {MapType, maptype2string, string2maptype} from './map_type';
import {Marker, MarkerJson} from './marker';
import {Storage} from './storage';
import {parse_float, parse_int} from './utilities';

export enum MapStateChange {
    NOTHING = 0,
    SIDEBAR = 1,
    MAPTYPE = 2,
    CENTER = 4,
    ZOOM = 8,
    VIEW = 12,
    MARKERS = 16,
    LINES = 32,
    API_KEYS = 64,
    LANGUAGE = 128,
    EVERYTHING = 255,
};

interface MarkerSettingsDict {
    coordinates_format: CoordinatesFormat, random_color: boolean, color: Color, radius: number
};
interface LineSettingsDict {distance_format: DistanceFormat, random_color: boolean, color: Color};
export class MapState {
    public app: App;
    public language: string = "";
    public sidebar_open: string|null = null;
    public google_api_key: string = "";
    public map_type: MapType|null = null;
    public zoom: number|null = null;
    public center: Coordinates|null = null;
    public hill_shading: boolean = false;
    public german_npa: boolean = false;
    public opencaching: boolean = false;
    public markers: Marker[] = [];
    public markers_hash: Map<number, Marker>;
    public lines: Line[] = [];
    public lines_hash: Map<number, Line>;
    public settings_marker_coordinates_format: CoordinatesFormat = CoordinatesFormat.DMS;
    public settings_marker_random_color: boolean;
    public settings_marker_color: Color = Color.default_color();
    public settings_marker_radius: number = 0;;
    public settings_line_distance_format: DistanceFormat = DistanceFormat.m;
    public settings_line_random_color: boolean = true;
    public settings_line_color: Color = Color.default_color();
    public observers: MapStateObserver[] = [];
    public storage: Storage;

    constructor(app: App) {
        this.app = app;
        this.markers_hash = new Map();
        this.lines_hash = new Map();
        this.storage = new Storage();
    }

    public store(): void {
        const self = this;

        this.storage.set('language', this.language);

        this.storage.set('google_api_key', this.google_api_key);

        this.storage.set('sidebar_open', this.sidebar_open);
        this.storage.set_coordinates('center', this.center);
        this.storage.set_int('zoom', this.zoom);
        this.storage.set('map_type', maptype2string(this.map_type));
        this.storage.set_bool('hillshading', this.hill_shading);
        this.storage.set_bool('german_npa', this.german_npa);
        this.storage.set_bool('opencaching', this.opencaching);
        this.storage.set('markers', this.get_marker_ids_string());
        this.markers.forEach((marker: Marker): void => {
            self.update_marker_storage(marker);
        });
        this.storage.set('lines', this.get_line_ids_string());
        this.lines.forEach((line: Line): void => {
            self.update_line_storage(line);
        });

        this.storage.set(
            'settings.marker.coordinates_format',
            this.settings_marker_coordinates_format,
        );
        this.storage.set_bool(
            'settings.marker.random_color',
            this.settings_marker_random_color,
        );
        this.storage.set_color(
            'settings.marker.color',
            this.settings_marker_color,
        );
        this.storage.set_float(
            'settings.marker.radius',
            this.settings_marker_radius,
        );

        this.storage.set(
            'settings.line.distance_format',
            this.settings_line_distance_format,
        );
        this.storage.set_bool(
            'settings.line.random_color',
            this.settings_line_random_color,
        );
        this.storage.set_color('settings.line.color', this.settings_line_color);
    }

    public restore(): void {
        const self = this;

        // language
        this.set_language(this.storage.get('language', '')!);

        // api keys
        this.set_google_api_key(this.storage.get('google_api_key', '')!);

        // sidebar
        this.set_sidebar_open(this.storage.get('sidebar_open', null));

        // map view
        this.set_view(
            this.storage.get_coordinates('center', new Coordinates(48, 8))!,
            this.storage.get_int('zoom', 13),
        );
        this.set_map_type(
            string2maptype(
                this.storage.get(
                    'map_type',
                    maptype2string(MapType.STAMEN_TERRAIN)!,
                )!,
            )!,
        );
        this.set_hill_shading(this.storage.get_bool('hillshading', false));
        this.set_german_npa(this.storage.get_bool('german_npa', false));
        this.set_opencaching(this.storage.get_bool('opencaching', false));

        // markers
        const marker_ids = new Map();
        this.storage
            .get('markers', '')!
            .split(';')
            .forEach((id: string): void => {
                if (id === '') {
                    return;
                }
                const coordinates = self.storage.get_coordinates(
                    `marker[${id}].coordinates`,
                    null,
                );
                const name = self.storage.get(`marker[${id}].name`, id)!;
                const color = self.storage.get_color(
                    `marker[${id}].color`,
                    new Color('FF0000'),
                )!;
                const radius = self.storage.get_float(`marker[${id}].radius`, 0)!;
                if (coordinates) {
                    const marker = new Marker(coordinates);
                    marker.name = name;
                    marker.color = color;
                    marker.radius = radius;
                    self.markers.push(marker);
                    self.markers_hash.set(marker.get_id(), marker);
                    marker_ids.set(parseInt(id, 10), marker.get_id());
                }
            });

        // lines
        this.storage
            .get('lines', '')!
            .split(';')
            .forEach((id: string): void => {
                if (id === '') {
                    return;
                }
                const old_marker1 = self.storage.get_int(
                    `line[${id}].marker1`,
                    -1,
                )!;
                const old_marker2 = self.storage.get_int(
                    `line[${id}].marker2`,
                    -1,
                )!;
                const color = self.storage.get_color(
                    `line[${id}].color`,
                    new Color('FF0000'),
                )!;

                let marker1 = -1;
                if (marker_ids.has(old_marker1)) {
                    marker1 = marker_ids.get(old_marker1);
                }

                let marker2 = -1;
                if (marker_ids.has(old_marker2)) {
                    marker2 = marker_ids.get(old_marker2);
                }

                const line = new Line(marker1, marker2);
                line.color = color;
                self.lines.push(line);
                self.lines_hash.set(line.get_id(), line);
            });

        this.recompute_lines();

        // settings
        const coordinates_format = parseCoordinatesFormat(this.storage.get(
            'settings.marker.coordinates_format',
            ''
        )!, this.settings_marker_coordinates_format);
        this.set_default_marker_settings({
            coordinates_format,
            random_color: this.storage.get_bool(
                'settings.marker.random_color',
                true,
            ),
            color: this.storage.get_color(
                'settings.marker.color',
                new Color('FF0000'),
            ),
            radius: this.storage.get_float('settings.marker.radius', 0)!,
        });


        const distance_format = parseDistanceFormat(this.storage.get(
            'settings.marker.distance_format',
            ''
        )!, this.settings_line_distance_format);
        this.set_default_line_settings({
            distance_format,
            random_color: this.storage.get_bool(
                'settings.line.random_color',
                true,
            ),
            color: this.storage.get_color(
                'settings.line.color',
                new Color('FF0000'),
            ),
        });
    }

    public clear_storage(): void {
        const self = this;

        const ok_keys = new Set();
        ok_keys.add('version');
        ok_keys.add('language');
        ok_keys.add('google_api_key');
        ok_keys.add('center');
        ok_keys.add('zoom');
        ok_keys.add('map_type');
        ok_keys.add('hillshading');
        ok_keys.add('german_npa');
        ok_keys.add('opencaching');
        ok_keys.add('sidebar_open');
        ok_keys.add('markers');
        this.markers.forEach((obj: Marker): void => {
            const id = obj.get_id();
            ok_keys.add(`marker[${id}].coordinates`);
            ok_keys.add(`marker[${id}].name`);
            ok_keys.add(`marker[${id}].color`);
            ok_keys.add(`marker[${id}].radius`);
        });
        ok_keys.add('lines');
        this.lines.forEach((obj: Line): void => {
            const id = obj.get_id();
            ok_keys.add(`line[${id}].marker1`);
            ok_keys.add(`line[${id}].marker2`);
            ok_keys.add(`line[${id}].color`);
        });
        ok_keys.add('settings.marker.coordinates_format');
        ok_keys.add('settings.marker.random_color');
        ok_keys.add('settings.marker.color');
        ok_keys.add('settings.marker.radius');
        ok_keys.add('settings.line.distance_format');
        ok_keys.add('settings.line.random_color');
        ok_keys.add('settings.line.color');

        const bad_keys = this.storage.all_keys().filter((key: string): boolean => {
            return !ok_keys.has(key);
        });
        bad_keys.forEach((key: string): void => {
            console.log('bad key: ', key);
            self.storage.remove(key);
        });
    }

    public restore_from_url(): void {
        const self = this;

        const params = new Map();
        window.location.search
            .substr(1)
            .split('&')
            .forEach((token: string): void => {
                const tokens = token.split('=', 2);
                if (tokens[0].length > 0) {
                    if (tokens.length === 1) {
                        params.set(tokens[0], '');
                    } else {
                        params.set(tokens[0], tokens[1]);
                    }
                }
            });

        let center = null;
        let zoom = null;
        let map_type = null;
        interface MarkerDict {name: string, coordinates: Coordinates, color: Color, radius: number};
        const markers: MarkerDict[] = [];
        const marker_hash = new Map();
        interface LineDict {from: number, to: number, color: Color};
        const lines: LineDict[] = [];

        params.forEach((value: string, key: string): void => {
            switch (key) {
                case 'c':
                    center = Coordinates.from_string(value);
                    break;
                case 'z':
                    zoom = parse_int(value);
                    break;
                case 't':
                    map_type = string2maptype(value);
                    if (map_type === null) {
                        switch (value) {
                            case 'OSM':
                            case 'OSM/DE':
                                map_type = MapType.OPENSTREETMAP;
                                break;
                            case 'TOPO':
                                map_type = MapType.OPENTOPOMAP;
                                break;
                            case 'roadmap':
                                map_type = MapType.GOOGLE_ROADMAP;
                                break;
                            case 'terrain':
                                map_type = MapType.GOOGLE_TERRAIN;
                                break;
                            case 'satellite':
                                map_type = MapType.GOOGLE_SATELLITE;
                                break;
                            case 'hybrid':
                                map_type = MapType.GOOGLE_HYBRID;
                                break;
                        }
                    }
                    break;
                case 'm':
                    value.split('*').forEach((token: string): void => {
                        // A:47.984967:7.908317:1000:markerA:ff0000
                        const tokens = token.split(':');
                        if (tokens.length < 3 || tokens.length > 6) {
                            return;
                        }
                        const id = tokens[0];
                        const lat: number|null = parse_float(tokens[1]);
                        const lon: number|null = parse_float(tokens[2]);
                        let radius: number|null = 0;
                        if (tokens.length > 3) {
                            radius = parse_float(tokens[3]);
                        }
                        let name = id;
                        if (tokens.length > 4) {
                            name = self.decode(tokens[4]);
                        }
                        let color: Color|null = Color.random_from_palette();
                        if (tokens.length > 5) {
                            color = Color.from_string(tokens[5]);
                        }

                        if (
                            id.length > 0 &&
                            lat !== null &&
                            lon !== null &&
                            radius !== null &&
                            name !== null &&
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
                case 'd':
                    value.split('*').forEach((token: string): void => {
                        // from:to:color
                        const tokens = token.split(':');
                        if (tokens.length < 2 || tokens.length > 3) {
                            return;
                        }

                        let from = null;
                        if (tokens[0].length === 0) {
                            from = -1;
                        } else if (marker_hash.has(tokens[0])) {
                            from = marker_hash.get(tokens[0]);
                        }
                        let to = null;
                        if (tokens[1].length === 0) {
                            to = -1;
                        } else if (marker_hash.has(tokens[1])) {
                            to = marker_hash.get(tokens[1]);
                        }
                        let color = Color.from_string('#ff0000');
                        if (tokens.length > 2) {
                            color = Color.from_string(tokens[2]);
                        }

                        if (from !== null && to !== null && color !== null) {
                            lines.push({from, to, color});
                        }
                    });
                    break;
                default:
                    console.log(
                        `ignoring unsupported url parameter: ${key}=${value}`,
                    );
            }
        });

        if (center === null && markers.length === 0) {
            return;
        }

        this.clear_storage();

        if (center === null) {
            let lat = 0;
            let lon = 0;
            markers.forEach((marker: Marker): void => {
                lat += marker.coordinates.lat();
                lon += marker.coordinates.lng();
            });
            center = new Coordinates(lat / markers.length, lon / markers.length);
        }
        this.storage.set_coordinates('center', center);

        if (zoom !== null) {
            this.storage.set_int('zoom', zoom);
        }

        if (map_type !== null) {
            this.storage.set('map_type', map_type);
        }

        const marker_ids = markers.map((_m: MarkerDict, i: number): number => {
            return i;
        });
        this.storage.set('markers', marker_ids.join(';'));
        markers.forEach((obj: MarkerDict, i: number): void => {
            self.storage.set(`marker[${i}].name`, obj.name);
            self.storage.set_coordinates(
                `marker[${i}].coordinates`,
                obj.coordinates,
            );
            self.storage.set_float(`marker[${i}].radius`, obj.radius);
            if (obj.color !== null) {
                self.storage.set_color(`marker[${i}].color`, obj.color);
            }
        });

        const line_ids = lines.map((_l: LineDict, i: number): number => {
            return i;
        });
        this.storage.set('lines', line_ids.join(';'));
        lines.forEach((obj: LineDict, i: number): void => {
            self.storage.set_int(`line[${i}].marker1`, obj.from);
            self.storage.set_int(`line[${i}].marker2`, obj.to);
            self.storage.set_color(`line[${i}].color`, obj.color);
        });
    }

    public create_link(): string {
        const self = this;

        const base = window.location.href.split('?')[0].split('#')[0];
        const markers = this.markers
            .map((m: Marker): string => {
                return `${m.get_id()}:${m.coordinates
                    .lat()
                    .toFixed(6)}:${m.coordinates
                    .lng()
                    .toFixed(6)}:${m.radius.toFixed(1)}:${self.encode(
                    m.name,
                )}:${m.color.to_string()}`;
            })
            .join('*');
        const lines = this.lines
            .map((obj: Line): string => {
                return `${obj.marker1}:${obj.marker2}:${obj.color.to_string()}`;
            })
            .join('*');

        return `${base}?c=${this.center!
            .lat()
            .toFixed(6)}:${this.center!.lng().toFixed(6)}&z=${this.zoom}&t=${
            this.map_type
        }&m=${markers}&d=${lines}`;
    }

    public decode(s: string): string {
        return decodeURIComponent(s);
    }

    public encode(s: string): string {
        return encodeURIComponent(s)
            .replace(new RegExp(/\*/, 'g'), '%2A')
            .replace(new RegExp(/:/, 'g'), '%3A');
    }

    public register_observer(observer: MapStateObserver): void {
        this.observers.push(observer);
    }

    public update_observers(changes: number): void {
        if (changes === MapStateChange.NOTHING) {
            console.error('MapSate.update_observers called with no changes');
        }
        let updatedChanges = changes;
        if (changes & (MapStateChange.MARKERS | MapStateChange.LINES)) {
            if (this.recompute_lines()) {
                updatedChanges = changes | MapStateChange.LINES;
            }
        }
        this.observers.forEach((observer: MapStateObserver): void => {
            observer.update_state(updatedChanges);
        });
    }

    public recompute_lines(): boolean {
        const self = this;
        let changed = false;
        this.lines.forEach((line: Line): void => {
            const marker1 = self.get_marker(line.marker1);
            const marker2 = self.get_marker(line.marker2);
            if (marker1 && marker2) {
                const db = marker1.coordinates.distance_bearing(
                    marker2.coordinates,
                );
                if (line.length === null) {
                    changed = true;
                    line.length = new Distance(db.distance, DistanceFormat.m);
                } else if (db.distance !== line.length.m()) {
                    changed = true;
                    line.length.set(db.distance, DistanceFormat.m);
                }
                if (db.distance < 1.0) {
                    if (line.bearing !== null) {
                        changed = true;
                        line.bearing = null;
                    }
                } else if (db.bearing !== line.bearing) {
                    changed = true;
                    line.bearing = db.bearing;
                }
            } else {
                if (line.length !== null) {
                    changed = true;
                    line.length = null;
                }
                if (line.bearing !== null) {
                    changed = true;
                    line.bearing = null;
                }
            }

            if (!marker1 && line.marker1 >= 0) {
                changed = true;
                line.marker1 = -1;
            }
            if (!marker2 && line.marker2 >= 0) {
                changed = true;
                line.marker2 = -1;
            }
        });

        return changed;
    }

    public set_language(language: string): void {
        this.language = language;
        this.storage.set('language', this.language);
        this.update_observers(MapStateChange.LANGUAGE);
    }

    public set_google_api_key(key: string): void {
        this.google_api_key = key;
        this.storage.set('google_api_key', this.google_api_key);
        this.update_observers(MapStateChange.API_KEYS);
    }

    public set_sidebar_open(section: string|null): void {
        this.sidebar_open = section;
        this.storage.set('sidebar_open', section);
        this.update_observers(MapStateChange.SIDEBAR);
    }

    public set_map_type(map_type: MapType|null): void {
        this.map_type = map_type;
        this.storage.set('map_type', maptype2string(this.map_type));
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_hill_shading(enabled: boolean): void {
        this.hill_shading = enabled;
        this.storage.set_bool('hillshading', this.hill_shading);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_german_npa(enabled: boolean): void {
        this.german_npa = enabled;
        this.storage.set_bool('german_npa', this.german_npa);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_opencaching(enabled: boolean): void {
        this.opencaching = enabled;
        this.storage.set_bool('opencaching', this.opencaching);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    public set_view(center: Coordinates, zoom: number): void {
        this.center = center;
        this.zoom = zoom;
        this.storage.set_coordinates('center', this.center);
        this.storage.set_int('zoom', this.zoom);
        this.update_observers(MapStateChange.VIEW);
    }

    public set_zoom(zoom: number): void {
        this.zoom = zoom;
        this.storage.set_int('zoom', this.zoom);
        this.update_observers(MapStateChange.ZOOM);
    }

    public set_center(coordinates: Coordinates): void {
        this.center = coordinates;
        this.storage.set_coordinates('center', this.center);
        this.update_observers(MapStateChange.CENTER);
    }

    public add_marker(coordinates: Coordinates|null): Marker {
        let marker = null;
        if (!coordinates) {
            marker = new Marker(this.center!);
        } else {
            marker = new Marker(coordinates);
        }
        if (!this.settings_marker_random_color) {
            marker.color = this.settings_marker_color;
        }
        marker.radius = this.settings_marker_radius;

        this.markers.push(marker);
        this.markers_hash.set(marker.get_id(), marker);
        this.update_marker_storage(marker);
        this.storage.set('markers', this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);

        this.app.message(this.app.translate('messages.marker_created'));

        return marker;
    }

    public get_marker(id: number): Marker|null {
        const marker = this.markers_hash.get(id);
        if (marker === undefined) {
            return null;
        }
        return marker;
    }

    public delete_marker(id: number): void {
        this.markers = this.markers.filter((marker: Marker, _index: number, _arr: Marker[]): boolean => {
            return marker.get_id() !== id;
        });
        this.markers_hash.delete(id);
        this.storage.set('markers', this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    public delete_all_markers(): void {
        Marker.reset_ids();
        this.markers = [];
        this.markers_hash.clear();
        this.storage.set('markers', null);
        this.update_observers(MapStateChange.MARKERS);
    }

    public set_marker_coordinates(id: number, coordinates: Coordinates): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);
            return;
        }
        this.markers_hash.get(id)!.coordinates = coordinates;
        this.storage.set_coordinates(`marker[${id}].coordinates`, coordinates);
        this.update_observers(MapStateChange.MARKERS);
    }

    public set_marker_name(id: number, name: string): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);
            return;
        }
        this.markers_hash.get(id)!.name = name;
        this.storage.set(`marker[${id}].name`, name);
        this.update_observers(MapStateChange.MARKERS);
    }

    public set_marker_color(id: number, color: Color): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);
            return;
        }
        this.markers_hash.get(id)!.color = color;
        this.storage.set_color(`marker[${id}].color`, color);
        this.update_observers(MapStateChange.MARKERS);
    }

    public set_marker_radius(id: number, radius: number): void {
        if (!this.markers_hash.has(id)) {
            console.log("bad marker id", id);
            return;
        }
        this.markers_hash.get(id)!.radius = radius;
        this.storage.set_float(`marker[${id}].radius`, radius);
        this.update_observers(MapStateChange.MARKERS);
    }

    public update_marker_storage(marker: Marker): void {
        const id = marker.get_id();
        this.storage.set_coordinates(
            `marker[${id}].coordinates`,
            marker.coordinates,
        );
        this.storage.set(`marker[${id}].name`, marker.name);
        this.storage.set_color(`marker[${id}].color`, marker.color);
        this.storage.set_float(`marker[${id}].radius`, marker.radius);
    }

    public get_marker_ids_string(): string {
        return this.markers.map((m: Marker): string => `${m.get_id()}`).join(';');
    }

    public reorder_markers(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this.markers.splice(new_index, 0, this.markers.splice(old_index, 1)[0]);
        this.storage.set('markers', this.get_marker_ids_string());
    }

    public add_line(): Line {
        const line = new Line(-1, -1);
        if (!this.settings_line_random_color) {
            line.color = this.settings_line_color;
        }

        this.lines.push(line);
        this.lines_hash.set(line.get_id(), line);
        this.update_line_storage(line);
        this.storage.set('lines', this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);

        this.app.message(this.app.translate('messages.line_created'));

        return line;
    }

    public get_line(id: number): Line|null {
        const line = this.lines_hash.get(id);
        if (line === undefined) {
            return null;
        }
        return line;
    }

    public delete_line(id: number): void {
        this.lines = this.lines.filter((line: Line, _index: number, _arr: any): boolean => {
            return line.get_id() !== id;
        });
        this.lines_hash.delete(id);
        this.storage.set('lines', this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);
    }

    public delete_all_lines(): void {
        Line.reset_ids();
        this.lines = [];
        this.lines_hash.clear();
        this.storage.set('lines', null);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_marker1(id: number, marker_id: number): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);
            return;
        }
        this.lines_hash.get(id)!.marker1 = marker_id;
        this.storage.set_int(`line[${id}].marker1`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_marker2(id: number, marker_id: number): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);
            return;
        }
        this.lines_hash.get(id)!.marker2 = marker_id;
        this.storage.set_int(`line[${id}].marker2`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }

    public set_line_color(id: number, color: Color): void {
        if (!this.lines_hash.has(id)) {
            console.log("bad line id", id);
            return;
        }
        this.lines_hash.get(id)!.color = color;
        this.storage.set_color(`line[${id}].color`, color);
        this.update_observers(MapStateChange.LINES);
    }

    public update_line_storage(line: Line): void {
        const id = line.get_id();
        this.storage.set_int(`line[${id}].marker1`, line.marker1);
        this.storage.set_int(`line[${id}].marker2`, line.marker2);
        this.storage.set_color(`line[${id}].color`, line.color);
    }

    public get_line_ids_string(): string {
        return this.lines.map((line: Line): string => String(line.get_id())).join(';');
    }

    public reorder_lines(old_index: number, new_index: number): void {
        if (old_index === new_index) {
            return;
        }

        this.lines.splice(new_index, 0, this.lines.splice(old_index, 1)[0]);
        this.storage.set('lines', this.get_line_ids_string());
    }

    public show_line(line: Line): void {
        const marker1 = this.get_marker(line.marker1);
        const marker2 = this.get_marker(line.marker2);

        if (marker1) {
            if (marker2 && marker1 !== marker2) {
                const distance_bearing = marker1.coordinates.distance_bearing(
                    marker2.coordinates,
                );
                const center = marker1.coordinates.project(
                    distance_bearing.bearing,
                    distance_bearing.distance * 0.5,
                );
                this.set_center(center);
            } else {
                this.set_center(marker1.coordinates);
            }
        } else if (marker2) {
            this.set_center(marker2.coordinates);
        } else {
            // nothing
        }
    }

    public set_default_marker_settings(settings: MarkerSettingsDict): void {
        this.settings_marker_coordinates_format = settings.coordinates_format;
        this.storage.set(
            'settings.marker.coordinates_format',
            this.settings_marker_coordinates_format,
        );

        this.settings_marker_random_color = settings.random_color;
        this.storage.set_bool(
            'settings.marker.random_color',
            this.settings_marker_random_color,
        );

        this.settings_marker_color = settings.color;
        this.storage.set_color(
            'settings.marker.color',
            this.settings_marker_color,
        );

        this.settings_marker_radius = settings.radius;
        this.storage.set_float(
            'settings.marker.radius',
            this.settings_marker_radius,
        );

        this.update_observers(MapStateChange.MARKERS);
    }

    public set_default_line_settings(settings: LineSettingsDict): void {
        this.settings_line_distance_format = settings.distance_format;
        this.storage.set(
            'settings.line.distance_format',
            this.settings_line_distance_format,
        );

        this.settings_line_random_color = settings.random_color;
        this.storage.set_bool(
            'settings.line.random_color',
            this.settings_line_random_color,
        );

        this.settings_line_color = settings.color;
        this.storage.set_color('settings.line.color', this.settings_line_color);

        this.update_observers(MapStateChange.LINES);
    }

    public to_json(): object {
        const data = {
            maptype: this.map_type,
            center: this.center!.to_string_D(),
            zoom: this.zoom,
            hill_shading: this.hill_shading,
            german_npa: this.german_npa,
            opencaching: this.opencaching,
            settings: {
                markers: {
                    coordinates_format: this.settings_marker_coordinates_format,
                    random_color: this.settings_marker_random_color,
                    color: this.settings_marker_color.to_hash_string(),
                    radius: this.settings_marker_radius,
                },
                lines: {
                    distance_format: this.settings_line_distance_format,
                    random_color: this.settings_line_random_color,
                    color: this.settings_line_color.to_hash_string(),
                },
            },
            markers: ([] as MarkerJson[]),
            lines: ([] as LineJson[]),
        };

        this.markers.forEach((marker: Marker): void => {
            data.markers.push(marker.to_json());
        });
        this.lines.forEach((line: Line): void => {
            data.lines.push(line.to_json());
        });
        return data;
    }

    public from_json(data: any): void {
        const self = this;

        if ('maptype' in data) {
            const map_type = string2maptype(data.maptype);
            if (map_type) {
                this.map_type = map_type;
            }
        }
        if ('zoom' in data) {
            const zoom = parseInt(data.zoom, 10);
            if (zoom !== null) {
                this.zoom = zoom;
            }
        }
        if ('center' in data) {
            const center = Coordinates.from_string(data.center);
            if (center !== null) {
                this.center = center;
            }
        }

        if ('hill_shading' in data) {
            this.hill_shading = data.hill_shading;
        }

        if ('german_npa' in data) {
            this.german_npa = data.german_npa;
        }

        if ('opencaching' in data) {
            this.opencaching = data.opencaching;
        }

        if ('settings' in data) {
            if ('markers' in data.settings) {
                if ('coordinates_format' in data.settings.markers) {
                    this.settings_marker_coordinates_format = parseCoordinatesFormat(
                        data.settings.markers.coordinates_format,
                        this.settings_marker_coordinates_format
                    );
                }
                if ('random_color' in data.settings.markers) {
                    this.settings_marker_random_color =
                        data.settings.markers.random_color;
                }
                if ('color' in data.settings.markers) {
                    const color = Color.from_string(data.settings.markers.color);
                    if (color) {
                        this.settings_marker_color = color;
                    }
                }
                if ('radius' in data.settings.markers) {
                    const radius = parse_float(data.settings.markers.radius);
                    if (radius !== null) {
                        this.settings_marker_radius = radius;
                    }
                }
            }
            if ('lines' in data.settings) {
                if ('distance_format' in data.settings.lines) {
                    this.settings_line_distance_format =
                        parseDistanceFormat(
                            data.settings.lines.random_color,
                            this.settings_line_distance_format
                        );
                }
                if ('random_color' in data.settings.lines) {
                    this.settings_line_random_color =
                        data.settings.lines.random_color;
                }
                if ('color' in data.settings.lines) {
                    const color = Color.from_string(data.settings.lines.color);
                    if (color) {
                        this.settings_line_color = color;
                    }
                }
            }
        }

        const marker_ids = new Map();
        if ('markers' in data && Array.isArray(data.markers)) {
            this.markers = [];
            this.markers_hash.clear();
            Marker.reset_ids();
            data.markers.forEach((m: any): void => {
                let id = null;
                let coordinates = null;
                let name = null;
                let color = null;
                let radius = null;
                if ('marker_id' in m) {
                    id = parseInt(m.marker_id, 10);
                }
                if ('coordinates' in m) {
                    coordinates = Coordinates.from_string(m.coordinates);
                }
                if ('name' in m) {
                    name = String(m.name);
                }
                if ('color' in m) {
                    color = Color.from_string(m.color);
                }
                if ('radius' in m) {
                    radius = parseFloat(m.radius);
                }

                if (coordinates) {
                    const marker = new Marker(coordinates);
                    self.markers.push(marker);
                    self.markers_hash.set(marker.get_id(), marker);
                    marker_ids.set(id, marker.get_id());

                    if (name) {
                        marker.name = name;
                    }
                    if (color) {
                        marker.color = color;
                    }
                    if (radius !== null) {
                        marker.radius = radius;
                    }
                }
            });
        }

        if ('lines' in data && Array.isArray(data.lines)) {
            this.lines = [];
            this.lines_hash.clear();
            Line.reset_ids();
            data.lines.forEach((l: any): void => {
                let old_marker1 = -1;
                let old_marker2 = -1;
                let color = null;
                if ('marker1' in l) {
                    old_marker1 = parseInt(l.marker1, 10);
                }
                if ('marker2' in l) {
                    old_marker2 = parseInt(l.marker2, 10);
                }
                if ('color' in l) {
                    color = Color.from_string(l.color);
                }

                let marker1 = -1;
                if (marker_ids.has(old_marker1)) {
                    marker1 = marker_ids.get(old_marker1);
                }

                let marker2 = -1;
                if (marker_ids.has(old_marker2)) {
                    marker2 = marker_ids.get(old_marker2);
                }

                const line = new Line(marker1, marker2);
                if (color) {
                    line.color = color;
                }

                self.lines.push(line);
                self.lines_hash.set(line.get_id(), line);
            });
        }

        this.store();
        this.update_observers(MapStateChange.EVERYTHING);
    }
}
