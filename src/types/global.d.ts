declare module "*.scss";
declare module "*.css";


interface Window {
    umami?: {
        track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
    };
}