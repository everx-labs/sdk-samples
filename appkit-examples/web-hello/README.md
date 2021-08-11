# Hello Web – WebPack TON SDK example

In this example we use [ton-client-js](https://github.com/tonlabs/ton-client-js) to deploy solidity contract Hello.sol to [TON OS SE](https://docs.ton.dev/86757ecb2/p/2771b0-overview) (local blockchain).

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) (if you want to use local blockchain TON OS SE) daemon running



## Preparation

* [Run TON OS SE on your computer](https://docs.ton.dev/86757ecb2/p/2771b0-overview) 

```sh
tondev se start
```

Note: if you have running TON OS SE already with port mapping other than 80, than you have to
change TON OS SE address in index.js line 9.

## Install packages & run:

```sh
npm i
npm start
```

This opens the browser with address: http://localhost:4000
