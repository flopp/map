import {App} from "./app";
import {MapStateChange} from "./map_state";
import {isGoogle, MapType, maptype2human, maptype2string, string2maptype} from "./map_type";
import {SidebarItem} from "./sidebar_item";
import {remove_element} from "./utilities";

interface IBaseLayerDict {type: MapType; option: HTMLOptionElement|null;}

export class SidebarLayers extends SidebarItem {
    private readonly base_layers: IBaseLayerDict[];
    private readonly base_layer_select: HTMLSelectElement;
    private readonly hill_shading_checkbox: HTMLInputElement;
    private readonly german_npa_checkbox: HTMLInputElement;
    private readonly opencaching_checkbox: HTMLInputElement;

    public constructor(app: App, id: string) {
        super(app, id);

        this.base_layers = [
            {type: MapType.OPENSTREETMAP, option: null},
            {type: MapType.OPENTOPOMAP, option: null},
            {type: MapType.STAMEN_TERRAIN, option: null},
            {type: MapType.HUMANITARIAN, option: null},
            {type: MapType.ARCGIS_WORLDIMAGERY, option: null},
            {type: MapType.GOOGLE_ROADMAP, option: null},
            {type: MapType.GOOGLE_SATELLITE, option: null},
            {type: MapType.GOOGLE_HYBRID, option: null},
            {type: MapType.GOOGLE_TERRAIN, option: null},
        ];

        this.base_layer_select = this._div.querySelector("[data-base-layer]")!;
        this.base_layers.forEach((base_layer: IBaseLayerDict): void => {
            base_layer.option = new Option(
                maptype2human(base_layer.type),
                maptype2string(base_layer.type),
                false,
                base_layer.type === this.app.map_state.map_type,
            );
            this.base_layer_select.appendChild(base_layer.option);
        });
        this.base_layer_select.onchange = (): void => {
            app.switch_map(string2maptype(this.base_layer_select.value));
        };

        this._div.querySelector("[data-add-keys-button]")!.addEventListener("click", (): void => {
            this.app.show_api_keys_dialog();
        });

        if (!app.has_google_maps()) {
            this.disable_google_layers();
        }

        this.hill_shading_checkbox = this._div.querySelector(
            "[data-hill-shading-layer]",
        )!;
        this.hill_shading_checkbox.checked = this.app.map_state.hill_shading;
        this.hill_shading_checkbox.onchange = (): void => {
            this.app.map_state.set_hill_shading(
                this.hill_shading_checkbox.checked,
            );
        };

        this.german_npa_checkbox = this._div.querySelector(
            "[data-german-npa-layer]",
        )!;
        this.german_npa_checkbox.checked = this.app.map_state.german_npa;
        this.german_npa_checkbox.onchange = (): void => {
            this.app.map_state.set_german_npa(
                this.german_npa_checkbox.checked,
            );
        };

        this.opencaching_checkbox = this._div.querySelector(
            "[data-opencaching-layer]",
        )!;
        this.opencaching_checkbox.checked = this.app.map_state.opencaching;
        this.opencaching_checkbox.onchange = (): void => {
            this.app.map_state.set_opencaching(
                this.opencaching_checkbox.checked,
            );
        };
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.MAPTYPE) === MapStateChange.NOTHING) {
            return;
        }
        if (this.app.map_state.map_type === null) {
            return;
        }

        /* base_layer */
        this.base_layer_select.value = maptype2string(this.app.map_state.map_type);
        this.update_base_layer_help();
    }

    public disable_layers(check_function: (layer_type: MapType|null) => boolean): void {
        this.base_layers.forEach((base_layer: IBaseLayerDict): void => {
            if (check_function(base_layer.type)) {
                if (base_layer.option !== null) {
                    remove_element(base_layer.option);
                    base_layer.option = null;
                }
            }
        });
        this.update_base_layer_help();
    }

    public enable_layers(check_function: (layer_type: MapType|null) => boolean): void {
        this.base_layers.forEach((base_layer: IBaseLayerDict): void => {
            if (check_function(base_layer.type)) {
                if (base_layer.option === null) {
                    base_layer.option = new Option(
                        maptype2human(base_layer.type),
                        maptype2string(base_layer.type),
                        false,
                        base_layer.type === this.app.map_state.map_type,
                    );
                    this.base_layer_select.appendChild(base_layer.option);
                }
            }
        });
        this.update_base_layer_help();
    }

    public disable_google_layers(): void {
        this.disable_layers(isGoogle);
    }

    public enable_google_layers(): void {
        this.enable_layers(isGoogle);
    }

    public update_base_layer_help(): void {
        const help_div = (this._div.querySelector("[data-base-layer-help]") as HTMLElement);
        if (this.app.has_google_maps()) {
            help_div.classList.add("is-hidden");
            return;
        }
        help_div.innerText = this.app.translate("sidebar.layers.google_disabled");
        help_div.classList.remove("is-hidden");
    }
}
