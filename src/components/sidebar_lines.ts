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
    create_color_input,
    create_element,
    create_icon_button,
    create_select_input,
    parse_int,
    remove_element,
} from "./utilities";

interface INameId {
    name: string;
    id: number;
}

export class SidebarLines extends SidebarItem {
    private readonly sortable: Sortable;
    private readonly settingsDialog: LineSettingsDialog;

    public constructor(app: App, id: string) {
        super(app, id);

        document.querySelector("#btn-add-line")!.addEventListener("click", (): void => {
            this.app.map_state.add_line();
        });
        document.querySelector("#btn-delete-lines")!.addEventListener("click", (): void => {
            if (this.app.map_state.lines.length === 0) {
                return;
            }
            this.app.yesNoDialog(
                this.app.translate("sidebar.lines.delete_all"),
                this.app.translate("sidebar.lines.delete_all_question"),
                () => {
                    this.app.map_state.delete_all_lines();
                },
            );
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

    public update_state(changes: number, _marker_id: number = -1): void {
        if ((changes & (MapStateChange.LINES | MapStateChange.LANGUAGE | MapStateChange.MARKERS)) === 0) {
            return;
        }

        const markers = this.get_markers();

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
        let scrollTo: Element|null = null;
        const container = document.querySelector("#lines")!;
        this.app.map_state.lines.forEach((line: Line): void => {
            let div = document.querySelector(`#line-${line.get_id()}`);
            if (div === null) {
                div = this.create_div(line);
                container.append(div);
                scrollTo = div;
            }

            (div.querySelector(
                ".line-color",
            ) as HTMLElement).style.backgroundColor = line.color.to_hash_string();

            const from_select = div.querySelector("[data-from]")!;
            const to_select = div.querySelector("[data-to]")!;
            from_select.innerHTML = "";
            to_select.innerHTML = "";
            markers.forEach((name_id: INameId): void => {
                from_select.append(
                    new Option(name_id.name, String(name_id.id), false, name_id.id === line.marker1),
                );
                to_select.append(
                    new Option(name_id.name, String(name_id.id), false, name_id.id === line.marker2),
                );
            });

            let stats = "n/a";
            if (line.length !== null) {
                const length = line.length.to_string(this.app.map_state.settings_line_distance_format);
                stats = (line.bearing !== null) ? `${length}, ${line.bearing.toFixed(2)}°` : length;
            }
            div.querySelector(".line-stats")!.textContent = stats;

            this.update_edit_values(line);
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
                remove_element(document.querySelector(`#line-edit-${id}`));
            });
        }

        if (scrollTo !== null) {
            (scrollTo as HTMLElement).scrollIntoView(false);
        }
    }

    private get_markers(): INameId[] {
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

            return a.name.localeCompare(b.name, "en", {numeric: true});
        });

        return markers;
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
        const from = create_select_input("data-from");
        from.select.onchange = (): void => {
            this.set_from(line, parse_int(from.select.value));
        };
        const to = create_select_input("data-to");
        to.select.onchange = (): void => {
            this.set_to(line, parse_int(to.select.value));
        };
        center.append(from.div);
        center.append(to.div);
        center.append(create_element("div", ["line-stats"]));
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
                const line_div = document.querySelector(`#line-${line.get_id()}`)!;
                const edit_div = this.create_edit_div(line);
                line_div.parentNode!.insertBefore(edit_div, line_div.nextSibling);
                this.update_edit_values(line);
                edit_div.scrollIntoView(false);
            }
            event.stopPropagation();
        });
        // .translate("sidebar.lines.delete")
        const button_delete = create_icon_button("trash-2", "sidebar.lines.delete", ["is-danger", "is-small"], ["icon16"], (event: Event) => {
            this.app.map_state.delete_line(line.get_id());
            event.stopPropagation();
        });
        [button_search, button_edit, button_delete].forEach((button: HTMLElement) => {
            buttons.append(button);
            button.title = this.app.translate(button.getAttribute("data-i18n")!);
        });
        center.append(buttons);

        return div;
    }

    private create_edit_div(line: Line): HTMLElement {
        const div = create_element("div", ["edit"], {
            id: `line-edit-${line.get_id()}`,
        });
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

        div.append(color);
        div.append(buttons);

        return div;
    }

    private update_edit_values(line: Line): void {
        const div = document.querySelector(`#line-edit-${line.get_id()}`);
        if (div !== null) {
            (div.querySelector("[data-color]") as HTMLInputElement).value = line.color.to_hash_string();
        }
    }

    private submit_edit(line: Line): void {
        const div = document.querySelector(`#line-edit-${line.get_id()}`) as HTMLElement;
        const color = Color.from_string(
            (div.querySelector("[data-color]") as HTMLInputElement).value,
        );

        if (color === null) {
            this.app.message_error(this.app.translate("sidebar.lines.bad_values_message"));

            return;
        }

        remove_element(div);

        if (!line.color.equals(color)) {
            line.color = color;

            this.app.map_state.update_line_storage(line);
            this.app.map_state.update_observers(MapStateChange.LINES);
        }
    }

    private set_from(line: Line, marker: number|null): void {
        const m = marker !== null ? marker : -1;
        if (line.marker1 === m) {
            return;
        }

        line.marker1 = m;

        this.app.map_state.update_line_storage(line);
        this.app.map_state.update_observers(MapStateChange.LINES);
    }

    private set_to(line: Line, marker: number|null): void {
        const m = marker !== null ? marker : -1;
        if (line.marker2 === m) {
            return;
        }

        line.marker2 = m;

        this.app.map_state.update_line_storage(line);
        this.app.map_state.update_observers(MapStateChange.LINES);
    }
}
