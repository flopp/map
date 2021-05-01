import {Geodesic} from 'geographiclib';

const CoordinatesFormat = {
    D: 'D',
    DM: 'DM',
    DMS: 'DMS',
};

if (Object.freeze) {
    Object.freeze(CoordinatesFormat);
}

export {CoordinatesFormat};

let coordinates_format: string = CoordinatesFormat.DM;

function pad(num: number|string, width: number) : string {
    let s = String(num);
    while (s.length < width) {
        s = '0' + s;
    }
    return s;
}

export class Coordinates {
    private _raw_lat: number
    private _raw_lng: number

    constructor(lat: number, lng: number) {
        this._raw_lat = lat;
        this._raw_lng = lng;
    }

    public raw_lat(): number {
        return this._raw_lat;
    }

    public raw_lng(): number {
        return this._raw_lng;
    }

    public lat() : number {
        return this.raw_lat();
    }

    public lng() : number {
        let lng = this.raw_lng();
        while (lng < -180) {
            lng += 360;
        }
        while (lng > 180) {
            lng -= 360;
        }
        return lng;
    }

    public next_lng(other: number) : number {
        let lng = this.raw_lng();
        while (lng < other - 180) {
            lng += 360;
        }
        while (lng > other + 180) {
            lng -= 360;
        }
        return lng;
    }

    public static set_coordinates_format(format: string) : void {
        coordinates_format = format;
    }

    public static get_coordinates_format(): string {
        return coordinates_format;
    }

    public static from_components(
        h1: string, d1: number, m1: number, s1: number,
        h2: string, d2: number, m2: number, s2: number) : Coordinates
    {
        let lat: number;
        let lng: number;

        if (h1 !== '+' && d1 < 0) {
            return null;
        }
        // allow for m/s = 60 for supporting UNESCO style coordinates; see https://github.com/flopp/FloppsMap/issues/77
        if (m1 < 0 || m1 >= 61) {
            return null;
        }
        if (s1 < 0 || s1 >= 61) {
            return null;
        }

        if (h2 !== '+' && d2 < 0) {
            return null;
        }
        if (m2 < 0 || m2 >= 61) {
            return null;
        }
        if (s2 < 0 || s2 >= 61) {
            return null;
        }

        const c1 = d1 + m1 / 60.0 + s1 / 3600.0;
        const c2 = d2 + m2 / 60.0 + s2 / 3600.0;

        if (h1 === '+' && h2 === '+') {
            lat = c1;
            lng = c2;
        } else if ((h1 === 'N' || h1 === 'S') && (h2 === 'E' || h2 === 'W')) {
            lat = c1;
            lng = c2;
            if (h1 === 'S') {
                lat = -lat;
            }
            if (h2 === 'W') {
                lng = -lng;
            }
        } else if ((h2 === 'N' || h2 === 'S') && (h1 === 'E' || h1 === 'W')) {
            lat = c2;
            lng = c1;
            if (h2 === 'S') {
                lat = -lat;
            }
            if (h1 === 'W') {
                lng = -lng;
            }
        } else {
            return null;
        }

        return new Coordinates(lat, lng);
    }

    public static from_string(str: string): Coordinates {
        const s = Coordinates.sanitize_string(str);
        const patterns = [
                // DM / H D M
                {
                    "regexp": /^\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*$/,
                    "fields": [
                        1,
                        2,
                        3,
                        0,
                        4,
                        5,
                        6,
                        0,
                    ],
                },
                // DM / D H M
                {
                    "regexp": /^\s*(\d+)\s*([NEWS])\s*(\d+\.?\d*)\s+(\d+)\s*([NEWS])\s*(\d+\.?\d*)\s*$/,
                    "fields": [
                        2,
                        1,
                        3,
                        0,
                        5,
                        4,
                        6,
                        0,
                    ],
                },
                // DM / D M H
                {
                    "regexp": /^\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*$/,
                    "fields": [
                        3,
                        1,
                        2,
                        0,
                        6,
                        4,
                        5,
                        0,
                    ],
                },
                // DM / D M
                {
                    "regexp": /^\s*(\d+)\s+(\d+\.?\d*)\s+(\d+)\s+(\d+\.?\d*)\s*$/,
                    "fields": [
                        'N',
                        1,
                        2,
                        0,
                        'E',
                        3,
                        4,
                        0,
                    ],
                },
                // DMS / H D M S
                {
                    "regexp": /^\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*$/,
                    "fields": [
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7,
                        8,
                    ],
                },
                // DMS / D H M S
                {
                    "regexp": /^\s*(\d+)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s+(\d+)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*$/,
                    "fields": [
                        2,
                        1,
                        3,
                        4,
                        6,
                        5,
                        7,
                        8,
                    ],
                },
                // DMS / D M S H
                {
                    "regexp": /^\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*$/,
                    "fields": [
                        4,
                        1,
                        2,
                        3,
                        6,
                        5,
                        6,
                        7,
                    ],
                },
                // DMS / D M S
                {
                    "regexp": /^\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s+(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*$/,
                    "fields": [
                        'N',
                        1,
                        2,
                        3,
                        'E',
                        4,
                        5,
                        6,
                    ],
                },
                // D / H D
                {
                    "regexp": /^\s*([NEWS])\s*(\d+\.?\d*)\s*([NEWS])\s*(\d+\.?\d*)\s*$/,
                    "fields": [
                        1,
                        2,
                        0,
                        0,
                        3,
                        4,
                        0,
                        0,
                    ],
                },
                // D / D H
                {
                    "regexp": /^\s*(\d+\.?\d*)\s*([NEWS])\s*(\d+\.?\d*)\s*([NEWS])\s*$/,
                    "fields": [
                        2,
                        1,
                        0,
                        0,
                        4,
                        3,
                        0,
                        0,
                    ],
                },
                // D / D
                {
                    "regexp": /^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/,
                    "fields": [
                        '+',
                        1,
                        0,
                        0,
                        '+',
                        2,
                        0,
                        0,
                    ],
                },
            ];

        const extract_hemisphere = (match: RegExpMatchArray, index: string|number) : string => {
            if (typeof index === 'number') {
                return match[index];
            }
            return index;
        };

        const extract_component = (match: RegExpMatchArray, index: string|number) : number => {
            if (index > 0) {
                return parseFloat(match[index]);
            }
            return 0;
        };

        for (const p of patterns) {
            const m = s.match(p.regexp);
            if (m) {
                const c = Coordinates.from_components(
                    extract_hemisphere(m, p.fields[0]),
                    extract_component(m, p.fields[1]),
                    extract_component(m, p.fields[2]),
                    extract_component(m, p.fields[3]),
                    extract_hemisphere(m, p.fields[4]),
                    extract_component(m, p.fields[5]),
                    extract_component(m, p.fields[6]),
                    extract_component(m, p.fields[7]),
                );

                if (c) {
                    return c;
                }
            }
        }

        return null;
    }

    public to_string_format(format: string) : string {
        switch (format) {
            case CoordinatesFormat.D:
                return this.to_string_D();
            case CoordinatesFormat.DMS:
                return this.to_string_DMS();
            case CoordinatesFormat.DM:
            default:
                return this.to_string_DM();
        }
    }

    public to_string() : string {
        return this.to_string_format(coordinates_format);
    }

    public to_string_DM() : string {
        let lat = Math.abs(this.lat());
        let lat_minutes: number;
        let lat_milli_minutes: number;
        let lng = Math.abs(this.lng());
        let lng_minutes: number;
        let lng_milli_minutes: number;

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        lat_minutes = Math.floor(lat * 60);
        lat = lat * 60 - lat_minutes;
        lat_milli_minutes = Math.floor(Math.round(lat * 1000));
        while (lat_milli_minutes >= 1000) {
            lat_milli_minutes -= 1000;
            lat_minutes += 1;
        }

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        lng_minutes = Math.floor(lng * 60);
        lng = lng * 60 - lng_minutes;
        lng_milli_minutes = Math.floor(Math.round(lng * 1000));
        while (lng_milli_minutes >= 1000) {
            lng_milli_minutes -= 1000;
            lng_minutes += 1;
        }

        return (
            this.NS() +
            ' ' +
            pad(lat_deg, 2) +
            ' ' +
            pad(lat_minutes, 2) +
            '.' +
            pad(lat_milli_minutes, 3) +
            ' ' +
            this.EW() +
            ' ' +
            pad(lng_deg, 3) +
            ' ' +
            pad(lng_minutes, 2) +
            '.' +
            pad(lng_milli_minutes, 3)
        );
    }

    public to_string_DMS() : string {
        let lat = Math.abs(this.lat());
        let lng = Math.abs(this.lng());

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        const lat_minutes = Math.floor(lat * 60);
        lat = lat * 60 - lat_minutes;
        const lat_seconds = lat * 60.0;

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        const lng_minutes = Math.floor(lng * 60);
        lng = lng * 60 - lng_minutes;
        const lng_seconds = lng * 60.0;

        return (
            this.NS() +
            ' ' +
            pad(lat_deg, 2) +
            ' ' +
            pad(lat_minutes, 2) +
            ' ' +
            pad(lat_seconds.toFixed(2), 5) +
            ' ' +
            this.EW() +
            ' ' +
            pad(lng_deg, 3) +
            ' ' +
            pad(lng_minutes, 2) +
            ' ' +
            pad(lng_seconds.toFixed(2), 5)
        );
    }

    public to_string_D() : string {
        return `${this.NS()} ${Math.abs(this.lat()).toFixed(
            6,
        )} ${this.EW()} ${Math.abs(this.lng()).toFixed(6)}`;
    }

    public distance(other: Coordinates) : number {
        const geod = Geodesic.WGS84;
        const r = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.LONG_UNROLL,
        );
        return r.s12;
    }

    public distance_bearing(other: Coordinates) : {distance: number, bearing: number} {
        const geod = Geodesic.WGS84;
        const r = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.AZIMUTH | Geodesic.LONG_UNROLL,
        );
        return {distance: r.s12, bearing: r.azi1};
    }

    public project(angle: number, distance: number) : Coordinates {
        const geod = Geodesic.WGS84;
        const r = geod.Direct(
            this.lat(),
            this.lng(),
            angle,
            distance,
            Geodesic.LONGITUDE | Geodesic.LATITUDE | Geodesic.LONG_UNROLL,
        );
        return new Coordinates(r.lat2, r.lon2);
    }

    public interpolate_geodesic_line(other: Coordinates, _zoom: number) : Coordinates[] {
        // const d = 6000000 / Math.pow(2, zoom);
        const max_k = 50;
        const geod = Geodesic.WGS84;
        const t = geod.Inverse(
            this.raw_lat(),
            this.raw_lng(),
            other.raw_lat(),
            other.next_lng(this.raw_lng()),
            Geodesic.DISTANCE | Geodesic.LONG_UNROLL,
        );

        // const k = Math.min(max_k, Math.max(1, Math.ceil(t.s12 / d)));
        const k = max_k;
        const points = new Array(k + 1);
        points[0] = this;
        points[k] = new Coordinates(other.raw_lat(), other.next_lng(this.raw_lng()));

        if (k > 1) {
            const line = geod.InverseLine(
                this.raw_lat(),
                this.raw_lng(),
                other.raw_lat(),
                other.next_lng(this.raw_lng()),
                Geodesic.LATITUDE | Geodesic.LONGITUDE | Geodesic.LONG_UNROLL,
            );
            const da12 = t.a12 / k;
            for (let i = 1; i < k; i += 1) {
                const point = line.GenPosition(
                    true,
                    i * da12,
                    Geodesic.LATITUDE |
                        Geodesic.LONGITUDE |
                        Geodesic.LONG_UNROLL,
                );
                points[i] = new Coordinates(point.lat2, point.lon2);
            }
        }

        return points;
    }

    public geodesic_circle(radius: number) : Coordinates[] {
        const delta_angle = 1;
        const points = [];
        for (let angle = 0; angle < 360; angle += delta_angle) {
            points.push(this.project(angle, radius));
        }
        return points;
    }

    public NS() : string {
        if (this.lat() >= 0) {
            return 'N';
        }
        return 'S';
    }

    public EW() : string {
        if (this.lng() >= 0) {
            return 'E';
        }
        return 'W';
    }

    public static sanitize_string(s: string) : string {
        let sanitized = '';
        let commas = 0;
        let periods = 0;

        for (const c of s) {
            if (c === 'o' || c === 'O') {
                // map 'O'/'o' to 'E' (German 'Ost' = 'East')
                sanitized += 'E';
            } else if (c.match(/[a-z0-9-]/i)) {
                sanitized += c.toUpperCase();
            } else if (c === '.') {
                periods += 1;
                sanitized += c;
            } else if (c === ',') {
                commas += 1;
                sanitized += c;
            } else {
                sanitized += ' ';
            }
        }

        // try to map commas to spaces or periods
        if (commas === 1 && (periods === 0 || periods >= 2)) {
            return sanitized.replace(/,/g, ' ');
        }

        if (commas >= 1 && periods === 0) {
            return sanitized.replace(/,/g, '.');
        }

        return sanitized;
    }
}
