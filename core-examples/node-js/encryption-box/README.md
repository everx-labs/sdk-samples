# NodeJS SDK Encryption Box example

In this example we demonstrate how to implement your own encryption box.

In order to achieve this, the sample application implements the following interface:

```ts
export interface AppEncryptionBox {
    get_info(): Promise<ResultOfAppEncryptionBoxGetInfo>,
    encrypt(params: ParamsOfAppEncryptionBoxEncrypt): Promise<ResultOfAppEncryptionBoxEncrypt>,
    decrypt(params: ParamsOfAppEncryptionBoxDecrypt): Promise<ResultOfAppEncryptionBoxDecrypt>,
}
```

where

```ts
type ResultOfAppEncryptionBoxGetInfo = {
    info: EncryptionBoxInfo
}

type ParamsOfAppEncryptionBoxEncrypt = {
    data: string
}

type ResultOfAppEncryptionBoxEncrypt = {
    data: string
}

type ParamsOfAppEncryptionBoxDecrypt = {
    data: string
}

type ResultOfAppEncryptionBoxDecrypt = {
    data: string
}
```

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)

## Preparation

Install packages and run:

```shell
$ npm i
$ npm start

> node index.js

*** Encryption Box Example ***
Algorithm: duplicator
Data: 12345
Encrypted: 1234512345
Decrypted: 12345
```
