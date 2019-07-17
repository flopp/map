var next_marker_id = 0;

export class Marker {
    constructor(coordinates) {
        this.id = next_marker_id;
        this.coordinates = coordinates;
        this.name = `Marker ${this.id}`;
        this.color = (Math.random().toString(16) + '000000').slice(2, 8);
        this.radius = 0;

        next_marker_id += 1;
    }

    static reset_ids() {
        next_marker_id = 0;
    }

    to_json() {
        return {
            "id": this.id,
            "coordinates": this.coordinates.to_string_D(),
            "name": this.name,
            "color": this.color,
            "radius": this.radius
        };
    }
}
