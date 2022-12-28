import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";

// tslint:disable-next-line: no-default-import
import resources from "../lang";

import {App} from "./app";
import {MapStateChange} from "./map_state";
import {MapStateObserver} from "./map_state_observer";

export class Language extends MapStateObserver {
    private initialized: boolean;

    public constructor(app: App) {
        super(app);
        this.initialized = false;

        i18next
            .use(I18nextBrowserLanguageDetector)
            .init({
                debug: true,
                detection: {
                    order: ["querystring", "localStorage", "navigator"],
                    lookupQuerystring: "lang",
                    lookupLocalStorage: "i18nextLng",
                    caches: ["localStorage"],
                },
                load: "languageOnly",
                fallbackLng: ["en", "de"],
                ns: ["main"],
                defaultNS: "main",
                resources,
                supportedLngs: ["en", "de"],
            })
            .then((): void => {
                this.initialized = true;
                this.localize();
            })
            .catch((err: any): void => {
                console.log("i18n initialization failed", err);
            });
    }

    public update_state(changes: number): void {
        if ((changes & MapStateChange.LANGUAGE) === MapStateChange.NOTHING) {
            return;
        }

        if (this.app.map_state.language === i18next.language || i18next.language.startsWith(this.app.map_state.language)) {
            return;
        }
        this.app.message(`${i18next.language} => ${this.app.map_state.language}`);

        i18next
            .changeLanguage(this.app.map_state.language)
            .then((): void => {
                this.localize();
            })
            .catch((err: any): void => {
                console.log("i18n: failed to set language", this.app.map_state.language, err);
            });
    }

    public translate(key: string): string {
        if (!this.initialized) {
            console.log("i18n: not initialized, yet.");

            return key;
        }

        const translation = i18next.t(key);
        if (translation === "") {
            return key;
        }

        return translation;
    }

    public localize(tree: HTMLElement | null = null): void {
        if (!this.initialized) {
            console.log("i18n: not initialized, yet.");

            return;
        }

        (tree !== null ? tree : document)
            .querySelectorAll("[data-i18n]")
            .forEach((element: HTMLElement): void => {
                this.localizeElement(element);
            });
        this.app.map_state.update_observers(MapStateChange.LANGUAGE);
    }

    public localizeElement(element: HTMLElement): void {
        const key = element.getAttribute("data-i18n")!;
        let translation = i18next.t(key);
        if (translation === "") {
            translation = key;
        }

        const target = element.getAttribute("data-i18n-target");
        switch (target) {
            case null:
            case "":
            case "text":
                element.textContent = translation;
                break;
            case "placeholder":
                (element as HTMLInputElement).placeholder = translation;
                break;
            default:
                console.log(`i18n: bad i18n target attribute '${target}' in '${key}'`);
        }
    }
}
