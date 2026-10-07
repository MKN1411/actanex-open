declare const __ACTANEX_VERSION__: string;
declare const __ACTANEX_RELEASE_ID__: string;
export const BUILD_VERSION = typeof __ACTANEX_VERSION__ === 'undefined' ? 'development' : __ACTANEX_VERSION__;
export const BUILD_RELEASE_ID = typeof __ACTANEX_RELEASE_ID__ === 'undefined' ? null : __ACTANEX_RELEASE_ID__;
