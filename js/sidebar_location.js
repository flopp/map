import {MapStateObserver} from './mapstate.js';

export class SidebarLocation extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        $('#btn-locate').click(() => {
            self.app.locate_me();
        });
        $('#btn-search').click(() => {
            self.perform_search();
        });
        $('#input-search').keypress((event) => {
            if (event.which == 13) {
                self.perform_search();
            }
        });
    }

    update_state(_changes) {
        // nothing
    }

    perform_search() {
        const location_string = $('#input-search').val().trim();
        if (location_string.length > 0) {
            self.app.search_location(location_string);
        }
    }
}
