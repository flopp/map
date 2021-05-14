import {App} from "./app";
import {MapStateObserver} from "./map_state_observer";
import {create_element, create_icon} from "./utilities";

export class SidebarItem extends MapStateObserver {
    protected _div: HTMLElement;

    public constructor(app: App, id: string) {
        super(app);

        this._div = document.getElementById(`sidebar-${id}`)!;

        const header = create_element("div", ["header"]);
        const h2 = create_element("h2", [], {
            "data-i18n": `sidebar.${id}.title`,
        });
        const span = create_element("span", ["close"]);
        const svg = create_icon("x", ["icon24"]);
        span.append(svg);
        header.append(h2, span);
        this._div.prepend(header);

        span.addEventListener("click", (): void => {
            this.app.map_state.set_sidebar_open(null);
        });
    }

    public activate(): void {
        this._div.classList.add("active");
    }

    public deactivate(): void {
        this._div.classList.remove("active");
    }
}
