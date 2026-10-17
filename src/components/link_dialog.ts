import {App} from "./app";
import {Dialog} from "./dialog";
import {create_element} from "./utilities";

const create_link_dialog = (): void => {
    const dialog = create_element("div", ["modal"], {id: "link-dialog"});
    const card = create_element("div", ["modal-card"]);

    const header = create_element("header", ["modal-card-head"]);
    const title = create_element("h2", ["modal-card-title"], {
        "data-i18n": "dialog.link.title",
    });
    title.textContent = "Create Map Link";
    header.append(title);
    header.append(
        create_element("button", ["delete"], {
            "data-cancel": null,
            "aria-label": "close",
        }),
    );
    card.append(header);

    const body = create_element("section", ["modal-card-body"]);
    const help = create_element("p", [], {
        "data-i18n": "dialog.link.help",
    });
    help.textContent =
        "You can share this link with others to enable them to view your current map state.";
    body.append(help);

    const link_field = create_element("div", ["field", "has-addons"]);
    const input_control = create_element("div", ["control", "is-expanded"]);
    input_control.append(
        create_element("input", ["input"], {
            id: "link-dialog-input",
            type: "text",
            readonly: null,
        }),
    );
    link_field.append(input_control);

    const copy_control = create_element("div", ["control"]);
    const copy_button = create_element("a", ["button", "is-info"], {
        id: "link-dialog-copy-button",
        "data-i18n": "dialog.link.copy",
    });
    copy_button.textContent = "Copy";
    copy_control.append(copy_button);
    link_field.append(copy_control);
    body.append(link_field);

    const too_long = create_element("p", ["help", "is-hidden"], {
        id: "link-dialog-too-long",
        "data-i18n": "dialog.link.too-long",
    });
    too_long.textContent = "Link too long";
    body.append(too_long);
    card.append(body);

    const footer = create_element("footer", ["modal-card-foot"]);
    const cancel_button = create_element("button", ["button"], {
        "data-cancel": null,
        "data-i18n": "general.cancel",
    });
    cancel_button.textContent = "Close";
    footer.append(cancel_button);
    card.append(footer);

    dialog.append(create_element("div", ["modal-background"]), card);
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
