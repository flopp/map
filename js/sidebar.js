import {MapStateChange, MapStateObserver} from './map_state.js';
import {SidebarLayers} from './sidebar_layers.js';
import {SidebarLines} from './sidebar_lines.js';
import {SidebarLocation} from './sidebar_location.js';
import {SidebarMarkers} from './sidebar_markers.js';
import {SidebarTools} from './sidebar_tools.js';

export class Sidebar extends MapStateObserver {
    constructor(sidebar_selector, sidebar_controls_selector, app) {
        super(app);

        const self = this;

        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        document.querySelectorAll('.sidebar-control-button').forEach((button) => {
            button.addEventListener('click', () => {
                self.toggle(button);
            });

            const close_button = document.querySelector(`${button.dataset.container} > .header > .close`);
            close_button.addEventListener('click', () => {
                self.toggle(null);
            });

            self.controls.push(button);
        });

        this.sidebar_location = new SidebarLocation(app);
        this.sidebar_layers = new SidebarLayers(app);
        this.sidebar_markers = new SidebarMarkers(app);
        this.sidebar_lines = new SidebarLines(app);
        this.sidebar_tools = new SidebarTools(app);
    }

    toggle(toggle_control) {
        if (
            !toggle_control ||
            toggle_control.parentElement.classList.contains('active')
        ) {
            this.app.map_state.set_sidebar_open(null);
        } else {
            this.app.map_state.set_sidebar_open(toggle_control.id);
        }
    }

    update_state(changes) {
        if ((changes & MapStateChange.SIDEBAR) == MapStateChange.NOTHING) {
            return;
        }

        const section = this.app.map_state.sidebar_open;

        if (!section) {
            this.controls.forEach((control) => {
                const parent = control.parentElement;
                const container = document.querySelector(control.dataset.container);
                parent.classList.remove('active');
                container.classList.remove('active');
            });

            document.querySelector(this.sidebar_selector).classList.remove('sidebar-open');
            document.querySelector(this.sidebar_controls_selector).classList.remove('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer) => {
                mapContainer.classList.remove('sidebar-open');
            });
        } else {
            let found = false;
            this.controls.forEach((control) => {
                const parent = control.parentElement;
                const container = document.querySelector(control.dataset.container);
                if (section == control.id) {
                    found = true;
                    parent.classList.add('active');
                    container.classList.add('active');
                } else {
                    parent.classList.remove('active');
                    container.classList.remove('active');
                }
            });

            if (!found) {
                const control = this.controls[0];
                control.parentElement.classList.add('active');
                document.querySelector(control.dataset.container).classList.add('active');
            }

            document.querySelector(this.sidebar_selector).classList.add('sidebar-open');
            document.querySelector(this.sidebar_controls_selector).classList.add('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer) => {
                mapContainer.classList.add('sidebar-open');
            });
        }

        this.app.update_geometry();
    }
}
