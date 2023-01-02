import {App} from "./app";
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";
import {SidebarHero} from "./sidebar_hero";
import {SidebarInfo} from "./sidebar_info";
import {SidebarItem} from "./sidebar_item";
import {SidebarLayers} from "./sidebar_layers";
import {SidebarLines} from "./sidebar_lines";
import {SidebarMarkers} from "./sidebar_markers";
import {SidebarSearch} from "./sidebar_search";
import {SidebarTools} from "./sidebar_tools";
import {create_element, create_icon} from "./utilities";

export class Sidebar extends MapStateObserver {
    private readonly _sidebar_controls: HTMLDivElement;
    private readonly _sidebars: Map<string, [HTMLDivElement, SidebarItem]>;
    public sidebar_layers: SidebarLayers;

    public constructor(app: App) {
        super(app);

        this._sidebar_controls = document.getElementById("sidebar-controls")! as HTMLDivElement;

        this.sidebar_layers = new SidebarLayers(app, "layers");

        // .translate("sidebar.hero.title")
        // .translate("sidebar.search.title")
        // .translate("sidebar.layers.title")
        // .translate("sidebar.markers.title")
        // .translate("sidebar.lines.title")
        // .translate("sidebar.tools.title")
        // .translate("sidebar.info.title")
        this._sidebars = new Map();
        [
            ["hero", "star", (i: string): SidebarItem => new SidebarHero(app, i)],
            ["search", "search", (i: string): SidebarItem => new SidebarSearch(app, i)],
            ["layers", "layers", (_id: string): SidebarItem => this.sidebar_layers],
            ["markers", "map-pin", (id: string): SidebarItem => new SidebarMarkers(app, id)],
            ["lines", "maximize-2", (id: string): SidebarItem => new SidebarLines(app, id)],
            ["tools", "tool", (id: string): SidebarItem => new SidebarTools(app, id)],
            ["info", "help-circle", (id: string): SidebarItem => new SidebarInfo(app, id)],
        ].forEach((value: [string, string, (id: string) => SidebarItem]): void => {
            this._sidebars.set(value[0], [
                this._create_sidebar_control(value[0], value[1]),
                value[2](value[0]),
            ]);
        });

        this.update_state(MapStateChange.SIDEBAR);
    }

    public toggle(name: string | null): void {
        if (name === null || this.app.map_state.sidebar_open === name) {
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

            document.getElementsByTagName("body")[0].classList.remove("sidebar-open");
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

            document.getElementsByTagName("body")[0].classList.add("sidebar-open");
        }

        this.app.update_geometry();
    }

    private _create_sidebar_control(name: string, icon: string): HTMLDivElement {
        const div = create_element("div", ["sidebar-control"]) as HTMLDivElement;
        const a = create_element("a", ["sidebar-control-button"], {href: "#"});
        const svg = create_icon(icon, ["icon24"]);
        a.append(svg);
        div.append(a);
        this._sidebar_controls.append(div);

        a.addEventListener("click", (event: Event): void => {
            this.toggle(name);
            event.stopPropagation();
        });

        return div;
    }
}
