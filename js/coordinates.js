/* global require */
const GeographicLib = require("../node_modules/geographiclib/geographiclib.min.js");

const CoordinatesFormat = {
    D: 0,
    DM: 1,
    DMS: 2,
};

if (Object.freeze) {
    Object.freeze(CoordinatesFormat);
}

export {CoordinatesFormat};

let coordinates_format = CoordinatesFormat.DM;

export class Coordinates {
    constructor(lat, lng) {
        this.raw_lat = lat;
        this.raw_lng = lng;
    }

    lat() {
        return this.raw_lat;
    }

    lng() {
        let lng = this.raw_lng;
        while (lng < -180) {
            lng += 360;
        }
        while (lng > 180) {
            lng -= 360;
        }
        return lng;
    }

    next_lng(other) {
        let lng = this.raw_lng;
        while (lng < other - 180) {
            lng += 360;
        }
        while (lng > other + 180) {
            lng -= 360;
        }
        return lng;
    }


    static set_coordinates_format(format) {
        coordinates_format = format;
    }
    static get_coordinates_format() {
        return coordinates_format;
    }

    static from_google(latlng) {
        return new Coordinates(latlng.lat(), latlng.lng());
    }

    static from_leaflet(latlng) {
        return new Coordinates(latlng.lat, latlng.lng);
    }

    static from_components(h1, d1, m1, s1, h2, d2, m2, s2) {
        let lat, lng;

        if ((h1 !== '+') && (d1 < 0)) {
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

        const c1 = d1 + (m1 / 60.0) + (s1 / 3600.0);
        const c2 = d2 + (m2 / 60.0) + (s2 / 3600.0);

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

    static from_string(str) {
        const
            s = Coordinates.sanitize_string(str),
            patterns = [
                // DM / H D M
                [/^\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*$/, 1, 2, 3, 0, 4, 5, 6, 0],
                // DM / D H M
                [/^\s*(\d+)\s*([NEWS])\s*(\d+\.?\d*)\s+(\d+)\s*([NEWS])\s*(\d+\.?\d*)\s*$/, 2, 1, 3, 0, 5, 4, 6, 0],
                // DM / D M H
                [/^\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*$/, 3, 1, 2, 0, 6, 4, 5, 0],
                // DM / D M
                [/^\s*(\d+)\s+(\d+\.?\d*)\s+(\d+)\s+(\d+\.?\d*)\s*$/, 'N', 1, 2, 0, 'E', 3, 4, 0],
                // DMS / H D M S
                [/^\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*$/, 1, 2, 3, 4, 5, 6, 7, 8],
                // DMS / D H M S
                [/^\s*(\d+)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s+(\d+)\s*([NEWS])\s*(\d+)\s+(\d+\.?\d*)\s*$/, 2, 1, 3, 4, 6, 5, 7, 8],
                // DMS / D M S H
                [/^\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*([NEWS])\s*$/, 4, 1, 2, 3, 6, 5, 6, 7],
                // DMS / D M S
                [/^\s*(\d+)\s+(\d+)\s+(\d+\.?\d*)\s+(\d+)\s+(\d+)\s+(\d+\.?\d*)\s*$/, 'N', 1, 2, 3, 'E', 4, 5, 6],
                // D / H D
                [/^\s*([NEWS])\s*(\d+\.?\d*)\s*([NEWS])\s*(\d+\.?\d*)\s*$/, 1, 2, 0, 0, 3, 4, 0, 0],
                // D / D H
                [/^\s*(\d+\.?\d*)\s*([NEWS])\s*(\d+\.?\d*)\s*([NEWS])\s*$/, 2, 1, 0, 0, 4, 3, 0, 0],
                // D / D
                [/^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/, '+', 1, 0, 0, '+', 2, 0, 0]
            ];

        function mm(match, index) {
            if (typeof index === 'number') {
                if (index > 0) {
                    const mi = match[index];
                    if (mi === '+' || mi === 'N' || mi === 'E' || mi === 'W' || mi === 'S') {
                        return mi;
                    }
                    return parseFloat(mi);
                }
            }
            return index;
        }

        for (let i = 0; i < patterns.length; i += 1) {
            const p = patterns[i];
            const m = s.match(p[0]);
            if (m) {
                const c = Coordinates.from_components(
                    mm(m, p[1]),
                    mm(m, p[2]),
                    mm(m, p[3]),
                    mm(m, p[4]),
                    mm(m, p[5]),
                    mm(m, p[6]),
                    mm(m, p[7]),
                    mm(m, p[8])
                );

                if (c) {
                    return c;
                }
            }
        }

        return null;
    }

    to_google() {
        /* global google */
        return new google.maps.LatLng(this.raw_lat, this.raw_lng);
    }

    to_leaflet() {
        /* global L */
        return L.latLng(this.raw_lat, this.raw_lng);
    }

    static to_leaflet_path(path) {
        const leaflet_path = [];
        path.forEach((coordinates) => {
            leaflet_path.push(coordinates.to_leaflet());
        });
        return leaflet_path;
    }

    to_string_format(format) {
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

    to_string() {
        return this.to_string_format(coordinates_format);
    }

    to_string_DM() {
        let lat = Math.abs(this.lat()),
            lat_min,
            lat_mmin,
            lng = Math.abs(this.lng()),
            lng_min,
            lng_mmin;

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        lat_min = Math.floor(lat * 60);
        lat = lat * 60 - lat_min;
        lat_mmin = Math.floor(Math.round(lat * 1000));
        while (lat_mmin >= 1000) {
            lat_mmin -= 1000;
            lat_min += 1;
        }

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        lng_min = Math.floor(lng * 60);
        lng = lng * 60 - lng_min;
        lng_mmin = Math.floor(Math.round(lng * 1000));
        while (lng_mmin >= 1000) {
            lng_mmin -= 1000;
            lng_min += 1;
        }

        return this.NS() +
                " " +
                Coordinates.zeropad(lat_deg, 2) +
                " " +
                Coordinates.zeropad(lat_min, 2) +
                "." +
                Coordinates.zeropad(lat_mmin, 3) +
                " " +
                this.EW() +
                " " +
                Coordinates.zeropad(lng_deg, 3) +
                " " +
                Coordinates.zeropad(lng_min, 2) +
                "." +
                Coordinates.zeropad(lng_mmin, 3);
    }


    to_string_DMS() {
        let lat = Math.abs(this.lat()),
            lng = Math.abs(this.lng());

        const lat_deg = Math.floor(lat);
        lat -= lat_deg;
        const lat_min = Math.floor(lat * 60);
        lat = lat * 60 - lat_min;
        const lat_sec = lat * 60.0;

        const lng_deg = Math.floor(lng);
        lng -= lng_deg;
        const lng_min = Math.floor(lng * 60);
        lng = lng * 60 - lng_min;
        const lng_sec = lng * 60.0;

        return this.NS() +
                " " +
                Coordinates.zeropad(lat_deg, 2) +
                " " +
                Coordinates.zeropad(lat_min, 2) +
                " " +
                Coordinates.zeropad(lat_sec.toFixed(2), 5) +
                " " +
                this.EW() +
                " " +
                Coordinates.zeropad(lng_deg, 3) +
                " " +
                Coordinates.zeropad(lng_min, 2) +
                " " +
                Coordinates.zeropad(lng_sec.toFixed(2), 5);
    }

    to_string_D() {
        return `${this.NS()} ${Math.abs(this.lat()).toFixed(6)} ${this.EW()} ${Math.abs(this.lng()).toFixed(6)}`;
    }

    distance(other) {
        const geod = GeographicLib.Geodesic.WGS84;
        const r = geod.Inverse(this.raw_lat, this.raw_lng, other.raw_lat, other.next_lng(this.raw_lng), GeographicLib.Geodesic.DISTANCE | GeographicLib.Geodesic.LONG_UNROLL);
        return r.s12;
    }

    distance_bearing(other) {
        const geod = GeographicLib.Geodesic.WGS84;
        const r = geod.Inverse(this.raw_lat, this.raw_lng, other.raw_lat, other.next_lng(this.raw_lng), GeographicLib.Geodesic.DISTANCE | GeographicLib.Geodesic.AZIMUTH | GeographicLib.Geodesic.LONG_UNROLL);
        return {distance: r.s12, bearing: r.azi1};
    }

    project(angle, distance) {
        const geod = GeographicLib.Geodesic.WGS84;
        const r = geod.Direct(this.lat(), this.lng(), angle, distance, GeographicLib.Geodesic.LONGITUDE | GeographicLib.Geodesic.LATITUDE | GeographicLib.Geodesic.LONG_UNROLL);
        return new Coordinates(r.lat2, r.lon2);
    }

    interpolate_geodesic_line(other, _zoom) {
        // const d = 6000000 / Math.pow(2, zoom);
        const maxk = 50;
        const geod = GeographicLib.Geodesic.WGS84;
        const t = geod.Inverse(this.raw_lat, this.raw_lng, other.raw_lat, other.next_lng(this.raw_lng), GeographicLib.Geodesic.DISTANCE | GeographicLib.Geodesic.LONG_UNROLL);

        // const k = Math.min(maxk, Math.max(1, Math.ceil(t.s12 / d)));
        const k = maxk;
        const points = new Array(k + 1);
        points[0] = this;
        points[k] = new Coordinates(other.raw_lat, other.next_lng(this.raw_lng));

        if (k > 1) {
            const line = geod.InverseLine(this.raw_lat, this.raw_lng, other.raw_lat, other.next_lng(this.raw_lng), GeographicLib.Geodesic.LATITUDE | GeographicLib.Geodesic.LONGITUDE | GeographicLib.Geodesic.LONG_UNROLL);
            const da12 = t.a12 / k;
            for (let i = 1; i < k; i += 1) {
                const point = line.GenPosition(true, i * da12, GeographicLib.Geodesic.LATITUDE | GeographicLib.Geodesic.LONGITUDE | GeographicLib.Geodesic.LONG_UNROLL);
                points[i] = new Coordinates(point.lat2, point.lon2);
            }
        }

        return points;
    }

    NS() {
        if (this.lat() >= 0) {
            return 'N';
        }
        return 'S';
    }

    EW() {
        if (this.lng() >= 0) {
            return 'E';
        }
        return 'W';
    }

    static zeropad(num, width) {
        let s = String(num);
        while (s.length < width) {
            s = "0" + s;
        }
        return s;
    }

    static sanitize_string(s) {
        let sanitized = "",
            commas = 0,
            periods = 0;

        for (let i = 0; i < s.length; i += 1) {
            if ((s[i] === 'o') || (s[i] === 'O')) {
                // map 'O'/'o' to 'E' (German 'Ost' = 'East')
                sanitized += 'E';
            } else if (s[i].match(/[a-z0-9-]/i)) {
                sanitized += s[i].toUpperCase();
            } else if (s[i] === '.') {
                periods += 1;
                sanitized += s[i];
            } else if (s[i] === ',') {
                commas += 1;
                sanitized += s[i];
            } else {
                sanitized += ' ';
            }
        }

        // try to map commas to spaces or periods
        if ((commas === 1) && ((periods === 0) || (periods >= 2))) {
            return sanitized.replace(/,/g, ' ');
        }

        if ((commas >= 1) && (periods === 0)) {
            return sanitized.replace(/,/g, '.');
        }

        return sanitized;
    }
}
