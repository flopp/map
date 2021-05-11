import {Color} from "./color";
import {Coordinates} from "./coordinates";

let next_marker_id = 0;

export interface IMarkerJson {
    marker_id: number;
    coordinates: string;
    name: string;
    color: string;
    radius: number;
}

export class Marker {
    private readonly marker_id: number;
    public coordinates: Coordinates;
    public name: string;
    public color: Color;
    public radius: number;

    constructor(coordinates: Coordinates) {
        this.marker_id = next_marker_id;
        this.coordinates = coordinates;
        this.name = `Marker ${this.get_id()}`;
        this.color = Color.random_from_palette();
        this.radius = 0;

        next_marker_id += 1;
    }

    public static reset_ids(): void {
        next_marker_id = 0;
    }

    public get_id(): number {
        return this.marker_id;
    }

    public to_json(): IMarkerJson {
        return {
            marker_id: this.get_id(),
            coordinates: this.coordinates.to_string_D(),
            name: this.name,
            color: this.color.to_string(),
            radius: this.radius,
        };
    }
}
