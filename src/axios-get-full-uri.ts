import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

/**
 * Gets full uri combining baseUrl and url.
 *
 * Axios does not export such method, so we implement it ourselves.
 * @see https://github.com/axios/axios/pull/3737
 */
export function axiosGetFullUri(config: AxiosRequestConfig): string {
  const requestedURL = axios.getUri();

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
function combineURLs(baseURL: string, relativeURL: string): string {
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
function buildFullPath(baseURL: string | void, requestedURL: string): string {
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
function isAbsoluteURL(url: string): boolean {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
