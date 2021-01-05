export function getScript(url: string, callback: () => void): void {
    const prior = document.getElementsByTagName('script')[0];
    let script = document.createElement('script');
    script.async = true;

    script.addEventListener('load', (): void => {
        script.onload = null;
        script = undefined;
        if (callback) {
            callback();
        }
    });

    script.src = url;
    prior.parentNode.insertBefore(script, prior);
};
