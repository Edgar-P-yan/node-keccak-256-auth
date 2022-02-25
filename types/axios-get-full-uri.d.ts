import type { AxiosRequestConfig } from 'axios';
/**
 * Gets full uri combining baseUrl and url.
 *
 * Axios does not export such method, so we implement it ourselves.
 * @see https://github.com/axios/axios/pull/3737
 */
export declare function axiosGetFullUri(config: AxiosRequestConfig): string;
//# sourceMappingURL=axios-get-full-uri.d.ts.map