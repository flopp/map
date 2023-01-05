import {App} from "./app";
import {create_element, create_icon} from "./utilities";

export class Dialog {
    protected readonly _app: App;
    protected readonly _div: HTMLDivElement;

    public constructor(id: string, app: App, helpUrl: string = "") {
        this._app = app;
        this._div = document.getElementById(id) as HTMLDivElement;

        if (helpUrl !== "") {
            const title = this._div.querySelector(".modal-card-title")!;
            const help = create_element("a", ["helpButton"]) as HTMLAnchorElement;
            help.target = "_blank";
            help.href = helpUrl;
            help.append(create_icon("help-circle", ["icon24"]));
            title.parentElement!.insertBefore(help, title.nextSibling);
        }

        this._div.querySelectorAll("[data-cancel]").forEach((element: HTMLElement): void => {
            element.addEventListener("click", (): void => {
                this.hide();
            });
        });
        this._div.querySelectorAll("[data-ok]").forEach((element: HTMLElement): void => {
            element.addEventListener("click", (): void => {
                this.ok();
            });
        });
    }

    public show() {
        this._div.classList.add("is-active");
    }

    public hide() {
        this._div.classList.remove("is-active");
    }

    public ok() {
        throw new Error("Dialog.ok not implemented by subclass.");
    }
}
