# NodeJS SDK signingBox example

In this example we demonstrate how to eliminate passing your keys to the library
by using `signingBox` interface.

We deploy solidity contract `Hello.sol` to [TONOS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview) (local blockchain) 
and interact with it using `signingBox` instead of a key pair.

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

In your projects you can write your own class that implements this interface
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
Result:
```
Hello localhost TON!
Future address of the contract will be: 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Grams were transfered from giver to 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Hello contract was deployed at address: 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Сontract run transaction with output null ,  0ceec8b242992ac33a5bb861aa025f9e4c3be821f703827b86bdd37589ffbe8d
Contract reacted to your sayHello { value0: '0x5f4fe6c8' }
```