import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {Dialog} from "./dialog";
import {create_element, parse_float} from "./utilities";

export class MultiMarkersDialog extends Dialog {
    private readonly _useCommonName: HTMLInputElement;
    private readonly _useCommonColor: HTMLInputElement;
    private readonly _useCommonRadius: HTMLInputElement;
    private readonly _commonName: HTMLInputElement;
    private readonly _commonColor: HTMLInputElement;
    private readonly _commonRadius: HTMLInputElement;
    private readonly _markerData: HTMLInputElement;
    private readonly _dataFormat: HTMLSpanElement;
    private readonly _example: HTMLSpanElement;

    public constructor(app: App) {
        super(
            MultiMarkersDialog.create_dialog(),
            app,
            "https://blog.flopp.net/creating-multiple-markers/",
        );

        this._useCommonName = this._div.querySelector("[data-use-common-name]")!;
        this._useCommonColor = this._div.querySelector("[data-use-common-color]")!;
        this._useCommonRadius = this._div.querySelector("[data-use-common-radius]")!;
        this._commonName = this._div.querySelector("[data-common-name]")!;
        this._commonColor = this._div.querySelector("[data-common-color]")!;
        this._commonRadius = this._div.querySelector("[data-common-radius]")!;
        this._markerData = this._div.querySelector("[data-marker-data]")!;
        this._dataFormat = this._div.querySelector("[data-format]")!;
        this._example = this._div.querySelector("[data-example]")!;

        this._useCommonName.onchange = (): void => {
            this.update_description();
        };
        this._useCommonColor.onchange = (): void => {
            this.update_description();
        };
        this._useCommonRadius.onchange = (): void => {
            this.update_description();
        };

        this._useCommonName.checked = true;
        this._useCommonColor.checked = true;
        this._useCommonRadius.checked = true;

        this._commonName.value = "M";
        this._commonRadius.value = "0";
    }

    private static create_dialog(): HTMLDivElement {
        const dialog = create_element("div", ["modal"], {
            id: "multi-markers-dialog",
        }) as HTMLDivElement;
        const modal_card = create_element("div", ["modal-card"]);
        const header = create_element("header", ["modal-card-head"]);
        const title = create_element("h2", ["modal-card-title"], {
            "data-i18n": "dialog.multi-markers.title",
        });
        title.textContent = "Create Multiple Markers";
        header.append(title);
        const close_button = create_element("button", ["delete"], {
            "data-cancel": null,
            "aria-label": "close",
        });
        header.append(close_button);
        modal_card.append(header);

        const body = create_element("section", ["modal-card-body"]);
        const common_attributes_heading = create_element("h3", ["is-size-4"], {
            "data-i18n": "dialog.multi-markers.common-attributes",
        });
        common_attributes_heading.textContent = "Common Marker Attributes";
        body.append(common_attributes_heading);

        const columns = create_element("div", ["columns"]);
        const name_column = MultiMarkersDialog.create_common_attribute_column(
            "name",
            "Name Prefix",
            "text",
        );
        const color_column = MultiMarkersDialog.create_common_attribute_column(
            "color",
            "Color",
            "color",
        );
        const radius_column = MultiMarkersDialog.create_common_attribute_column(
            "radius",
            "Circle Radius (m)",
            "text",
        );
        columns.append(name_column, color_column, radius_column);
        body.append(columns);

        const data_heading = create_element("h3", ["is-size-4"], {
            "data-i18n": "dialog.multi-markers.data",
        });
        data_heading.textContent = "Marker Data";
        body.append(data_heading);

        const data_description = create_element("p");
        const format_label = create_element("span", [], {
            "data-i18n": "dialog.multi-markers.format",
        });
        format_label.textContent = "Data format per line:";
        const data_format = create_element("span", ["is-family-code"], {
            "data-format": null,
        });
        const example_label = create_element("span", [], {
            "data-i18n": "dialog.multi-markers.example",
        });
        example_label.textContent = "Example:";
        const example = create_element("span", ["is-family-code"], {
            "data-example": null,
        });
        data_description.append(
            format_label,
            create_element("br"),
            data_format,
            create_element("br"),
            example_label,
            create_element("br"),
            example,
        );
        body.append(data_description);

        const marker_data = create_element("textarea", ["textarea", "is-family-code"], {
            "data-marker-data": null,
            placeholder: "Marker Data",
        });
        body.append(marker_data);
        modal_card.append(body);

        const footer = create_element("footer", ["modal-card-foot"]);
        const create_button = create_element("button", ["button", "is-success"], {
            "data-ok": null,
            "data-i18n": "dialog.multi-markers.create",
        });
        create_button.textContent = "Create Markers";
        footer.append(create_button);
        const cancel_button = create_element("button", ["button"], {
            "data-cancel": null,
            "data-i18n": "general.cancel",
        });
        cancel_button.textContent = "Cancel";
        footer.append(cancel_button);
        modal_card.append(footer);

        dialog.append(create_element("div", ["modal-background"]), modal_card);
        document.body.append(dialog);

        return dialog;
    }

    private static create_common_attribute_column(
        attribute: "name" | "color" | "radius",
        label: string,
        input_type: "text" | "color",
    ): HTMLElement {
        const column = create_element("div", ["column"]);
        const checkbox_label = create_element("label", ["checkbox"]);
        checkbox_label.append(
            create_element("input", [], {
                type: "checkbox",
                [`data-use-common-${attribute}`]: null,
            }),
        );
        const label_text = create_element("span", [], {
            "data-i18n": `dialog.multi-markers.${attribute}`,
        });
        label_text.textContent = label;
        checkbox_label.append(label_text);
        column.append(checkbox_label);

        const field = create_element("div", ["field"]);
        const control = create_element("div", ["control"]);
        control.append(
            create_element("input", ["input"], {
                [`data-common-${attribute}`]: null,
                type: input_type,
            }),
        );
        field.append(control);
        column.append(field);

        return column;
    }

    public show(): void {
        (this._div.querySelector("[data-common-color]") as HTMLInputElement).value =
            Color.random_from_palette().to_hash_string();
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
            this._app.map_state.add_marker(marker_data.coordinates, {
                name: marker_data.name,
                color: marker_data.color,
                radius: marker_data.radius,
            });
        });

        this.hide();
    }

    private update_description(): void {
        const use_common_name = this._useCommonName.checked;
        const use_common_color = this._useCommonColor.checked;
        const use_common_radius = this._useCommonRadius.checked;

        const description = [`<${this._app.translate("dialog.multi-markers.coordinates_token")}>`];
        let example1 = "N 47 59.765 E 007 50.964";
        let example2 = "40.712728 -74.006015";
        if (!use_common_name) {
            example1 += ";Freiburg";
            example2 += ";New York";
            description.push(`<${this._app.translate("dialog.multi-markers.name_token")}>`);
        }
        if (!use_common_color) {
            example1 += ";#FF0000";
            example2 += ";A020F0";
            description.push(`<${this._app.translate("dialog.multi-markers.color_token")}>`);
        }
        if (!use_common_radius) {
            example1 += ";5000";
            example2 += ";0";
            description.push(`<${this._app.translate("dialog.multi-markers.radius_token")}>`);
        }
        this._dataFormat.innerText = description.join(";");
        this._example.innerHTML = `${example1}<br />${example2}`;
    }
}
