import {MapStateObserver, MapStateChange} from "./mapstate.js";
import {MapType} from "./maptype.js";


export class SidebarLayers extends MapStateObserver {
    constructor(app) {
        super(app);

        this.baselayers = [
            {type: MapType.OPENSTREETMAP,    name: "OpenStreetMap"},
            {type: MapType.OPENTOPOMAP,      name: "OpenTopoMap"},
            {type: MapType.STAMEN_TERRAIN,   name: "Stamen Terrain"},
            {type: MapType.GOOGLE_ROADMAP,   name: "Google Roadmap"},
            {type: MapType.GOOGLE_SATELLITE, name: "Google Satellite"},
            {type: MapType.GOOGLE_HYBRID,    name: "Google Hybrid"},
            {type: MapType.GOOGLE_TERRAIN,   name: "Google Terrain"},
            {type: MapType.BING_ROAD,        name: "Bing Road"},
            {type: MapType.BING_AERIAL,      name: "Bing Aerial"},
        ];

        const baselayer_select = $("#sidebar-layers").find("[data-baselayer]");
        this.baselayers.forEach((baselayer) => {
            baselayer.option = $(`<option value=${baselayer.type}>`).text(baselayer.name);
            baselayer_select.append(baselayer.option);
        });
        baselayer_select.change(() => {
            app.switch_map(baselayer_select.val());
        });

        if (!app.has_google_maps()) {
            this.disable_google_layers();
        }
        if (!app.has_bing_maps()) {
            this.disable_bing_layers();
        }
    }

    update_state(changes) {
        if ((changes & MapStateChange.MAPTYPE) == MapStateChange.NOTHING) {
            return;
        }

        /* baselayer */
        $("#sidebar-layers").find("[data-baselayer]").val(this.map_state.map_type);
        this.update_baselayer_help();
    }

    disable_google_layers() {
        this.baselayers.forEach((baselayer) => {
            if (baselayer.name.indexOf("Google") >= 0) {
                baselayer.option.remove();
            }
        });
        this.update_baselayer_help();
    }

    disable_bing_layers() {
        this.baselayers.forEach((baselayer) => {
            if (baselayer.name.indexOf("Bing") >= 0) {
                baselayer.option.remove();
            }
        });
        this.update_baselayer_help();
    }

    update_baselayer_help() {
        const help_div = $("#sidebar-layers").find("[data-baselayer-help]");
        let missing_layers = '';
        if (this.app.has_google_maps()) {
            if (this.app.has_bing_maps()) {
                help_div.addClass("is-hidden");
                return;
            }
            missing_layers = 'Bing Maps';
        } else if (this.app.has_bing_maps()) {
            missing_layers = 'Google Maps';
        } else {
            missing_layers = 'Google Maps and Bing Maps';
        }
        help_div.removeClass("is-hidden");
        help_div.text(`${missing_layers} layers have been disabled due to missing/invalid API keys or other API problems.`);
    }
}
