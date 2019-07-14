class Sidebar extends MapStateObserver {
    constructor(sidebar_selector, sidebar_controls_selector, app) {
        super(app.map_state);

        var self = this;
        
        this.app = app;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        $(".sidebar-control-button").each((index, button) => {
            var id = button.id;
            button.addEventListener('click', () => {
                self.toggle(id);
            });

            var close_button = $(button.dataset.container + " > .header > .close");
            close_button.click(() => {
                self.toggle(null);
            });

            self.controls.push(button);
        });

        /* location */
        $("#btn-locate").click(() => {
            self.app.locate_me();
        });
        $("#btn-search").click(() => {
            var location_string = $("#input-search").val();
            self.app.search_location(location_string);
        });

        /* layers */
        this.map_type_activators = [
            {selector: '#btn-openstreetmap',    type: MapType.OPENSTREETMAP   },
            {selector: '#btn-opentopomap',      type: MapType.OPENTOPOMAP     },
            {selector: '#btn-stamen-terrain',   type: MapType.STAMEN_TERRAIN  },
            {selector: '#btn-google-roadmap',   type: MapType.GOOGLE_ROADMAP  },
            {selector: '#btn-google-satellite', type: MapType.GOOGLE_SATELLITE},
            {selector: '#btn-google-hybrid',    type: MapType.GOOGLE_HYBRID   },
            {selector: '#btn-google-terrain',   type: MapType.GOOGLE_TERRAIN  },
        ];
        this.map_type_activators.forEach((activator) => {
            $(activator.selector).click(() => {
                self.app.switch_map(activator.type);
            });
        });

        /* markers */
        $("#btn-add-marker").click(() => {
            self.map_state.add_marker();
        });
        $("#btn-delete-markers").click(() => {
            self.map_state.delete_all_markers();
        });

        /* lines */
    }

    toggle (toggle_control_id) {
        var show_sidebar = false;

        this.controls.forEach((control) => {
            var parent = control.parentElement;
            var container = $(control.dataset.container);
            if (toggle_control_id == control.id) {
                if (parent.classList.contains('active')) {
                    parent.classList.remove('active');
                    container.removeClass('active');
                } else {
                    show_sidebar = true;
                    parent.classList.add('active');
                    container.addClass('active');
                }
            } else {
                parent.classList.remove('active');
                container.removeClass('active');
            }
        });

        if (show_sidebar) {
            $(this.sidebar_selector).addClass('sidebar-open');
            $(this.sidebar_controls_selector).addClass('sidebar-open');
            $(".map-container").each((index, obj) => {
                obj.classList.add('sidebar-open');
            });
        } else {
            $(this.sidebar_selector).removeClass('sidebar-open');
            $(this.sidebar_controls_selector).removeClass('sidebar-open');
            $(".map-container").each((index, obj) => {
                obj.classList.remove('sidebar-open');
            });
        }

        if (this.app) {
            this.app.update_geometry();
        }
    }

    update_state() {
        var self = this;

        /* layers */
        this.map_type_activators.forEach((activator) => {
            if (self.map_state.map_type == activator.type) {
                $(activator.selector).addClass("is-active");
            } else {
                $(activator.selector).removeClass("is-active");
            }
        });

        this.update_markers_section();
    }

    update_markers_section() {
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
        '            <span class="icon is-small"><i class="fas fa-ellipsis-h aria-hidden="true"></i></span>' +
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

        return $('<div class="dropdown is-right">' +
                 '    <div class="dropdown-trigger">' +
                 '        <button class="button is-white" aria-haspopup="true" aria-controls="dropdown-marker-' + marker_id + '">' +
                 '            <span class="icon is-small">' +
                 '                <i class="fas fa-ellipsis-h aria-hidden="true"></i>' +
                 '            </span>' +
                 '        </button>' +
                 '    </div>' +
                 '    <div class="dropdown-menu" id="dropdown-marker-' + marker_id + '" role="menu">' +
                 '        <div class="dropdown-content">' +
                 '            <a href="#" class="marker-edit dropdown-item">Edit</a>' +
                 '            <a href="#" class="marker-project dropdown-item">Waypoint Projection</a>' +
                 '            <a href="#" class="marker-delete dropdown-item">Delete</a>' +
                 '        </div>' +
                 '    </div>' +
                 '</div>');
    }
}
