# NodeJS SDK signingBox example

In this example we demonstrate how to eliminate passing your keys to the library
by using `signingBox` interface.

We deploy solidity contract `Hello.sol` to [TONOS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview)
(local blockchain) and interact with it using `signingBox` instead of a key pair.

Notice `dummySigningBox` class that implements the required interface.

```ts
export interface AppSigningBox {
    get_public_key(): Promise<ResultOfAppSigningBoxGetPublicKey>,
    sign(params: ParamsOfAppSigningBoxSign): Promise<ResultOfAppSigningBoxSign>,
}
```

where

```ts
type ResultOfAppSigningBoxGetPublicKey = {
    public_key: string
}

type ParamsOfAppSigningBoxSign = {
    unsigned: string
}

type ResultOfAppSigningBoxSign = {
    signature: string
}
```

In your projects you can write your own class that implements this interface
and eliminate passing your keys inside the library.

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) (if you want to use local blockchain TON OS SE)

## Preparation

* [Install tondev and run TONOS SE on your computer](https://docs.ton.dev/86757ecb2/p/206d7d-introduction) 

```sh
npm i -g tondev
tondev se start
```

Install packages and run:

```shell
$ npm i
$ npm start
Hello localhost TON!
Future address of the contract will be: 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Grams were transferred from giver to 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Hello contract was deployed at address: 0:6a77bd82590eeef139d2ef149df31947759b32b3cc25da39d562b12d03ecd4a2
Contract run transaction with output null, f5d04358f56dbd943670e13fa0e4b308d321134db362d2ed2dc643ea7c3f109d
Contract reacted to your sayHello {"value0":"0x00000000000000000000000000000000000000000000000000000000603a0a75"}
```
