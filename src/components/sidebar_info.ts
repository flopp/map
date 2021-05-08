import {App} from './app';
import {SidebarItem} from "./sidebar_item";

export class SidebarInfo extends SidebarItem {
    constructor(app: App, id: string) {
        super(app, id);
    }

    public update_state(_changes: number): void {
        // nothing
    }
};
