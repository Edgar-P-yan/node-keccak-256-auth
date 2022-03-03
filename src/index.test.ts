/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { keccak256AxiosInterceptor } from './axios-interceptor';
import { Keccak256Strategy } from './passport-strategy';

const AUTHORIZATION_HEADER_REGEX =
  /^Keccak-256 public_key=0x000001921169232344c6b46ff7612bd16a921bff,signed_headers=([a-z0-9-]+;)*[a-z0-9-]+,signature=0x[a-f0-9]{130}$/;

// const publicKey = '0x000001921169232344C6B46ff7612BD16A921Bff';
const privateKey =
  '0x8beae57c2bed21b2912aacb0fb496f6dde18a6414a44a869e8c0409703ec02b6';

describe('unit | keccak256AxiosInterceptor', () => {
  it('sets Authorization header', () => {
    const interceptor = keccak256AxiosInterceptor({
      privateKey,
    });

    const newConfigs = interceptor({
      method: 'GET',
      baseURL: 'https://example.com',
      url: '/url',
    });

    expect(newConfigs.headers?.['authorization']).toBeDefined();
    expect(newConfigs.headers?.['authorization']).toMatch(
      AUTHORIZATION_HEADER_REGEX,
    );
  });

  it('calculates x-keccak-256-string-to-sign and signature correctly', () => {
    const interceptor = keccak256AxiosInterceptor({
      privateKey,
      debug: true,
    });

    const date = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const stringToSign = `GET /url\ndate:Thu, 01 Jan 1970 00:00:00 GMT\nhost:example.com`;

    const configs = interceptor({
      method: 'GET',
      baseURL: 'https://example.com',
      url: '/url',
      headers: {
        date,
      },
    });

    expect(configs.headers?.['x-keccak-256-string-to-sign']).toEqual(
      stringToSign,
    );
    expect(configs.headers?.['authorization']).toMatch(
      /signature=0x6256b08a7818d715628de0c3c6817a4d9321b42322cb68ac83a1deb27df0b4df519565f60c1b4661fe4f71591079d8c0583e269fa49d77c16bea49e4e3f35e981b$/,
    );

    const configs2 = interceptor({
      method: 'GET',
      url: 'https://example.com/url',
      headers: {
        date,
      },
    });

    expect(configs2.headers?.['x-keccak-256-string-to-sign']).toEqual(
      stringToSign,
    );
    expect(configs2.headers?.['authorization']).toMatch(
      /signature=0x6256b08a7818d715628de0c3c6817a4d9321b42322cb68ac83a1deb27df0b4df519565f60c1b4661fe4f71591079d8c0583e269fa49d77c16bea49e4e3f35e981b$/,
    );
  });
});

describe('unit | Keccak256Strategy', () => {
  it('fails when Authorization header is invalid', () => {
    const strategy = mockPassportStrategy(new Keccak256Strategy());

    const invalidAuthorizationHeaders = [
      '',
      'Keccak-256 ',
      'keccak-256 ',
      'Keccak-256 public_key=0x000001921169232344C6B46ff7612BD16A921Bff',
      'Keccak-256 public_key=0x000001921169232344C6B46ff7612BD16A921Bff,signature=0x031fd8e6322362de861fdfe0ed68c403271b193c127f184',
      'Keccak-256 public_key=0x000001921169232344C6B46ff7612BD16A921Bff,signed_headers=date;host,signature=',
      'Keccak-256 public_key=0x000001921169232344C6B46ff7612BD16A921Bff,signed_headers=date;host,signature=0x031fd8e6322362de861fdfe0ed68c403271b193c127f184',
    ];

    invalidAuthorizationHeaders.forEach((authorizationHeader) => {
      strategy.authenticate({
        headers: {
          authorization: authorizationHeader,
        },
      } as any);

      expect(strategy._error).toBeDefined();
      strategy._clear();
    });
  });

  it('successfully verifies the signature', () => {
    const strategy = mockPassportStrategy(new Keccak256Strategy());

    strategy.authenticate({
      method: 'GET',
      originalUrl: '/url',
      headers: {
        authorization:
          'Keccak-256 public_key=0x000001921169232344c6b46ff7612bd16a921bff,signed_headers=date;host,signature=0x6256b08a7818d715628de0c3c6817a4d9321b42322cb68ac83a1deb27df0b4df519565f60c1b4661fe4f71591079d8c0583e269fa49d77c16bea49e4e3f35e981b',
        date: 'Thu, 01 Jan 1970 00:00:00 GMT',
        host: 'example.com',
      },
    } as any);

    expect(strategy._result).toBeDefined();
    expect(strategy._result.publicKey).toEqual(
      '0x000001921169232344c6b46ff7612bd16a921bff',
    );
  });
});

function mockPassportStrategy<T extends object>(
  strategy: T,
): T & { _result?: any; _error?: any; _clear: () => void } {
  // @ts-ignore
  strategy.success = function (result: any) {
    // @ts-ignore
    this._result = result;
  };
  // @ts-ignore
  strategy.error = function (error: any) {
    // @ts-ignore
    this._error = error;
  };
  // @ts-ignore
  strategy._clear = function () {
    // @ts-ignore
    this._result = null;
    // @ts-ignore
    this._error = null;
  };

  return strategy as any;
}
