import type { AxiosRequestConfig } from 'axios';
declare type AxiosInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig;
/**
 * Adds Authorization header with the Keccak-256 schema to the requests.
 * @see https://coldstack.atlassian.net/wiki/spaces/CS/pages/322109441/HTTP
 */
export declare function keccak256AxiosInterceptor(params: {
    privateKey: string;
    signedHeaders?: string[];
    debug?: boolean;
}): AxiosInterceptor;
export {};
//# sourceMappingURL=axios-interceptor.d.ts.map