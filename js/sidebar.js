class Sidebar extends MapStateObserver {
    constructor(sidebar_selector, sidebar_controls_selector, app) {
        super(app.map_state);

        const self = this;
        
        this.app = app;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        $(".sidebar-control-button").each((index, button) => {
            const id = button.id;
            button.addEventListener('click', () => {
                self.toggle(id);
            });

            const close_button = $(`${button.dataset.container} > .header > .close`);
            close_button.click(() => {
                self.toggle(null);
            });

            self.controls.push(button);
        });

        this.sidebar_location = new SidebarLocation(app);
        this.sidebar_layers = new SidebarLayers(app);
        this.sidebar_markers = new SidebarMarkers(app);
    }

    toggle (toggle_control_id) {
        let show_sidebar = false;

        this.controls.forEach((control) => {
            const parent = control.parentElement;
            const container = $(control.dataset.container);
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

        this.app.update_geometry();
    }

    update_state() {
        // nothing
    }
}
