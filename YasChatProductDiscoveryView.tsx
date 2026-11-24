/**
 * Backward-compatible entrypoint.
 * The original prototype contained malformed JSX/DOM selectors and placeholder
 * actions. The maintained, typed implementation lives under src/.
 */
export { default } from "./src/YasChatProductDiscoveryView";
export * from "./src/yasChatDiscovery";
export * from "./src/yasChatDiscoveryApi";
