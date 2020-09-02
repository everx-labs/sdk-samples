# NodeJS SDK Hello example

In this example we demonstrate how to use signingBox interface to deploy solidity 
contract `Hello.sol` to [TONOS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview) (local blockchain) 
and interact with it.

Notice `dummySigningBox` class that implements the required interface.
```
export interface TONSigningBox {
    getPublicKey(): Promise<string>, // ed25519 public key

    sign(message: TONInputMessage, outputEncoding: TONOutputEncodingType): Promise<string>,
}
```
where 
```
export type TONOutputEncodingType = 'Text' | 'Hex' | 'HexUppercase' | 'Base64';

export type TONInputMessage = {
    text?: string,
    hex?: string,
    base64?: string
}

```

In your projects you can write your own class that implement this interface
and eliminate passing your keys inside the library. 

## Prerequisite

* Node.js >= [12.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) (if you want to use local blockchain TON OS SE)


## Preparation

* [Install tondev-cli and run TON OS SE  on your computer](https://docs.ton.dev/86757ecb2/p/206d7d-introduction) 

```sh
npm install -g ton-dev-cli 
tondev start
```

Install packages and run:

```sh
npm install
node index.js
```
