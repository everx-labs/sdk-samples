# NodeJS SDK Custom Giver configuration example

In this example we will configure AppKit to use our own Giver, deploy sample contract to test this configuration, 
send some funds to random address and check messages and transactions made by this operation. In the example we use
predeployed TON OS SE giver with its address, keys and ABI, but you can use any other giver by substituting these values 
with your own.

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) installed and running
* [TONDEV CLI](https://docs.ton.dev/86757ecb2/p/179e51-tondev)

## Preparation

* [Run TON OS SE on your computer](https://docs.ton.dev/86757ecb2/p/19d886-ton-os-se) 

```sh
tondev se start
```

You're all set! Check out the TON OS SE GraphQL web playground at http://0.0.0.0/graphql. 
For Windows, use http://127.0.0.1/graphql or http://localhost/graphql. Learn more about GraphQL API here.

See other available [TON OS SE management options in TONDEV](https://docs.ton.dev/86757ecb2/v/0/p/54722f-ton-os-se).

## Install packages & run:

```sh
npm i
npm start
```
