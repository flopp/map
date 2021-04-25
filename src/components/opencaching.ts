import {Coordinates} from './coordinates';
import {getConfig} from './config';

enum State {
    Uninitialized = 0,
    Initializing,
    Querying,
    Error,
    Ready
};

interface Site {
    name: string,
    url: string,
    key: string
};

interface OkapiInstallation {
    site_url: string,
    site_name: string,
    okapi_base_url: string
};

export interface OkapiCache {
    code: string,
    name: string,
    location: string,
    status: string,
    url: string,
    type: string
};

interface OkapiError {
    developer_message: string;
    reason_stack: string[];
    status: string;
    more_info: string;
};

interface OkapiErrorMessage {
    error: OkapiError;
};

type CachesCallback = (caches: Map<string, OkapiCache>) => void;

const Icons = new Map([
    ["Other", "assets/cachetype-1.png"],
    ["Traditional", "assets/cachetype-2.png"],
    ["Multi", "assets/cachetype-3.png"],
    ["Virtual", "assets/cachetype-4.png"],
    ["Webcam", "assets/cachetype-5.png"],
    ["Event", "assets/cachetype-6.png"],
    ["Quiz", "assets/cachetype-7.png"],
    ["Math/Physics", "assets/cachetype-8.png"],
    ["Moving", "assets/cachetype-9.png"],
    ["Drive-In", "assets/cachetype-10.png"],
]);

export class Opencaching {
    private state: State;
    private timer: any;
    private callback: CachesCallback;
    private bounds: [number, number, number, number][];
    private sites: Site[];
    private disabled_sites: Set<string>;

    constructor(callback: CachesCallback) {
        this.state = State.Uninitialized;
        this.timer = null;
        this.callback = callback;
        this.bounds = [];
        this.sites = null;
        this.disabled_sites = new Set();
    }

    public loadBbox(north: number, south: number, west: number, east: number): void {
        switch (this.state) {
            case State.Uninitialized: {
                this.bounds.push([north, south, west, east]);
                this.initialize();
                break;
            }
            case State.Initializing: {
                this.bounds.push([north, south, west, east]);
                break;
            }
            case State.Querying: {
                this.bounds.push([north, south, west, east]);
                break;
            }
            case State.Error: {
                break;
            }
            case State.Ready: {
                this.bounds.push([north, south, west, east]);
                this.scheduleLoad();
                break;
            }
        }
    }

    public stop(): void {
        this.unscheduleLoad();
    }

    public parseLocation(loc: string): Coordinates {
        const lat_lng = loc.split("|");
        return new Coordinates(parseFloat(lat_lng[0]), parseFloat(lat_lng[1]));
    }

    public type_icon(type: string): string {
        if (Icons.has(type)) {
            return Icons.get(type);
        }
        return "assets/cachetype-1.png";
    }

    private initialize(): void {
        this.state = State.Initializing;

        const self = this;
        const keys = new Map();
        keys.set("Opencaching.DE", getConfig("OPENCACHING_DE_KEY"));
        keys.set("Opencaching.PL", getConfig("OPENCACHING_PL_KEY"));
        keys.set("Opencaching.NL", getConfig("OPENCACHING_NL_KEY"));
        keys.set("Opencaching.US", getConfig("OPENCACHING_US_KEY"));
        keys.set("Opencache.UK",   getConfig("OPENCACHING_UK_KEY"));
        keys.set("Opencaching.RO", getConfig("OPENCACHING_RO_KEY"));

        fetch("https://www.opencaching.de/okapi/services/apisrv/installations")
            .then((response: Response): Promise<any> => response.json())
            .then((data: OkapiInstallation[]): void => {
                self.sites = [];
                data.forEach((site: OkapiInstallation): void => {
                    if (!site.okapi_base_url.startsWith("https://")) {
                        return;
                    }
                    if (!keys.has(site.site_name)) {
                        return;
                    }
                    const key = keys.get(site.site_name);
                    if (key === "") {
                        return;
                    }

                    self.sites.push(
                        {
                            "name": site.site_name,
                            "url": site.okapi_base_url,
                            "key": key
                        }
                    );
                });
                self.state = State.Ready;
                self.scheduleLoad();
            })
            .catch((error: any): void => {
                console.log(error);
                self.state = State.Error;
            });
    }

    private scheduleLoad(): void {
        const self = this;
        if (this.bounds.length === 0) {
            return;
        }

        this.unscheduleLoad();
        this.timer = window.setTimeout((): void => {
            self.load();
        }, 1000);
    }

    private unscheduleLoad(): void {
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private load(): void {
        const self = this;

        if ((this.bounds.length === 0) || (this.sites === null) || (this.sites.length === 0)) {
            return;
        }

        this.state = State.Querying;

        const [north, south, west, east]: [number, number, number, number] = this.bounds[this.bounds.length-1];
        this.bounds = [];

        const promises: Promise<Map<string, OkapiCache>>[] = [];
        self.sites.forEach((site: Site): void => {
            if (self.disabled_sites.has(site.name)) {
                return;
            }
            const url = `${site.url}services/caches/shortcuts/search_and_retrieve`;
            const bbox = `${south}|${west}|${north}|${east}`;
            const parameters = [
                `consumer_key=${encodeURIComponent(site.key)}`,
                `search_method=${encodeURIComponent('services/caches/search/bbox')}`,
                `search_params=${encodeURIComponent(`{"bbox": "${bbox}", "limit": "500"}`)}`,
                `retr_method=${encodeURIComponent('services/caches/geocaches')}`,
                `retr_params=${encodeURIComponent('{"fields": "code|name|location|type|status|url"}')}`,
                `wrap=${encodeURIComponent('false')}`
            ];
            promises.push(
                fetch(url + '?' + parameters.join('&'))
                    .then((response: Response): Promise<any> => response.json())
                    .then((data: object): Map<string, OkapiCache> => {
                        const caches: Map<string, OkapiCache> = new Map();
                        if (("error" in data) && data.hasOwnProperty("error")) {
                            throw (data as OkapiErrorMessage).error;
                        }
                        for (const key in data) {
                            if (data.hasOwnProperty(key)) {
                                caches.set(key, data[key]);
                            }
                        };
                        return caches;
                    }).catch((error: any): Map<string, OkapiCache> => {
                        console.log(site.name, error);
                        console.log("Disabling site for future requests:", site.name);
                        self.disabled_sites.add(site.name);
                        return new Map();
                    })
            );
        });

        Promise.all(promises).then((cache_maps: Map<string, OkapiCache>[]): void => {
            self.state = State.Ready;
            const caches: Map<string, OkapiCache> = new Map();
            cache_maps.forEach((caches_map: Map<string, OkapiCache>): void => {
                caches_map.forEach((value: any, key: string): void => {
                    caches.set(key, value);
                });
            });
            self.callback(caches);
            self.scheduleLoad();
        });
    }
}
