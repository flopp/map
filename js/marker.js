var _next_marker_id = 0;

class Marker {
    constructor(coordinates) {
        this.id = _next_marker_id;
        this.coordinates = coordinates;
        this.name = "MARKER " + this.id;
        this.color = (Math.random().toString(16) + '000000').slice(2, 8);
        this.radius = Math.random() * 1000;

        _next_marker_id += 1;
    }

    static reset_ids() {
        _next_marker_id = 0;
    }
}
