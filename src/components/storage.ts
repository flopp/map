import {Color} from "./color";
import {Coordinates, CoordinatesFormat} from "./coordinates";
import {MapType} from "./map_type";
import { Marker } from "./marker";
import {parse_float, parse_int} from "./utilities";

export class Storage {
    private readonly ok: boolean;

    constructor() {
        this.ok = true;
        try {
            const x = "__storage_test__";
            window.localStorage.setItem(x, x);
            window.localStorage.removeItem(x);
        } catch (e) {
            this.ok = false;
            console.error("Local storage not available!");
        }

        this.migrate();
        this.set_int("version", 2);
    }

    public all_keys(): string[] {
        if (!this.ok) {
            return [];
        }

        return Object.keys(window.localStorage);
    }

    public migrate(): void {
        const version = this.get_int("version", 0);
        if (version === 1) {
            // From the old "Flopp's Map"
            this.migrate_from_v1();
        } else if (version === 2) {
            // Already current => nothing to do
        } else {
            // Something else => nothing to do
        }
    }

    public migrate_from_v1(): void {
        // Clat + clon
        let center = null;
        if (this.exists("clat") && this.exists("clon")) {
            const clat = this.get_float("clat", null);
            const clon = this.get_float("clon", null);
            if (clat !== null && clon !== null) {
                center = new Coordinates(clat, clon);
            }
        }

        // Zoom
        const zoom = this.get_int("zoom", 13);

        // Maptype
        let map_type = MapType.STAMEN_TERRAIN;
        switch (this.get("maptype", null)) {
            case "OSM":
            case "OSM/DE":
                map_type = MapType.OPENSTREETMAP;
                break;
            case "TOPO":
                map_type = MapType.OPENTOPOMAP;
                break;
            case "roadmap":
                map_type = MapType.GOOGLE_ROADMAP;
                break;
            case "terrain":
                map_type = MapType.GOOGLE_TERRAIN;
                break;
            case "satellite":
                map_type = MapType.GOOGLE_SATELLITE;
                break;
            case "hybrid":
                map_type = MapType.GOOGLE_HYBRID;
                break;
            default:
        }

        // CoordinatesFormat
        let coordinates_format = CoordinatesFormat.DM;
        switch (this.get("coordinatesFormat", null)) {
            case "D":
                coordinates_format = CoordinatesFormat.D;
                break;
            case "DM":
                coordinates_format = CoordinatesFormat.DM;
                break;
            case "DMS":
                coordinates_format = CoordinatesFormat.DMS;
                break;
            default:
        }

        interface IMarkerDict {
            name: string; coordinates: Coordinates; radius: number; color: Color;
        }

        // Markers (ID1:ID2:...); markerID1; markerID2; ...
        const markers: IMarkerDict[] = [];
        const marker_hash = new Map();
        this.get("markers", "")!
            .split(":")
            .forEach((id_string: string): void => {
                const id_int = parse_int(id_string);
                if (id_int === null) {
                    return;
                }
                const key = `marker${id_int}`;
                const raw_data = this.get(key, null);
                if (raw_data === null) {
                    return;
                }

                const data = raw_data.split(":");
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
                    color: ((color !== null) ? color : Color.random_from_palette()),
                    radius,
                });
            });

        interface ILineDict {
            from: number; to: number; color: Color;
        }

        // Lines (FROM1:TO1*FROM2:TO2*...)
        const lines: ILineDict[] = [];
        this.get("lines", "")!
            .split("*")
            .forEach((ids: string): void => {
                const split_ids = ids.split(":");
                if (split_ids.length !== 2) {
                    return;
                }
                let from = this.alpha2id_v1(split_ids[0]);
                let to = this.alpha2id_v1(split_ids[1]);
                if (from < 0 || !marker_hash.has(from)) {
                    from = -1;
                }
                if (to < 0 || !marker_hash.has(to)) {
                    to = -1;
                }
                lines.push({
                    from,
                    to,
                    color: Color.from_string("#ff0000")!,
                });
            });

        // Write out everything
        if (center !== null) {
            this.set_coordinates("center", center);
        }
        this.set_int("zoom", zoom);
        this.set("map_type", map_type);
        this.set("settings.marker.coordinates_format", coordinates_format);

        const marker_ids = markers.map((_m: IMarkerDict, i: number): number => i);
        this.set("markers", marker_ids.join(";"));
        markers.forEach((obj: IMarkerDict, i: number): void => {
            this.set(`marker[${i}].name`, obj.name);
            this.set_coordinates(`marker[${i}].coordinates`, obj.coordinates);
            this.set_float(`marker[${i}].radius`, obj.radius);
            this.set_color(`marker[${i}].color`, obj.color);
        });

        const line_ids = lines.map((_l, i: number): number => i);
        this.set("lines", line_ids.join(";"));
        lines.forEach((obj: ILineDict, i: number): void => {
            this.set_int(`line[${i}].marker1`, obj.from);
            this.set_int(`line[${i}].marker2`, obj.to);
            this.set_color(`line[${i}].color`, obj.color);
        });
    }

    public alpha2id_v1(s: string): number {
        const index_A = "A".charCodeAt(0);
        const index_0 = "0".charCodeAt(0);
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

    public set(key: string, value: string|null): void {
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

    public get(key: string, default_value: string|null): string|null {
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

    public set_int(key: string, value: number|null): void {
        if (value === null) {
            this.set(key, null);
            return;
        }

        this.set(key, String(value));
    }

    public set_bool(key: string, value: boolean|null): void {
        if (value === null) {
            this.set(key, null);
            return;
        }

        if (value) {
            this.set_int(key, 1);
        } else {
            this.set_int(key, 0);
        }
    }

    public set_float(key: string, value: number|null): void {
        if (value === null) {
            this.set(key, null);
            return;
        }

        this.set(key, String(value));
    }

    public set_color(key: string, value: Color|null): void {
        if (value === null) {
            this.set(key, null);
            return;
        }

        this.set(key, value.to_string());
    }

    public set_coordinates(key: string, value: Coordinates|null): void {
        if (value === null) {
            this.set(key, null);
            return;
        }

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

    public get_float(key: string, default_value: number|null): number|null {
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

    public get_coordinates(key: string, default_value: Coordinates|null): Coordinates|null {
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
