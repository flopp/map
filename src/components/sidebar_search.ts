import {App} from "./app";
import {SidebarItem} from "./sidebar_item";

export class SidebarSearch extends SidebarItem {
    public constructor(app: App, id: string) {
        super(app, id);

        document.querySelector("#btn-locate")!.addEventListener("click", (): void => {
            this.app.locate_me();
        });
        document.querySelector("#btn-search")!.addEventListener("click", (): void => {
            this.perform_search();
        });
        document.querySelector("#input-search")!.addEventListener("keyup", (event: KeyboardEvent): void => {
            if (event.key === "Enter") {
                this.perform_search();
            }
        });
    }

    public update_state(_changes: number): void {
        // Nothing
    }

    public perform_search(): void {
        const location_string = (document.querySelector("#input-search") as HTMLInputElement).value.trim();
        if (location_string.length > 0) {
            this.app.search_location(location_string);
        }
    }
}
