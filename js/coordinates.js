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
}
