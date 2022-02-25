/*!
 * keccak-256-auth v0.0.1
 * (c) Edgar Pogosyan
 * Released under the MIT License.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ethUtil = require('ethereumjs-util');
var sigUtil = require('@metamask/eth-sig-util');
var url = require('url');
var axios = require('axios');
var _debug = require('debug');
var passportStrategy = require('passport-strategy');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var ethUtil__namespace = /*#__PURE__*/_interopNamespace(ethUtil);
var sigUtil__namespace = /*#__PURE__*/_interopNamespace(sigUtil);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var _debug__default = /*#__PURE__*/_interopDefaultLegacy(_debug);

/**
 * Gets full uri combining baseUrl and url.
 *
 * Axios does not export such method, so we implement it ourselves.
 * @see https://github.com/axios/axios/pull/3737
 */
function axiosGetFullUri(config) {
    var requestedURL = axios__default["default"].getUri(config);
    return buildFullPath(config.baseURL, requestedURL);
}
/**
 * Internal combineURLs helper function from axios
 * @see https://github.com/axios/axios/blob/d99d5faac29899eba68ce671e6b3cbc9832e9ad8/lib/helpers/combineURLs.js
 *
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
function combineURLs(baseURL, relativeURL) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}
/**
 * Internal buildFullPath helper function from axios
 * @see https://github.com/axios/axios/blob/d99d5faac29899eba68ce671e6b3cbc9832e9ad8/lib/core/buildFullPath.js
 *
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
}
/**
 * Internal isAbsoluteURL helper function from axios
 * @see https://github.com/axios/axios/blob/d99d5faac29899eba68ce671e6b3cbc9832e9ad8/lib/helpers/isAbsoluteURL.js
 *
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

var debug = _debug__default["default"]('keccak-256-auth:axios-interceptor');
/**
 * Adds Authorization header with the Keccak-256 schema to the requests.
 * @see https://coldstack.atlassian.net/wiki/spaces/CS/pages/322109441/HTTP
 */
function keccak256AxiosInterceptor(params) {
    var privateKey = Buffer.from(params.privateKey.replace(/^0x/, ''), 'hex');
    var publicKey = ethUtil__namespace.bufferToHex(ethUtil__namespace.privateToAddress(privateKey));
    var defaultSignedHeaders = params.signedHeaders
        ? params.signedHeaders.map(function (header) { return header.toLowerCase(); })
        : ['date', 'host'];
    params.debug &&
        debug("Initialized: publicKey=".concat(publicKey, ", signedHeaders=").concat(defaultSignedHeaders.join(';')));
    return function _keccak256AxiosInterceptor(config) {
        if (!config.method) {
            throw new TypeError("config.method is ".concat(config.method));
        }
        var uri = url__default["default"].parse(axiosGetFullUri(config));
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
        var signature = sigUtil__namespace.personalSign({
            privateKey: privateKey,
            data: ethUtil__namespace.bufferToHex(Buffer.from(stringToSign, 'utf-8')),
        });
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        config.headers['authorization'] =
            'Keccak-256 public_key=' +
                publicKey +
                ',signed_headers=' +
                signedHeaders.join(';') +
                ',signature=' +
                signature;
        if (params.debug) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            config.headers['x-keccak-256-string-to-sign'] = stringToSign;
        }
        debug("String to sign: ".concat(stringToSign));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        debug("Authorization header: ".concat(config.headers['authorization']));
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
    function Keccak256Strategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Keccak256Strategy.prototype.authenticate = function (req) {
        try {
            var parsed = this.parseAuthorizationHeader(req);
            var stringToSign = this.getStringToSign(req, parsed);
            var msgBufferHex = ethUtil__namespace.bufferToHex(Buffer.from(stringToSign, 'utf8'));
            var address = sigUtil__namespace.recoverPersonalSignature({
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
}(passportStrategy.Strategy));

exports.Keccak256Strategy = Keccak256Strategy;
exports.keccak256AxiosInterceptor = keccak256AxiosInterceptor;
//# sourceMappingURL=index.js.map
