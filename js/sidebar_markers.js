import Sortable from 'sortablejs';

import {Color} from './color.js';
import {Coordinates, CoordinatesFormat} from './coordinates.js';
import {MapStateChange, MapStateObserver} from './map_state.js';
import {
    parse_float,
    parse_int,
    create_button,
    create_dropdown,
    create_element,
    create_text_input,
    create_color_input,
} from './utilities.js';

export class SidebarMarkers extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        document.querySelector('#btn-add-marker').addEventListener('click', () => {
            self.app.map_state.add_marker();
        });
        document.querySelector('#btn-delete-markers').addEventListener('click', () => {
            self.app.map_state.delete_all_markers();
        });

        this.settingsDiv = document.querySelector('#marker-settings');
        this.hide_settings();
        [
            {id: CoordinatesFormat.D, name: 'Degrees'},
            {id: CoordinatesFormat.DM, name: 'Degrees+Minutes'},
            {id: CoordinatesFormat.DMS, name: 'Degrees+Minutes+Seconds'},
        ].forEach((item) => {
            this.settingsDiv.querySelector('[data-coordinates-format]').appendChild(
                new Option(
                    item.name,
                    item.id,
                    item.id == CoordinatesFormat.DM,
                    item.id === Coordinates.get_coordinates_format()
                )
            );
        });
        document.querySelector('#btn-marker-settings').addEventListener('click', () => {
            self.toggle_settings();
        });
        this.settingsDiv.querySelector('[data-cancel]').addEventListener('click', () => {
            self.hide_settings();
        });
        this.settingsDiv.querySelector('[data-submit]').addEventListener('click', () => {
            self.submit_settings();
        });

        this.sortable = Sortable.create(document.getElementById('markers'), {
            onEnd: (event) => {
                self.app.map_state.reorder_markers(
                    event.oldIndex,
                    event.newIndex,
                );
            },
        });
    }

    update_state(changes) {
        if ((changes & MapStateChange.MARKERS) == MapStateChange.NOTHING) {
            return;
        }

        const self = this;

        /* update and add markers */
        this.app.map_state.markers.forEach((marker) => {
            let div = document.querySelector(`#marker-${marker.get_id()}`);
            if (div === null) {
                div = self.create_div(marker);
                document.querySelector('#markers').appendChild(div);
            }

            const circle =
                marker.radius > 0
                    ? self.app.translate('sidebar.markers.circle').replace('{1}', marker.radius.toFixed(2))
                    : self.app.translate('sidebar.markers.no_circle');
            div.querySelector('.marker-color').style.backgroundColor = marker.color.to_hash_string();
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
            this.app.map_state.markers.forEach((marker) => {
                ids.add(marker.get_id());
            });

            const deleted_ids = [];
            markers.forEach((m) => {
                const id = parse_int(m.getAttribute("id").substring(7));
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                const div = document.querySelector(`#marker-${id}`);
                div.parentElement.removeChild(div);

                const edit_div = document.querySelector(`#marker-edit-${id}`);
                if (edit_div !== null) {
                    edit_div.parentElement.removeChild(edit_div);
                }
            });
        }

        this.update_settings_display();
    }

    create_div(marker) {
        const self = this;
        const m = create_element('div', ["marker"], {"id": `marker-${marker.get_id()}`});

        const left = create_element('div', ["marker-left"]);
        const color = create_element('div', ["marker-color"]);
        left.appendChild(color);
        m.appendChild(left);

        const center = create_element('div', ["marker-center"]);
        ["name", "coordinates", "radius"].forEach((name) => {
            const div = create_element('div', [`marker-${name}`]);
            center.appendChild(div);
        });
        m.appendChild(center);

        const right = create_element('div', ["marker-right"]);
        right.appendChild(this.create_marker_dropdown(marker));
        m.appendChild(right);

        m.addEventListener('click', () => {
            self.app.map_state.set_center(marker.coordinates, null);
        });

        return m;
    }

    create_edit_div(marker) {
        const self = this;

        const div = create_element("div", ["edit"], {"id": `marker-edit-${marker.get_id()}`});

        const name = create_text_input(this.app.translate('sidebar.markers.edit_name'), 'data-name', this.app.translate('sidebar.markers.edit_name_placeholder'));
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
        const color = create_color_input(this.app.translate('sidebar.markers.edit_color'), 'data-color', this.app.translate('sidebar.markers.edit_color_placeholder'));

        const submit_button = create_button(this.app.translate('general.submit'), () => {
            self.submit_edit(marker);
        });
        const cancel_button = create_button(this.app.translate('general.cancel'), () => {
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

    create_marker_dropdown(marker) {
        const self = this;
        return create_dropdown([
            {
                label: self.app.translate('sidebar.markers.edit'),
                callback: () => {
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
                callback: () => {
                    self.app.show_projection_dialog(marker);
                },
            },
            {
                label: self.app.translate('sidebar.markers.delete'),
                callback: () => {
                    self.app.map_state.delete_marker(marker.get_id());
                },
            },
        ]);
    }

    update_edit_values(marker) {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`);
        if (div === null) {
            return;
        }

        div.querySelector('[data-name]').value = marker.name;
        div.querySelector('[data-coordinates]').value =  marker.coordinates.to_string_format(
            this.app.map_state.settings_marker_coordinates_format,
        );
        div.querySelector('[data-radius]').value = marker.radius;
        div.querySelector('[data-color]').value = marker.color.to_hash_string();
    }

    submit_edit(marker) {
        const div = document.querySelector(`#marker-edit-${marker.get_id()}`);
        const name = div.querySelector('[data-name]').value;
        const coordinates = Coordinates.from_string(
            div.querySelector('[data-coordinates]').value,
        );
        const radius = parse_float(div.querySelector('[data-radius]').value);
        const color = Color.from_string(div.querySelector('[data-color]').value);

        if (name.length == 0 || !coordinates || radius === null || !color) {
            this.app.message_error(this.app.translate('sidebar.markers.bad_values_message'));
            return;
        }

        div.parentNode.removeChild(div);

        marker.name = name;
        marker.coordinates = coordinates;
        marker.radius = radius;
        marker.color = color;
        this.app.map_state.update_marker_storage(marker);
        this.app.map_state.update_observers(MapStateChange.MARKERS);
    }

    settings_shown() {
        return !this.settingsDiv.classList.contains('is-hidden');
    }

    show_settings() {
        if (this.settings_shown()) {
            return;
        }

        this.settingsDiv.classList.remove('is-hidden');
        this.update_settings_display();
    }

    hide_settings() {
        this.settingsDiv.classList.add('is-hidden');
    }

    toggle_settings() {
        if (this.settings_shown()) {
            this.hide_settings();
        } else {
            this.show_settings();
        }
    }

    submit_settings() {
        const coordinates_format = this.settingsDiv.querySelector('[data-coordinates-format]').value;
        const random_color = this.settingsDiv
            .querySelector('[data-random-color]')
            .checked;
        const color = Color.from_string(
            this.settingsDiv.querySelector('[data-color]').value,
        );
        const radius = parse_float(this.settingsDiv.querySelector('[data-radius]').value);
        if (color === null || radius === null) {
            this.app.message_error(this.app.translate('sidebar.markers.bad_values_message'));
            return;
        }

        this.app.map_state.set_default_marker_settings({
            coordinates_format: coordinates_format,
            random_color: random_color,
            color: color,
            radius: radius,
        });

        this.hide_settings();
    }

    update_settings_display() {
        if (!this.settings_shown()) {
            return;
        }

        this.settingsDiv
            .querySelector('[data-coordinates-format]')
            .value = this.app.map_state.settings_marker_coordinates_format;
        this.settingsDiv
            .querySelector('[data-random-color]')
            .checked = this.app.map_state.settings_marker_random_color;
        this.settingsDiv
            .querySelector('[data-color]')
            .velue = this.app.map_state.settings_marker_color.to_hash_string();
        this.settingsDiv
            .querySelector('[data-radius]')
            .value = this.app.map_state.settings_marker_radius;
    }
}
