import Sortable from 'sortablejs';

import {App} from './app';
import {Color} from './color';
import {Coordinates, CoordinatesFormat} from './coordinates';
import {MapStateChange} from './map_state';
import {MapStateObserver} from "./map_state_observer";
import {Marker} from './marker';
import {
    parse_float,
    parse_int,
    create_button,
    create_dropdown,
    create_element,
    create_text_input,
    create_color_input,
    remove_element,
} from './utilities';

export class SidebarMarkers extends MapStateObserver {
    private settingsDiv: HTMLElement;
    private sortable: Sortable;

    constructor(app: App) {
        super(app);

        const self = this;

        document.querySelector('#btn-add-marker').addEventListener('click', (): void => {
            self.app.map_state.add_marker(null);
        });
        document.querySelector('#btn-delete-markers').addEventListener('click', (): void => {
            self.app.map_state.delete_all_markers();
        });

        interface CoordinatesFormatDict {id: string, name: string};
        this.settingsDiv = document.querySelector('#marker-settings');
        this.hide_settings();
        [
            {id: CoordinatesFormat.D, name: 'Degrees'},
            {id: CoordinatesFormat.DM, name: 'Degrees+Minutes'},
            {id: CoordinatesFormat.DMS, name: 'Degrees+Minutes+Seconds'},
        ].forEach((item: CoordinatesFormatDict): void => {
            this.settingsDiv.querySelector('[data-coordinates-format]').appendChild(
                new Option(
                    item.name,
                    item.id,
                    item.id === CoordinatesFormat.DM,
                    item.id === Coordinates.get_coordinates_format()
                )
            );
        });
        document.querySelector('#btn-marker-settings').addEventListener('click', (): void => {
            self.toggle_settings();
        });
        this.settingsDiv.querySelector('[data-cancel]').addEventListener('click', (): void => {
            self.hide_settings();
        });
        this.settingsDiv.querySelector('[data-submit]').addEventListener('click', (): void => {
            self.submit_settings();
        });

        this.sortable = Sortable.create(document.getElementById('markers'), {
            onEnd: (event: Sortable.SortableEvent): void => {
                self.app.map_state.reorder_markers(
                    event.oldIndex,
                    event.newIndex,
                );
            },
        });
    }

    public update_state(changes: number): void {
        if ((changes & (MapStateChange.MARKERS | MapStateChange.LANGUAGE)) === MapStateChange.NOTHING) {
            return;
        }

        const self = this;

        if (changes & MapStateChange.LANGUAGE) {
            // The language has changed
            // => remove all markers from the sidebar, such that they are all re-added.
            for (const div of document.querySelectorAll('#markers > .marker')) {
                const id = parse_int(div.getAttribute("id").substring(7));
                remove_element(div as HTMLElement);
                remove_element(document.querySelector(`#marker-edit-${id}`));
            }
        }

        /* update and add markers */
        this.app.map_state.markers.forEach((marker: Marker): void => {
            let div = document.querySelector(`#marker-${marker.get_id()}`);
            if (div === null) {
                div = self.create_div(marker);
                document.querySelector('#markers').appendChild(div);
            }

            const circle =
                marker.radius > 0
                    ? self.app.translate('sidebar.markers.circle').replace('{1}', marker.radius.toFixed(2))
                    : self.app.translate('sidebar.markers.no_circle');
            (div.querySelector('.marker-color') as HTMLElement).style.backgroundColor = marker.color.to_hash_string();
            div.querySelector('.marker-name').textContent = marker.name;
            div.querySelector('.marker-radius').textContent = circle;
            div.querySelector('.marker-coordinates').textContent = marker.coordinates.to_string_format(
                self.app.map_state.settings_marker_coordinates_format,
            );

            self.update_edit_values(marker);
        });

        /* remove spurious markers */
        const markers = document.querySelectorAll('#markers > .marker');
        if (markers.length > this.app.map_state.markers.length) {
            const ids = new Set();
            this.app.map_state.markers.forEach((marker: Marker): void => {
                ids.add(marker.get_id());
            });

            const deleted_ids = [];
            markers.forEach((m: HTMLElement): void => {
                const id = parse_int(m.getAttribute("id").substring(7));
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id: number): void => {
                const div = document.querySelector(`#marker-${id}`);
                remove_element(div as HTMLElement);
                remove_element(document.querySelector(`#marker-edit-${id}`));
            });
        }

        this.update_settings_display();
    }

    private create_div(marker: Marker): HTMLElement {
        const self = this;
        const m = create_element('div', ["marker"], {"id": `marker-${marker.get_id()}`});

        const left = create_element('div', ["marker-left"]);
        const color = create_element('div', ["marker-color"]);
        left.appendChild(color);
        m.appendChild(left);

        const center = create_element('div', ["marker-center"]);
        ["name", "coordinates", "radius"].forEach((name: string): void => {
            const div = create_element('div', [`marker-${name}`]);
            center.appendChild(div);
        });
        m.appendChild(center);

        const right = create_element('div', ["marker-right"]);
        right.appendChild(this.create_marker_dropdown(marker));
        m.appendChild(right);

        m.addEventListener('click', (): void => {
            self.app.map_state.set_center(marker.coordinates);
        });

        return m;
    }

    private create_edit_div(marker: Marker): HTMLElement {
        const self = this;

        const div = create_element("div", ["edit"], {"id": `marker-edit-${marker.get_id()}`});

        const name = create_text_input(
            this.app.translate('sidebar.markers.edit_name'),
            'data-name',
            this.app.translate('sidebar.markers.edit_name_placeholder'));
        const coordinates = create_text_input(
            this.app.translate('sidebar.markers.edit_coordinates'),
            'data-coordinates',
            this.app.translate('sidebar.markers.edit_coordinates_placeholder'),
        );
        const radius = create_text_input(
            this.app.translate('sidebar.markers.edit_radius'),
            'data-radius',
            this.app.translate('sidebar.markers.edit_radius_placeholder'),
        );
        const color = create_color_input(
            this.app.translate('sidebar.markers.edit_color'),
            'data-color',
            this.app.translate('sidebar.markers.edit_color_placeholder'));

        const submit_button = create_button(this.app.translate('general.submit'), (): void => {
            self.submit_edit(marker);
        });
        const cancel_button = create_button(this.app.translate('general.cancel'), (): void => {
            div.remove();
        });
        const buttons = create_element("div", ["field", "is-grouped"]);
        buttons.appendChild(submit_button);
        buttons.appendChild(cancel_button);

        div.appendChild(name);
        div.appendChild(coordinates);
        div.appendChild(radius);
        div.appendChild(color);
        div.appendChild(buttons);

        return div;
    }

    private create_marker_dropdown(marker: Marker): HTMLElement {
        const self = this;
        return create_dropdown([
            {
                label: self.app.translate('sidebar.markers.edit'),
                callback: (): void => {
                    if (document.querySelector(`#marker-edit-${marker.get_id()}`) === null) {
                        const div = document.querySelector(`#marker-${marker.get_id()}`);
                        const edit_div = self.create_edit_div(marker);
                        div.parentNode.insertBefore(edit_div, div.nextSibling);
                        self.update_edit_values(marker);
                    }
                },
            },
            {
                label: self.app.translate('sidebar.markers.projection'),
                callback: (): void => {
                    self.app.show_projection_dialog(marker);
                },
            },
            {
                label: self.app.translate('sidebar.markers.delete'),
                callback: (): void => {
                    self.app.map_state.delete_marker(marker.get_id());
                },
            },
        ]);
    }

    private update_edit_values(marker: Marker): void {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`);
        if (div === null) {
            return;
        }

        (div.querySelector('[data-name]') as HTMLInputElement).value = marker.name;
        (div.querySelector('[data-coordinates]') as HTMLInputElement).value = marker.coordinates.to_string_format(
            this.app.map_state.settings_marker_coordinates_format,
        );
        (div.querySelector('[data-radius]') as HTMLInputElement).value = String(marker.radius);
        (div.querySelector('[data-color]') as HTMLInputElement).value = marker.color.to_hash_string();
    }

    private submit_edit(marker: Marker): void {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`);
        const name = (div.querySelector('[data-name]') as HTMLInputElement).value;
        const coordinates = Coordinates.from_string(
            (div.querySelector('[data-coordinates]') as HTMLInputElement).value,
        );
        const radius = parse_float((div.querySelector('[data-radius]') as HTMLInputElement).value);
        const color = Color.from_string((div.querySelector('[data-color]') as HTMLInputElement).value);

        if (name.length === 0 || !coordinates || radius === null || !color) {
            this.app.message_error(this.app.translate('sidebar.markers.bad_values_message'));
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
        const coordinates_format = (this.settingsDiv
            .querySelector('[data-coordinates-format]') as HTMLInputElement)
            .value;
        const random_color = (this.settingsDiv
            .querySelector('[data-random-color]') as HTMLInputElement)
            .checked;
        const color = Color.from_string(
            (this.settingsDiv.querySelector('[data-color]') as HTMLInputElement).value,
        );
        const radius = parse_float((this.settingsDiv.querySelector('[data-radius]') as HTMLInputElement).value);
        if (color === null || radius === null) {
            this.app.message_error(this.app.translate('sidebar.markers.bad_values_message'));
            return;
        }

        this.app.map_state.set_default_marker_settings({ coordinates_format, random_color, color, radius });

        this.hide_settings();
    }

    private update_settings_display(): void {
        if (!this.settings_shown()) {
            return;
        }

        (this.settingsDiv
            .querySelector('[data-coordinates-format]') as HTMLInputElement)
            .value = this.app.map_state.settings_marker_coordinates_format;
        (this.settingsDiv
            .querySelector('[data-random-color]') as HTMLInputElement)
            .checked = this.app.map_state.settings_marker_random_color;
        (this.settingsDiv
            .querySelector('[data-color]') as HTMLInputElement)
            .value = this.app.map_state.settings_marker_color.to_hash_string();
        (this.settingsDiv
            .querySelector('[data-radius]') as HTMLInputElement)
            .value = String(this.app.map_state.settings_marker_radius);
    }
}
