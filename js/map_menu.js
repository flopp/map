export class MapMenu {
    constructor(app) {
        const self = this;
        this.app = app;
        this.menu = $('#map-contextmenu');
        this.addmarker = $('#map-contextmenu-addmarker');
        this.deletemarker = $('#map-contextmenu-deletemarker');
        this.projection = $('#map-contextmenu-projection');
        this.centermap = $('#map-contextmenu-centermap');
        this.marker = null;
        this.coordinates = null;

        this.addmarker.click(() => {
            self.hide();
            self.app.map_state.add_marker(self.coordinates);
            return false;
        });

        this.deletemarker.click(() => {
            self.hide();
            if (self.marker) {
                self.app.map_state.delete_marker(self.marker.get_id());
                self.marker = null;
            }
            return false;
        });

        this.projection.click(() => {
            self.hide();
            if (self.marker) {
                self.app.show_projection_dialog(self.marker);
            }
            return false;
        });

        this.centermap.click(() => {
            self.hide();
            if (self.coordinates) {
                self.app.map_state.set_center(self.coordinates);
            } else if (self.marker) {
                self.app.map_state.set_center(self.marker.coordinates);
            }
            return false;
        });

        this.hide();
    }

    hide() {
        this.menu.css({display: 'none'});
    }

    showMap(wrapper, x, y, coordinates) {
        this.addmarker.show();
        this.deletemarker.hide();
        this.projection.hide();
        this.centermap.show();

        this.marker = null;
        this.coordinates = coordinates;

        this.show(wrapper, x, y);
    }

    showMarker(wrapper, x, y, marker) {
        this.addmarker.hide();
        this.deletemarker.show();
        this.projection.show();
        this.centermap.show();

        this.marker = marker;
        this.coordinates = null;

        this.show(wrapper, x, y);
    }

    show(wrapper, x, y) {
        this.hide();

        let xx = x;
        let yy = y;

        // Adjust the menu if clicked to close to the edge of the map
        if (x > wrapper.width() - this.menu.width()) {
            xx = wrapper.width() - this.menu.width();
        }

        if (y > wrapper.height() - this.menu.height()) {
            yy = wrapper.height() - this.menu.height();
        }

        this.menu.css({top: yy, left: xx, display: 'block'});
    }
}
