import {App} from "./app";

export class Dialog {
    protected readonly _app: App;
    protected readonly _div: HTMLDivElement;

    public constructor(id: string, app: App) {
        this._app = app;
        this._div = document.getElementById(id) as HTMLDivElement;

        this._div.querySelectorAll("[data-cancel]")
            .forEach((element: HTMLElement): void => {
                element.addEventListener("click", (): void => {
                    this.hide();
                });
            });
        this._div.querySelectorAll("[data-ok]")
            .forEach((element: HTMLElement): void => {
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
