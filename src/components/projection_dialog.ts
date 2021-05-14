import {App} from "./app";
import {Color} from "./color";
import {Dialog} from "./dialog";
import {MapStateChange} from "./map_state";
import {Marker} from "./marker";
import {parse_float} from "./utilities";

export class ProjectionDialog extends Dialog {
    private marker: Marker | null = null;

    public constructor(app: App) {
        super("projection-dialog", app);
    }

    public showMarker(marker: Marker): void {
        this.marker = marker;
        (this._div.querySelector("[data-distance]") as HTMLInputElement).value = "";
        (this._div.querySelector("[data-bearing]") as HTMLInputElement).value = "";
        const name = this._app.translate("dialog.projection.new_marker_name", marker.name);
        (this._div.querySelector("[data-target-name]") as HTMLInputElement).value = name;
        (this._div.querySelector(
            "[data-target-color]",
        ) as HTMLInputElement).value = marker.color.to_hash_string();
        (this._div.querySelector("[data-target-radius]") as HTMLInputElement).value = "";
        (this._div.querySelector(
            "[data-line-color]",
        ) as HTMLInputElement).value = marker.color.to_hash_string();

        super.show();
    }

    public ok(): void {
        const distance = parse_float(
            (this._div.querySelector("[data-distance]") as HTMLInputElement).value,
        );
        const bearing = parse_float(
            (this._div.querySelector("[data-bearing]") as HTMLInputElement).value,
        );
        const target_name = (this._div.querySelector("[data-target-name]") as HTMLInputElement)
            .value;
        const target_color = Color.from_string(
            (this._div.querySelector("[data-target-color]") as HTMLInputElement).value,
        );
        const target_radius = parse_float(
            (this._div.querySelector("[data-target-radius]") as HTMLInputElement).value,
        );
        const create_line = (this._div.querySelector("[data-line]") as HTMLInputElement).checked;
        const line_color = Color.from_string(
            (this._div.querySelector("[data-line-color]") as HTMLInputElement).value,
        );

        if (distance === null || distance <= 0) {
            this._app.message_error(this._app.translate("dialog.projection.bad_distance_message"));

            return;
        }
        if (bearing === null) {
            this._app.message_error(this._app.translate("dialog.projection.bad_bearing_message"));

            return;
        }

        const coordinates = this.marker!.coordinates.project(bearing, distance);
        const target_marker = this._app.map_state.add_marker(coordinates);
        target_marker.name = target_name;
        target_marker.radius = target_radius !== null ? target_radius : -1;
        target_marker.color = target_color !== null ? target_color : this.marker!.color;
        this._app.map_state.update_marker_storage(target_marker);

        if (create_line) {
            const line = this._app.map_state.add_line();
            line.marker1 = this.marker!.get_id();
            line.marker2 = target_marker.get_id();
            line.color = line_color !== null ? line_color : this.marker!.color;
            this._app.map_state.update_line_storage(line);
            this._app.map_state.update_observers(MapStateChange.MARKERS | MapStateChange.LINES);
        } else {
            this._app.map_state.update_observers(MapStateChange.MARKERS);
        }

        this.hide();
    }
}
