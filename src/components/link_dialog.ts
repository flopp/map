import ClipboardJS from 'clipboard';
import {App} from './app';

interface ClipboardJsEvent {
    action: string;
    text: string;
    trigger: Element;
    clearSelection(): void;
}

export class LinkDialog {
    private div: HTMLElement;
    private app: App;
    private clipboard: ClipboardJS;

    constructor(app: App) {
        const self = this;

        this.div = document.querySelector('#link-dialog');
        this.app = app;
        this.clipboard = new ClipboardJS('#link-dialog-copy-button');
        this.clipboard.on('success', (e: ClipboardJsEvent): void => {
            self.app.message(self.app.translate('dialog.link.copied_message').replace('{1}', e.text));
        });
        this.clipboard.on('error', (_e: ClipboardJsEvent): void => {
            self.app.message_error(
                self.app.translate('dialog.link.failed_message'),
            );
        });

        this.div.querySelectorAll('[data-cancel]').forEach((element: HTMLElement): void => {
            element.addEventListener('click', (): void => {
                self.hide();
            });
        });
    }

    public show(): void {
        this.div.classList.add('is-active');
        const link = this.app.map_state.create_link();
        (document.querySelector('#link-dialog-input') as HTMLInputElement).value = link;
    }

    public hide(): void {
        this.div.classList.remove('is-active');
    }
}
