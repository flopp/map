import {App} from "./app";
import {Dialog} from "./dialog";

export class ApiKeysDialog extends Dialog {
    private readonly _keyInput: HTMLInputElement;

    public constructor(app: App) {
        super("api-keys-dialog", app);

        this._keyInput = this._div.querySelector(
            "[data-google-api-key]",
        ) as HTMLInputElement;
    }

    public show(): void {
        this._keyInput.value = this._app.map_state.google_api_key;
        super.show();
    }

    public ok(): void {
        this._app.map_state.set_google_api_key(
            this._keyInput.value,
        );
        this._app.reset_maps();
        this.hide();
    }
}
