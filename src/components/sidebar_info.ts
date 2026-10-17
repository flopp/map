import {App} from "./app";
import type {MapStateChange} from "./map_state";
import {SidebarItem} from "./sidebar_item";

export class SidebarInfo extends SidebarItem {
    public constructor(app: App, id: string) {
        super(app, id);

        document.querySelector("#btn-news")!.addEventListener("click", (): void => {
            this.app.news_dialog.show();
        });
    }

    public update_state(_changes: MapStateChange): void {
        // Nothing
    }
}
