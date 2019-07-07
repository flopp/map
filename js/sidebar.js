class Sidebar {
    constructor(sidebar_selector, sidebar_controls_selector, controls) {
        var self = this;
        
        this.map = null;
        this.map_state = null;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;
        this.controls = controls;

        controls.forEach((control_id) => {
            var control = $(control_id);
            control.click(() => {self.toggle(control_id); });
            var close_button = $(control.data("container") + " > .sidebar-header > .close");
            close_button.click(() => {self.toggle(null); });
        });

        $("#btn-add-marker").click(() => { self.map.add_marker(); });
        $("#btn-delete-markers").click(() => { self.map.delete_all_markers(); });
    }

    set_map(map) {
        this.map = map;
        this.map_state = map.map_state;
    }

    toggle (toggle_control_id) {
        var show_sidebar = false;

        this.controls.forEach((control_id) => {
            var control = $(control_id);
            var parent = control.parent();
            var container = $(control.data("container"));
            if (toggle_control_id == control_id) {
                if (parent.hasClass('active')) {
                    parent.removeClass('active');
                    container.removeClass('active');
                } else {
                    show_sidebar = true;
                    parent.addClass('active');
                    container.addClass('active');
                }
            } else {
                parent.removeClass('active');
                container.removeClass('active');
            }
        });

        if (show_sidebar) {
            $(this.sidebar_selector).addClass('active');
            $(this.sidebar_controls_selector).addClass('active');
        } else {
            $(this.sidebar_selector).removeClass('active');
            $(this.sidebar_controls_selector).removeClass('active');
        }

        if (this.map) {
            this.map.update_geometry();
        }
    }

    update_state() {
        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if ($("#marker-" + marker.id).length > 0) {
                $("#marker-" + marker.id + " .coordinates").text(marker.coordinates.to_text());
            } else {
                var m = $("<li>");
                m.attr('class', 'marker');
                m.attr('id', "marker-" + marker.id);
                m.append($('<span class="coordinates">' + marker.coordinates.to_text() + '</span>'));
                $("#markers").append(m);
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
}