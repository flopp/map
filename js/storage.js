import {Color} from "./color.js";
import {Coordinates, CoordinatesFormat} from "./coordinates.js";
import {MapType} from "./maptype.js";
import {parse_int, parse_float} from "./utilities.js";


export class Storage {
    constructor() {
        this.ok = true;
        try {
            const x = '__storage_test__';
            window.localStorage.setItem(x, x);
            window.localStorage.removeItem(x);
        } catch (e) {
            this.ok = false;
            console.error("Local storage not available!");
        }

        this.migrate();
        this.set_int('version', 2);
    }

    all_keys() {
        if (!this.ok) {
            return [];
        }

        return Object.keys(window.localStorage);
    }

    migrate() {
        const version = this.get_int('version', 0);
        if (version === 1) {
            // from the old "Flopp's Map"
            this.migrate_from_v1();
        } else if (version === 2) {
            // already current => nothing to do
        } else {
            // something else => nothing to do
        }
    }

    migrate_from_v1() {
        const self = this;

        // clat + clon
        let center = null;
        if (this.exists('clat') && this.exists('clon')) {
            const clat = this.get_float('clat', null);
            const clon = this.get_float('clon', null);
            if ((clat !== null) && (clon !== null)) {
                center = new Coordinates(clat, clon);
            }
        }

        // zoom
        const zoom = this.get_int('zoom', 13);

        // maptype
        let map_type = MapType.STAMEN_TERRAIN;
        switch (this.get('maptype', null)) {
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

        // coordinatesFormat
        let coordinates_format = CoordinatesFormat.DM;
        switch (this.get('coordinatesFormat', null)) {
            case 'D':
                coordinates_format = CoordinatesFormat.D;
                break;
            case 'DM':
                coordinates_format = CoordinatesFormat.DM;
                break;
            case 'DMS':
                coordinates_format = CoordinatesFormat.DMS;
                break;
        }

        // markers (ID1:ID2:...); markerID1; markerID2; ...
        const markers = [];
        const marker_hash = new Map();
        this.get('markers', '').split(':').forEach((id_string) => {
            const id_int = parse_int(id_string);
            if (id_int === null) {
                return;
            }
            const key = `marker${id_int}`;
            const raw_data = self.get(key, null);
            if (raw_data === null) {
                return;
            }

            const data = raw_data.split(':');
            if ((data.length !== 4) && (data.length !== 5)) {
                return;
            }

            const lat = parse_float(data[0]);
            const lon = parse_float(data[1]);
            if ((lat === null) || (lon === null)) {
                return;
            }
            const coordinates = new Coordinates(lat, lon);

            let radius = parse_float(data[2]);
            if (radius === null) {
                radius = 0;
            }

            const name = data[3];

            let color = null;
            if (data.length === 5) {
                color = Color.from_string(data[4]);
            }

            marker_hash.set(id_int, markers.length);
            markers.push({name: name, coordinates: coordinates, color: color, radius: radius});
        });

        // lines (FROM1:TO1*FROM2:TO2*...)
        const lines = [];
        this.get('lines', '').split('*').forEach((ids) => {
            const split_ids = ids.split(':');
            if (split_ids.length !== 2) {
                return;
            }
            let from = self.alpha2id_v1(split_ids[0]);
            let to = self.alpha2id_v1(split_ids[1]);
            if ((from < 0) || !marker_hash.has(from)) {
                from = -1;
            }
            if ((to < 0) || !marker_hash.has(to)) {
                to = -1;
            }
            lines.push({from: from, to: to, color: Color.from_string('#ff0000')});
        });

        // write out everything
        if (center !== null) {
            this.set_coordinates('center', center);
        }
        this.set_int('zoom', zoom);
        this.set('map_type', map_type);
        this.set('settings.marker.coordinates_format', coordinates_format);

        const marker_ids = markers.map((_m, i) => {
            return i;
        });
        this.set('markers', marker_ids.join(';'));
        markers.forEach((obj, i) => {
            this.set(`marker[${i}].name`, obj.name);
            this.set_coordinates(`marker[${i}].coordinates`, obj.coordinates);
            this.set_float(`marker[${i}].radius`, obj.radius);
            if (obj.color !== null) {
                this.set_color(`marker[${i}].color`, obj.color);
            }
        });

        const line_ids = lines.map((_l, i) => {
            return i;
        });
        this.set('lines', line_ids.join(';'));
        lines.forEach((obj, i) => {
            this.set(`line[${i}].marker1`, obj.from);
            this.set(`line[${i}].marker2`, obj.to);
            this.set_color(`line[${i}].color`, obj.color);
        });
    }

    alpha2id_v1(s) {
        const index_A = 'A'.charCodeAt(0);
        const index_0 = '0'.charCodeAt(0);
        const upper_s = s.toUpperCase();

        if ((/^[A-Z]$/).test(upper_s)) {
            return upper_s.charCodeAt(0) - index_A;
        }

        if ((/^[A-Z][0-9]$/).test(upper_s)) {
            return (upper_s.charCodeAt(0) - index_A) + (26 * (upper_s.charCodeAt(1) - index_0));
        }

        return -1;
    }

    set(key, value) {
        if (!this.ok) {
            return;
        }

        if (value !== null) {
            window.localStorage.setItem(key, String(value));
        } else {
            window.localStorage.removeItem(key);
        }
    }

    exists(key) {
        if (!this.ok) {
            return false;
        }
        return window.localStorage.getItem(key) !== null;
    }

    get(key, default_value) {
        if (!this.ok) {
            return default_value;
        }

        const s = window.localStorage.getItem(key);
        if (s !== null) {
            return s;
        }
        return default_value;
    }

    remove(key) {
        if (!this.ok) {
            return;
        }
        window.localStorage.removeItem(key);
    }

    set_int(key, value) {
        this.set(key, String(value));
    }
    set_bool(key, value) {
        if (value) {
            this.set_int(key, 1);
        } else {
            this.set_int(key, 0);
        }
    }
    set_float(key, value) {
        this.set(key, String(value));
    }
    set_color(key, value) {
        this.set(key, value.to_string());
    }
    set_coordinates(key, value) {
        this.set(key, `${value.lat()};${value.lng()}`);
    }

    get_int(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseInt(s, 10);
        }
        return default_value;
    }
    get_bool(key, default_value) {
        if (default_value) {
            return this.get_int(key, 1) != 0;
        }
        return this.get_int(key, 0) != 0;
    }
    get_float(key, default_value) {
        const s = this.get(key, null);
        if (s !== null) {
            return parseFloat(s);
        }
        return default_value;
    }
    get_color(key, default_value) {
        const s = this.get(key, null);
        if (s === null) {
            return default_value;
        }

        const c = Color.from_string(s);
        if (c === null) {
            return default_value;
        }

        return c;
    }
    get_coordinates(key, default_value) {
        const s = this.get(key, null);
        if (s === null) {
            return default_value;
        }

        const c = Coordinates.from_string(s);
        if (c === null) {
            return default_value;
        }

        return c;
    }
}