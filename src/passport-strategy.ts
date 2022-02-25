import type express from 'express';
import { Strategy } from 'passport-strategy';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import type { Keccak256User } from './keccak-256-user.interface';

interface ParsedAuthorizationHeader {
  publicKey: string;
  signedHeaders: string[];
  signature: string;
}

export class Keccak256Strategy extends Strategy {
  override authenticate(req: express.Request): void {
    try {
      const parsed = this.parseAuthorizationHeader(req);

      const stringToSign = this.getStringToSign(req, parsed);

      const msgBufferHex = ethUtil.bufferToHex(
        Buffer.from(stringToSign, 'utf8'),
      );

      const address = sigUtil.recoverPersonalSignature({
        data: msgBufferHex,
        signature: parsed.signature,
      });

      if (parsed.publicKey.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Unauthorized: wrong signature');
      }

      const user: Keccak256User = {
        publicKey: parsed.publicKey,
      };

      this.success(user);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.error(err as any);
    }
  }

  private getStringToSign(
    req: express.Request,
    parsed: ParsedAuthorizationHeader,
  ): string {
    let stringToSign = `${req.method.toUpperCase()} ${req.originalUrl}\n`;

    if (parsed.signedHeaders.length) {
      const headersEntries = Object.entries(req.headers)
        .filter(([key]) => parsed.signedHeaders.includes(key))
        .sort(([key1], [key2]) => (key1 > key2 ? 1 : -1))
        .map((header) => {
          // When the request has multiple headers with the same name sort
          // them by their value
          if (Array.isArray(header[1])) {
            header[1] = header[1].sort();
          }

          return header;
        });

      const headersArr: string[] = [];

      headersEntries.forEach((header) => {
        if (!Array.isArray(header[1])) {
          headersArr.push(header[0] + ':' + header[1]);
        } else {
          header[1].forEach((value) => {
            headersArr.push(header[0] + ':' + value);
          });
        }
      });

      stringToSign += headersArr.join('\n');
    }

    return stringToSign;
  }

  private parseAuthorizationHeader(
    req: express.Request,
  ): ParsedAuthorizationHeader {
    if (
      !req.headers.authorization ||
      typeof req.headers.authorization !== 'string'
    ) {
      throw new Error('Missing Authorization header');
    }

    const [schema, params] = req.headers.authorization.split(' ') as [
      string,
      string,
    ];
    if (schema !== 'Keccak-256') {
      throw new Error('Unknown authentication schema. Expected Keccak-256');
    }

    const [publicKeyPair, headersPartPair, signPartPair] = params
      .split(',')
      .map((pair) => pair.split('='));

    if (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      publicKeyPair![0] !== 'public_key' ||
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      headersPartPair![0] !== 'signed_headers' ||
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      signPartPair![0] !== 'signature'
    ) {
      throw new Error('Invalid Authentication header');
    }

    const result: ParsedAuthorizationHeader = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      publicKey: publicKeyPair![1]!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      signedHeaders: headersPartPair![1]!
        .split(';')
        .filter((header) => !!header),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      signature: signPartPair![1]!,
    };

    if (!result.publicKey.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Authentication header');
    }

    return result;
  }
}
