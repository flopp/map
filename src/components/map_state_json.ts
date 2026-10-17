import {Color} from "./color";
import {Coordinates, CoordinatesFormat} from "./coordinates";
import {DistanceFormat} from "./distance";
import {MapType, string2maptype} from "./map_type";

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

const parse_json_number = (value: unknown): number | null => {
    const parsed =
        typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number(value)
              : Number.NaN;

    return Number.isFinite(parsed) ? parsed : null;
};

const parse_json_nonnegative_number = (value: unknown): number | null => {
    const parsed = parse_json_number(value);
    if (parsed === null) {
        return null;
    }

    return parsed >= 0 ? parsed : 0;
};

const parse_json_boolean = (value: unknown): boolean | null =>
    typeof value === "boolean" ? value : null;

const parse_json_color = (value: unknown): Color | null =>
    typeof value === "string" ? Color.from_string(value) : null;

export const parse_map_state_json = (data: unknown): MapStateJsonImport | null => {
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
                const radius = parse_json_number(raw_marker.radius);
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
};
