# NodeJS SDK HelloWallet example

In this example we deploy solidity contract HelloWallet.sol to [TON OS SE](https://docs.ton.dev/86757ecb2/p/19d886-ton-os-se) (local blockchain), run its on-chain method and run its get-method.
After observation of this demo you will understand how to create and deploy a contract, how to call its methods on-chain (without and with parameters), how to call its get methods locally.
[See the detailed sample explanation.](https://docs.ton.dev/86757ecb2/p/33b76d-quick-start/t/214f93)

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) installed and running
* [TONDEV CLI](https://docs.ton.dev/86757ecb2/p/179e51-tondev)

## Preparation

* [Run TON OS SE on your computer](https://docs.ton.dev/86757ecb2/p/19d886-ton-os-se) 

```sh
tondev se start
```

You're all set! Check out the TON OS SE GraphQL web playground at http://0.0.0.0/graphql. For Windows, use http://127.0.0.1/graphql or http://localhost/graphql. Learn more about GraphQL API here.

See other available [TON OS SE management options in TONDEV](https://docs.ton.dev/86757ecb2/v/0/p/54722f-ton-os-se).

## Install packages & run:

```sh
npm i
npm start
```
