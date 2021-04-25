import {App} from "./app";
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";
import {SidebarLayers} from './sidebar_layers';
import {SidebarLines} from './sidebar_lines';
import {SidebarMarkers} from './sidebar_markers';
import {SidebarSearch} from './sidebar_search';
import {SidebarTools} from './sidebar_tools';

export class Sidebar extends MapStateObserver {
    private sidebar_selector: string;
    private sidebar_controls_selector: string;
    private controls: HTMLElement[];
    private sidebar_search: SidebarSearch;
    public sidebar_layers: SidebarLayers;
    private sidebar_markers: SidebarMarkers;
    private sidebar_lines: SidebarLines;
    private sidebar_tools: SidebarTools;

    constructor(sidebar_selector: string, sidebar_controls_selector: string, app: App) {
        super(app);

        const self = this;

        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        document.querySelectorAll('.sidebar-control-button').forEach((button: HTMLElement): void => {
            button.addEventListener('click', (): void => {
                self.toggle(button);
            });

            const close_button = document.querySelector(`${button.dataset.container} > .header > .close`);
            close_button.addEventListener('click', (): void => {
                self.toggle(null);
            });

            self.controls.push(button);
        });

        this.sidebar_search = new SidebarSearch(app);
        this.sidebar_layers = new SidebarLayers(app);
        this.sidebar_markers = new SidebarMarkers(app);
        this.sidebar_lines = new SidebarLines(app);
        this.sidebar_tools = new SidebarTools(app);
    }

    public toggle(toggle_control: HTMLElement): void {
        if (
            !toggle_control ||
            toggle_control.parentElement.classList.contains('active')
        ) {
            this.app.map_state.set_sidebar_open(null);
        } else {
            this.app.map_state.set_sidebar_open(toggle_control.id);
        }
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.SIDEBAR) === MapStateChange.NOTHING) {
            return;
        }

        const section = this.app.map_state.sidebar_open;

        if (!section) {
            this.controls.forEach((control: HTMLElement): void => {
                const parent = control.parentElement;
                const container = document.querySelector(control.dataset.container);
                parent.classList.remove('active');
                container.classList.remove('active');
            });

            document.querySelector(this.sidebar_selector).classList.remove('sidebar-open');
            document.querySelector(this.sidebar_controls_selector).classList.remove('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer: HTMLElement): void => {
                mapContainer.classList.remove('sidebar-open');
            });
        } else {
            let found = false;
            this.controls.forEach((control: HTMLElement): void => {
                const parent = control.parentElement;
                const container = document.querySelector(control.dataset.container);
                if (section === control.id) {
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
            document.querySelectorAll('.map-container').forEach((mapContainer: HTMLElement): void => {
                mapContainer.classList.add('sidebar-open');
            });
        }

        this.app.update_geometry();
    }
}
