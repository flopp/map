import {App} from "./app";
import {Dialog} from "./dialog";

export class LinkDialog extends Dialog {
    public constructor(app: App) {
        super("link-dialog", app, "https://blog.flopp.net/creating-a-link/");

        const copy_button = document.getElementById("link-dialog-copy-button") as HTMLButtonElement;

        copy_button.addEventListener("click", () => {
            const text = (document.querySelector("#link-dialog-input") as HTMLInputElement).value;
            app.copyClipboard(
                text,
                app.translate("dialog.link.copied-message", text),
                app.translate("dialog.link.failed-message"),
            );
        });
    }

    public show(): void {
        const link = this._app.map_state.create_link();
        (document.querySelector("#link-dialog-input") as HTMLInputElement).value = link;

        super.show();
    }
}
