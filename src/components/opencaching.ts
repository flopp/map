import {getConfig} from "./config";
import {Coordinates} from "./coordinates";

enum State {
    Uninitialized = 0,
    Initializing,
    Querying,
    Error,
    Ready,
}

interface ISite {
    name: string;
    url: string;
    key: string;
}

interface IOkapiInstallation {
    site_url: string;
    site_name: string;
    okapi_base_url: string;
}

export interface IOkapiCache {
    code: string;
    name: string;
    location: string;
    status: string;
    url: string;
    type: string;
}

interface IOkapiError {
    developer_message: string;
    reason_stack: string[];
    status: string;
    more_info: string;
}

interface IOkapiErrorMessage {
    error: IOkapiError;
}

type CachesCallback = (caches: Map<string, IOkapiCache>) => void;

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
    private state: State = State.Uninitialized;
    private timer: number|null = null;
    private readonly callback: CachesCallback;
    private bounds: Array<[number, number, number, number]> = [];
    private sites: ISite[]|null = null;
    private readonly disabled_sites: Set<string>;

    public constructor(callback: CachesCallback) {
        this.callback = callback;
        this.bounds = [];
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
            default:
        }
    }

    public stop(): void {
        this.unscheduleLoad();
    }

    public static parseLocation(loc: string): Coordinates {
        const lat_lng = loc.split("|");

        return new Coordinates(parseFloat(lat_lng[0]), parseFloat(lat_lng[1]));
    }

    public static type_icon(type: string): string {
        if (Icons.has(type)) {
            return Icons.get(type)!;
        }

        return "assets/cachetype-1.png";
    }

    private initialize(): void {
        this.state = State.Initializing;

        const keys: Map<string, string|null> = new Map();
        keys.set("Opencaching.DE", getConfig("OPENCACHING_DE_KEY"));
        keys.set("Opencaching.PL", getConfig("OPENCACHING_PL_KEY"));
        keys.set("Opencaching.NL", getConfig("OPENCACHING_NL_KEY"));
        keys.set("Opencaching.US", getConfig("OPENCACHING_US_KEY"));
        keys.set("Opencache.UK",   getConfig("OPENCACHING_UK_KEY"));
        keys.set("Opencaching.RO", getConfig("OPENCACHING_RO_KEY"));

        fetch("https://www.opencaching.de/okapi/services/apisrv/installations")
            .then((response: Response): Promise<any> => response.json())
            .then((data: IOkapiInstallation[]): void => {
                this.sites = data.filter((site: IOkapiInstallation): boolean => {
                    if (!site.okapi_base_url.startsWith("https://")) {
                        return false;
                    }
                    if (!keys.has(site.site_name)) {
                        return false;
                    }
                    const key = keys.get(site.site_name);

                    return (key !== null && key !== "");
                }).map((site: IOkapiInstallation): ISite =>
                    ({
                        name: site.site_name,
                        url: site.okapi_base_url,
                        key: keys.get(site.site_name)!,
                    }));

                this.state = State.Ready;
                this.scheduleLoad();
            })
            .catch((error: any): void => {
                console.log(error);
                this.state = State.Error;
            });
    }

    private scheduleLoad(): void {
        if (this.bounds.length === 0) {
            return;
        }

        this.unscheduleLoad();
        this.timer = window.setTimeout((): void => {
            this.load();
        }, 1000);
    }

    private unscheduleLoad(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private load(): void {
        if ((this.bounds.length === 0) || (this.sites === null) || (this.sites.length === 0)) {
            return;
        }

        this.state = State.Querying;

        const [north, south, west, east]: [number, number, number, number] = this.bounds[this.bounds.length-1];
        this.bounds = [];

        const promises: Array<Promise<Map<string, IOkapiCache>>> = [];
        this.sites.forEach((site: ISite): void => {
            if (this.disabled_sites.has(site.name)) {
                return;
            }
            const url = `${site.url}services/caches/shortcuts/search_and_retrieve`;
            const bbox = `${south}|${west}|${north}|${east}`;
            const parameters = [
                `consumer_key=${encodeURIComponent(site.key)}`,
                `search_method=${encodeURIComponent("services/caches/search/bbox")}`,
                `search_params=${encodeURIComponent(`{"bbox": "${bbox}", "limit": "500"}`)}`,
                `retr_method=${encodeURIComponent("services/caches/geocaches")}`,
                `retr_params=${encodeURIComponent('{"fields": "code|name|location|type|status|url"}')}`,
                `wrap=${encodeURIComponent("false")}`,
            ];
            promises.push(
                fetch(`${url}?${parameters.join("&")}`)
                    .then((response: Response): Promise<any> => response.json())
                    .then((data: object): Map<string, IOkapiCache> => {
                        const caches: Map<string, IOkapiCache> = new Map();
                        if (("error" in data) && data.hasOwnProperty("error")) {
                            throw (data as IOkapiErrorMessage).error;
                        }
                        Object.entries(data).forEach((entry: [string, any]): void => {
                            caches.set(entry[0], entry[1] as IOkapiCache);
                        });

                        return caches;
                    }).catch((error: any): Map<string, IOkapiCache> => {
                        console.log(site.name, error);
                        console.log("Disabling site for future requests:", site.name);
                        this.disabled_sites.add(site.name);

                        return new Map();
                    }),
            );
        });

        Promise
            .all(promises)
            .then((cache_maps: Array<Map<string, IOkapiCache>>): void => {
                this.state = State.Ready;
                const caches: Map<string, IOkapiCache> = new Map();
                cache_maps.forEach((caches_map: Map<string, IOkapiCache>): void => {
                    caches_map.forEach((value: any, key: string): void => {
                        caches.set(key, value);
                    });
                });
                this.callback(caches);
                this.scheduleLoad();
            })
            .catch((reason: any): void => {
                console.log("fetching geocaches failed", reason);
            });
    }
}
