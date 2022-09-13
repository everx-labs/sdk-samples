# NodeJS  transfer tokens with comment

In this example we demostrate how to transfer tokens from one contract to another with comment.


## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)


## Before running the example

-   Create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev/projects) if you don't have one.
-   Remember its Development Network HTTPS endpoint, you must pass this endpoint as a parameter when running the example.
-  [Deploy multisig wallet](https://github.com/tonlabs/sdk-samples/tree/master/core-examples/node-js/multisig) to Developer network
and place your keys in the project root folder into `keys.json` file and multisig account address to `address.txt` file.

## Install packages & run:

```sh
npm i
node index.js <HTTPS_DEVNET_ENDPOINT>
`
