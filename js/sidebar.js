class Sidebar {
    constructor(sidebar_selector, sidebar_controls_selector) {
        var self = this;
        
        this.app = null;
        this.map_state = null;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        $(".sidebar-control-button").each((index, button) => {
            var id = button.id;
            button.addEventListener('click', () => { self.toggle(id); });
            var close_button = $(button.dataset.container + " > .sidebar-header > .close");
            close_button.click(() => { self.toggle(null); });

            self.controls.push(button);
        });

        /* location */
        $("#btn-locate").click(() => { self.app.locate_me(); });

        /* markers */
        $("#btn-add-marker").click(() => { self.app.add_marker(); });
        $("#btn-delete-markers").click(() => { self.app.delete_all_markers(); });

        /* lines */
    }

    set_app(app) {
        this.app = app;
        this.map_state = app.map_state;
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
            $(this.sidebar_selector).addClass('active');
            $(this.sidebar_controls_selector).addClass('active');
        } else {
            $(this.sidebar_selector).removeClass('active');
            $(this.sidebar_controls_selector).removeClass('active');
        }

        if (this.app) {
            this.app.update_geometry();
        }
    }

    update_state() {
        var self = this;

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if ($("#marker-" + marker.id).length > 0) {
                $("#marker-" + marker.id + " .coordinates").text(marker.coordinates.to_text());
            } else {
                var m = $("<li>");
                m.attr('class', 'marker');
                m.attr('id', "marker-" + marker.id);
                m.append($('<span class="coordinates">' + marker.coordinates.to_text() + '</span>'));
                m.append($('<a class="delete-button button is-danger">Delete</button>'));
                $("#markers").append(m);

                $("#marker-" + marker.id + " .delete-button").click(() => {
                    self.app.delete_marker(marker.id);
                });
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