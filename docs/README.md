Keccak-256 Auth for Node.js and JavaScript

# Keccak-256 Auth for Node.js and JavaScript

## Table of contents

### Classes

- [Keccak256Strategy](classes/Keccak256Strategy.md)

### Interfaces

- [Keccak256User](interfaces/Keccak256User.md)

### Functions

- [keccak256AxiosInterceptor](README.md#keccak256axiosinterceptor)

## Functions

### keccak256AxiosInterceptor

▸ **keccak256AxiosInterceptor**(`params`): `AxiosInterceptor`

Adds Authorization header with the Keccak-256 schema to the requests.

**`see`** https://coldstack.atlassian.net/wiki/spaces/CS/pages/322109441/HTTP

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.privateKey` | `string` |
| `params.signedHeaders?` | `string`[] |

#### Returns

`AxiosInterceptor`

#### Defined in

src/axios-interceptor.ts:13
