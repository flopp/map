import Sortable from "sortablejs";

import {App} from "./app";
import {Color} from "./color";
import {Coordinates} from "./coordinates";
import {MapStateChange} from "./map_state";
import {Marker} from "./marker";
import {MarkerSettingsDialog} from "./marker_settings_dialog";
import {SidebarItem} from "./sidebar_item";
import {
    create_button,
    create_color_input,
    create_element,
    create_icon_button,
    create_text_input,
    parse_float,
    parse_int,
    remove_element,
} from "./utilities";

export class SidebarMarkers extends SidebarItem {
    private readonly sortable: Sortable;
    private readonly settingsDialog: MarkerSettingsDialog;

    public constructor(app: App, id: string) {
        super(app, id);

        this.settingsDialog = new MarkerSettingsDialog(app);

        document.querySelector("#btn-add-marker")!.addEventListener("click", (): void => {
            this.app.map_state.add_marker(null);
        });
        document.querySelector("#btn-delete-markers")!.addEventListener("click", (): void => {
            this.app.map_state.delete_all_markers();
        });
        document.querySelector("#btn-marker-settings")!.addEventListener("click", (): void => {
            this.settingsDialog.show();
        });

        this.sortable = Sortable.create(document.getElementById("markers")!, {
            handle: ".drag-handle",
            onEnd: (event: Sortable.SortableEvent): void => {
                if (event.oldIndex !== undefined && event.newIndex !== undefined) {
                    this.app.map_state.reorder_markers(event.oldIndex, event.newIndex);
                }
            },
        });
    }

    public update_state(changes: number): void {
        if (
            (changes & (MapStateChange.MARKERS | MapStateChange.LANGUAGE)) ===
            MapStateChange.NOTHING
        ) {
            return;
        }

        if ((changes & MapStateChange.LANGUAGE) !== 0) {
            // The language has changed
            // => remove all markers from the sidebar, such that they are all re-added.
            for (const div of document.querySelectorAll("#markers > .marker")) {
                const id = parse_int(div.getAttribute("id")!.substring(7));
                remove_element(div as HTMLElement);
                remove_element(document.querySelector(`#marker-edit-${id}`));
            }
        }

        /* update and add markers */
        this.app.map_state.markers.forEach((marker: Marker): void => {
            let div = document.querySelector(`#marker-${marker.get_id()}`);
            if (div === null) {
                div = this.create_div(marker);
                document.querySelector("#markers")!.append(div);
            }

            const circle =
                marker.radius > 0
                    ? this.app.translate("sidebar.markers.circle", marker.radius.toFixed(2))
                    : this.app.translate("sidebar.markers.no_circle");
            (div.querySelector(
                ".marker-color",
            ) as HTMLElement).style.backgroundColor = marker.color.to_hash_string();
            div.querySelector(".marker-name")!.textContent = marker.name;
            div.querySelector(".marker-radius")!.textContent = circle;
            div.querySelector(".marker-coordinates")!.textContent = marker.coordinates.to_string(
                this.app.map_state.settings_marker_coordinates_format,
            );

            this.update_edit_values(marker);
        });

        /* remove spurious markers */
        const markers = document.querySelectorAll("#markers > .marker");
        if (markers.length > this.app.map_state.markers.length) {
            const ids = new Set();
            this.app.map_state.markers.forEach((marker: Marker): void => {
                ids.add(marker.get_id().toString());
            });

            const deleted_ids: string[] = [];
            markers.forEach((m: HTMLElement): void => {
                const id = m.getAttribute("id")!.substring(7);
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id: string): void => {
                const div = document.querySelector(`#marker-${id}`);
                remove_element(div as HTMLElement);
                remove_element(document.querySelector(`#marker-edit-${id}`));
            });
        }
    }

    private create_div(marker: Marker): HTMLElement {
        const m = create_element("div", ["marker"], {
            id: `marker-${marker.get_id()}`,
        });

        const left = create_element("div", ["marker-left", "drag-handle"]);
        const color = create_element("div", ["marker-color"]);
        left.append(color);
        m.append(left);

        const center = create_element("div", ["marker-center"]);
        center.append(create_element("div", ["marker-name"]));
        center.append(create_element("div", ["marker-coordinates"]));
        center.append(create_element("div", ["marker-radius"]));
        m.append(center);

        const buttons = create_element("div", ["action-buttons", "buttons", "has-addons"]);
        // .translate("sidebar.markers.show")
        const button_search = create_icon_button("search", "sidebar.markers.show", ["is-info", "is-small"], ["icon16"], (event: Event) => {
            this.app.map_state.set_center(marker.coordinates);
            event.stopPropagation();
        });
        // .translate("sidebar.markers.copy_coordinates")
        const button_copy = create_icon_button("copy", "sidebar.markers.copy_coordinates", ["is-info", "is-small"], ["icon16"], (event: Event) => {
            const text = marker.coordinates.to_string(
                this.app.map_state.settings_marker_coordinates_format,
            );
            this.app.copyClipboard(
                text,
                this.app.translate("sidebar.markers.copy_coordinates_success_message", text),
                this.app.translate("sidebar.markers.copy_coordinates_failure_message"),
            );
            event.stopPropagation();
        });
        // .translate("sidebar.markers.projection")
        const button_project = create_icon_button("arrow-up-right", "sidebar.markers.projection", ["is-success", "is-small"], ["icon16"], (event: Event) => {
            this.app.show_projection_dialog(marker);
            event.stopPropagation();
        });
        // .translate("sidebar.markers.edit")
        const button_edit = create_icon_button("edit", "sidebar.markers.edit", ["is-warning", "is-small"], ["icon16"], (event: Event) => {
            if (document.querySelector(`#marker-edit-${marker.get_id()}`) === null) {
                const div = document.querySelector(`#marker-${marker.get_id()}`)!;
                const edit_div = this.create_edit_div(marker);
                div.parentNode!.insertBefore(edit_div, div.nextSibling);
                this.update_edit_values(marker);
            }
            event.stopPropagation();
        });
        // .translate("sidebar.markers.delete")
        const button_delete = create_icon_button("trash-2", "sidebar.markers.delete", ["is-danger", "is-small"], ["icon16"], (event: Event) => {
            this.app.map_state.delete_marker(marker.get_id());
            event.stopPropagation();
        });
        [button_search, button_project, button_copy, button_edit, button_delete].forEach((button: HTMLElement): void => {
            buttons.append(button);
            button.title = this.app.translate(button.getAttribute("data-i18n")!);
        });
        center.append(buttons);

        return m;
    }

    private create_edit_div(marker: Marker): HTMLElement {
        const div = create_element("div", ["edit"], {
            id: `marker-edit-${marker.get_id()}`,
        });

        const name = create_text_input(
            this.app.translate("sidebar.markers.edit_name"),
            "data-name",
            this.app.translate("sidebar.markers.edit_name_placeholder"),
        );
        const coordinates = create_text_input(
            this.app.translate("sidebar.markers.edit_coordinates"),
            "data-coordinates",
            this.app.translate("sidebar.markers.edit_coordinates_placeholder"),
        );
        const radius = create_text_input(
            this.app.translate("sidebar.markers.edit_radius"),
            "data-radius",
            this.app.translate("sidebar.markers.edit_radius_placeholder"),
        );
        const color = create_color_input(
            this.app.translate("sidebar.markers.edit_color"),
            "data-color",
            this.app.translate("sidebar.markers.edit_color_placeholder"),
        );

        const submit_button = create_button(this.app.translate("general.submit"), (): void => {
            this.submit_edit(marker);
        });
        const cancel_button = create_button(this.app.translate("general.cancel"), (): void => {
            div.remove();
        });
        const buttons = create_element("div", ["field", "is-grouped"]);
        buttons.append(submit_button);
        buttons.append(cancel_button);

        div.append(name);
        div.append(coordinates);
        div.append(radius);
        div.append(color);
        div.append(buttons);

        return div;
    }

    private update_edit_values(marker: Marker): void {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`);
        if (div === null) {
            return;
        }

        (div.querySelector("[data-name]") as HTMLInputElement).value = marker.name;
        (div.querySelector(
            "[data-coordinates]",
        ) as HTMLInputElement).value = marker.coordinates.to_string(
            this.app.map_state.settings_marker_coordinates_format,
        );
        (div.querySelector("[data-radius]") as HTMLInputElement).value = String(marker.radius);
        (div.querySelector(
            "[data-color]",
        ) as HTMLInputElement).value = marker.color.to_hash_string();
    }

    private submit_edit(marker: Marker): void {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`)!;
        const name = (div.querySelector("[data-name]") as HTMLInputElement).value;
        const coordinates = Coordinates.from_string(
            (div.querySelector("[data-coordinates]") as HTMLInputElement).value,
        );
        const radius = parse_float((div.querySelector("[data-radius]") as HTMLInputElement).value);
        const color = Color.from_string(
            (div.querySelector("[data-color]") as HTMLInputElement).value,
        );

        if (name.length === 0 || coordinates === null || radius === null || color === null) {
            this.app.message_error(this.app.translate("sidebar.markers.bad_values_message"));

            return;
        }

        remove_element(div as HTMLElement);

        marker.name = name;
        marker.coordinates = coordinates;
        marker.radius = radius;
        marker.color = color;
        this.app.map_state.update_marker_storage(marker);
        this.app.map_state.update_observers(MapStateChange.MARKERS);
    }
}
