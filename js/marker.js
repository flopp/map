import {Color} from './color.js';

let next_marker_id = 0;

export class Marker {
    constructor(coordinates) {
        this.marker_id = next_marker_id;
        this.coordinates = coordinates;
        this.name = `Marker ${this.get_id()}`;
        this.color = Color.random_from_palette();
        this.radius = 0;

        next_marker_id += 1;
    }

    static reset_ids() {
        next_marker_id = 0;
    }

    get_id() {
        return this.marker_id;
    }

    to_json() {
        return {
            marker_id: this.get_id(),
            coordinates: this.coordinates.to_string_D(),
            name: this.name,
            color: this.color.to_string(),
            radius: this.radius,
        };
    }
}
