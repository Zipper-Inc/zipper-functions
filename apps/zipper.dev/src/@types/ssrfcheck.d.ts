declare module 'ssrfcheck' {
  type Options = {
    /**
     * When an error occurs the function will only return false and wont throw it
     * @type {boolean}
     * @default true
     */
    quiet?: boolean;
    /**
     * Tells if the validator must automatically block any IP-URIs, e.g. https://164.456.34.44. By default IP URIs are allowed
     * @type {boolean}
     * @default false
     */
    noIP?: boolean;
    /**
     * Tells if the validator must allow URI's that contains login notation, e.g. https://test:pass@domain.com address
     * @type {boolean}
     * @default false
     */
    allowUsername?: boolean;
    /**
     * Protocols accepted by the validator. Default protocols are http, https
     * @type {string[]}
     */
    allowedProtocols?: string[];
  };
  export function isSSRFSafeURL(url: string, options?: Options): boolean;
}
