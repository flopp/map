class SidebarLocation extends MapStateObserver {
    constructor(app) {
        super(app.map_state);
        this.app = app;

        const self = this;

        $("#btn-locate").click(() => {
            self.app.locate_me();
        });
        $("#btn-search").click(() => {
            var location_string = $("#input-search").val();
            self.app.search_location(location_string);
        });
    }

    update_state() {
        // nothing
    }
}