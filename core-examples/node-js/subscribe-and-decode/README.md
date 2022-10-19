# NodeJS SDK Subscription example

In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.

In the example we use [Evernode SE](https://docs.everos.dev/evernode-platform/products/simple-emulator-se), local blockchain.

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install)
* [EverDev CLI](https://docs.everos.dev/everdev/)


## Preparation

* [Run Evernode SE on your computer](https://docs.everos.dev/everdev/command-line-interface/evernode-platform-startup-edition-se)

```sh
everdev se start
```

You're all set! Check out the Evernode SE GraphQL web playground at http://0.0.0.0/graphql. For Windows, use http://127.0.0.1/graphql or http://localhost/graphql. Learn more about GraphQL API here.

See other available [Evernode SE management options in EverDev](https://docs.everos.dev/everdev/command-line-interface/evernode-platform-startup-edition-se).

## Install packages and run:

```sh
npm i
npm start
```
