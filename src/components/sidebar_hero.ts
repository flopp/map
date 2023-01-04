import {App} from "./app";
import {SidebarItem} from "./sidebar_item";

export class SidebarHero extends SidebarItem {
    public constructor(app: App, id: string) {
        super(app, id);
    }

    public update_state(_changes: number, _marker_id: number = -1): void {
        // Nothing
    }
}
