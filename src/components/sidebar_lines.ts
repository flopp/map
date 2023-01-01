import Sortable from "sortablejs";

import {App} from "./app";
import {Color} from "./color";
import {Line} from "./line";
import {LineSettingsDialog} from "./line_settings_dialog";
import {MapStateChange} from "./map_state";
import {Marker} from "./marker";
import {SidebarItem} from "./sidebar_item";
import {
    create_button,
    create_icon_button,
    create_color_input,
    create_element,
    create_select_input,
    parse_int,
    remove_element,
} from "./utilities";

export class SidebarLines extends SidebarItem {
    private readonly sortable: Sortable;
    private readonly settingsDialog: LineSettingsDialog;

    public constructor(app: App, id: string) {
        super(app, id);

        document.querySelector("#btn-add-line")!.addEventListener("click", (): void => {
            this.app.map_state.add_line();
        });
        document.querySelector("#btn-delete-lines")!.addEventListener("click", (): void => {
            this.app.map_state.delete_all_lines();
        });

        this.settingsDialog = new LineSettingsDialog(app);

        document.querySelector("#btn-line-settings")!.addEventListener("click", (): void => {
            this.settingsDialog.show();
        });

        this.sortable = Sortable.create(document.getElementById("lines")!, {
            handle: ".drag-handle",
            onEnd: (event: Sortable.SortableEvent): void => {
                if (event.oldIndex !== undefined && event.newIndex !== undefined) {
                    this.app.map_state.reorder_lines(event.oldIndex, event.newIndex);
                }
            },
        });
    }

    public update_state(changes: number): void {
        if ((changes & (MapStateChange.LINES | MapStateChange.LANGUAGE)) !== 0) {
            if ((changes & MapStateChange.LANGUAGE) !== 0) {
                // The language has changed
                // => remove all lines from the sidebar, such that they are all re-added.
                for (const div of document.querySelectorAll("#lines > .line")) {
                    const id = parse_int(div.getAttribute("id")!.substring(5));
                    remove_element(div as HTMLElement);
                    remove_element(document.querySelector(`#line-edit-${id}`));
                }
            }

            // Update and add lines
            this.app.map_state.lines.forEach((line: Line): void => {
                let div = document.querySelector(`#line-${line.get_id()}`);
                if (div === null) {
                    div = this.create_div(line);
                    document.querySelector("#lines")!.append(div);
                }

                const length =
                    line.length !== null
                        ? line.length.to_string(this.app.map_state.settings_line_distance_format)
                        : "n/a";
                const bearing = line.bearing !== null ? `${line.bearing.toFixed(2)}°` : "n/a";

                (div.querySelector(
                    ".line-color",
                ) as HTMLElement).style.backgroundColor = line.color.to_hash_string();
                div.querySelector(".line-from")!.textContent = this.marker_name(line.marker1);
                div.querySelector(".line-to")!.textContent = this.marker_name(line.marker2);
                div.querySelector(".line-distance")!.textContent = length;
                div.querySelector(".line-bearing")!.textContent = bearing;
            });

            /* remove spurious lines */
            const lines = document.querySelectorAll("#lines > .line");
            if (lines.length > this.app.map_state.lines.length) {
                const ids = new Set();
                this.app.map_state.lines.forEach((line: Line): void => {
                    ids.add(line.get_id().toString());
                });

                const deleted_ids: string[] = [];
                lines.forEach((obj: HTMLElement): void => {
                    const id = obj.getAttribute("id")!.substring(5);
                    if (!ids.has(id)) {
                        deleted_ids.push(id);
                    }
                });

                deleted_ids.forEach((id: string): void => {
                    remove_element(document.querySelector(`#line-${id}`));
                    remove_element(document.querySelector(`#line-element-${id}`));
                });
            }
        }

        if ((changes & (MapStateChange.MARKERS | MapStateChange.LINES)) !== 0) {
            this.app.map_state.lines.forEach((line: Line): void => {
                this.update_edit_values(line);
            });
        }
    }

    private create_row(table: HTMLElement, label_i18n: string, cls: string): void {
        const tr = create_element("tr");
        const td1 = create_element("td", ["has-text-weight-semibold"], {"data-i18n": label_i18n});
        td1.textContent = this.app.translate(label_i18n);
        tr.append(td1);
        const td2 = create_element("td", [cls]);
        tr.append(td2);
        table.append(tr);
    }

    private create_div(line: Line): HTMLElement {
        const div = create_element("div", ["line"], {
            id: `line-${line.get_id()}`,
        });
        const left = create_element("div", ["line-left", "drag-handle"]);
        const color = create_element("div", ["line-color"]);
        left.append(color);
        div.append(left);

        const center = create_element("div", ["line-center"]);
        const table = create_element("table");
        this.create_row(table, "sidebar.lines.from", "line-from"); // .translate("sidebar.lines.from")
        this.create_row(table, "sidebar.lines.to", "line-to"); // .translate("sidebar.lines.to")
        this.create_row(table, "sidebar.lines.length", "line-distance"); // .translate("sidebar.lines.length")
        this.create_row(table, "sidebar.lines.bearing", "line-bearing"); // .translate("sidebar.lines.bearing")
        center.append(table);
        div.append(center);

        const buttons = create_element("div", ["action-buttons", "buttons", "has-addons"]);
        // .translate("sidebar.lines.show")
        const button_search = create_icon_button("search", "sidebar.lines.show", ["is-info", "is-small"], ["icon16"], (event: Event) => {
            this.app.map_state.show_line(line);
            event.stopPropagation();
        });
        // .translate("sidebar.lines.edit")
        const button_edit = create_icon_button("edit", "sidebar.lines.edit", ["is-warning", "is-small"], ["icon16"], (event: Event) => {
            if (document.querySelector(`#line-edit-${line.get_id()}`) === null) {
                const div = document.querySelector(`#line-${line.get_id()}`)!;
                const edit_div = this.create_edit_div(line);
                div.parentNode!.insertBefore(edit_div, div.nextSibling);
                this.update_edit_values(line);
            }
            event.stopPropagation();
        });
        // .translate("sidebar.lines.delete")
        const button_delete = create_icon_button("trash-2", "sidebar.lines.delete", ["is-danger", "is-small"], ["icon16"], (event: Event) => {
            this.app.map_state.delete_line(line.get_id());
            event.stopPropagation();
        });
        [button_search, button_edit, button_delete].forEach(button => {
            buttons.append(button);
            button.title = this.app.translate(button.getAttribute("data-i18n")!);    
        });
        center.append(buttons);

        div.addEventListener("click", (): void => {
            this.app.map_state.show_line(line);
        });

        return div;
    }

    private marker_name(id: number): string {
        if (id === -1) {
            return this.app.translate("general.no_marker_tag");
        }

        const marker = this.app.map_state.get_marker(id);
        if (marker !== null) {
            return marker.name;
        }

        return this.app.translate("general.no_marker_tag");
    }

    private create_edit_div(line: Line): HTMLElement {
        const div = create_element("div", ["edit"], {
            id: `line-edit-${line.get_id()}`,
        });
        const from = create_select_input(
            this.app.translate("sidebar.lines.edit_from"),
            "data-from",
        );
        const to = create_select_input(this.app.translate("sidebar.lines.edit_to"), "data-to");
        const color = create_color_input(
            this.app.translate("sidebar.lines.edit_color"),
            "data-color",
            this.app.translate("sidebar.lines.edit_color_placeholder"),
        );

        const submit_button = create_button(this.app.translate("general.submit"), (): void => {
            this.submit_edit(line);
        });
        const cancel_button = create_button(this.app.translate("general.cancel"), (): void => {
            div.remove();
        });
        const buttons = create_element("div", ["field", "is-grouped"]);
        buttons.append(submit_button);
        buttons.append(cancel_button);

        div.append(from);
        div.append(to);
        div.append(color);
        div.append(buttons);

        return div;
    }

    private update_edit_values(line: Line): void {
        const div = document.querySelector(`#line-edit-${line.get_id()}`);
        if (div === null) {
            return;
        }

        interface INameId {
            name: string;
            id: number;
        }

        const markers = [{name: this.app.translate("general.no_marker_tag"), id: -1}];
        this.app.map_state.markers.forEach((marker: Marker): void => {
            markers.push({name: marker.name, id: marker.get_id()});
        });
        markers.sort((a: INameId, b: INameId): number => {
            if (a.id < 0) {
                return -1;
            }
            if (b.id < 0) {
                return +1;
            }

            return a.name.localeCompare(b.name);
        });

        const from_select = div.querySelector("[data-from]")!;
        from_select.innerHTML = "";
        markers.forEach((name_id: INameId): void => {
            from_select.append(
                new Option(name_id.name, String(name_id.id), false, name_id.id === line.marker1),
            );
        });

        const to_select = div.querySelector("[data-to]")!;
        to_select.innerHTML = "";
        markers.forEach((name_id: INameId): void => {
            to_select.append(
                new Option(name_id.name, String(name_id.id), false, name_id.id === line.marker2),
            );
        });

        (div.querySelector("[data-color]") as HTMLInputElement).value = line.color.to_hash_string();
    }

    private submit_edit(line: Line): void {
        const div = document.querySelector(`#line-edit-${line.get_id()}`) as HTMLElement;
        const marker1 = parse_int((div.querySelector("[data-from]") as HTMLInputElement).value);
        const marker2 = parse_int((div.querySelector("[data-to]") as HTMLInputElement).value);
        const color = Color.from_string(
            (div.querySelector("[data-color]") as HTMLInputElement).value,
        );

        if (color === null) {
            this.app.message_error(this.app.translate("sidebar.lines.bad_values_message"));

            return;
        }

        remove_element(div);

        line.marker1 = marker1 !== null ? marker1 : -1;
        line.marker2 = marker2 !== null ? marker2 : -1;
        line.color = color;

        this.app.map_state.update_line_storage(line);
        this.app.map_state.update_observers(MapStateChange.LINES);
    }
}
