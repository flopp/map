import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {Dialog} from "./dialog";
import {MapStateChange} from "./map_state";
import {parse_float} from "./utilities";

export class MultiMarkersDialog extends Dialog {
    private readonly _useCommonName: HTMLInputElement;
    private readonly _useCommonColor: HTMLInputElement;
    private readonly _useCommonRadius: HTMLInputElement;
    private readonly _commonName: HTMLInputElement;
    private readonly _commonColor: HTMLInputElement;
    private readonly _commonRadius: HTMLInputElement;
    private readonly _markerData: HTMLInputElement;
    private readonly _dataFormat: HTMLTextAreaElement;

    public constructor(app: App) {
        super("multi-markers-dialog", app);

        this._useCommonName = this._div.querySelector("[data-use-common-name]")!;
        this._useCommonColor = this._div.querySelector("[data-use-common-color]")!;
        this._useCommonRadius = this._div.querySelector("[data-use-common-radius]")!;
        this._commonName = this._div.querySelector("[data-common-name]")!;
        this._commonColor = this._div.querySelector("[data-common-color]")!;
        this._commonRadius = this._div.querySelector("[data-common-radius]")!;
        this._markerData = this._div.querySelector("[data-marker-data]")!;
        this._dataFormat = this._div.querySelector("[data-format]")!;

        this._useCommonName.onchange = (): void => {
            this.update_description();
        };
        this._useCommonColor.onchange = (): void => {
            this.update_description();
        };
        this._useCommonRadius.onchange = (): void => {
            this.update_description();
        };
    }

    public show(): void {
        (this._div.querySelector(
            "[data-common-color]",
        ) as HTMLInputElement).value = Color.random_from_palette().to_hash_string();
        this.update_description();
        super.show();
    }

    public ok(): void {
        const use_common_name = this._useCommonName.checked;
        const use_common_color = this._useCommonColor.checked;
        const use_common_radius = this._useCommonRadius.checked;
        const common_name = this._commonName.value;
        const common_color = Color.from_string(this._commonColor.value);
        const common_radius = parse_float(this._commonRadius.value);

        if (use_common_color && common_color === null) {
            this._app.message_error(
                this._app.translate("dialog.multi-markers.bad_common_color_message"),
            );

            return;
        }
        if (use_common_radius && common_radius === null) {
            this._app.message_error(
                this._app.translate("dialog.multi-markers.bad_common_radius_message"),
            );

            return;
        }

        let tokens_per_line = 1;
        if (!use_common_name) {
            tokens_per_line += 1;
        }
        if (!use_common_color) {
            tokens_per_line += 1;
        }
        if (!use_common_radius) {
            tokens_per_line += 1;
        }

        interface IMarkerDict {
            name: string;
            coordinates: Coordinates;
            radius: number;
            color: Color;
        }

        const errors: string[] = [];
        const data: IMarkerDict[] = [];
        let line_index = 0;
        let marker_index = 1;
        this._markerData.value.split("\n").forEach((line: string): void => {
            line_index += 1;

            if (line.trim() === "") {
                return;
            }

            let line_has_errors = false;
            const tokens = line.split(";");
            if (tokens.length !== tokens_per_line) {
                errors.push(
                    this._app.translate(
                        "dialog.multi-markers.tokens_message",
                        String(line_index),
                        String(tokens_per_line),
                    ),
                );
                line_has_errors = true;
            }
            let token_index = 0;

            const coordinates = Coordinates.from_string(tokens[token_index].trim());

            if (coordinates === null) {
                errors.push(
                    this._app.translate(
                        "dialog.multi-markers.coordinates_message",
                        String(line_index),
                        tokens[token_index].trim(),
                    ),
                );
                line_has_errors = true;
            }
            token_index += 1;

            let name = `${common_name}${marker_index}`;
            if (!use_common_name) {
                name = tokens[token_index].trim();
                if (name === "") {
                    errors.push(
                        this._app.translate(
                            "dialog.multi-markers.name_message",
                            String(line_index),
                        ),
                    );
                    line_has_errors = true;
                }
                token_index += 1;
            }

            let color = common_color;
            if (!use_common_color) {
                color = Color.from_string(tokens[token_index].trim());
                if (color === null) {
                    errors.push(
                        this._app.translate(
                            "dialog.multi-markers.color_message",
                            String(line_index),
                            tokens[token_index].trim(),
                        ),
                    );
                    line_has_errors = true;
                }
                token_index += 1;
            }

            let radius = common_radius;
            if (!use_common_radius) {
                radius = parse_float(tokens[token_index].trim());
                if (radius === null) {
                    errors.push(
                        this._app.translate(
                            "dialog.multi-markers.radius_message",
                            String(line_index),
                            tokens[token_index].trim(),
                        ),
                    );
                    line_has_errors = true;
                }
                token_index += 1;
            }

            if (!line_has_errors) {
                data.push({
                    name,
                    coordinates: coordinates!,
                    color: color!,
                    radius: radius!,
                });
                marker_index += 1;
            }
        });

        if (errors.length > 0) {
            this._app.message_error(errors.join("\n"));

            return;
        }

        data.forEach((marker_data: IMarkerDict): void => {
            const marker = this._app.map_state.add_marker(marker_data.coordinates);
            marker.name = marker_data.name;
            marker.color = marker_data.color;
            marker.radius = marker_data.radius;
            this._app.map_state.update_marker_storage(marker);
        });

        this._app.map_state.update_observers(MapStateChange.MARKERS);
        this.hide();
    }

    private update_description(): void {
        const use_common_name = this._useCommonName.checked;
        const use_common_color = this._useCommonColor.checked;
        const use_common_radius = this._useCommonRadius.checked;

        const description = [`<${this._app.translate("dialog.multi-markers.coordinates_token")}>`];
        if (!use_common_name) {
            description.push(`<${this._app.translate("dialog.multi-markers.name_token")}>`);
        }
        if (!use_common_color) {
            description.push(`<${this._app.translate("dialog.multi-markers.color_token")}>`);
        }
        if (!use_common_radius) {
            description.push(`<${this._app.translate("dialog.multi-markers.radius_token")}>`);
        }
        this._dataFormat.innerText = description.join(";");
    }
}
