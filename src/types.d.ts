export { };

declare global {
    interface Window {
        isApp?: boolean
        Bridge?: any;
        flutter_inappwebview?: any;
    }
}