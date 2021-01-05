import Sortable from 'sortablejs';

import {App} from './app';
import {Color} from './color';
import {Line} from './line';
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";
import {Marker} from './marker';
import {
    create_button,
    create_dropdown,
    create_element,
    create_color_input,
    create_select_input,
    parse_int,
    remove_element,
} from './utilities';

export class SidebarLines extends MapStateObserver {
    private settingsDiv: HTMLElement;
    private sortable: Sortable;

    constructor(app: App) {
        super(app);

        const self = this;

        document.querySelector('#btn-add-line').addEventListener('click', (): void => {
            self.app.map_state.add_line();
        });
        document.querySelector('#btn-delete-lines').addEventListener('click', (): void => {
            self.app.map_state.delete_all_lines();
        });

        this.settingsDiv = document.querySelector('#line-settings');
        this.hide_settings();
        document.querySelector('#btn-line-settings').addEventListener('click', (): void => {
            self.toggle_settings();
        });
        this.settingsDiv.querySelector('[data-cancel]').addEventListener('click', (): void => {
            self.hide_settings();
        });
        this.settingsDiv.querySelector('[data-submit]').addEventListener('click', (): void => {
            self.submit_settings();
        });

        this.sortable = Sortable.create(document.getElementById('lines'), {
            onEnd: (event: Sortable.SortableEvent): void => {
                self.app.map_state.reorder_lines(event.oldIndex, event.newIndex);
            },
        });
    }

    public update_state(changes: number): void {
        const self = this;
        if (changes & MapStateChange.LINES) {
            // update and add lines
            this.app.map_state.lines.forEach((line: Line): void => {
                let div = document.querySelector(`#line-${line.get_id()}`);
                if (div === null) {
                    div = self.create_div(line);
                    document.querySelector('#lines').appendChild(div);
                }

                const length =
                    line.length !== null ? `${line.length.toFixed(2)} m` : 'n/a';
                const bearing =
                    line.bearing !== null
                        ? `${line.bearing.toFixed(2)}°`
                        : 'n/a';

                (div.querySelector(".line-color") as HTMLElement).style.backgroundColor = line.color.to_hash_string();
                div.querySelector(".line-from").textContent = self.marker_name(line.marker1);
                div.querySelector(".line-to").textContent = self.marker_name(line.marker2);
                div.querySelector(".line-distance").textContent = length;
                div.querySelector(".line-bearing").textContent = bearing;
            });

            /* remove spurious lines */
            const lines = document.querySelectorAll('#lines > .line');
            if (lines.length > this.app.map_state.lines.length) {
                const ids = new Set();
                this.app.map_state.lines.forEach((line: Line): void => {
                    ids.add(line.get_id());
                });

                const deleted_ids = [];
                lines.forEach((obj: HTMLElement): void => {
                    const id = parse_int(obj.getAttribute("id").substring(5));
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

        this.update_settings_display();

        if (changes & (MapStateChange.MARKERS | MapStateChange.LINES)) {
            this.app.map_state.lines.forEach((line: Line): void => {
                self.update_edit_values(line);
            });
        }
    }

    private create_row(table: HTMLElement, label: string, cls: string): void {
        const tr = create_element("tr");
        const td1 = create_element("td", ["has-text-weight-semibold"]);
        td1.textContent = label;
        tr.appendChild(td1);
        const td2 = create_element("td", [cls]);
        tr.appendChild(td2);
        table.appendChild(tr);
    }

    private create_div(line: Line): HTMLElement {
        const self = this;

        const div = create_element("div", ["line"], {"id": `line-${line.get_id()}`});

        const left = create_element("div", ["line-left"]);
        const color = create_element("div", ["line-color"]);
        left.appendChild(color);
        div.appendChild(left);

        const center = create_element("div", ["line-center"]);
        const table = create_element("table");
        this.create_row(table, self.app.translate('sidebar.lines.from'), "line-from");
        this.create_row(table, self.app.translate('sidebar.lines.to'), "line-to");
        this.create_row(table, self.app.translate('sidebar.lines.length'), "line-distance");
        this.create_row(table, self.app.translate('sidebar.lines.bearing'), "line-bearing");
        center.appendChild(table);
        div.appendChild(center);

        const right = create_element("div", ["line-right"]);
        right.appendChild(this.create_line_dropdown(line));
        div.appendChild(right);

        div.addEventListener('click', (): void => {
            self.app.map_state.show_line(line);
        });

        return div;
    }

    private marker_name(id: number): string {
        if (id === -1) {
            return this.app.translate('general.no_marker_tag');
        }

        const marker = this.app.map_state.get_marker(id);
        if (marker) {
            return marker.name;
        }

        return this.app.translate('general.no_marker_tag');
    }

    private create_edit_div(line: Line): HTMLElement {
        const self = this;

        const div = create_element("div", ["edit"], {"id": `line-edit-${line.get_id()}`});

        const from = create_select_input(this.app.translate('sidebar.lines.edit_from'), 'data-from');
        const to = create_select_input(this.app.translate('sidebar.lines.edit_to'), 'data-to');
        const color = create_color_input(
            this.app.translate('sidebar.lines.edit_color'),
            'data-color',
            this.app.translate('sidebar.lines.edit_color_placeholder'));

        const submit_button = create_button(this.app.translate('general.submit'), (): void => {
            self.submit_edit(line);
        });
        const cancel_button = create_button(this.app.translate('general.cancel'), (): void => {
            div.remove();
        });
        const buttons = create_element("div", ["field", "is-grouped"]);
        buttons.appendChild(submit_button);
        buttons.appendChild(cancel_button);

        div.appendChild(from);
        div.appendChild(to);
        div.appendChild(color);
        div.appendChild(buttons);

        return div;
    }

    private create_line_dropdown(line: Line): HTMLElement {
        const self = this;
        return create_dropdown([
            {
                label: this.app.translate('sidebar.lines.edit'),
                callback: (): void => {
                    if (document.querySelector(`#line-edit-${line.get_id()}`) === null) {
                        const div = document.querySelector(`#line-${line.get_id()}`);
                        const edit_div = self.create_edit_div(line);
                        div.parentNode.insertBefore(edit_div, div.nextSibling);
                        self.update_edit_values(line);
                    }
                },
            },
            {
                label: this.app.translate('sidebar.lines.delete'),
                callback: (): void => {
                    self.app.map_state.delete_line(line.get_id());
                },
            },
        ]);
    }

    private update_edit_values(line: Line): void {
        const div = document.querySelector(`#line-edit-${line.get_id()}`);
        if (div === null) {
            return;
        }

        interface NameId {name: string, id: number};

        const markers = [{name: this.app.translate('general.no_marker_tag'), id: -1}];
        this.app.map_state.markers.forEach((marker: Marker): void => {
            markers.push({name: marker.name, id: marker.get_id()});
        });
        markers.sort((a: NameId, b: NameId): number => {
            if (a.id < 0) {
                return -1;
            }
            if (b.id < 0) {
                return +1;
            }
            return a.name.localeCompare(b.name);
        });

        const from_select = div.querySelector('[data-from]');
        from_select.innerHTML = "";
        markers.forEach((name_id: NameId): void => {
            from_select.appendChild(new Option(
                name_id.name,
                String(name_id.id),
                false,
                name_id.id === line.marker1)
            );
        });

        const to_select = div.querySelector('[data-to]');
        to_select.innerHTML = "";
        markers.forEach((name_id: NameId): void => {
            to_select.appendChild(new Option(
                name_id.name,
                String(name_id.id),
                false,
                name_id.id === line.marker2)
            );
        });

        (div.querySelector('[data-color]') as HTMLInputElement).value = line.color.to_hash_string();
    }

    private submit_edit(line: Line): void {
        const div = (document.querySelector(`#line-edit-${line.get_id()}`) as HTMLElement);
        const marker1 = parse_int((div.querySelector('[data-from]') as HTMLInputElement).value);
        const marker2 = parse_int((div.querySelector('[data-to]') as HTMLInputElement).value);
        const color = Color.from_string((div.querySelector('[data-color]') as HTMLInputElement).value);

        if (!color) {
            this.app.message_error(this.app.translate('sidebar.lines.bad_values_message'));
            return;
        }

        remove_element(div);

        line.marker1 = marker1;
        line.marker2 = marker2;
        line.color = color;

        this.app.map_state.update_line_storage(line);
        this.app.map_state.update_observers(MapStateChange.LINES);
    }

    private settings_shown(): boolean {
        return !this.settingsDiv.classList.contains('is-hidden');
    }

    private show_settings(): void {
        if (this.settings_shown()) {
            return;
        }

        this.settingsDiv.classList.remove('is-hidden');
        this.update_settings_display();
    }

    private hide_settings(): void {
        this.settingsDiv.classList.add('is-hidden');
    }

    private toggle_settings(): void {
        if (this.settings_shown()) {
            this.hide_settings();
        } else {
            this.show_settings();
        }
    }

    private submit_settings(): void {
        const random_color = (this.settingsDiv
            .querySelector('[data-random-color]') as HTMLInputElement)
            .checked;
        const color = Color.from_string(
            (this.settingsDiv.querySelector('[data-color]') as HTMLInputElement).value,
        );

        if (color === null) {
            this.app.message_error(this.app.translate('sidebar.lines.bad_values_message'));
            return;
        }

        this.app.map_state.set_default_line_settings({random_color, color});

        this.hide_settings();
    }

    private update_settings_display(): void {
        if (!this.settings_shown()) {
            return;
        }

        (this.settingsDiv
            .querySelector('[data-random-color]') as HTMLInputElement)
            .checked = this.app.map_state.settings_line_random_color;
        (this.settingsDiv
            .querySelector('[data-color]') as HTMLInputElement)
            .value = this.app.map_state.settings_line_color.to_hash_string();
    }
}
