import {App} from "./app";
import {Color} from "./color";
import {Dialog} from "./dialog";
import {Marker} from "./marker";
import {create_element, parse_float} from "./utilities";

export class ProjectionDialog extends Dialog {
    private marker: Marker | null = null;

    public constructor(app: App) {
        super(ProjectionDialog.create_dialog(), app, "https://blog.flopp.net/waypoint-projection/");
    }

    private static create_dialog(): HTMLDivElement {
        const dialog = create_element("div", ["modal"], {
            id: "projection-dialog",
        }) as HTMLDivElement;
        const modal_card = create_element("div", ["modal-card"]);

        const header = create_element("header", ["modal-card-head"]);
        const title = create_element("h2", ["modal-card-title"], {
            "data-i18n": "dialog.projection.title",
        });
        title.textContent = "Waypoint Projection";
        header.append(title);
        header.append(
            create_element("button", ["delete"], {
                "data-cancel": null,
            }),
        );
        modal_card.append(header);

        const body = create_element("section", ["modal-card-body"]);
        body.append(ProjectionDialog.create_heading("data", "Projection Data"));
        body.append(
            ProjectionDialog.create_input_field(
                "distance",
                "text",
                "Distance (m)",
                "dialog.projection.distance",
            ),
            ProjectionDialog.create_input_field(
                "bearing",
                "text",
                "Bearing (°)",
                "dialog.projection.bearing",
            ),
        );

        body.append(ProjectionDialog.create_heading("marker", "Created Marker"));
        body.append(
            ProjectionDialog.create_input_field(
                "target-name",
                "text",
                "Name of created marker",
                "dialog.projection.marker_name",
            ),
            ProjectionDialog.create_input_field(
                "target-color",
                "color",
                "Color of created marker",
                "dialog.projection.marker_color",
            ),
            ProjectionDialog.create_input_field(
                "target-radius",
                "text",
                "Circle radius of created marker",
                "dialog.projection.marker_radius",
            ),
        );

        body.append(ProjectionDialog.create_heading("line", "Created Line"));
        const line_field = create_element("div", ["field"]);
        const line_control = create_element("div", ["control"]);
        const line_label = create_element("label", ["checkbox"]);
        line_label.append(
            create_element("input", [], {
                "data-line": null,
                type: "checkbox",
            }),
        );
        const line_label_text = create_element("span", [], {
            "data-i18n": "dialog.projection.create-line",
        });
        line_label_text.textContent = "Create line?";
        line_label.append(line_label_text);
        line_control.append(line_label);
        line_field.append(line_control);
        body.append(
            line_field,
            ProjectionDialog.create_input_field(
                "line-color",
                "color",
                "Color of created line",
                "dialog.projection.line_color",
            ),
        );
        modal_card.append(body);

        const footer = create_element("footer", ["modal-card-foot"]);
        const project_button = create_element("button", ["button", "is-success"], {
            "data-ok": null,
            "data-i18n": "dialog.projection.project",
        });
        project_button.textContent = "Perform Projection";
        footer.append(project_button);
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

    private static create_heading(key: string, text: string): HTMLElement {
        const heading = create_element("h3", ["is-size-4"], {
            "data-i18n": `dialog.projection.${key}`,
        });
        heading.textContent = text;

        return heading;
    }

    private static create_input_field(
        data_key: string,
        type: "text" | "color",
        placeholder: string,
        translation_key: string,
    ): HTMLElement {
        const field = create_element("div", ["field"]);
        const control = create_element("div", ["control"]);
        control.append(
            create_element("input", ["input"], {
                [`data-${data_key}`]: null,
                type,
                placeholder,
                "data-i18n": translation_key,
                "data-i18n-target": "placeholder",
            }),
        );
        field.append(control);

        return field;
    }

    public showMarker(marker: Marker): void {
        this.marker = marker;
        (this._div.querySelector("[data-distance]") as HTMLInputElement).value = "";
        (this._div.querySelector("[data-bearing]") as HTMLInputElement).value = "";
        const name = this._app.translate("dialog.projection.new_marker_name", marker.name);
        (this._div.querySelector("[data-target-name]") as HTMLInputElement).value = name;
        (this._div.querySelector("[data-target-color]") as HTMLInputElement).value =
            marker.color.to_hash_string();
        (this._div.querySelector("[data-target-radius]") as HTMLInputElement).value = "";
        (this._div.querySelector("[data-line-color]") as HTMLInputElement).value =
            marker.color.to_hash_string();

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
        const target_marker = this._app.map_state.add_marker(coordinates, {
            name: target_name,
            radius: target_radius !== null ? target_radius : -1,
            color: target_color !== null ? target_color : this.marker!.color,
        });

        if (create_line) {
            this._app.map_state.add_line({
                marker1: this.marker!.get_id(),
                marker2: target_marker.get_id(),
                color: line_color !== null ? line_color : this.marker!.color,
            });
        }

        this.hide();
    }
}
