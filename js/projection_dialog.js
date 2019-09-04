import {Color} from './color.js';
import {MapStateChange} from './mapstate.js';
import {parse_float} from './utilities.js';

export class ProjectionDialog {
    constructor (app) {
        this.app = app;
        this.marker = null;

        const self = this;
        $("#projection-dialog .projection-cancel").click(() => {
            self.hide();
        });
        $("#projection-dialog .projection-perform").click(() => {
            self.go();
        });
    }

    show(marker) {
        this.marker = marker;
        $("#projection-dialog [data-distance]").val("");
        $("#projection-dialog [data-bearing]").val("");
        $("#projection-dialog [data-targetname]").val(`Projection from ${marker.name}`);
        $("#projection-dialog [data-targetcolor]").val(marker.color.to_hash_string());
        $("#projection-dialog [data-targetradius]").val("");
        $("#projection-dialog [data-linecolor]").val(marker.color.to_hash_string());
        $("#projection-dialog").addClass("is-active");
    }

    hide() {
        $("#projection-dialog").removeClass("is-active");
    }

    go() {
        const distance = parse_float($("#projection-dialog [data-distance]").val());
        const bearing = parse_float($("#projection-dialog [data-bearing]").val());
        const target_name = $("#projection-dialog [data-targetname]").val();
        const target_color = Color.from_string($("#projection-dialog [data-targetcolor]").val());
        const target_radius = parse_float($("#projection-dialog [data-targetradius").val());
        const create_line = $("#projection-dialog [data-line]").is(":checked");
        const line_color = Color.from_string($("#projection-dialog [data-linecolor]").val());

        if ((distance === null) || (distance <= 0)) {
            this.app.message_error('Bad distance');
            return;
        }
        if (bearing === null) {
            this.app.message_error("Bad bearing");
            return;
        }

        const coordinates = this.marker.coordinates.project(bearing, distance);
        const target_marker = this.app.map_state.add_marker(coordinates);
        target_marker.name = target_name;
        target_marker.radius = (target_radius !== null)
            ? target_radius
            : -1;
        target_marker.color = (target_color !== null)
            ? target_color
            : this.marker.color;
        this.app.map_state.update_marker_storage(target_marker);

        if (create_line) {
            const line = this.app.map_state.add_line();
            line.marker1 = this.marker.get_id();
            line.marker2 = target_marker.get_id();
            line.color = (line_color !== null)
                ? line_color
                : this.marker.color;
            this.app.map_state.update_line_storage(line);
            this.app.map_state.update_observers(MapStateChange.MARKERS | MapStateChange.LINES);
        } else {
            this.app.map_state.update_observers(MapStateChange.MARKERS);
        }

        this.hide();
    }
}

