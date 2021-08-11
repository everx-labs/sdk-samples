# NodeJS SDK Subscription example

In this example we deploy "hello world" contract and subscribe to related messages.

In the example we use [TON OS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview), local blockchain.

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install)
* [TONDEV CLI](https://docs.ton.dev/86757ecb2/p/179e51-tondev)


## Preparation

* [Run TON OS SE on your computer](https://docs.ton.dev/86757ecb2/p/2771b0-overview) 

```sh
tondev se start
```

You're all set! Check out the TON OS SE GraphQL web playground at http://0.0.0.0/graphql. For Windows, use http://127.0.0.1/graphql or http://localhost/graphql. Learn more about GraphQL API here.

See other available [TON OS SE management options in TONDEV](https://docs.ton.dev/86757ecb2/v/0/p/54722f-ton-os-se).

## Install packages and run:

```sh
npm install
node index.js
```
