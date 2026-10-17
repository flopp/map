import {App} from "./app";
import {create_element} from "./utilities";

export class YesNoDialog {
    private readonly _app: App;
    private readonly _dialog: HTMLDivElement;
    private readonly _title: HTMLHeadingElement;
    private readonly _text: HTMLParagraphElement;
    private readonly _yes_button: HTMLButtonElement;
    private _on_yes: (() => void) | null = null;

    public constructor(app: App) {
        this._app = app;

        this._dialog = create_element("div", ["modal"], {
            id: "yesno-dialog",
        }) as HTMLDivElement;
        const card = create_element("div", ["modal-card"]);
        const header = create_element("header", ["modal-card-head"]);
        this._title = create_element("h2", ["modal-card-title"], {
            id: "yesno-title",
        }) as HTMLHeadingElement;
        this._title.textContent = "TITLE";
        header.append(this._title);
        card.append(header);

        const body = create_element("section", ["modal-card-body"]);
        this._text = create_element("p", [], {
            id: "yesno-text",
        }) as HTMLParagraphElement;
        this._text.textContent = "TEXT";
        body.append(this._text);
        card.append(body);

        const footer = create_element("footer", ["modal-card-foot"]);
        this._yes_button = create_element("button", ["button"], {
            id: "yesno-yes",
            "data-i18n": "general.yes",
        }) as HTMLButtonElement;
        this._yes_button.textContent = "YES";
        this._yes_button.addEventListener("click", (): void => this.confirm());
        footer.append(this._yes_button);

        const no_button = create_element("button", ["button"], {
            id: "yesno-no",
            "data-i18n": "general.no",
        });
        no_button.textContent = "NO";
        no_button.addEventListener("click", (): void => this.close());
        footer.append(no_button);
        card.append(footer);

        this._dialog.append(create_element("div", ["modal-background"]), card);
        document.body.append(this._dialog);
        this._app.localize(this._dialog);
    }

    public show(title: string, text: string, onYes: () => void): void {
        this._title.innerHTML = title;
        this._text.innerHTML = text;
        this._on_yes = onYes;
        this._dialog.classList.add("is-active");
        this._yes_button.focus();
    }

    private confirm(): void {
        const on_yes = this._on_yes;
        this.close();
        on_yes?.();
    }

    private close(): void {
        this._dialog.classList.remove("is-active");
        this._on_yes = null;
    }
}
