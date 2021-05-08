import {App} from './app';
import {MapStateObserver} from "./map_state_observer";

export class SidebarItem extends MapStateObserver {
    protected _div: HTMLElement;

    constructor(app: App, id: string) {
        super(app);

        const self = this;

        this._div = document.getElementById(id)!;

        const closeButton = this._div.querySelector(".header > .close");
        if (closeButton) {
            closeButton.addEventListener('click', (): void => {
                self.app.map_state.set_sidebar_open(null);
            });
        }
    }

    public activate(): void {
        this._div.classList.add("active");
    }

    public deactivate(): void {
        this._div.classList.remove("active");
    }
};
