import type express from 'express';
import { Strategy } from 'passport-strategy';
interface AuthenticateOptions {
    allowFrom: string[];
}
export declare class Keccak256Strategy extends Strategy {
    private options;
    constructor(options: AuthenticateOptions);
    authenticate(req: express.Request): void;
    private getStringToSign;
    private parseAuthorizationHeader;
}
export {};
//# sourceMappingURL=passport-strategy.d.ts.map