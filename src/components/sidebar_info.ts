import {App} from "./app";
import {SidebarItem} from "./sidebar_item";

export class SidebarInfo extends SidebarItem {
    public constructor(app: App, id: string) {
        super(app, id);

        document.querySelector("#btn-news")!.addEventListener("click", (): void => {
            this.app.news_dialog.show();
        });
    }

    public update_state(_changes: number): void {
        // Nothing
    }
}
