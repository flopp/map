import ClipboardJS from "clipboard";

import {App} from "./app";
import {Dialog} from "./dialog";

interface IClipboardJsEvent {
    action: string;
    text: string;
    trigger: Element;
    clearSelection(): void;
}

export class LinkDialog extends Dialog {
    private readonly clipboard: ClipboardJS;

    public constructor(app: App) {
        super("link-dialog", app);

        this.clipboard = new ClipboardJS("#link-dialog-copy-button");
        this.clipboard.on("success", (e: IClipboardJsEvent): void => {
            this._app.message(this._app.translate("dialog.link.copied-message").replace("{1}", e.text));
        });
        this.clipboard.on("error", (_e: IClipboardJsEvent): void => {
            this._app.message_error(
                this._app.translate("dialog.link.failed-message"),
            );
        });
    }

    public show(): void {
        const link = this._app.map_state.create_link();
        (document.querySelector("#link-dialog-input") as HTMLInputElement).value = link;

        super.show();
    }
}
