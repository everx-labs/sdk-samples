# NodeJS SDK Subscription example

In this example we use [ton-client-js](https://github.com/tonlabs/ton-client-js) and a multisig wallet contract
to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.

In the example we use [TONOS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview), local blockchain.

## Prerequisite

* Node.js >= [12.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install)


## Preparation

* [Run TON OS SE on your computer](https://docs.ton.dev/86757ecb2/p/206d7d-introduction) 

```sh
tondev start
```

Install packages:

```sh
npm install
node index.js
```
