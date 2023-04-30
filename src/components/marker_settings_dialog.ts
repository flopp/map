import {App} from "./app";
import {Color} from "./color";
import {CoordinatesFormat, parseCoordinatesFormat} from "./coordinates";
import {Dialog} from "./dialog";
import {parse_float} from "./utilities";

interface ICoordinatesFormatDict {
    id: string;
    name: string;
}

export class MarkerSettingsDialog extends Dialog {
    public constructor(app: App) {
        super("marker-settings-dialog", app);

        const format = this._div.querySelector("[data-coordinates-format]")!;
        [
            {id: CoordinatesFormat.D, name: "Degrees"},
            {id: CoordinatesFormat.DM, name: "Degrees+Minutes"},
            {id: CoordinatesFormat.DMS, name: "Degrees+Minutes+Seconds"},
        ].forEach((item: ICoordinatesFormatDict): void => {
            format.append(
                new Option(
                    item.name,
                    item.id,
                    item.id === CoordinatesFormat.DM,
                    item.id === this._app.map_state.settings_marker_coordinates_format,
                ),
            );
        });
    }

    public show(): void {
        const coordinates_input = this._div.querySelector(
            "[data-coordinates-format]",
        ) as HTMLInputElement;
        const random_input = this._div.querySelector("[data-random-color]") as HTMLInputElement;
        const color_input = this._div.querySelector("[data-color]") as HTMLInputElement;
        const radius_input = this._div.querySelector("[data-radius]") as HTMLInputElement;
        const filled_input = this._div.querySelector("[data-filled]") as HTMLInputElement;
        
        coordinates_input.value = this._app.map_state.settings_marker_coordinates_format;
        random_input.checked = this._app.map_state.settings_marker_random_color;
        color_input.value = this._app.map_state.settings_marker_color.to_hash_string();
        radius_input.value = String(this._app.map_state.settings_marker_radius);
        filled_input.checked = this._app.map_state.settings_marker_filled;

        super.show();
    }

    public ok(): void {
        const coordinates_input = this._div.querySelector(
            "[data-coordinates-format]",
        ) as HTMLInputElement;
        const random_input = this._div.querySelector("[data-random-color]") as HTMLInputElement;
        const color_input = this._div.querySelector("[data-color]") as HTMLInputElement;
        const radius_input = this._div.querySelector("[data-radius]") as HTMLInputElement;
        const filled_input = this._div.querySelector("[data-filled]") as HTMLInputElement;

        const coordinates_format = parseCoordinatesFormat(
            coordinates_input.value,
            CoordinatesFormat.DMS,
        );
        const random_color = random_input.checked;
        const color = Color.from_string(color_input.value);
        const radius = parse_float(radius_input.value);
        const filled = filled_input.checked;
        if (color === null || radius === null) {
            this._app.message_error(
                this._app.translate("dialog.marker-settings.bad_values_message"),
            );

            return;
        }

        this._app.map_state.set_default_marker_settings({
            coordinates_format,
            random_color,
            color,
            radius,
            filled,
        });

        this.hide();
    }
}
