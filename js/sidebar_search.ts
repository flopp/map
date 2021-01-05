import {App} from "./app";
import {MapStateObserver} from "./map_state_observer";

export class SidebarSearch extends MapStateObserver {
    constructor(app: App) {
        super(app);

        const self = this;

        document.querySelector('#btn-locate').addEventListener('click', (): void => {
            self.app.locate_me();
        });
        document.querySelector('#btn-search').addEventListener('click', (): void => {
            self.perform_search();
        });
        document.querySelector('#input-search').addEventListener('keyup', (event: KeyboardEvent): void => {
            if (event.keyCode === 13) {
                self.perform_search();
            }
        });
    }

    public update_state(_changes: number): void {
        // nothing
    }

    public perform_search(): void {
        const location_string = (document.querySelector('#input-search') as HTMLInputElement).value.trim();
        if (location_string.length > 0) {
            this.app.search_location(location_string);
        }
    }
}
