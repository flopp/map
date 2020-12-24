import i18next from 'i18next';
import resources from '@alienfast/i18next-loader!../lang/index.js';
// import {i18nextBrowserLanguageDetector} from 'i18next-browser-languagedetector';
import {MapStateObserver, MapStateChange} from './map_state.js';

export class Language extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        this.initialized = false;

        // .use(i18nextBrowserLanguageDetector)
        i18next
            .init(
                {
                    debug: true,
                    detection: {
                        order: ['querystring', 'localStorage', 'navigator'],
                        lookupQuerystring: 'lang',
                        lookupLocalStorage: 'i18nextLng',
                        caches: ['localStorage'],
                    },
                    load: 'languageOnly',
                    whitelist: ['en', 'de'],
                    nonExplicitWhitelist: true,
                    fallbackLng: ['en', 'de'],
                    ns: ['main'],
                    defaultNS:'main',
                    resources
                },
                (err) => {
                    if (!err) {
                        self.initialized = true;
                        self.localize();
                    }
                },
            );
    }

    update_state(changes) {
        if ((changes & MapStateChange.LANGUAGE) == MapStateChange.NOTHING) {
            return;
        }

        const self = this;

        i18next.changeLanguage(this.app.map_state.language, (err) => {
            if (!err) {
                self.localize();
            }
        });
    }

    translate(key) {
        if (!this.initialized) {
            console.log('i18n: not initialized, yet.');
            return key;
        }

        const translation = i18next.t(key);
        if (translation == '') {
            return key;
        }

        return translation;
    }

    localize() {
        if (!this.initialized) {
            console.log('i18n: not initialized, yet.');
            return;
        }

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            let translation = i18next.t(key);
            if (translation == '') {
                translation = key;
            }

            const target = element.getAttribute('data-i18n-target');
            if (target === null || target ===  '' || target == 'text') {
                element.textContent = translation;
            } else if (target === 'placeholder') {
                element.placeholder = translation;
            } else {
                console.log(
                    `i18n: bad i18n target attribute '${target}' in '${key}'`
                );
            }
        });
    }
}
