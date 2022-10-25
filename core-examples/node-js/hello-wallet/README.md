# NodeJS SDK Hello example

In this example we deploy solidity contract Hello.sol to [Evernode SE](https://docs.everos.dev/evernode-platform/products/simple-emulator-se) (local blockchain), run its on-chain method (without and with parameters) and run its get-method.

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) installed and running
* [EverDev CLI](https://docs.everos.dev/everdev/)


## Preparation

* [Run Evernode SE on your computer](https://docs.everos.dev/evernode-platform/products/simple-emulator-se)

```sh
everdev se start
```

You're all set! Check out the Evernode SE GraphQL web playground at http://0.0.0.0/graphql. For Windows, use http://127.0.0.1/graphql or http://localhost/graphql. Learn more about GraphQL API [here](https://docs.everos.dev/ever-platform/reference/graphql-api/).

See other available [Evernode SE management options in EverDev](https://docs.everos.dev/everdev/command-line-interface/evernode-platform-startup-edition-se).

## Install packages & run:

```sh
npm install
node index.js
```
