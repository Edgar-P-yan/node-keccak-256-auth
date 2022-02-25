/*!
 * keccak-256-auth v0.0.0
 * (c) Edgar Pogosyan
 * Released under the MIT License.
 */

import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import url from 'url';
import { Strategy } from 'passport-strategy';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

/**
 * @see https://github.com/axios/axios/pull/3737
 */
function axiosGetFullUri(config) {
    // config = mergeConfig(this.defaults, config);
    var fullPath = undefined(config.baseURL, config.url);
    return undefined(fullPath, config.params, config.paramsSerializer);
}

/**
 * Adds Authorization header with the Keccak-256 schema to the requests.
 * @see https://coldstack.atlassian.net/wiki/spaces/CS/pages/322109441/HTTP
 */
function keccak256AxiosInterceptor(params) {
    var privateKey = Buffer.from(params.privateKey.replace(/^0x/, ''), 'hex');
    var publicKey = ethUtil.privateToAddress(privateKey).toString('hex');
    var defaultSignedHeaders = params.signedHeaders
        ? params.signedHeaders.map(function (header) { return header.toLowerCase(); })
        : ['date', 'host'];
    return function (config) {
        if (!config.method) {
            throw new TypeError("config.method is ".concat(config.method));
        }
        var uri = url.parse(axiosGetFullUri(config));
        /** path is the "/pathname?query=val" part of the url */
        var path = uri.path;
        /**
         * The list of headers
         * @example
         * ["content-length:1024", "content-type:text/plain"]
         */
        var headers = [];
        // In the "config" object there is no Host header
        // But it will appear only when the request sent.
        // We set it here explicitly to make sure that
        // in the signature the Host header will be included.
        if (!hasKeyCaseInsensitive(config.headers, 'host')) {
            var host = uri.host;
            if (config.headers) {
                config.headers['host'] = host;
            }
            else {
                config.headers = {
                    host: host,
                };
            }
        }
        if (!hasKeyCaseInsensitive(config.headers, 'date')) {
            var date = new Date().toUTCString();
            if (config.headers) {
                config.headers['date'] = date;
            }
            else {
                config.headers = {
                    date: date,
                };
            }
        }
        // Delete all headers from SignedHeaders which are not specified in the configs
        var signedHeaders = defaultSignedHeaders
            .filter(function (header) { return hasKeyCaseInsensitive(config.headers, header); })
            .sort();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Object.entries(config.headers)
            .map(function (_a) {
            var key = _a[0], val = _a[1];
            return [key.toLowerCase(), String(val)];
        })
            .filter(function (_a) {
            var key = _a[0];
            return signedHeaders.includes(key);
        })
            .sort(function (_a, _b) {
            var key1 = _a[0];
            var key2 = _b[0];
            return (key1 > key2 ? 1 : -1);
        })
            .forEach(function (_a) {
            var key = _a[0], val = _a[1];
            headers.push("".concat(key, ":").concat(val));
        });
        var stringToSign = "".concat(config.method.toUpperCase(), " ").concat(path, "\n") + headers.join('\n');
        var signature = sigUtil.personalSign({
            privateKey: privateKey,
            data: ethUtil.bufferToHex(Buffer.from(stringToSign, 'utf-8')),
        });
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        config.headers['authorization'] =
            'Keccak-256 public_key=' +
                publicKey +
                ',signed_headers=' +
                signedHeaders.join(';') +
                ',signature=' +
                signature;
        return config;
    };
}
function hasKeyCaseInsensitive(record, key) {
    var lowerKey = key.toLowerCase();
    return record
        ? Object.keys(record).some(function (k) { return k.toLowerCase() === lowerKey; })
        : false;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var Keccak256Strategy = /** @class */ (function (_super) {
    __extends(Keccak256Strategy, _super);
    function Keccak256Strategy(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        return _this;
    }
    Keccak256Strategy.prototype.authenticate = function (req) {
        try {
            var parsed = this.parseAuthorizationHeader(req);
            if (!this.options.allowFrom
                .map(function (key) { return key.toLowerCase(); })
                .includes(parsed.publicKey.toLocaleLowerCase())) {
                throw new Error('Unauthorized: unknown publicKey');
            }
            var stringToSign = this.getStringToSign(req, parsed);
            var msgBufferHex = ethUtil.bufferToHex(Buffer.from(stringToSign, 'utf8'));
            var address = sigUtil.recoverPersonalSignature({
                data: msgBufferHex,
                signature: parsed.signature,
            });
            if (parsed.publicKey.toLowerCase() !== address.toLowerCase()) {
                throw new Error('Unauthorized: wrong signature');
            }
            var user = {
                publicKey: parsed.publicKey,
            };
            this.success(user);
        }
        catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.error(err);
        }
    };
    Keccak256Strategy.prototype.getStringToSign = function (req, parsed) {
        var stringToSign = "".concat(req.method.toUpperCase(), " ").concat(req.originalUrl, "\n");
        if (parsed.signedHeaders.length) {
            var headersEntries = Object.entries(req.headers)
                .filter(function (_a) {
                var key = _a[0];
                return parsed.signedHeaders.includes(key);
            })
                .sort(function (_a, _b) {
                var key1 = _a[0];
                var key2 = _b[0];
                return (key1 > key2 ? 1 : -1);
            })
                .map(function (header) {
                // When the request has multiple headers with the same name sort
                // them by their value
                if (Array.isArray(header[1])) {
                    header[1] = header[1].sort();
                }
                return header;
            });
            var headersArr_1 = [];
            headersEntries.forEach(function (header) {
                if (!Array.isArray(header[1])) {
                    headersArr_1.push(header[0] + ':' + header[1]);
                }
                else {
                    header[1].forEach(function (value) {
                        headersArr_1.push(header[0] + ':' + value);
                    });
                }
            });
            stringToSign += headersArr_1.join('\n');
        }
        return stringToSign;
    };
    Keccak256Strategy.prototype.parseAuthorizationHeader = function (req) {
        if (!req.headers.authorization ||
            typeof req.headers.authorization !== 'string') {
            throw new Error('Missing Authorization header');
        }
        var _a = req.headers.authorization.split(' '), schema = _a[0], params = _a[1];
        if (schema !== 'Keccak-256') {
            throw new Error('Unknown authentication schema. Expected Keccak-256');
        }
        var _b = params
            .split(',')
            .map(function (pair) { return pair.split('='); }), publicKeyPair = _b[0], headersPartPair = _b[1], signPartPair = _b[2];
        if (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        publicKeyPair[0] !== 'public_key' ||
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            headersPartPair[0] !== 'signed_headers' ||
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            signPartPair[0] !== 'signature') {
            throw new Error('Invalid Authentication header');
        }
        var result = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            publicKey: publicKeyPair[1],
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            signedHeaders: headersPartPair[1]
                .split(';')
                .filter(function (header) { return !!header; }),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            signature: signPartPair[1],
        };
        if (!result.publicKey.match(/^0x[a-fA-F0-9]{40}$/)) {
            throw new Error('Invalid Authentication header');
        }
        return result;
    };
    return Keccak256Strategy;
}(Strategy));

export { Keccak256Strategy, keccak256AxiosInterceptor };
//# sourceMappingURL=index.mjs.map
