import { create } from "sortablejs";
import {App} from "./app";
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";
import {SidebarLayers} from './sidebar_layers';
import {SidebarLines} from './sidebar_lines';
import {SidebarMarkers} from './sidebar_markers';
import {SidebarSearch} from './sidebar_search';
import {SidebarTools} from './sidebar_tools';
import {SidebarInfo} from './sidebar_info';
import {SidebarItem} from './sidebar_item';
import {create_element, create_icon} from "./utilities";

export class Sidebar extends MapStateObserver {
    private _sidebar: HTMLDivElement;
    private _sidebar_controls: HTMLDivElement;
    //private _sidebars: Map<string, [HTMLDivElement, any]>;
    private controls: HTMLElement[];
    private sidebar_search: SidebarSearch;
    public sidebar_layers: SidebarLayers;
    private sidebar_markers: SidebarMarkers;
    private sidebar_lines: SidebarLines;
    private sidebar_tools: SidebarTools;
    private sidebar_info: SidebarInfo;

    constructor(app: App) {
        super(app);

        const self = this;

        this._sidebar = document.getElementById("sidebar")! as HTMLDivElement;
        this._sidebar_controls = document.getElementById("sidebar-controls")! as HTMLDivElement;

        /*
        this._sidebars = new Map();
        this._sidebars.set("search", [this._create_sidebar_control("search"), new SidebarSearch(app)]);
        this._sidebars.set("layers", [this._create_sidebar_control("layers"), new SidebarLayers(app)]);
        this._sidebars.set("markers", [this._create_sidebar_control("map-pin"), new SidebarMarkers(app)]);
        this._sidebars.set("lines", [this._create_sidebar_control("maximize-2"), new SidebarLines(app)]);
        this._sidebars.set("tools", [this._create_sidebar_control("tool"), new SidebarTools(app)]);
        this._sidebars.set("info", [this._create_sidebar_control("help-circle"), new SidebarInfo(app)]);
        */

        this.controls = [];
        document.querySelectorAll('.sidebar-control-button').forEach((button: HTMLElement): void => {
            button.addEventListener('click', (): void => {
                self.toggle(button);
            });

            self.controls.push(button);
        });

        this.sidebar_search = new SidebarSearch(app, "sidebar-search");
        this.sidebar_layers = new SidebarLayers(app, "sidebar-layers");
        this.sidebar_markers = new SidebarMarkers(app, "sidebar-markers");
        this.sidebar_lines = new SidebarLines(app, "sidebar-lines");
        this.sidebar_tools = new SidebarTools(app, "sidebar-tools");
        this.sidebar_info = new SidebarInfo(app, "sidebar-info");
    }

    public toggle(toggle_control: HTMLElement|null): void {
        if (
            toggle_control === null ||
            toggle_control.parentElement === null ||
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

            this._sidebar.classList.remove('sidebar-open');
            this._sidebar_controls.classList.remove('sidebar-open');
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

            this._sidebar.classList.add('sidebar-open');
            this._sidebar_controls.classList.add('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer: HTMLElement): void => {
                mapContainer.classList.add('sidebar-open');
            });
        }

        this.app.update_geometry();
    }

    private _create_sidebar_control(icon: string): HTMLDivElement {
        const div = create_element("div", ["sidebar-control"]) as HTMLDivElement;
        const a = create_element("a", ["sidebar-control-button"], {"href": "#"});
        const svg = create_icon(icon, ["icon24"]);
        a.appendChild(svg);
        div.appendChild(a);
        this._sidebar_controls.appendChild(div);

        return div;
    }
}
