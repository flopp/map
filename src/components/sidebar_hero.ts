import {App} from "./app";
import type {MapStateChange} from "./map_state";
import {SidebarItem} from "./sidebar_item";

export class SidebarHero extends SidebarItem {
    public constructor(app: App, id: string) {
        super(app, id, "https://blog.flopp.net");
    }

    public update_state(_changes: MapStateChange): void {
        // Nothing
    }
}
