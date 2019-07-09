var _next_marker_id = 0;

class Marker {
    constructor(coordinates) {
        this.coordinates = coordinates;
        this.id = _next_marker_id;
        _next_marker_id += 1;
    }

    name() {
        return this.id;
    }
}
