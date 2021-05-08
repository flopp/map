import {App} from './app';
import {MapStateChange} from './map_state';
import {create_element} from "./utilities";
import {SidebarItem} from "./sidebar_item";

export class SidebarTools extends SidebarItem {
    private language_select: HTMLInputElement;

    constructor(app: App, id: string) {
        super(app, id);

        const self = this;

        this.language_select = this._div.querySelector('[data-language]')!;

        interface TitleShort { title: string, short: string};
        [
            {title: 'English', short: 'en'},
            {title: 'Deutsch', short: 'de'},
        ].forEach((language: TitleShort): void => {
            self.language_select.appendChild(new Option(
                language.title,
                language.short,
                language.short  === "en",
                language.short === self.app.map_state.language)
            );
        });
        this.language_select.onchange = (): void => {
            self.app.map_state.set_language(self.language_select.value);
        };

        document.querySelector('#btn-link')!.addEventListener('click', (): void => {
            self.app.show_link_dialog();
        });

        document.querySelector('#btn-export-json')!.addEventListener('click', (): void => {
            self.export_json();
        });

        document.querySelector('#btn-import-json')!.addEventListener('click', (event: InputEvent): void => {
            (document.querySelector('#inp-import-json') as HTMLButtonElement).click();
            event.preventDefault();
        });
        (document.querySelector('#inp-import-json') as HTMLInputElement).onchange = (event: InputEvent): void => {
            if (event.target === null) {
                return;
            }
            const files = (event.target as HTMLInputElement).files;
            if (files === null) {
                return;
            }
            self.import_json(files[0]);
        };

        document.querySelector('#btn-multi-markers')!.addEventListener('click', (): void => {
            self.app.show_multi_markers_dialog();
        });
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.LANGUAGE) === MapStateChange.NOTHING) {
            return;
        }

        this.language_select.value = this.app.map_state.language;
    }

    public export_json(): void {
        const data = JSON.stringify(this.app.map_state.to_json());
        const element = create_element('a', [], {
            'href': `data:application/json;charset=utf-8,${encodeURIComponent(data)}`,
            'download': 'map_state.json'
        });
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    public import_json(file: File): void {
        const self = this;
        const reader = new FileReader();
        reader.onloadend = (): void => {
            const data = JSON.parse((reader.result as string));
            self.app.map_state.from_json(data);
            self.app.switch_map(self.app.map_state.map_type);
        };
        reader.readAsText(file);

        // reset file input
        (document.querySelector('#inp-import-json') as HTMLInputElement).value = '';
    }
}
