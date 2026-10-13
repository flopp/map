import {App} from "./app";
import {Dialog} from "./dialog";

const create_link_dialog = (): void => {
    const dialog = document.createElement("div");
    dialog.id = "link-dialog";
    dialog.classList.add("modal");
    dialog.innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <h2 class="modal-card-title" data-i18n="dialog.link.title">Create Map Link</h2>
                <button class="delete" data-cancel aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                <p data-i18n="dialog.link.help">You can share this link with others to enable them to view your current map state.</p>
                <div class="field has-addons">
                    <div class="control is-expanded">
                        <input id="link-dialog-input" class="input" type="text" readonly />
                    </div>
                    <div class="control">
                        <a id="link-dialog-copy-button" class="button is-info" data-i18n="dialog.link.copy">Copy</a>
                    </div>
                </div>
                <p id="link-dialog-too-long" class="help is-hidden" data-i18n="dialog.link.too-long">Link too long</p>
            </section>
            <footer class="modal-card-foot">
                <button class="button" data-cancel data-i18n="general.cancel">Close</button>
            </footer>
        </div>
    `;
    document.body.append(dialog);
};

export class LinkDialog extends Dialog {
    public constructor(app: App) {
        create_link_dialog();
        super("link-dialog", app, "https://blog.flopp.net/creating-a-link/");
        app.localize(this._div);

        const copy_button = this._div.querySelector(
            "#link-dialog-copy-button",
        ) as HTMLAnchorElement;

        copy_button.addEventListener("click", () => {
            const text = (this._div.querySelector("#link-dialog-input") as HTMLInputElement).value;
            app.copyClipboard(
                text,
                app.translate("dialog.link.copied-message", text),
                app.translate("dialog.link.failed-message"),
            );
        });
    }

    public show(): void {
        const link = this._app.map_state.create_link();
        (this._div.querySelector("#link-dialog-input") as HTMLInputElement).value = link;

        const too_long = this._div.querySelector("#link-dialog-too-long")!;
        if (link.length > 2000) {
            too_long.innerHTML = this._app.translate("dialog.link.too-long", `${link.length}`);
            too_long.classList.remove("is-hidden");
        } else {
            too_long.classList.add("is-hidden");
        }

        super.show();
    }
}
