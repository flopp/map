import {App} from "./app";

export class ApiKeysDialog {
    private div: HTMLElement;
    private app: App;

    constructor(app: App) {
        const self = this;

        this.div = document.querySelector('#api-keys-dialog');
        this.app = app;

        this.div.querySelectorAll('[data-cancel]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.hide();
            });
        });
        this.div.querySelectorAll('[data-ok]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.ok();
            });
        });
    }

    public show(): void {
        this.div.classList.add('is-active');
        (this.div.querySelector(
            '[data-google-api-key]',
        ) as HTMLInputElement).value = this.app.map_state.google_api_key;
    }

    public hide(): void {
        this.div.classList.remove('is-active');
    }

    public ok(): void {
        this.app.map_state.set_google_api_key(
            (this.div.querySelector('[data-google-api-key]') as HTMLInputElement).value,
        );
        this.app.reset_maps();
        this.hide();
    }
}
