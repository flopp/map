class Sidebar extends MapStateObserver {
    constructor(sidebar_selector, sidebar_controls_selector, app) {
        super(app.map_state);

        var self = this;
        
        this.app = null;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        $(".sidebar-control-button").each((index, button) => {
            var id = button.id;
            button.addEventListener('click', () => { self.toggle(id); });
            var close_button = $(button.dataset.container + " > .header > .close");
            close_button.click(() => { self.toggle(null); });

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
                $("#marker-" + marker.id + " .marker-name").text(marker.name());
                $("#marker-" + marker.id + " .marker-coordinates").text(marker.coordinates.to_string());
            } else {
                var m = $("<li>");
                m.attr('class', 'marker');
                m.attr('id', "marker-" + marker.id);
                m.append($('<div class="marker-name">' + marker.name() + '</div>'));
                m.append($('<div class="marker-coordinates">' + marker.coordinates.to_string() + '</div>'));
                var buttons = $('<div class="marker-buttons buttons has-addons"></div>');
                buttons.append($('<a class="marker-locate-button button is-info"><i class="fas fa-search-location"></i></a>'));
                buttons.append($('<a class="marker-delete-button button is-danger"><i class="fas fa-trash"></i></a>'));
                m.append(buttons);
                $("#markers").append(m);

                $("#marker-" + marker.id + " .marker-locate-button").click(() => {
                    self.map_state.set_center(marker.coordinates, null);
                });
                $("#marker-" + marker.id + " .marker-delete-button").click(() => {
                    self.map_state.delete_marker(marker.id, null);
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