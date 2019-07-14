class SidebarMarkers extends MapStateObserver {
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
            if ($("#marker-" + marker.id).length > 0) {
                $("#marker-" + marker.id + " .marker-color").css("background-color", "#" + marker.color);
                $("#marker-" + marker.id + " .marker-name").text(marker.name);
                $("#marker-" + marker.id + " .marker-radius").text(marker.radius);
                $("#marker-" + marker.id + " .marker-coordinates").text(marker.coordinates.to_string());
            } else {
                $("#markers").append(self.create_marker_div(marker));
            }
        });

        /* remove spurious markers */
        var markers = $("#markers").children();
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
                $("#marker-" + id).remove();
            });
        }
    }

    create_marker_div(marker) {
        const self = this;
        const m = $("<div class=\"marker\">");
        m.attr('id', "marker-" + marker.id);

        const left   = $('<div class="marker-left"></div>');
        left.append($('<div class="marker-color" style="background-color: #' + marker.color + '"></div>'));
        m.append(left);
        
        const center = $('<div class="marker-center"></div>');
        center.append($('<div class="marker-name">' + marker.name + '</div>'));
        center.append($('<div class="marker-coordinates">' + marker.coordinates.to_string() + '</div>'));
        center.append($('<div class="marker-radius">' + marker.radius + '</div>'));
        m.append(center);
        
        const right  = $('<div class="marker-right"></div>');
        right.append(this.create_marker_dropdown(marker.id));
        m.append(right);
        
        m.click(() => {
            self.map_state.set_center(marker.coordinates, null);
        });

        return m;
    }
    
    create_marker_dropdown(marker_id) {
        const self = this;

        const menu_id = 'dropdown-marker-' + marker_id;
        const dropdown = $('<div class="dropdown is-right">');
        dropdown.click((event) => {
            event.stopPropagation();
            $("#marker-" + marker_id + " .dropdown").toggleClass('is-active');
        });

        const dropdown_trigger = $('<div class="dropdown-trigger">');
        dropdown.append(dropdown_trigger);
        const dropdown_button = $('<button class="button is-white" aria-haspopup="true" aria-controls="' + menu_id +'">' +
        '            <span class="icon is-small"><i class="fas fa-ellipsis-v aria-hidden="true"></i></span>' +
        '        </button>');
        dropdown_trigger.append(dropdown_button);

        const dropdown_menu =$('<div class="dropdown-menu" id="' + menu_id + '" role="menu">');
        dropdown.append(dropdown_menu);
        const dropdown_menu_content = $('<div class="dropdown-content">');
        dropdown_menu.append(dropdown_menu_content);

        const menu_edit = $('<a href="#" class="marker-edit dropdown-item">Edit</a>');
        menu_edit.click(() => {});
        dropdown_menu_content.append(menu_edit);
        
        const menu_project = $('<a href="#" class="marker-project dropdown-item">Waypoint Projection</a>');
        menu_project.click(() => {});
        dropdown_menu_content.append(menu_project);
        
        const menu_delete = $('<a href="#" class="marker-delete dropdown-item">Delete</a>');
        menu_delete.click(() => {
            self.map_state.delete_marker(marker_id, null);
        });
        dropdown_menu_content.append(menu_delete);
        
        return dropdown;
    }
}