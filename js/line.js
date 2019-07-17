var next_line_id = 0;

export class Line {
    constructor(marker_id1, marker_id2) {
        this.id = next_line_id;
        this.marker1 = marker_id1;
        this.marker2 = marker_id2;
        this.color = (Math.random().toString(16) + '000000').slice(2, 8);

        next_line_id += 1;
    }

    static reset_ids() {
        next_line_id = 0;
    }

    to_json() {
        return {
            "marker1": this.marker1,
            "marker2": this.marker2,
            "color": this.color
        };
    }
}
