export const  getScript = (url: string): void => {
    const prior = document.getElementsByTagName("script")[0];
    let script: HTMLScriptElement|undefined = document.createElement("script");
    script.async = true;

    script.addEventListener("load", (): void => {
        script!.onload = null;
        script = undefined;
    });

    script.src = url;
    prior.parentNode!.insertBefore(script, prior);
};
