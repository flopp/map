declare const _config: Record<string, string>;

export function getConfig(key: string): string|null {
    if (_config.hasOwnProperty(key)) {
        return _config[key];
    }
    return null;
}
