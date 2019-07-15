import {Coordinates} from "./coordinates.js";
import {MapStateObserver} from "./mapstate.js";

export class SidebarMarkers extends MapStateObserver {
    constructor(app) {
        super(app.map_state);

        const self = this;

        $("#btn-add-marker").click(() => {
            self.map_state.add_marker();
        });
        $("#btn-delete-markers").click(() => {
            self.map_state.delete_all_markers();
        });
    }

    update_state() {
        const self = this;

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if ($(`#marker-${marker.id}`).length > 0) {
                $(`#marker-${marker.id} .marker-color`).css("background-color", `#${marker.color}`);
                $(`#marker-${marker.id} .marker-name`).text(marker.name);
                if (marker.radius <= 0) {
                    $(`#marker-${marker.id} .marker-radius`).text("No circle.");
                } else {
                    $(`#marker-${marker.id} .marker-radius`).text(`Circle: ${marker.radius.toFixed(2)} m`);
                }
                $(`#marker-${marker.id} .marker-coordinates`).text(marker.coordinates.to_string());
            } else {
                $("#markers").append(self.create_marker_div(marker));
                $("#markers").append(self.create_marker_edit_div(marker));
            }
            self.update_edit_values(marker);
        });

        /* remove spurious markers */
        var markers = $("#markers > .marker");
        if (markers.length > this.map_state.markers.length) {
            var ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.id);
            });

            var deleted_ids = [];
            markers.each((i, m) => {
                var id = parseInt(m.id.substring(7));
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            })

            deleted_ids.forEach((id) => {
                $(`#marker-${id}`).remove();
                $(`#marker-edit-${id}`).remove();
            });
        }
    }

    create_marker_div(marker) {
        const self = this;
        const m = $(`<div id="marker-${marker.id}" class="marker">`);

        const left   = $('<div class="marker-left"></div>');
        left.append($(`<div class="marker-color" style="background-color: #${marker.color}"></div>`));
        m.append(left);

        const center = $('<div class="marker-center"></div>');
        center.append($(`<div class="marker-name">${marker.name}</div>`));
        center.append($(`<div class="marker-coordinates">${marker.coordinates.to_string()}</div>`));
        if (marker.radius <= 0) {
            center.append($('<div class="marker-radius">No circle.</div>'));
        } else {
            center.append($(`<div class="marker-radius">Circle: ${marker.radius.toFixed(2)} m</div>`));
        }
        m.append(center);

        const right  = $('<div class="marker-right"></div>');
        right.append(this.create_marker_dropdown(marker));
        m.append(right);

        m.click(() => {
            self.map_state.set_center(marker.coordinates, null);
        });

        return m;
    }

    create_marker_edit_div(marker) {
        const self = this;
        const m = $(`<div id="marker-edit-${marker.id}" class="edit">`);

        const name = $(`
        <div class="field">
            <label class="label">Name</label>
            <div class="control">
                <input class="input marker-edit-name" type="text" placeholder="Name">
            </div>
        </div>`);

        const coordinates = $(`<div class="field">
            <label class="label">Coordinates</label>
            <div class="control">
                <input class="input marker-edit-coordinates" type="text" placeholder="Coordinates">
            </div>
        </div>`);

        const radius = $(`<div class="field">
            <label class="label">Circle Radius (m)</label>
            <div class="control">
                <input class="input marker-edit-radius" type="text" placeholder="Circle Radius">
            </div>
        </div>`);

        const color = $(`<div class="field">
            <label class="label">Color</label>
            <div class="control">
                <input class="input marker-edit-color" type="text" placeholder="Color">
            </div>
        </div>`);

        const submit_button = $('<button class="button">Submit</button>').click(() => {
            self.submit_marker_edit(marker.id);
        });
        const cancel_button = $('<button class="button">Cancel</button>').click(() => {
            $(`#marker-edit-${marker.id}`).removeClass("show-edit");
        });
        const buttons = $('<div class="field is-grouped">')
            .append($('<div class="control">').append(submit_button))
            .append($('<div class="control">').append(cancel_button));

        m.append(name).append(coordinates).append(radius).append(color).append(buttons);

        return m;
    }

    create_marker_dropdown(marker) {
        const self = this;

        const menu_id = `dropdown-marker-${marker.id}`;
        const dropdown = $('<div class="dropdown is-right">');
        dropdown.click((event) => {
            event.stopPropagation();
            $(`#marker-${marker.id} .dropdown`).toggleClass('is-active');
        });

        const dropdown_trigger = $('<div class="dropdown-trigger">');
        dropdown.append(dropdown_trigger);
        const dropdown_button = $(`<button class="button is-white" aria-haspopup="true" aria-controls="${menu_id}">
            <span class="icon is-small"><i class="fas fa-ellipsis-v aria-hidden="true"></i></span>
        </button>`);
        dropdown_trigger.append(dropdown_button);

        const dropdown_menu =$(`<div class="dropdown-menu" id="${menu_id}" role="menu">`);
        dropdown.append(dropdown_menu);
        const dropdown_menu_content = $('<div class="dropdown-content">');
        dropdown_menu.append(dropdown_menu_content);

        const menu_edit = $('<a href="#" class="marker-edit dropdown-item">Edit</a>');
        menu_edit.click(() => {
            self.update_edit_values(marker);
            $(`#marker-edit-${marker.id}`).addClass("show-edit");

        });
        dropdown_menu_content.append(menu_edit);

        const menu_project = $('<a href="#" class="marker-project dropdown-item">Waypoint Projection</a>');
        menu_project.click(() => {
            console.log("not implemented");
        });
        dropdown_menu_content.append(menu_project);

        const menu_delete = $('<a href="#" class="marker-delete dropdown-item">Delete</a>');
        menu_delete.click(() => {
            self.map_state.delete_marker(marker.id, null);
        });
        dropdown_menu_content.append(menu_delete);

        return dropdown;
    }

    update_edit_values(marker) {
        $(`#marker-edit-${marker.id} .marker-edit-name`).val(marker.name);
        $(`#marker-edit-${marker.id} .marker-edit-coordinates`).val(marker.coordinates.to_string());
        $(`#marker-edit-${marker.id} .marker-edit-radius`).val(marker.radius);
        $(`#marker-edit-${marker.id} .marker-edit-color`).val(marker.color);
    }

    submit_marker_edit(marker_id) {
        const marker = this.map_state.get_marker(marker_id);
        if (marker) {
            const name = $(`#marker-edit-${marker.id} .marker-edit-name`).val();
            const coordinates = Coordinates.from_string($(`#marker-edit-${marker.id} .marker-edit-coordinates`).val());
            const radius = parseFloat($(`#marker-edit-${marker.id} .marker-edit-radius`).val());
            const color = $(`#marker-edit-${marker.id} .marker-edit-color`).val();

            if ((name.length == 0) || (!coordinates) || (radius === null) || (!RegExp('^[0-9A-Fa-f]{6}$').test(color))) {
                alert('bad values.');
                return;
            }

            marker.name = name;
            marker.coordinates = coordinates;
            marker.radius = radius;
            marker.color = color;

            this.map_state.update_observers(null);
        }
        $(`#marker-edit-${marker.id}`).removeClass("show-edit");
    }
}