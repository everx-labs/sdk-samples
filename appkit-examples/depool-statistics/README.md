# Getting information from DePool with NodeJS

In this example we get list of all known DePool contracts addresses in [mainnet.evercloud.dev](https://ton.live) and run 
get methods of an existing [DePool](https://github.com/tonlabs/ton-labs-contracts/blob/master/solidity/depool/DePool.sol). 
If you want to connect to another DePool, choose from catalog of DePools [https://ton.live/dePools](https://ton.live/dePools).

## Before running the example

-   Create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev) if you don't have one.
-   Remember its Mainnet HTTPS endpoint.
-   Pass this endpoint as a parameter when running the example.


## Install packages & run:

```sh
npm i
node index.js <HTTPS_MAINNET_ENDPOINT>
```
