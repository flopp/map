import {MapStateObserver, MapStateChange} from "./mapstate.js";
import {MapType} from "./maptype.js";


export class SidebarLayers extends MapStateObserver {
    constructor(app) {
        super(app.map_state);

        $("#baselayer-dropdown").click((event) => {
            event.stopPropagation();
            $("#baselayer-dropdown").toggleClass('is-active');
        });

        this.baselayers = [
            {type: MapType.OPENSTREETMAP,    name: "OpenStreetMap"},
            {type: MapType.OPENTOPOMAP,      name: "OpenTopoMap"},
            {type: MapType.STAMEN_TERRAIN,   name: "Stamen Terrain"},
            {type: MapType.GOOGLE_ROADMAP,   name: "Google Roadmap"},
            {type: MapType.GOOGLE_SATELLITE, name: "Google Satellite"},
            {type: MapType.GOOGLE_HYBRID,    name: "Google Hybrid"},
            {type: MapType.GOOGLE_TERRAIN,   name: "Google Terrain"},
        ];
        const baselayer_menu = $("#baselayer-dropdown .dropdown-content");
        this.baselayers.forEach((baselayer) => {
            baselayer.a = $('<a href="#" class="dropdown-item">')
                .text(baselayer.name)
                .click(() => {
                    app.switch_map(baselayer.type);
                });
            baselayer_menu.append(baselayer.a);
        });
    }

    update_state(changes) {
        if ((changes & MapStateChange.MAPTYPE) == MapStateChange.NOTHING) {
            return;
        }

        var self = this;

        /* baselayer */
        this.baselayers.forEach((baselayer) => {
            if (self.map_state.map_type == baselayer.type) {
                baselayer.a.addClass("is-active");
                $("#baselayer-name").text(baselayer.name);
            } else {
                baselayer.a.removeClass("is-active");
            }
        });
    }
}
