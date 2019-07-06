class Sidebar {
    constructor(sidebar_selector, sidebar_controls_selector, controls) {
        var self = this;
        
        this.map = null;
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
    }

    toggle (toggle_control_id) {
        var self = this;
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
}