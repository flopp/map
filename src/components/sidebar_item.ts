import {App} from "./app";
import {MapStateObserver} from "./map_state_observer";
import {create_element, create_icon} from "./utilities";

export class SidebarItem extends MapStateObserver {
    protected _div: HTMLElement;

    public constructor(app: App, id: string, helpUrl: string = "") {
        super(app);

        this._div = document.getElementById(`sidebar-${id}`)!;

        const header = create_element("div", ["header"]);
        const h2 = create_element("h2", [], {
            "data-i18n": `sidebar.${id}.title`,
        });
        header.append(h2);

        if (helpUrl !== "") {
            const help = create_element("a", ["helpButton"]) as HTMLAnchorElement;
            help.target = "_blank";
            help.href = helpUrl;
            help.append(create_icon("help-circle", ["icon24"]));
            header.append(help);
        }

        const close = create_element("close", ["closeButton"]);
        close.addEventListener("click", (): void => {
            this.app.map_state.set_sidebar_open(null);
        });
        close.append(create_icon("x", ["icon24"]));
        header.append(close);

        this._div.prepend(header);
    }

    public activate(): void {
        this._div.classList.add("active");
    }

    public deactivate(): void {
        this._div.classList.remove("active");
    }
}
