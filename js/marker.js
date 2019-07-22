import {Color} from './color.js';

var next_marker_id = 0;

export class Marker {
    constructor(coordinates) {
        this.id = next_marker_id;
        this.coordinates = coordinates;
        this.name = `Marker ${this.id}`;
        this.color = Color.random_from_palette();
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
            "color": this.color.to_string(),
            "radius": this.radius
        };
    }
}
