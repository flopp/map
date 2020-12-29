import {Color} from './color.js';
import {Coordinates, CoordinatesFormat} from './coordinates.js';
import {Line} from './line.js';
import {Marker} from './marker.js';
import {Storage} from './storage.js';
import {MapType, maptype2string, string2maptype} from './map_type.js';
import {parse_float, parse_int} from './utilities.js';

export const MapStateChange = {
    NOTHING: 0,
    SIDEBAR: 1,
    MAPTYPE: 2,
    CENTER: 4,
    ZOOM: 8,
    VIEW: 12,
    MARKERS: 16,
    LINES: 32,
    API_KEYS: 64,
    LANGUAGE: 128,
    EVERYTHING: 255,
};

export class MapState {
    constructor(app) {
        this.app = app;

        this.language = '';

        this.sidebar_open = null;

        this.google_api_key = '';
        this.bing_api_key = '';

        this.map_type = null;
        this.zoom = null;
        this.center = null;
        this.hillshading = false;

        this.markers = [];
        this.markers_hash = new Map();

        this.lines = [];
        this.lines_hash = new Map();

        this.settings_marker_coordinates_format = null;
        this.settings_marker_random_color = null;
        this.settings_marker_color = null;
        this.settings_marker_radius = null;

        this.settings_line_random_color = null;
        this.settings_line_color = null;

        this.observers = [];

        this.storage = new Storage();
    }

    store() {
        const self = this;

        this.storage.set('language', this.language);

        this.storage.set('google_api_key', this.google_api_key);
        this.storage.set('bing_api_key', this.bing_api_key);

        this.storage.set('sidebar_open', this.sidebar_open);
        this.storage.set_coordinates('center', this.center);
        this.storage.set_int('zoom', this.zoom);
        this.storage.set('map_type', maptype2string(this.map_type));
        this.storage.set_bool('hillshading', this.hillshading);
        this.storage.set('markers', this.get_marker_ids_string());
        this.markers.forEach((marker) => {
            self.update_marker_storage(marker);
        });
        this.storage.set('lines', this.get_line_ids_string());
        this.lines.forEach((line) => {
            self.update_line_storage(line);
        });

        this.storage.set_int(
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

        this.storage.set_bool(
            'settings.line.random_color',
            this.settings_line_random_color,
        );
        this.storage.set_color('settings.line.color', this.settings_line_color);
    }

    restore() {
        const self = this;

        // language
        this.set_language(this.storage.get('language', ''));

        // api keys
        this.set_google_api_key(this.storage.get('google_api_key', ''));
        this.set_bing_api_key(this.storage.get('bing_api_key', ''));

        // sidebar
        this.set_sidebar_open(this.storage.get('sidebar_open', null));

        // map view
        this.set_view(
            this.storage.get_coordinates('center', new Coordinates(48, 8)),
            this.storage.get_int('zoom', 13),
        );
        this.set_map_type(
            string2maptype(
                this.storage.get(
                    'map_type',
                    maptype2string(MapType.STAMEN_TERRAIN),
                ),
            ),
        );
        this.set_hillshading(this.storage.get_bool('hillshading', false));
        this.set_german_npa(this.storage.get_bool('german_npa', false));

        // markers
        const marker_ids = new Map();
        this.storage
            .get('markers', '')
            .split(';')
            .forEach((id) => {
                if (id === '') {
                    return;
                }
                const coordinates = self.storage.get_coordinates(
                    `marker[${id}].coordinates`,
                    null,
                );
                const name = self.storage.get(`marker[${id}].name`, id);
                const color = self.storage.get_color(
                    `marker[${id}].color`,
                    new Color('FF0000'),
                );
                const radius = self.storage.get_float(`marker[${id}].radius`, 0);
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
            .get('lines', '')
            .split(';')
            .forEach((id) => {
                if (id === '') {
                    return;
                }
                const old_marker1 = self.storage.get_int(
                    `line[${id}].marker1`,
                    -1,
                );
                const old_marker2 = self.storage.get_int(
                    `line[${id}].marker2`,
                    -1,
                );
                const color = self.storage.get_color(
                    `line[${id}].color`,
                    new Color('FF0000'),
                );

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
        this.set_default_marker_settings({
            coordinates_format: this.storage.get_int(
                'settings.marker.coordinates_format',
                1,
            ),
            random_color: this.storage.get_bool(
                'settings.marker.random_color',
                true,
            ),
            color: this.storage.get_color(
                'settings.marker.color',
                new Color('FF0000'),
            ),
            radius: this.storage.get_float('settings.marker.radius', 0),
        });

        this.set_default_line_settings({
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

    clear_storage() {
        const self = this;

        const ok_keys = new Set();
        ok_keys.add('version');
        ok_keys.add('language');
        ok_keys.add('google_api_key');
        ok_keys.add('bing_api_key');
        ok_keys.add('center');
        ok_keys.add('zoom');
        ok_keys.add('map_type');
        ok_keys.add('hillshading');
        ok_keys.add('sidebar_open');
        ok_keys.add('markers');
        this.markers.forEach((obj) => {
            const id = obj.get_id();
            ok_keys.add(`marker[${id}].coordinates`);
            ok_keys.add(`marker[${id}].name`);
            ok_keys.add(`marker[${id}].color`);
            ok_keys.add(`marker[${id}].radius`);
        });
        ok_keys.add('lines');
        this.lines.forEach((obj) => {
            const id = obj.get_id();
            ok_keys.add(`line[${id}].marker1`);
            ok_keys.add(`line[${id}].marker2`);
            ok_keys.add(`line[${id}].color`);
        });
        ok_keys.add('settings.marker.coordinates_format');
        ok_keys.add('settings.marker.random_color');
        ok_keys.add('settings.marker.color');
        ok_keys.add('settings.marker.radius');
        ok_keys.add('settings.line.random_color');
        ok_keys.add('settings.line.color');

        const bad_keys = this.storage.all_keys().filter((key) => {
            return !ok_keys.has(key);
        });
        bad_keys.forEach((key) => {
            console.log('bad key: ', key);
            self.storage.remove(key);
        });
    }

    restore_from_url() {
        const self = this;

        const params = new Map();
        window.location.search
            .substr(1)
            .split('&')
            .forEach((token) => {
                const tokens = token.split('=', 2);
                if (tokens[0].length > 0) {
                    if (tokens.length == 1) {
                        params.set(tokens[0], '');
                    } else {
                        params.set(tokens[0], tokens[1]);
                    }
                }
            });

        let center = null;
        let zoom = null;
        let map_type = null;
        const markers = [];
        const marker_hash = new Map();
        const lines = [];

        params.forEach((value, key) => {
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
                    value.split('*').forEach((token) => {
                        // A:47.984967:7.908317:1000:markerA:ff0000
                        const tokens = token.split(':');
                        if (tokens.length < 3 || tokens.length > 6) {
                            return;
                        }
                        const id = tokens[0];
                        const lat = parse_float(tokens[1]);
                        const lon = parse_float(tokens[2]);
                        let radius = 0;
                        if (tokens.length > 3) {
                            radius = parse_float(tokens[3]);
                        }
                        let name = id;
                        if (tokens.length > 4) {
                            name = self.decode(tokens[4]);
                        }
                        let color = Color.random_from_palette();
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
                                name: name,
                                coordinates: new Coordinates(lat, lon),
                                color: color,
                                radius: radius,
                            });
                        }
                    });
                    break;
                case 'd':
                    value.split('*').forEach((token) => {
                        // from:to:color
                        const tokens = token.split(':');
                        if (tokens.length < 2 || tokens.length > 3) {
                            return;
                        }

                        let from = null;
                        if (tokens[0].length == 0) {
                            from = -1;
                        } else if (marker_hash.has(tokens[0])) {
                            from = marker_hash.get(tokens[0]);
                        }
                        let to = null;
                        if (tokens[1].length == 0) {
                            to = -1;
                        } else if (marker_hash.has(tokens[1])) {
                            to = marker_hash.get(tokens[1]);
                        }
                        let color = Color.from_string('#ff0000');
                        if (tokens.length > 2) {
                            color = Color.from_string(tokens[2]);
                        }

                        if (from !== null && to !== null && color !== null) {
                            lines.push({from: from, to: to, color: color});
                        }
                    });
                    break;
                default:
                    console.log(
                        `ignoring unsupported url parameter: ${key}=${value}`,
                    );
            }
        });

        if (center === null && markers.length == 0) {
            return;
        }

        this.clear_storage();

        if (center === null) {
            let lat = 0;
            let lon = 0;
            markers.forEach((marker) => {
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

        const marker_ids = markers.map((_m, i) => {
            return i;
        });
        this.storage.set('markers', marker_ids.join(';'));
        markers.forEach((obj, i) => {
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

        const line_ids = lines.map((_l, i) => {
            return i;
        });
        this.storage.set('lines', line_ids.join(';'));
        lines.forEach((obj, i) => {
            self.storage.set(`line[${i}].marker1`, obj.from);
            self.storage.set(`line[${i}].marker2`, obj.to);
            self.storage.set_color(`line[${i}].color`, obj.color);
        });
    }

    create_link() {
        const self = this;

        const base = window.location.href.split('?')[0].split('#')[0];
        const markers = this.markers
            .map((m) => {
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
            .map((obj) => {
                return `${obj.marker1}:${obj.marker2}:${obj.color.to_string()}`;
            })
            .join('*');

        return `${base}?c=${this.center
            .lat()
            .toFixed(6)}:${this.center.lng().toFixed(6)}&z=${this.zoom}&t=${
            this.map_type
        }&m=${markers}&d=${lines}`;
    }

    decode(s) {
        return decodeURIComponent(s);
    }

    encode(s) {
        return encodeURIComponent(s)
            .replace(new RegExp(/\*/, 'g'), '%2A')
            .replace(new RegExp(/:/, 'g'), '%3A');
    }

    register_observer(observer) {
        this.observers.push(observer);
    }

    update_observers(changes) {
        if (changes === MapStateChange.NOTHING) {
            console.error('MapSate.update_observers called with no changes');
        }
        let updatedChanges = changes;
        if (changes & (MapStateChange.MARKERS | MapStateChange.LINES)) {
            if (this.recompute_lines()) {
                updatedChanges = changes | MapStateChange.LINES;
            }
        }
        this.observers.forEach((observer) => {
            observer.update_state(updatedChanges);
        });
    }

    recompute_lines() {
        const self = this;
        let changed = false;
        this.lines.forEach((line) => {
            const marker1 = self.get_marker(line.marker1);
            const marker2 = self.get_marker(line.marker2);
            if (marker1 && marker2) {
                const db = marker1.coordinates.distance_bearing(
                    marker2.coordinates,
                );
                if (db.distance != line.length) {
                    changed = true;
                    line.length = db.distance;
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

    set_language(language) {
        this.language = language;
        this.storage.set('language', this.language);
        this.update_observers(MapStateChange.LANGUAGE);
    }

    set_google_api_key(key) {
        this.google_api_key = key;
        this.storage.set('google_api_key', this.google_api_key);
        this.update_observers(MapStateChange.API_KEYS);
    }

    set_bing_api_key(key) {
        this.bing_api_key = key;
        this.storage.set('bing_api_key', this.bing_api_key);
        this.update_observers(MapStateChange.API_KEYS);
    }

    set_api_keys(google_api_key, bing_api_key) {
        this.google_api_key = google_api_key;
        this.storage.set('google_api_key', this.google_api_key);
        this.bing_api_key = bing_api_key;
        this.storage.set('bing_api_key', this.bing_api_key);
        this.update_observers(MapStateChange.API_KEYS);
    }

    set_sidebar_open(section) {
        this.sidebar_open = section;
        this.storage.set('sidebar_open', section);
        this.update_observers(MapStateChange.SIDEBAR);
    }

    set_map_type(map_type) {
        this.map_type = map_type;
        this.storage.set('map_type', maptype2string(this.map_type));
        this.update_observers(MapStateChange.MAPTYPE);
    }

    set_hillshading(enabled) {
        this.hillshading = enabled;
        this.storage.set_bool('hillshading', this.hillshading);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    set_german_npa(enabled) {
        this.german_npa = enabled;
        this.storage.set_bool('german_npa', this.german_npa);
        this.update_observers(MapStateChange.MAPTYPE);
    }

    set_view(center, zoom) {
        this.center = center;
        this.zoom = zoom;
        this.storage.set_coordinates('center', this.center);
        this.storage.set_int('zoom', this.zoom);
        this.update_observers(MapStateChange.VIEW);
    }

    set_zoom(zoom) {
        this.zoom = zoom;
        this.storage.set_int('zoom', this.zoom);
        this.update_observers(MapStateChange.ZOOM);
    }

    set_center(coordinates) {
        this.center = coordinates;
        this.storage.set_coordinates('center', this.center);
        this.update_observers(MapStateChange.CENTER);
    }

    add_marker(coordinates) {
        let marker = null;
        if (!coordinates) {
            marker = new Marker(this.center);
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

        this.app.message(this.app.translate('messages.marker_created'), 'info');

        return marker;
    }

    get_marker(id) {
        return this.markers_hash.get(id);
    }

    delete_marker(id) {
        this.markers = this.markers.filter((marker, _index, _arr) => {
            return marker.get_id() != id;
        });
        this.markers_hash.delete(id);
        this.storage.set('markers', this.get_marker_ids_string());
        this.update_observers(MapStateChange.MARKERS);
    }

    delete_all_markers() {
        Marker.reset_ids();
        this.markers = [];
        this.markers_hash.clear();
        this.storage.set('markers', null);
        this.update_observers(MapStateChange.MARKERS);
    }

    set_marker_coordinates(id, coordinates) {
        this.markers_hash.get(id).coordinates = coordinates;
        this.storage.set_coordinates(`marker[${id}].coordinates`, coordinates);
        this.update_observers(MapStateChange.MARKERS);
    }
    set_marker_name(id, name) {
        this.markers_hash.get(id).name = name;
        this.storage.set(`marker[${id}].name`, name);
        this.update_observers(MapStateChange.MARKERS);
    }
    set_marker_color(id, color) {
        this.markers_hash.get(id).color = color;
        this.storage.set_color(`marker[${id}].color`, color);
        this.update_observers(MapStateChange.MARKERS);
    }
    set_marker_radius(id, radius) {
        this.markers_hash.get(id).radius = radius;
        this.storage.set_float(`marker[${id}].radius`, radius);
        this.update_observers(MapStateChange.MARKERS);
    }
    update_marker_storage(marker) {
        const id = marker.get_id();
        this.storage.set_coordinates(
            `marker[${id}].coordinates`,
            marker.coordinates,
        );
        this.storage.set(`marker[${id}].name`, marker.name);
        this.storage.set_color(`marker[${id}].color`, marker.color);
        this.storage.set_float(`marker[${id}].radius`, marker.radius);
    }

    get_marker_ids_string() {
        return this.markers.map(m => m.get_id()).join(';');
    }

    reorder_markers(old_index, new_index) {
        if (old_index === new_index) {
            return;
        }

        this.markers.splice(new_index, 0, this.markers.splice(old_index, 1)[0]);
        this.storage.set('markers', this.get_marker_ids_string());
    }

    add_line() {
        const line = new Line(-1, -1);
        if (!this.settings_line_random_color) {
            line.color = this.settings_line_color;
        }

        this.lines.push(line);
        this.lines_hash.set(line.get_id(), line);
        this.update_line_storage(line);
        this.storage.set('lines', this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);

        this.app.message(this.app.translate('messages.line_created'), 'info');

        return line;
    }

    get_line(id) {
        return this.lines_hash.get(id);
    }

    delete_line(id) {
        this.lines = this.lines.filter((lines, _index, _arr) => {
            return lines.get_id() != id;
        });
        this.lines_hash.delete(id);
        this.storage.set('lines', this.get_line_ids_string());
        this.update_observers(MapStateChange.LINES);
    }

    delete_all_lines() {
        Line.reset_ids();
        this.lines = [];
        this.lines_hash.clear();
        this.storage.set('lines', null);
        this.update_observers(MapStateChange.LINES);
    }

    set_line_marker1(id, marker_id) {
        this.lines_hash.get(id).marker1 = marker_id;
        this.storage.set_int(`line[${id}].marker1`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }
    set_line_marker2(id, marker_id) {
        this.lines_hash.get(id).marker2 = marker_id;
        this.storage.set_int(`line[${id}].marker2`, marker_id);
        this.update_observers(MapStateChange.LINES);
    }
    set_line_color(id, color) {
        this.lines_hash.get(id).color = color;
        this.storage.set_color(`line[${id}].color`, color);
        this.update_observers(MapStateChange.LINES);
    }
    update_line_storage(line) {
        const id = line.get_id();
        this.storage.set_int(`line[${id}].marker1`, line.marker1);
        this.storage.set_int(`line[${id}].marker2`, line.marker2);
        this.storage.set_color(`line[${id}].color`, line.color);
    }

    get_line_ids_string() {
        return this.lines.map(line => line.get_id()).join(';');
    }

    reorder_lines(old_index, new_index) {
        if (old_index === new_index) {
            return;
        }

        this.lines.splice(new_index, 0, this.lines.splice(old_index, 1)[0]);
        this.storage.set('lines', this.get_line_ids_string());
    }

    show_line(line) {
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

    set_default_marker_settings(settings) {
        switch (settings.coordinates_format) {
            case CoordinatesFormat.D:
            case CoordinatesFormat.DM:
            case CoordinatesFormat.DMS:
                this.settings_marker_coordinates_format =
                    settings.coordinates_format;
                break;
            default:
                this.settings_marker_coordinates_format = CoordinatesFormat.DM;
        }
        this.storage.set_int(
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

    set_default_line_settings(settings) {
        this.settings_line_random_color = settings.random_color;
        this.storage.set_bool(
            'settings.line.random_color',
            this.settings_line_random_color,
        );

        this.settings_line_color = settings.color;
        this.storage.set_color('settings.line.color', this.settings_line_color);

        this.update_observers(MapStateChange.LINES);
    }

    to_json() {
        const data = {
            maptype: this.map_type,
            center: this.center.to_string_D(),
            zoom: this.zoom,
            settings: {
                markers: {
                    coordinates_format: this.settings_marker_coordinates_format,
                    random_color: this.settings_marker_random_color,
                    color: this.settings_marker_color.to_hash_string(),
                    radius: this.settings_marker_radius,
                },
                lines: {
                    random_color: this.settings_line_random_color,
                    color: this.settings_line_color.to_hash_string(),
                },
            },
            markers: [],
            lines: [],
        };

        this.markers.forEach((marker) => {
            data.markers.push(marker.to_json());
        });
        this.lines.forEach((line) => {
            data.lines.push(line.to_json());
        });
        return data;
    }

    from_json(data) {
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

        if ('settings' in data) {
            if ('markers' in data.settings) {
                if ('coordinates_format' in data.settings.markers) {
                    const coordinates_format = parse_int(
                        data.settings.markers.coordinates_format,
                    );
                    if (
                        coordinates_format === CoordinatesFormat.D ||
                        coordinates_format === CoordinatesFormat.DM ||
                        coordinates_format === CoordinatesFormat.DMS
                    ) {
                        this.settings_marker_coordinates_format = coordinates_format;
                    }
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
            data.markers.forEach((m) => {
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
            data.lines.forEach((l) => {
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

export class MapStateObserver {
    constructor(app) {
        this.app = app;
        app.map_state.register_observer(this);
    }

    update_state(_changes) {
        throw new Error('not implemented');
    }
}
