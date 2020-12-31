import {Color} from './color';
import {Coordinates, CoordinatesFormat} from './coordinates';
import {MapType} from './map_type';
import {parse_int, parse_float} from './utilities';

export class Storage {
    private ok: boolean;

    constructor() {
        this.ok = true;
        try {
            const x = '__storage_test__';
            window.localStorage.setItem(x, x);
            window.localStorage.removeItem(x);
        } catch (e) {
            this.ok = false;
            console.error('Local storage not available!');
        }

        this.migrate();
        this.set_int('version', 2);
    }

    public all_keys(): string[] {
        if (!this.ok) {
            return [];
        }

        return Object.keys(window.localStorage);
    }

    public migrate(): void {
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

    public migrate_from_v1(): void {
        const self = this;

        // clat + clon
        let center = null;
        if (this.exists('clat') && this.exists('clon')) {
            const clat = this.get_float('clat', null);
            const clon = this.get_float('clon', null);
            if (clat !== null && clon !== null) {
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

        interface MarkerDict {
            name: string, coordinates: Coordinates, radius: number, color: Color
        }

        // markers (ID1:ID2:...); markerID1; markerID2; ...
        const markers = [];
        const marker_hash = new Map();
        this.get('markers', '')
            .split(':')
            .forEach((id_string: string): void => {
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
                if (data.length !== 4 && data.length !== 5) {
                    return;
                }

                const lat = parse_float(data[0]);
                const lon = parse_float(data[1]);
                if (lat === null || lon === null) {
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
                markers.push({
                    name,
                    coordinates,
                    color,
                    radius,
                });
            });

        interface LineDict {
            from: number, to: number, color: Color
        }

        // lines (FROM1:TO1*FROM2:TO2*...)
        const lines = [];
        this.get('lines', '')
            .split('*')
            .forEach((ids: string): void => {
                const split_ids = ids.split(':');
                if (split_ids.length !== 2) {
                    return;
                }
                let from = self.alpha2id_v1(split_ids[0]);
                let to = self.alpha2id_v1(split_ids[1]);
                if (from < 0 || !marker_hash.has(from)) {
                    from = -1;
                }
                if (to < 0 || !marker_hash.has(to)) {
                    to = -1;
                }
                lines.push({
                    from,
                    to,
                    color: Color.from_string('#ff0000'),
                });
            });

        // write out everything
        if (center !== null) {
            this.set_coordinates('center', center);
        }
        this.set_int('zoom', zoom);
        this.set('map_type', map_type);
        this.set('settings.marker.coordinates_format', coordinates_format);

        const marker_ids = markers.map((_m: MarkerDict, i: number): number => {
            return i;
        });
        this.set('markers', marker_ids.join(';'));
        markers.forEach((obj: MarkerDict, i: number): void => {
            self.set(`marker[${i}].name`, obj.name);
            self.set_coordinates(`marker[${i}].coordinates`, obj.coordinates);
            self.set_float(`marker[${i}].radius`, obj.radius);
            if (obj.color !== null) {
                self.set_color(`marker[${i}].color`, obj.color);
            }
        });

        const line_ids = lines.map((_l, i: number): number => {
            return i;
        });
        this.set('lines', line_ids.join(';'));
        lines.forEach((obj: LineDict, i: number): void => {
            self.set(`line[${i}].marker1`, obj.from);
            self.set(`line[${i}].marker2`, obj.to);
            self.set_color(`line[${i}].color`, obj.color);
        });
    }

    public alpha2id_v1(s: string): number {
        const index_A = 'A'.charCodeAt(0);
        const index_0 = '0'.charCodeAt(0);
        const upper_s = s.toUpperCase();

        if (/^[A-Z]$/.test(upper_s)) {
            return upper_s.charCodeAt(0) - index_A;
        }

        if (/^[A-Z][0-9]$/.test(upper_s)) {
            return (
                upper_s.charCodeAt(0) -
                index_A +
                26 * (upper_s.charCodeAt(1) - index_0)
            );
        }

        return -1;
    }

    public set(key: string, value: any): void {
        if (!this.ok) {
            return;
        }

        if (value !== null) {
            window.localStorage.setItem(key, String(value));
        } else {
            window.localStorage.removeItem(key);
        }
    }

    public exists(key: string): boolean {
        if (!this.ok) {
            return false;
        }
        return window.localStorage.getItem(key) !== null;
    }

    public get(key: string, default_value: string): string {
        if (!this.ok) {
            return default_value;
        }

        const s = window.localStorage.getItem(key);
        if (s !== null) {
            return s;
        }
        return default_value;
    }

    public remove(key: string): void {
        if (!this.ok) {
            return;
        }
        window.localStorage.removeItem(key);
    }

    public set_int(key: string, value: number): void {
        this.set(key, String(value));
    }

    public set_bool(key: string, value: boolean): void {
        if (value) {
            this.set_int(key, 1);
        } else {
            this.set_int(key, 0);
        }
    }

    public set_float(key: string, value: number): void {
        this.set(key, String(value));
    }

    public set_color(key: string, value: Color): void {
        this.set(key, value.to_string());
    }

    public set_coordinates(key: string, value: Coordinates): void {
        this.set(key, `${value.lat()};${value.lng()}`);
    }

    public get_int(key: string, default_value: number): number {
        const s = this.get(key, null);
        if (s !== null) {
            return parseInt(s, 10);
        }
        return default_value;
    }

    public get_bool(key: string, default_value: boolean): boolean {
        if (default_value) {
            return this.get_int(key, 1) !== 0;
        }
        return this.get_int(key, 0) !== 0;
    }

    public get_float(key: string, default_value: number): number {
        const s = this.get(key, null);
        if (s !== null) {
            return parseFloat(s);
        }
        return default_value;
    }

    public get_color(key: string, default_value: Color): Color {
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

    public get_coordinates(key: string, default_value: Coordinates): Coordinates {
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
