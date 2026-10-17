import {App} from "./app";
import {Color} from "./color";
import {Dialog} from "./dialog";
import {DistanceFormat, parseDistanceFormat} from "./distance";
import {create_element} from "./utilities";

interface IDistanceFormatDict {
    id: DistanceFormat;
    name: string;
}

export class LineSettingsDialog extends Dialog {
    private readonly _distanceFormatInput: HTMLInputElement;
    private readonly _randomColorInput: HTMLInputElement;
    private readonly _colorInput: HTMLInputElement;
    private readonly _displayDistance: HTMLInputElement;

    public constructor(app: App) {
        super(LineSettingsDialog.create_dialog(), app);
        this._app.localize(this._div);

        this._distanceFormatInput = this._div.querySelector("[data-distance-format]")!;
        this._randomColorInput = this._div.querySelector("[data-random-color]")!;
        this._colorInput = this._div.querySelector("[data-color]")!;
        this._displayDistance = this._div.querySelector("[data-display-distance]")!;

        [
            {id: DistanceFormat.m, name: "m"},
            {id: DistanceFormat.km, name: "km"},
            {id: DistanceFormat.ft, name: "ft"},
            {id: DistanceFormat.mi, name: "mi"},
        ].forEach((item: IDistanceFormatDict): void => {
            this._distanceFormatInput.append(
                new Option(
                    item.name,
                    item.id,
                    item.id === DistanceFormat.m,
                    item.id === this._app.map_state.settings_line_distance_format,
                ),
            );
        });
    }

    private static create_dialog(): HTMLDivElement {
        const dialog = create_element("div", ["modal"], {
            id: "line-settings-dialog",
        }) as HTMLDivElement;
        const modal_card = create_element("div", ["modal-card"]);
        const header = create_element("header", ["modal-card-head"]);
        header.append(
            create_element("h2", ["modal-card-title"], {
                "data-i18n": "dialog.line-settings.title",
            }),
            create_element("button", ["delete"], {
                "data-cancel": null,
                "aria-label": "close",
            }),
        );
        modal_card.append(header);

        const body = create_element("section", ["modal-card-body"]);

        const distance_format_field = create_element("div", ["field"]);
        distance_format_field.append(
            create_element("label", ["label"], {
                "data-i18n": "dialog.line-settings.distance-format",
            }),
        );
        const distance_format_control = create_element("div", ["control"]);
        const distance_format_select = create_element("div", ["select"]);
        distance_format_select.append(create_element("select", [], {"data-distance-format": null}));
        distance_format_control.append(distance_format_select);
        distance_format_field.append(distance_format_control);
        body.append(distance_format_field);

        const color_field = create_element("div", ["field"]);
        const color_label = create_element("label", ["label"], {
            "data-i18n": "dialog.line-settings.default-color",
        });
        color_label.textContent = "Default Color";
        color_field.append(color_label);
        const random_color_control = create_element("div", ["control"]);
        const random_color_label = create_element("label", ["checkbox"]);
        random_color_label.append(
            create_element("input", [], {
                "data-random-color": null,
                type: "checkbox",
            }),
        );
        const random_color_text = create_element("span", [], {
            "data-i18n": "dialog.line-settings.random-colors",
        });
        random_color_text.textContent = "Use random colors";
        random_color_label.append(random_color_text);
        random_color_control.append(random_color_label);

        const color_control = create_element("div", ["control"]);
        color_control.append(
            create_element("input", ["input"], {
                "data-color": null,
                type: "color",
                placeholder: "Color",
            }),
        );
        color_field.append(random_color_control, color_control);
        body.append(color_field);

        const display_distance_field = create_element("div", ["field"]);
        const display_distance_label = create_element("label", ["label"], {
            "data-i18n": "dialog.line-settings.display-distance",
        });
        display_distance_label.textContent = "Display Distance";
        display_distance_field.append(display_distance_label);
        const display_distance_control = create_element("div", ["control"]);
        const display_distance_checkbox_label = create_element("label", ["checkbox"]);
        display_distance_checkbox_label.append(
            create_element("input", [], {
                "data-display-distance": null,
                type: "checkbox",
            }),
        );
        const display_distance_text = create_element("span", [], {
            "data-i18n": "dialog.line-settings.display-distance-text",
        });
        display_distance_text.textContent = "Display line distance on map";
        display_distance_checkbox_label.append(display_distance_text);
        display_distance_control.append(display_distance_checkbox_label);
        display_distance_field.append(display_distance_control);
        body.append(display_distance_field);
        modal_card.append(body);

        const footer = create_element("footer", ["modal-card-foot"]);
        footer.append(
            create_element("button", ["button", "is-success"], {
                "data-ok": null,
                "data-i18n": "dialog.line-settings.apply",
            }),
        );
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
        this._distanceFormatInput.value = this._app.map_state.settings_line_distance_format;
        this._randomColorInput.checked = this._app.map_state.settings_line_random_color;
        this._colorInput.value = this._app.map_state.settings_line_color.to_hash_string();
        this._displayDistance.checked = this._app.map_state.settings_line_display_distance;

        super.show();
    }

    public ok(): void {
        const distance_format = parseDistanceFormat(
            this._distanceFormatInput.value,
            DistanceFormat.m,
        );
        const random_color = this._randomColorInput.checked;
        const color = Color.from_string(this._colorInput.value);
        if (color === null) {
            this._app.message_error(this._app.translate("dialog.line-settings.bad_values_message"));

            return;
        }

        this._app.map_state.set_default_line_settings({
            distance_format,
            random_color,
            color,
        });

        this._app.map_state.set_display_distance(this._displayDistance.checked);

        this.hide();
    }
}
