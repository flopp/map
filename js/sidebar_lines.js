import {Color} from './color.js';
import {MapStateChange, MapStateObserver} from "./mapstate.js";

export class SidebarLines extends MapStateObserver {
    constructor(app) {
        super(app.map_state);

        const self = this;

        $("#btn-add-line").click(() => {
            self.map_state.add_line();
        });
        $("#btn-delete-lines").click(() => {
            self.map_state.delete_all_lines();
        });

        this.hide_settings();
        $("#btn-line-settings").click(() => {
            self.toggle_settings();
        });
        $("#line-settings [data-cancel]").click(() => {
            self.hide_settings();
        });
        $("#line-settings [data-submit]").click(() => {
            self.submit_settings();
        });
    }

    update_state(changes) {
        const self = this;
        if (changes & MapStateChange.LINES) {
            // update and add lines
            this.map_state.lines.forEach((line) => {
                if ($(`#line-${line.get_id()}`).length == 0) {
                    $("#lines").append(self.create_div(line));
                }

                const length = (line.length !== null)
                    ? `${line.length.toFixed(2)} m`
                    : "n/a";
                const bearing = (line.bearing !== null)
                    ? `${line.bearing.toFixed(2)}°`
                    : "n/a";

                $(`#line-${line.get_id()} .line-color`).css("background-color", line.color.to_hash_string());
                $(`#line-${line.get_id()} .line-from`).text(self.marker_name(line.marker1));
                $(`#line-${line.get_id()} .line-to`).text(self.marker_name(line.marker2));
                $(`#line-${line.get_id()} .line-distance`).text(length);
                $(`#line-${line.get_id()} .line-bearing`).text(bearing);
            });

            /* remove spurious lines */
            var lines = $("#lines > .line");
            if (lines.length > this.map_state.lines.length) {
                var ids = new Set();
                this.map_state.lines.forEach((line) => {
                    ids.add(line.get_id());
                });

                var deleted_ids = [];
                lines.each((i, m) => {
                    var id = parseInt(m.id.substring(5), 10);
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
            this.map_state.lines.forEach((line) => {
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
        center.append($(`<table>
            <tr><td>From:</td><td class="line-from"></td></tr>
            <tr><td>To:</td><td class="line-to"></td></tr>
            <tr><td>Length:</td><td class="line-distance"></td></tr>
            <tr><td>Bearing:</td><td class="line-bearing"></td></tr>
        </table>`));
        m.append(center);

        const right = $('<div class="line-right"></div>');
        right.append(this.create_line_dropdown(line));
        m.append(right);

        m.click(() => {
            self.map_state.show_line(line);
        });

        return m;
    }

    marker_name(id) {
        if (id == -1) {
            return "<NONE>";
        }

        const marker = this.map_state.get_marker(id);
        if (marker) {
            return marker.name;
        }

        return `<NONE>`;
    }

    create_edit_div(line) {
        const self = this;
        const m = $(`<div id="line-edit-${line.get_id()}" class="edit">`);

        const line1 = $(`<div class="field">
            <label class="label">From</label>
            <div class="control">
                <div class="select">
                    <select class="line-edit-from"></select>
                </div>
            </div>
        </div>`);

        const line2 = $(`<div class="field">
            <label class="label">To</label>
            <div class="control">
                <div class="select">
                    <select class="line-edit-to"></select>
                </div>
            </div>
        </div>`);

        const color = $(`<div class="field">
            <label class="label">Color</label>
            <div class="control">
                <input class="input line-edit-color" type="color" placeholder="Color">
            </div>
        </div>`);

        const submit_button = $('<button class="button">Submit</button>').click(() => {
            self.submit_edit(line);
        });
        const cancel_button = $('<button class="button">Cancel</button>').click(() => {
            $(`#line-edit-${line.get_id()}`).remove();
        });
        const buttons = $('<div class="field is-grouped">')
            .append($('<div class="control">').append(submit_button))
            .append($('<div class="control">').append(cancel_button));

        m.append(line1).append(line2).append(color).append(buttons);

        return m;
    }

    create_line_dropdown(line) {
        const self = this;

        const menu_id = `dropdown-line-${line.get_id()}`;
        const dropdown = $('<div class="dropdown is-right">');
        dropdown.click((event) => {
            event.stopPropagation();
            $(`#line-${line.get_id()} .dropdown`).toggleClass('is-active');
        });

        const dropdown_trigger = $('<div class="dropdown-trigger">');
        dropdown.append(dropdown_trigger);
        const dropdown_button = $(`<button class="button is-white" aria-haspopup="true" aria-controls="${menu_id}">
            <span class="icon is-small"><i class="fas fa-ellipsis-v aria-hidden="true"></i></span>
        </button>`);
        dropdown_trigger.append(dropdown_button);

        const dropdown_menu = $(`<div class="dropdown-menu" id="${menu_id}" role="menu">`);
        dropdown.append(dropdown_menu);
        const dropdown_menu_content = $('<div class="dropdown-content">');
        dropdown_menu.append(dropdown_menu_content);

        const menu_edit = $('<a href="#" class="line-edit dropdown-item">Edit</a>');
        menu_edit.click(() => {
            if ($(`#line-edit-${line.get_id()}`).length == 0) {
                self.create_edit_div(line).insertAfter(`#line-${line.get_id()}`);
                self.update_edit_values(line);
            }
        });
        dropdown_menu_content.append(menu_edit);

        const menu_delete = $('<a href="#" class="line-delete dropdown-item">Delete</a>');
        menu_delete.click(() => {
            self.map_state.delete_line(line.get_id());
        });
        dropdown_menu_content.append(menu_delete);

        return dropdown;
    }

    update_edit_values(line) {
        if ($(`#line-edit-${line.get_id()}`).length == 0) {
            return;
        }

        const markers = [{name: "<NONE>", id: -1}];
        this.map_state.markers.forEach((marker) => {
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

        $(`#line-edit-${line.get_id()} .line-edit-from`).empty();
        markers.forEach((name_id) => {
            const option = $(`<option value="${name_id.id}"></option>`);
            option.text(name_id.name);
            if (line.marker1 == name_id.id) {
                option.prop("selected", true);
            }
            $(`#line-edit-${line.get_id()} .line-edit-from`).append(option);
        });

        $(`#line-edit-${line.get_id()} .line-edit-to`).empty();
        markers.forEach((name_id) => {
            const option = $(`<option value="${name_id.id}"></option>`);
            option.text(name_id.name);
            if (line.marker2 == name_id.id) {
                option.prop("selected", true);
            }
            $(`#line-edit-${line.get_id()} .line-edit-to`).append(option);
        });

        $(`#line-edit-${line.get_id()} .line-edit-color`).val(line.color.to_hash_string());
    }

    submit_edit(line) {
        const marker1 = parseInt($(`#line-edit-${line.get_id()} .line-edit-from`).val(), 10);
        const marker2 = parseInt($(`#line-edit-${line.get_id()} .line-edit-to`).val(), 10);
        const color = Color.from_string($(`#line-edit-${line.get_id()} .line-edit-color`).val());

        if (!color) {
            alert('bad values.');
            return;
        }

        $(`#line-edit-${line.get_id()}`).remove();

        line.marker1 = marker1;
        line.marker2 = marker2;
        line.color = color;

        this.map_state.update_line_storage(line);
        this.map_state.update_observers(MapStateChange.LINES);
    }

    show_settings() {
        if (!$('#line-settings').hasClass('is-hidden')) {
            return;
        }

        $('#line-settings').removeClass('is-hidden');
        this.update_settings_display();
    }

    hide_settings() {
        $('#line-settings').addClass('is-hidden');
    }

    toggle_settings() {
        if ($('#line-settings').hasClass('is-hidden')) {
            this.hide_settings();
        } else {
            this.show_settings();
        }
    }

    submit_settings() {
        const random_color = $("#line-settings [data-random-color]").prop("checked");
        const color = Color.from_string($("#line-settings [data-color]").val());

        if (color === null) {
            alert("bad values");
            return;
        }

        this.map_state.set_default_line_settings({
            random_color: random_color,
            color: color
        });

        this.hide_settings();
    }

    update_settings_display() {
        if ($('#line-settings').hasClass('is-hidden')) {
            return;
        }

        $("#line-settings [data-random-color]").prop("checked", this.map_state.settings_line_random_color);
        $("#line-settings [data-color]").val(this.map_state.settings_line_color.to_hash_string());
    }
}
