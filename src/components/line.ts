import {Color} from "./color";
import {Distance} from "./distance";
import { MapState } from "./map_state";

let next_line_id: number = 0;

export interface ILineJson {
    marker1: number;
    marker2: number;
    color: string;
}

export class Line {
    public line_id: number;
    public marker1: number;
    public marker2: number;
    public color: Color;
    public length: Distance | null;
    public bearing: number | null;

    public constructor(marker_id1: number, marker_id2: number) {
        this.line_id = next_line_id;
        this.marker1 = marker_id1;
        this.marker2 = marker_id2;
        this.color = Color.random_from_palette();

        this.length = null;
        this.bearing = null;

        next_line_id += 1;
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
