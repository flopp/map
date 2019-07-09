const CoordinatesFormat = {
    D: 0,
    DM: 1,        
    DMS: 2,
};

let coordinates_format = CoordinatesFormat.DM;

class Coordinates {
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }

    static from_google(latlng) {
        return new Coordinates(latlng.lat(), latlng.lng());
    }
    
    static from_leaflet(latlng) {
        return new Coordinates(latlng.lat, latlng.lng);
    }

    to_google() {
        return new google.maps.LatLng(this.lat, this.lng)
    }

    to_leaflet() {
        return L.latLng(this.lat, this.lng)
    }

    to_string() {
        switch (coordinates_format) {
            case CoordinatesFormat.D:
                return this.to_string_D();
            case CoordinatesFormat.DMS:
                return this.to_string_DMS();
            case CoordinatesFormat.DM:
            default:
                return this.to_string_DM();
        }
    }

    static NS(lat) {
        if (lat >= 0) {
            return 'N';
        }
        return 'S';
    }
    
    static EW(lng) {    
        if (lng >= 0) {
            return 'E';
        }
        return 'W';
    }

    static zeropad(num, width) {
        var s = String(num);
        while (s.length < width) {
            s = "0" + s;
        }
        return s;
    }
    
    to_string_DM() {
        var lat = Math.abs(this.lat),
            lat_deg,
            lat_min,
            lat_mmin,
            lng = Math.abs(this.lng),
            lng_deg,
            lng_min,
            lng_mmin;
    
        lat_deg = Math.floor(lat);
        lat = lat - lat_deg;
        lat_min = Math.floor(lat * 60);
        lat = lat * 60 - lat_min;
        lat_mmin = Math.floor(Math.round(lat * 1000));
        while (lat_mmin >= 1000) {
            lat_mmin -= 1000;
            lat_min += 1;
        }
    
        lng_deg = Math.floor(lng);
        lng = lng - lng_deg;
        lng_min = Math.floor(lng * 60);
        lng = lng * 60 - lng_min;
        lng_mmin = Math.floor(Math.round(lng * 1000));
        while (lng_mmin >= 1000) {
            lng_mmin -= 1000;
            lng_min += 1;
        }
    
        return Coordinates.NS(this.lat) +
                " " +
                Coordinates.zeropad(lat_deg, 2) +
                " " +
                Coordinates.zeropad(lat_min, 2) +
                "." +
                Coordinates.zeropad(lat_mmin, 3) +
                " " +
                Coordinates.EW(this.lng) +
                " " +
                Coordinates.zeropad(lng_deg, 3) +
                " " +
                Coordinates.zeropad(lng_min, 2) +
                "." +
                Coordinates.zeropad(lng_mmin, 3);
    }
    
    
    to_string_DMS() {
        var lat = Math.abs(this.lat),
            lat_deg,
            lat_min,
            lat_sec,
            lng = Math.abs(this.lng),
            lng_deg,
            lng_min,
            lng_sec;
    
        lat_deg = Math.floor(lat);
        lat = lat - lat_deg;
        lat_min = Math.floor(lat * 60);
        lat = lat * 60 - lat_min;
        lat_sec = lat * 60.0;
    
        lng_deg = Math.floor(lng);
        lng = lng - lng_deg;
        lng_min = Math.floor(lng * 60);
        lng = lng * 60 - lng_min;
        lng_sec = lng * 60.0;
    
        return Coordinates.NS(this.lat) +
                " " +
                Coordinates.zeropad(lat_deg, 2) +
                " " +
                Coordinates.zeropad(lat_min, 2) +
                " " +
                Coordinates.zeropad(lat_sec.toFixed(2), 5) +
                " " +
                Coordinates.EW(this.lng) +
                " " +
                Coordinates.zeropad(lng_deg, 3) +
                " " +
                Coordinates.zeropad(lng_min, 2) +
                " " +
                Coordinates.zeropad(lng_sec.toFixed(2), 5);
    }
    
    to_string_D() {
        const lat = Math.abs(this.lat),
              lng = Math.abs(this.lng);
    
        return Coordinates.NS(this.lat) +
                " " +
                lat.toFixed(6) +
                " " +
                Coordinates.EW(this.lng) +
                " " +
                lng.toFixed(6);
    }
}
