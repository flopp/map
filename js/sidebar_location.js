import {MapStateObserver} from './map_state.js';

export class SidebarLocation extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        document.querySelector('#btn-locate').addEventListener('click', () => {
            self.app.locate_me();
        });
        document.querySelector('#btn-search').addEventListener('click', () => {
            self.perform_search();
        });
        document.querySelector('#input-search').addEventListener('keyup', (event) => {
            if (event.keyCode == 13) {
                self.perform_search();
            }
        });
    }

    update_state(_changes) {
        // nothing
    }

    perform_search() {
        const location_string = document.querySelector('#input-search').value.trim();
        if (location_string.length > 0) {
            self.app.search_location(location_string);
        }
    }
}
