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
import {create_element, create_icon} from "./utilities";
import { SidebarItem } from "./sidebar_item";

export class Sidebar extends MapStateObserver {
    private _sidebar: HTMLDivElement;
    private _sidebar_controls: HTMLDivElement;
    private _sidebars: Map<string, [HTMLDivElement, SidebarItem]>;
    public sidebar_layers: SidebarLayers;

    constructor(app: App) {
        super(app);

        this._sidebar = document.getElementById("sidebar")! as HTMLDivElement;
        this._sidebar_controls = document.getElementById("sidebar-controls")! as HTMLDivElement;

        this._sidebars = new Map();
        this._sidebars.set("search", [this._create_sidebar_control("search", "search"), new SidebarSearch(app, "sidebar-search")]);
        this.sidebar_layers = new SidebarLayers(app, "sidebar-layers");
        this._sidebars.set("layers", [this._create_sidebar_control("layers", "layers"), this.sidebar_layers]);
        this._sidebars.set("markers", [this._create_sidebar_control("markers", "map-pin"), new SidebarMarkers(app, "sidebar-markers")]);
        this._sidebars.set("lines", [this._create_sidebar_control("lines", "maximize-2"), new SidebarLines(app, "sidebar-lines")]);
        this._sidebars.set("tools", [this._create_sidebar_control("tools", "tool"), new SidebarTools(app, "sidebar-tools")]);
        this._sidebars.set("info", [this._create_sidebar_control("info", "help-circle"), new SidebarInfo(app, "sidebar-info")]);
    }

    public toggle(name: string|null): void {
        if ((name === null) || (this.app.map_state.sidebar_open === name)) {
            this.app.map_state.set_sidebar_open(null);
        } else {
            this.app.map_state.set_sidebar_open(name);
        }
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.SIDEBAR) === MapStateChange.NOTHING) {
            return;
        }

        const section = this.app.map_state.sidebar_open;

        if (section === null) {
            this._sidebars.forEach((value: [HTMLDivElement, SidebarItem]): void => {
                value[0].classList.remove("active");
                value[1].deactivate();
            });

            this._sidebar.classList.remove('sidebar-open');
            this._sidebar_controls.classList.remove('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer: HTMLElement): void => {
                mapContainer.classList.remove('sidebar-open');
            });
        } else {
            let found = false;
            this._sidebars.forEach((value: [HTMLDivElement, SidebarItem], key: string): void => {
                if (key === section) {
                    found = true;
                    value[0].classList.add("active");
                    value[1].activate();
                } else {
                    value[0].classList.remove("active");
                    value[1].deactivate();
                }
            });

            if (!found) {
                const value = this._sidebars.get("search")!;
                value[0].classList.add("active");
                value[1].activate();
            }

            this._sidebar.classList.add('sidebar-open');
            this._sidebar_controls.classList.add('sidebar-open');
            document.querySelectorAll('.map-container').forEach((mapContainer: HTMLElement): void => {
                mapContainer.classList.add('sidebar-open');
            });
        }

        this.app.update_geometry();
    }

    private _create_sidebar_control(name: string, icon: string): HTMLDivElement {
        const self =  this;

        const div = create_element("div", ["sidebar-control"]) as HTMLDivElement;
        const a = create_element("a", ["sidebar-control-button"], {"href": "#"});
        const svg = create_icon(icon, ["icon24"]);
        a.appendChild(svg);
        div.appendChild(a);
        this._sidebar_controls.appendChild(div);

        a.addEventListener('click', (): void => {
            self.toggle(name);
        });

        return div;
    }
}
