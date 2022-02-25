[Keccak-256 Auth for Node.js and JavaScript](../README.md) / Keccak256Strategy

# Class: Keccak256Strategy

## Hierarchy

- `Strategy`

  ↳ **`Keccak256Strategy`**

## Table of contents

### Constructors

- [constructor](Keccak256Strategy.md#constructor)

### Methods

- [authenticate](Keccak256Strategy.md#authenticate)
- [error](Keccak256Strategy.md#error)
- [fail](Keccak256Strategy.md#fail)
- [getStringToSign](Keccak256Strategy.md#getstringtosign)
- [parseAuthorizationHeader](Keccak256Strategy.md#parseauthorizationheader)
- [pass](Keccak256Strategy.md#pass)
- [redirect](Keccak256Strategy.md#redirect)
- [success](Keccak256Strategy.md#success)

## Constructors

### constructor

• **new Keccak256Strategy**()

#### Inherited from

Strategy.constructor

## Methods

### authenticate

▸ **authenticate**(`req`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

`void`

#### Overrides

Strategy.authenticate

#### Defined in

[src/passport-strategy.ts:14](https://github.com/Edgar-P-yan/node-keccak-256-auth/blob/6e253a6/src/passport-strategy.ts#L14)

___

### error

▸ **error**(`err`): `void`

Internal error while performing authentication.

Strategies should call this function when an internal error occurs
during the process of performing authentication; for example, if the
user directory is not available.

**`api`** public

#### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |

#### Returns

`void`

#### Inherited from

Strategy.error

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:96

___

### fail

▸ **fail**(`challenge`, `status`): `void`

Fail authentication, with optional `challenge` and `status`, defaulting
to 401.

Strategies should call this function to fail an authentication attempt.

**`api`** public

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `challenge` | `any` | (Can also be an object with 'message' and 'type' fields). |
| `status` | `number` |  |

#### Returns

`void`

#### Inherited from

Strategy.fail

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:60

▸ **fail**(`status`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `status` | `number` |

#### Returns

`void`

#### Inherited from

Strategy.fail

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:61

___

### getStringToSign

▸ `Private` **getStringToSign**(`req`, `parsed`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |
| `parsed` | `ParsedAuthorizationHeader` |

#### Returns

`string`

#### Defined in

[src/passport-strategy.ts:44](https://github.com/Edgar-P-yan/node-keccak-256-auth/blob/6e253a6/src/passport-strategy.ts#L44)

___

### parseAuthorizationHeader

▸ `Private` **parseAuthorizationHeader**(`req`): `ParsedAuthorizationHeader`

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\> |

#### Returns

`ParsedAuthorizationHeader`

#### Defined in

[src/passport-strategy.ts:82](https://github.com/Edgar-P-yan/node-keccak-256-auth/blob/6e253a6/src/passport-strategy.ts#L82)

___

### pass

▸ **pass**(): `void`

Pass without making a success or fail decision.

Under most circumstances, Strategies should not need to call this
function.  It exists primarily to allow previous authentication state
to be restored, for example from an HTTP session.

**`api`** public

#### Returns

`void`

#### Inherited from

Strategy.pass

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:84

___

### redirect

▸ **redirect**(`url`, `status?`): `void`

Redirect to `url` with optional `status`, defaulting to 302.

Strategies should call this function to redirect the user (via their
user agent) to a third-party website for authentication.

**`api`** public

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `status?` | `number` |

#### Returns

`void`

#### Inherited from

Strategy.redirect

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:73

___

### success

▸ **success**(`user`, `info?`): `void`

Authenticate `user`, with optional `info`.

Strategies should call this function to successfully authenticate a
user.  `user` should be an object supplied by the application after it
has been given an opportunity to verify credentials.  `info` is an
optional argument containing additional user information.  This is
useful for third-party authentication strategies to pass profile
details.

**`api`** public

#### Parameters

| Name | Type |
| :------ | :------ |
| `user` | `any` |
| `info?` | `any` |

#### Returns

`void`

#### Inherited from

Strategy.success

#### Defined in

node_modules/@types/passport-strategy/index.d.ts:48
