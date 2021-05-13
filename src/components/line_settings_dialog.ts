import {App} from "./app";
import {Color} from "./color";
import {Dialog} from "./dialog";
import {DistanceFormat, parseDistanceFormat} from "./distance";

interface IDistanceFormatDict {
    id: DistanceFormat;
    name: string;
}

export class LineSettingsDialog extends Dialog {
    private readonly _distanceFormatInput: HTMLInputElement;
    private readonly _randomColorInput: HTMLInputElement;
    private readonly _colorInput: HTMLInputElement;

    public constructor(app: App) {
        super("line-settings-dialog", app);

        this._distanceFormatInput = this._div.querySelector("[data-distance-format]")!;
        this._randomColorInput = this._div.querySelector("[data-random-color]")!;
        this._colorInput = this._div.querySelector("[data-color]")!;

        [
            {id: DistanceFormat.m, name: "m"},
            {id: DistanceFormat.km, name: "km"},
            {id: DistanceFormat.ft, name: "ft"},
            {id: DistanceFormat.mi, name: "mi"},
        ].forEach((item: IDistanceFormatDict): void => {
            this._distanceFormatInput.appendChild(
                new Option(
                    item.name,
                    item.id,
                    item.id === DistanceFormat.m,
                    item.id === this._app.map_state.settings_line_distance_format,
                ),
            );
        });
    }

    public show(): void {
        this._distanceFormatInput.value = this._app.map_state.settings_line_distance_format;
        this._randomColorInput.checked = this._app.map_state.settings_line_random_color;
        this._colorInput.value = this._app.map_state.settings_line_color.to_hash_string();

        super.show();
    }

    public ok(): void {
        const distance_format = parseDistanceFormat(this._distanceFormatInput.value, DistanceFormat.m);
        const random_color = this._randomColorInput.checked;
        const color = Color.from_string(this._colorInput.value);
        if (color === null) {
            this._app.message_error(this._app.translate("dialog.line-settings.bad_values_message"));

            return;
        }

        this._app.map_state.set_default_line_settings({distance_format, random_color, color});

        this.hide();
    }
}
