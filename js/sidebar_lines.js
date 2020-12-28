import $ from 'jquery';
import Sortable from 'sortablejs';

import {Color} from './color.js';
import {MapStateChange, MapStateObserver} from './map_state.js';
import {
    create_button,
    create_dropdown,
    create_color_input,
    create_select_input,
    parse_int,
} from './utilities.js';

export class SidebarLines extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        $('#btn-add-line').click(() => {
            self.app.map_state.add_line();
        });
        $('#btn-delete-lines').click(() => {
            self.app.map_state.delete_all_lines();
        });

        this.settingsDiv = $('#line-settings');
        this.hide_settings();
        $('#btn-line-settings').click(() => {
            self.toggle_settings();
        });
        this.settingsDiv.find('[data-cancel]').click(() => {
            self.hide_settings();
        });
        this.settingsDiv.find('[data-submit]').click(() => {
            self.submit_settings();
        });

        this.sortable = Sortable.create(document.getElementById('lines'), {
            onEnd: (event) => {
                self.app.map_state.reorder_lines(event.oldIndex, event.newIndex);
            },
        });
    }

    update_state(changes) {
        const self = this;
        if (changes & MapStateChange.LINES) {
            // update and add lines
            this.app.map_state.lines.forEach((line) => {
                if ($(`#line-${line.get_id()}`).length == 0) {
                    $('#lines').append(self.create_div(line));
                }

                const length =
                    line.length !== null ? `${line.length.toFixed(2)} m` : 'n/a';
                const bearing =
                    line.bearing !== null
                        ? `${line.bearing.toFixed(2)}°`
                        : 'n/a';

                $(`#line-${line.get_id()} .line-color`).css(
                    'background-color',
                    line.color.to_hash_string(),
                );
                $(`#line-${line.get_id()} .line-from`).text(
                    self.marker_name(line.marker1),
                );
                $(`#line-${line.get_id()} .line-to`).text(
                    self.marker_name(line.marker2),
                );
                $(`#line-${line.get_id()} .line-distance`).text(length);
                $(`#line-${line.get_id()} .line-bearing`).text(bearing);
            });

            /* remove spurious lines */
            const lines = $('#lines > .line');
            if (lines.length > this.app.map_state.lines.length) {
                const ids = new Set();
                this.app.map_state.lines.forEach((line) => {
                    ids.add(line.get_id());
                });

                const deleted_ids = [];
                lines.each((i, m) => {
                    const id = parse_int(m.id.substring(5));
                    if (!ids.has(id)) {
                        deleted_ids.push(id);
                    }
                });

                deleted_ids.forEach((id) => {
                    $(`#line-${id}`).remove();
                    $(`#line-edit-${id}`).remove();
                });
            }
        }

        this.update_settings_display();

        if (changes & (MapStateChange.MARKERS | MapStateChange.LINES)) {
            this.app.map_state.lines.forEach((line) => {
                self.update_edit_values(line);
            });
        }
    }

    create_div(line) {
        const self = this;
        const m = $(`<div id="line-${line.get_id()}" class="line">`);

        const left = $(`<div class="line-left">
            <div class="line-color"></div>
        </div>`);
        m.append(left);

        const center = $('<div class="line-center"></div>');
        center.append(
            $(`<table>
            <tr><td class="has-text-weight-semibold">${self.app.translate('sidebar.lines.from')}</td><td class="line-from"></td></tr>
            <tr><td class="has-text-weight-semibold">${self.app.translate('sidebar.lines.to')}</td><td class="line-to"></td></tr>
            <tr><td class="has-text-weight-semibold">${self.app.translate('sidebar.lines.length')}</td><td class="line-distance"></td></tr>
            <tr><td class="has-text-weight-semibold">${self.app.translate('sidebar.lines.bearing')}</td><td class="line-bearing"></td></tr>
        </table>`),
        );
        m.append(center);

        const right = $('<div class="line-right"></div>');
        right.append(this.create_line_dropdown(line));
        m.append(right);

        m.click(() => {
            self.app.map_state.show_line(line);
        });

        return m;
    }

    marker_name(id) {
        if (id == -1) {
            return this.app.translate('general.no_marker_tag');
        }

        const marker = this.app.map_state.get_marker(id);
        if (marker) {
            return marker.name;
        }

        return this.app.translate('general.no_marker_tag');
    }

    create_edit_div(line) {
        const self = this;
        const div = $(`<div id="line-edit-${line.get_id()}" class="edit">`);

        const from = create_select_input(this.app.translate('sidebar.lines.edit_from'), 'data-from');
        const to = create_select_input(this.app.translate('sidebar.lines.edit_to'), 'data-to');
        const color = create_color_input(this.app.translate('sidebar.lines.edit_color'), 'data-color', this.app.translate('sidebar.lines.edit_color_placeholder'));

        const submit_button = create_button(this.app.translate('general.submit'), () => {
            self.submit_edit(line);
        });
        const cancel_button = create_button(this.app.translate('general.cancel'), () => {
            div.remove();
        });
        const buttons = $('<div class="field is-grouped">')
            .append(submit_button)
            .append(cancel_button);

        div.append(from).append(to).append(color).append(buttons);

        return div;
    }

    create_line_dropdown(line) {
        const self = this;
        return create_dropdown(`dropdown-line-${line.get_id()}`, [
            {
                label: this.app.translate('sidebar.lines.edit'),
                callback: () => {
                    if ($(`#line-edit-${line.get_id()}`).length == 0) {
                        self.create_edit_div(line).insertAfter(
                            `#line-${line.get_id()}`,
                        );
                        self.update_edit_values(line);
                    }
                },
            },
            {
                label: this.app.translate('sidebar.lines.delete'),
                callback: () => {
                    self.app.map_state.delete_line(line.get_id());
                },
            },
        ]);
    }

    update_edit_values(line) {
        const div = $(`#line-edit-${line.get_id()}`);
        if (div.length == 0) {
            return;
        }

        const markers = [{name: this.app.translate('general.no_marker_tag'), id: -1}];
        this.app.map_state.markers.forEach((marker) => {
            markers.push({name: marker.name, id: marker.get_id()});
        });
        markers.sort((a, b) => {
            if (a.id < 0) {
                return -1;
            }
            if (b.id < 0) {
                return +1;
            }
            return a.name.localeCompare(b.name);
        });

        div.find('[data-from]').empty();
        markers.forEach((name_id) => {
            const option = $(`<option value="${name_id.id}"></option>`);
            option.text(name_id.name);
            if (line.marker1 == name_id.id) {
                option.prop('selected', true);
            }
            div.find('[data-from]').append(option);
        });

        div.find('[data-to]').empty();
        markers.forEach((name_id) => {
            const option = $(`<option value="${name_id.id}"></option>`);
            option.text(name_id.name);
            if (line.marker2 == name_id.id) {
                option.prop('selected', true);
            }
            div.find('[data-to]').append(option);
        });

        div.find('[data-color]').val(line.color.to_hash_string());
    }

    submit_edit(line) {
        const div = $(`#line-edit-${line.get_id()}`);
        const marker1 = parse_int(div.find('[data-from]').val());
        const marker2 = parse_int(div.find('[data-to]').val());
        const color = Color.from_string(div.find('[data-color]').val());

        if (!color) {
            this.app.message_error(this.app.translate('sidebar.lines.bad_values_message'));
            return;
        }

        div.remove();

        line.marker1 = marker1;
        line.marker2 = marker2;
        line.color = color;

        this.app.map_state.update_line_storage(line);
        this.app.map_state.update_observers(MapStateChange.LINES);
    }

    settings_shown() {
        return !this.settingsDiv.hasClass('is-hidden');
    }

    show_settings() {
        if (this.settings_shown()) {
            return;
        }

        this.settingsDiv.removeClass('is-hidden');
        this.update_settings_display();
    }

    hide_settings() {
        this.settingsDiv.addClass('is-hidden');
    }

    toggle_settings() {
        if (this.settings_shown()) {
            this.hide_settings();
        } else {
            this.show_settings();
        }
    }

    submit_settings() {
        const random_color = this.settingsDiv
            .find('[data-random-color]')
            .prop('checked');
        const color = Color.from_string(
            this.settingsDiv.find('[data-color]').val(),
        );

        if (color === null) {
            this.app.message_error(this.app.translate('sidebar.lines.bad_values_message'));
            return;
        }

        this.app.map_state.set_default_line_settings({
            random_color: random_color,
            color: color,
        });

        this.hide_settings();
    }

    update_settings_display() {
        if (!this.settings_shown()) {
            return;
        }

        this.settingsDiv
            .find('[data-random-color]')
            .prop('checked', this.app.map_state.settings_line_random_color);
        this.settingsDiv
            .find('[data-color]')
            .val(this.app.map_state.settings_line_color.to_hash_string());
    }
}
