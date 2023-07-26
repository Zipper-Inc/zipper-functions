import fetch from 'node-fetch';

import type {
  Inputs,
  ApiResponse,
  AppletOptions,
  ZipperRunClient,
} from './types';

import {
  DEFAULT_ZIPPER_DOT_RUN_HOST,
  LOG_PREFIX,
  ZIPPER_CLIENT_VERSION,
} from './constants';

function getBaseUrlFromIndentifier(identifier: string, overrideHost?: string) {
  let url;

  // If the identifier is a URL, we have what we need
  // Note: if the URL is not a zipper.run applet, it will def fail
  try {
    url = new URL(identifier);
  } catch (e) {
    // If it looks like a host, add a protocol, other let's assume it's a slug
    url = /\./.test(identifier)
      ? new URL(`https://${identifier}`)
      : new URL(`https://${identifier}.${DEFAULT_ZIPPER_DOT_RUN_HOST}`);
  }

  if (overrideHost) url.host = overrideHost;

  return new URL(url.origin);
}

class Applet implements ZipperRunClient {
  private baseUrl: URL;
  private isDebugMode: boolean;
  private token: string | undefined;

  constructor(indentifier: string, options?: AppletOptions) {
    this.baseUrl = getBaseUrlFromIndentifier(
      indentifier,
      options?.overrideHost,
    );
    this.isDebugMode = !!options?.debug;
    if (options?.token) this.token = options.token;

    this.debug('Applet.constructor', {
      indentifier,
      baseUrl: this.baseUrl,
      options: { ...options, token: options?.token ? '*****' : undefined },
    });
  }

  private debug(...args: any) {
    if (this.isDebugMode) console.log(`${LOG_PREFIX} DEBUG`, ...args);
  }

  get url() {
    return this.baseUrl.toString();
  }

  /**
   * Runs the applet at a given path with given inputs
   */
  async run<I extends Inputs = Inputs, O = any>({
    path = 'main.ts',
    inputs,
  }: {
    path?: string;
    inputs?: I;
  }): Promise<O> {
    this.debug('Applet.run', { path, inputs });

    const runUrl = new URL(this.baseUrl);
    runUrl.pathname = [path, 'api'].join('/');

    let body = '{}';
    if (inputs) {
      try {
        body = JSON.stringify(inputs);
      } catch (e) {
        throw new Error(`${LOG_PREFIX} Applet inputs could not be serialized`);
      }
    }
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Zipper-Client-Version': ZIPPER_CLIENT_VERSION,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    this.debug('Applet.run fetch', {
      runUrl,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? '******' : undefined,
      },
      body,
    });

    const { ok, data, error }: ApiResponse<O> = await fetch(runUrl, {
      method: 'POST',
      headers,
      body,
    })
      .then((r) => r.json())
      .catch((e) => ({
        ok: false,
        error: [
          'Applet could not complete fetch',
          e?.toString() || 'Unknown error',
        ].join(' -- '),
      }));

    if (!ok) {
      this.debug('Applet.run not ok', {
        data,
        error,
        path,
        inputs,
        body,
      });

      throw new Error(
        `${LOG_PREFIX} Response was not ok | ${error || 'Unknown error'}`,
      );
    }

    this.debug('Applet.run ok', { ok, data });
    return data;
  }

  /**
   * Chain syntax to run the applet a given path
   */
  path<I extends Inputs = Inputs, O = any>(
    path: string,
  ): ZipperRunClient<I, O> {
    this.debug('Applet.path', { path });
    return {
      url: [this.baseUrl + path].join('/'),
      run: async (inputs) => this.run({ path, inputs }),
    };
  }
}

/**
 * Create an Applet instance with the Zipper Client
 * @param identifier - The applet's *.zipper.run name or the entire zipper.run url
 * @param options - Options of how to interact with this applet
 */
export const createApplet = (identifier: string, options?: AppletOptions) =>
  new Applet(identifier, options);
