# Hello Web – WebPack TON SDK example

In this example we use [ever-sdk-js](https://github.com/tonlabs/ever-sdk-js) to deploy solidity contract Hello.sol to [Evernode SE](https://docs.everos.dev/evernode-platform/products/simple-emulator-se) (local blockchain).

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install) (if you want to use local blockchain Evernode SE) daemon running



## Preparation

* [Run Evernode SE on your computer](https://docs.everos.dev/everdev/command-line-interface/evernode-platform-startup-edition-se)

```sh
docker run -d --name local-node -e USER_AGREEMENT=yes -p80:80 tonlabs/local-node
```

Note: if you have running Evernode SE already with port mapping other than 80, than you have to
change Evernode SE address in index.js line 9.

## Install packages & run:

```sh
npm install
npm run web
```

Then open in browser address: http://localhost:4000
