import type { AxiosRequestConfig } from 'axios';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import url from 'url';
import { axiosGetFullUri } from './axios-get-full-uri';
import _debug from 'debug';
const debug = _debug('keccak-256-auth:axios-interceptor');

type AxiosInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig;

/**
 * Adds Authorization header with the Keccak-256 schema to the requests.
 * @see https://coldstack.atlassian.net/wiki/spaces/CS/pages/322109441/HTTP
 */
export function keccak256AxiosInterceptor(params: {
  privateKey: string;
  signedHeaders?: string[];
  debug?: boolean;
}): AxiosInterceptor {
  const privateKey = Buffer.from(params.privateKey.replace(/^0x/, ''), 'hex');
  const publicKey = ethUtil.bufferToHex(ethUtil.privateToAddress(privateKey));
  const defaultSignedHeaders = params.signedHeaders
    ? params.signedHeaders.map((header) => header.toLowerCase())
    : ['date', 'host'];

  params.debug &&
    debug(
      `Initialized: publicKey=${publicKey}, signedHeaders=${defaultSignedHeaders.join(
        ';',
      )}`,
    );

  return function _keccak256AxiosInterceptor(
    config: AxiosRequestConfig,
  ): AxiosRequestConfig {
    if (!config.method) {
      throw new TypeError(`config.method is ${config.method}`);
    }

    const uri = url.parse(axiosGetFullUri(config));

    /** path is the "/pathname?query=val" part of the url */
    const path = uri.path;

    /**
     * The list of headers
     * @example
     * ["content-length:1024", "content-type:text/plain"]
     */
    const headers: string[] = [];

    // In the "config" object there is no Host header
    // But it will appear only when the request sent.
    // We set it here explicitly to make sure that
    // in the signature the Host header will be included.
    if (!hasKeyCaseInsensitive(config.headers, 'host')) {
      const host = uri.host as string;
      if (config.headers) {
        config.headers['host'] = host;
      } else {
        config.headers = {
          host,
        };
      }
    }

    if (!hasKeyCaseInsensitive(config.headers, 'date')) {
      const date = new Date().toUTCString();
      if (config.headers) {
        config.headers['date'] = date;
      } else {
        config.headers = {
          date,
        };
      }
    }

    // Delete all headers from SignedHeaders which are not specified in the configs
    const signedHeaders = defaultSignedHeaders
      .filter((header) => hasKeyCaseInsensitive(config.headers, header))
      .sort();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Object.entries(config.headers!)
      .map(([key, val]): [string, string] => [key.toLowerCase(), String(val)])
      .filter(([key]) => signedHeaders.includes(key))
      .sort(([key1], [key2]) => (key1 > key2 ? 1 : -1))
      .forEach(([key, val]) => {
        headers.push(`${key}:${val}`);
      });

    const stringToSign =
      `${config.method.toUpperCase()} ${path}\n` + headers.join('\n');

    const signature = sigUtil.personalSign({
      privateKey,
      data: ethUtil.bufferToHex(Buffer.from(stringToSign, 'utf-8')),
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    config.headers!['authorization'] =
      'Keccak-256 public_key=' +
      publicKey +
      ',signed_headers=' +
      signedHeaders.join(';') +
      ',signature=' +
      signature;

    if (params.debug) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      config.headers!['x-keccak-256-string-to-sign'] = stringToSign;
    }

    debug(`String to sign: ${stringToSign}`);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    debug(`Authorization header: ${config.headers!['authorization']}`);

    return config;
  };
}

function hasKeyCaseInsensitive(
  record: Record<string, unknown> | undefined,
  key: string,
): boolean {
  const lowerKey = key.toLowerCase();
  return record
    ? Object.keys(record).some((k) => k.toLowerCase() === lowerKey)
    : false;
}
