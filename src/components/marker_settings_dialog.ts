import {App} from "./app";
import {Color} from "./color";
import {CoordinatesFormat, parseCoordinatesFormat} from "./coordinates";
import {Dialog} from "./dialog";
import {create_element, create_input_field, parse_float} from "./utilities";

interface ICoordinatesFormatDict {
    id: string;
    name: string;
}

export class MarkerSettingsDialog extends Dialog {
    public constructor(app: App) {
        super(MarkerSettingsDialog.create_dialog(), app);
        this._app.localize(this._div);

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

    private static create_dialog(): HTMLDivElement {
        const dialog = create_element("div", ["modal"], {
            id: "marker-settings-dialog",
        }) as HTMLDivElement;
        const modal_card = create_element("div", ["modal-card"]);
        const header = create_element("header", ["modal-card-head"]);
        const title = create_element("h2", ["modal-card-title"], {
            "data-i18n": "dialog.marker-settings.title",
        });
        header.append(title);
        header.append(
            create_element("button", ["delete"], {
                "data-cancel": null,
                "aria-label": "close",
            }),
        );
        modal_card.append(header);

        const body = create_element("section", ["modal-card-body"]);

        const format_field = create_element("div", ["field"]);
        const format_label = create_element("label", ["label"], {
            "data-i18n": "dialog.marker-settings.coordinates-format",
        });
        format_label.textContent = "Coordinates Display Format";
        format_field.append(format_label);
        const format_control = create_element("div", ["control"]);
        const format_select_wrapper = create_element("div", ["select"]);
        format_select_wrapper.append(
            create_element("select", [], {"data-coordinates-format": null}),
        );
        format_control.append(format_select_wrapper);
        format_field.append(format_control);
        body.append(format_field);

        const color_field = create_element("div", ["field"]);
        const color_label = create_element("label", ["label"], {
            "data-i18n": "dialog.marker-settings.default-color",
        });
        color_label.textContent = "Default Color";
        color_field.append(color_label);
        const random_control = create_element("div", ["control"]);
        const random_label = create_element("label", ["checkbox"]);
        random_label.append(
            create_element("input", [], {
                "data-random-color": null,
                type: "checkbox",
            }),
        );
        const random_text = create_element("span", [], {
            "data-i18n": "dialog.marker-settings.random-colors",
        });
        random_text.textContent = "Use random colors";
        random_label.append(random_text);
        random_control.append(random_label);
        const color_control = create_element("div", ["control"]);
        color_control.append(
            create_element("input", ["input"], {
                "data-color": null,
                type: "color",
                placeholder: "Color",
            }),
        );
        color_field.append(random_control, color_control);
        body.append(color_field);

        body.append(
            create_input_field({
                type: "text",
                attributes: {"data-radius": null},
                label: {
                    text: "Default Circle Radius (m)",
                    translation_key: "dialog.marker-settings.default-radius",
                },
                placeholder: {
                    text: "Circle Radius",
                    translation_key: "dialog.marker-settings.default-radius-placeholder",
                },
            }),
        );

        const filled_field = create_element("div", ["field"]);
        const filled_control = create_element("div", ["control"]);
        const filled_label = create_element("label", ["checkbox"]);
        filled_label.append(
            create_element("input", [], {
                "data-filled": null,
                type: "checkbox",
            }),
        );
        const filled_text = create_element("span", [], {
            "data-i18n": "dialog.marker-settings.filled",
        });
        filled_text.textContent = "Filled circles";
        filled_label.append(filled_text);
        filled_control.append(filled_label);
        filled_field.append(filled_control);
        body.append(filled_field);
        modal_card.append(body);

        const footer = create_element("footer", ["modal-card-foot"]);
        const apply_button = create_element("button", ["button", "is-success"], {
            "data-ok": null,
            "data-i18n": "dialog.marker-settings.apply",
        });
        footer.append(apply_button);
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
