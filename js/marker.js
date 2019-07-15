var next_marker_id = 0;

export class Marker {
    constructor(coordinates) {
        this.id = next_marker_id;
        this.coordinates = coordinates;
        this.name = `Marker ${this.id}`;
        this.color = (Math.random().toString(16) + '000000').slice(2, 8);
        this.radius = Math.random() * 1000;

        next_marker_id += 1;
    }

    static reset_ids() {
        next_marker_id = 0;
    }
}
