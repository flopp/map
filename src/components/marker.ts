import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {xml_escape} from "./utilities";

let next_marker_id = 0;

export interface IMarkerJson {
    marker_id: number;
    coordinates: string;
    name: string;
    color: string;
    radius: number;
}

export interface MarkerUpdate {
    coordinates?: Coordinates;
    name?: string;
    color?: Color;
    radius?: number;
}

export type MarkerView = Omit<Marker, "update">;

export class Marker {
    public readonly marker_id: number;
    private _coordinates: Coordinates;
    private _name: string;
    private _color: Color;
    private _radius: number;

    public constructor(coordinates: Coordinates, marker_id?: number) {
        this.marker_id = marker_id ?? next_marker_id;
        next_marker_id = Math.max(next_marker_id, this.marker_id + 1);
        this._coordinates = coordinates;
        const id = this.get_id();
        const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this._name =
            id < abc.length ? abc[id] : `${abc[id % abc.length]}${1 + Math.floor(id / abc.length)}`;
        this._color = Color.random_from_palette();
        this._radius = 0;
    }

    public get coordinates(): Coordinates {
        return this._coordinates;
    }

    public get name(): string {
        return this._name;
    }

    public get color(): Color {
        return this._color;
    }

    public get radius(): number {
        return this._radius;
    }

    public update(attributes: MarkerUpdate): void {
        if (attributes.coordinates !== undefined) {
            this._coordinates = attributes.coordinates;
        }
        if (attributes.name !== undefined) {
            this._name = attributes.name;
        }
        if (attributes.color !== undefined) {
            this._color = attributes.color;
        }
        if (attributes.radius !== undefined) {
            this._radius = attributes.radius;
        }
    }

    public static reset_ids(next: number = 0): void {
        next_marker_id = next;
    }

    public get_id(): number {
        return this.marker_id;
    }

    public to_gpx(): string {
        const symbol = "flag";
        const data: string[] = [];
        data.push(
            `<wpt lat="${this.coordinates.lat().toFixed(8)}" lon="${this.coordinates.lng().toFixed(8)}">`,
        );
        data.push(`    <name>${xml_escape(this.name)}</name>`);
        data.push(`    <desc>color="${this.color.to_string()}"</desc>`);
        data.push(`    <sym>${symbol}</sym>`);
        if (this.radius > 0) {
            data.push("    <extensions>");
            data.push("      <wptx1:WaypointExtension>");
            data.push(`        <wptx1:Proximity>${this.radius}</wptx1:Proximity>`);
            data.push("      </wptx1:WaypointExtension>");
            data.push("    </extensions>");
        }
        data.push("</wpt>");

        return data.join("\n");
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
