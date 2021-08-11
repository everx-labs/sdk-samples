# NodeJS SDK run_executor sample

In this example we observe the capabilities of `run_executor` function of tvm module. 

We will emulate subsequent execution of deploy of multisig wallet with 2 custodians, transaction submission by the 1st custodian and its confirmation by the 2nd custodian. 
We will compare estimated deploy and execution fees with the real fees using local blockchain TON OS SE. 

In the end of the sample we will find out how to emulate account's initial topup for presise balance emulation. 

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
npm install
node index.js
```
