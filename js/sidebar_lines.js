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
    }

    update_state(changes) {
        if ((changes & MapStateChange.LINES) == MapStateChange.NOTHING) {
            return;
        }

        const self = this;

        /* update and add lines */
        this.map_state.lines.forEach((line) => {
            if ($(`#line-${line.id}`).length > 0) {
                const length = (line.length !== null)
                    ? `${line.length.toFixed(2)} m`
                    : "n/a";
                const bearing = (line.bearing !== null)
                    ? `${line.bearing.toFixed(2)}°`
                    : "n/a";
        
                $(`#line-${line.id} .line-color`).css("background-color", line.color.to_hash_string());
                $(`#line-${line.id} .line-from`).text(self.marker_name(line.marker1));
                $(`#line-${line.id} .line-to`).text(self.marker_name(line.marker2));
                $(`#line-${line.id} .line-distance`).text(length);
                $(`#line-${line.id} .line-bearing`).text(bearing);
            } else {
                $("#lines").append(self.create_div(line));
            }
            self.update_edit_values(line);
        });

        /* remove spurious lines */
        var lines = $("#lines > .line");
        if (lines.length > this.map_state.lines.length) {
            var ids = new Set();
            this.map_state.lines.forEach((line) => {
                ids.add(line.id);
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

    create_div(line) {
        const self = this;
        const m = $(`<div id="line-${line.id}" class="line">`);

        const left = $('<div class="line-left"></div>');
        left.append($(`<div class="line-color" style="background-color: ${line.color.to_hash_string()}"></div>`));
        m.append(left);

        const from_name = this.marker_name(line.marker1);
        const to_name = this.marker_name(line.marker2);
        const length = (line.length !== null)
            ? `${line.length.toFixed(2)} m`
            : "n/a";
        const bearing = (line.bearing !== null)
            ? `${line.bearing.toFixed(2)}°`
            : "n/a";

        const center = $('<div class="line-center"></div>');
        const table = $('<table></table>');
        table.append($(`<tr><td>From:</td><td class="line-from">${from_name}</td></tr>`));
        table.append($(`<tr><td>To:</td><td class="line-to">${to_name}</td></tr>`));
        table.append($(`<tr><td>Length:</td><td class="line-distance">${length}</td></tr>`));
        table.append($(`<tr><td>Bearing:</td><td class="line-bearing">${bearing}</td></tr>`));
        center.append(table);
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
            return "n/a";
        }

        const marker = this.map_state.get_marker(id);
        if (marker) {
            return marker.name;
        }

        return `n/a (id=${id})`;
    }

    create_edit_div(line) {
        const self = this;
        const m = $(`<div id="line-edit-${line.id}" class="edit">`);

        const line1 = $(`<div class="field">
            <label class="label">From</label>
            <div class="control">
                <input class="input line-edit-from" type="text" placeholder="From">
            </div>
        </div>`);

        const line2 = $(`<div class="field">
            <label class="label">To</label>
            <div class="control">
                <input class="input line-edit-to" type="text" placeholder="To">
            </div>
        </div>`);

        const color = $(`<div class="field">
            <label class="label">Color</label>
            <div class="control">
                <input class="input line-edit-color" type="text" placeholder="Color">
            </div>
        </div>`);

        const submit_button = $('<button class="button">Submit</button>').click(() => {
            self.submit_edit(line.id);
        });
        const cancel_button = $('<button class="button">Cancel</button>').click(() => {
            $(`#line-edit-${line.id}`).remove();
        });
        const buttons = $('<div class="field is-grouped">')
            .append($('<div class="control">').append(submit_button))
            .append($('<div class="control">').append(cancel_button));

        m.append(line1).append(line2).append(color).append(buttons);

        return m;
    }

    create_line_dropdown(line) {
        const self = this;

        const menu_id = `dropdown-line-${line.id}`;
        const dropdown = $('<div class="dropdown is-right">');
        dropdown.click((event) => {
            event.stopPropagation();
            $(`#line-${line.id} .dropdown`).toggleClass('is-active');
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
            if ($(`#line-edit-${line.id}`).length == 0) {
                self.create_edit_div(line).insertAfter(`#line-${line.id}`);
                self.update_edit_values(line);
            }
        });
        dropdown_menu_content.append(menu_edit);

        const menu_delete = $('<a href="#" class="line-delete dropdown-item">Delete</a>');
        menu_delete.click(() => {
            self.map_state.delete_line(line.id, null);
        });
        dropdown_menu_content.append(menu_delete);

        return dropdown;
    }

    update_edit_values(line) {
        if ($(`#line-edit-${line.id}`).length > 0) {
            $(`#line-edit-${line.id} .line-edit-from`).val(line.marker1);
            $(`#line-edit-${line.id} .line-edit-to`).val(line.marker2);
            $(`#line-edit-${line.id} .line-edit-color`).val(line.color.to_string());
        }
    }

    submit_edit(object_id) {
        const line = this.map_state.get_line(object_id);
        if (line) {
            const marker1 = parseInt($(`#line-edit-${line.id} .line-edit-from`).val(), 10);
            const marker2 = parseInt($(`#line-edit-${line.id} .line-edit-to`).val(), 10);
            const color = Color.from_string($(`#line-edit-${line.id} .line-edit-color`).val());

            if (!color) {
                alert('bad values.');
                return;
            }

            line.marker1 = marker1;
            line.marker2 = marker2;
            line.color = color;
            this.map_state.update_line_storage(line);
            this.map_state.update_observers(MapStateChange.LINES);
        }
        $(`#line-edit-${line.id}`).remove();
    }
}
