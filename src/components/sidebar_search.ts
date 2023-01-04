import {App} from "./app";
import {MapStateChange} from "./map_state";
import {SidebarItem} from "./sidebar_item";

export class SidebarSearch extends SidebarItem {
    private readonly centerField: HTMLParagraphElement;

    public constructor(app: App, id: string) {
        super(app, id);

        this.centerField = document.querySelector("#sidebar-search-center")!;

        document.querySelector("#btn-locate")!.addEventListener("click", (): void => {
            this.app.locate_me();
        });
        document.querySelector("#btn-search")!.addEventListener("click", (): void => {
            this.perform_search();
        });
        document
            .querySelector("#input-search")!
            .addEventListener("keyup", (event: KeyboardEvent): void => {
                if (event.key === "Enter") {
                    this.perform_search();
                }
            });
        document.querySelector("#sidebar-search-center-copy")!.addEventListener("click", (event: Event): void => {
            const center = this.app.map_state.center;
            if (center === null) {
                return;
            }
            const text = center.to_string(
                this.app.map_state.settings_marker_coordinates_format,
            );
            this.app.copyClipboard(
                text,
                this.app.translate("sidebar.markers.copy_coordinates_success_message", text),
                this.app.translate("sidebar.markers.copy_coordinates_failure_message"),
            );
            event.stopPropagation();
        });
        document.querySelector("#sidebar-search-add-marker")!.addEventListener("click", (): void => {
            this.app.map_state.add_marker(null);
        });
    }

    public update_state(changes: number, _marker_id: number = -1): void {
        if ((changes & (MapStateChange.CENTER | MapStateChange.MARKERS)) === MapStateChange.NOTHING) {
            return;
        }

        this.centerField.innerText =
            (this.app.map_state.center === null) ?
            "n/a" :
            this.app.map_state.center.to_string(this.app.map_state.settings_marker_coordinates_format);
    }

    public perform_search(): void {
        const location_string = (document.querySelector(
            "#input-search",
        ) as HTMLInputElement).value.trim();
        if (location_string.length > 0) {
            this.app.search_location(location_string);
        }
    }
}
