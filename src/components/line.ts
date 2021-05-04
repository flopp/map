import {Color} from './color';

let next_line_id: number = 0;

export interface LineJson {
    marker1: number;
    marker2: number;
    color: string;
};
  
export class Line {
    private line_id: number;
    public marker1: number;
    public marker2: number;
    public color: Color;
    public length: number;
    public bearing: number;

    constructor(marker_id1: number, marker_id2: number) {
        this.line_id = next_line_id;
        this.marker1 = marker_id1;
        this.marker2 = marker_id2;
        this.color = Color.random_from_palette();

        this.length = null;
        this.bearing = null;

        next_line_id += 1;
    }

    public static reset_ids(): void {
        next_line_id = 0;
    }

    public get_id(): number {
        return this.line_id;
    }

    public to_json(): LineJson {
        return {
            marker1: this.marker1,
            marker2: this.marker2,
            color: this.color.to_string(),
        };
    }
}
