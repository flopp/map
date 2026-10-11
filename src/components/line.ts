import {Color} from "./color";
import {Distance} from "./distance";
import {MapState} from "./map_state";

let next_line_id: number = 0;

export interface ILineJson {
    marker1: number;
    marker2: number;
    color: string;
}

export interface LineUpdate {
    marker1?: number;
    marker2?: number;
    color?: Color;
}

export type LineView = Omit<Line, "update" | "update_measurements" | "length"> & {
    readonly length: Omit<Distance, "set"> | null;
};

export class Line {
    public readonly line_id: number;
    private _marker1: number;
    private _marker2: number;
    private _color: Color;
    private _length: Distance | null;
    private _bearing: number | null;

    public constructor(marker_id1: number, marker_id2: number, line_id?: number) {
        this.line_id = line_id ?? next_line_id;
        next_line_id = Math.max(next_line_id, this.line_id + 1);
        this._marker1 = marker_id1;
        this._marker2 = marker_id2;
        this._color = Color.random_from_palette();

        this._length = null;
        this._bearing = null;
    }

    public get marker1(): number {
        return this._marker1;
    }

    public get marker2(): number {
        return this._marker2;
    }

    public get color(): Color {
        return this._color;
    }

    public get length(): Distance | null {
        return this._length;
    }

    public get bearing(): number | null {
        return this._bearing;
    }

    public update(attributes: LineUpdate): void {
        if (attributes.marker1 !== undefined) {
            this._marker1 = attributes.marker1;
        }
        if (attributes.marker2 !== undefined) {
            this._marker2 = attributes.marker2;
        }
        if (attributes.color !== undefined) {
            this._color = attributes.color;
        }
    }

    public update_measurements(length: Distance | null, bearing: number | null): void {
        this._length = length;
        this._bearing = bearing;
    }

    public static reset_ids(next: number = 0): void {
        next_line_id = next;
    }

    public get_id(): number {
        return this.line_id;
    }

    public to_gpx(map_state: MapState): string {
        const data: string[] = [];
        data.push("<trk>");
        data.push(`<name>LINE:${this.marker1}:${this.marker2}:${this.color.to_string()}</name>`);
        data.push("<trkseg>");
        if (this.marker1 !== -1) {
            const c = map_state.markers[this.marker1].coordinates;
            data.push(`<trkpt lat="${c.lat().toFixed(8)}" lon="${c.lng().toFixed(8)}"></trkpt>`);
        }
        if (this.marker2 !== -1) {
            const c = map_state.markers[this.marker2].coordinates;
            data.push(`<trkpt lat="${c.lat().toFixed(8)}" lon="${c.lng().toFixed(8)}"></trkpt>`);
        }
        data.push("</trkseg>");
        data.push("</trk>");

        return data.join("\n");
    }

    public to_json(): ILineJson {
        return {
            marker1: this.marker1,
            marker2: this.marker2,
            color: this.color.to_string(),
        };
    }
}
