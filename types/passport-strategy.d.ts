import type express from 'express';
import { Strategy } from 'passport-strategy';
export declare class Keccak256Strategy extends Strategy {
    authenticate(req: express.Request): void;
    private getStringToSign;
    private parseAuthorizationHeader;
}
//# sourceMappingURL=passport-strategy.d.ts.map