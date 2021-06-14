# Integrate Free TON into exchange backend

In this example we demonstrate how to integrate Free TON into an exchange backend.

It covers such use-cases as: 
- wallet deploy 
- wallet deposit
- wallet withdraw
- sequential blockchain deposits and withdraws reading
- sequential wallet deposits and withdraws reading

To run this sample you need to have a multisig wallet with positive balance,
already deployed to the Developer Network. Specify its private key at the launch

Read about multisig wallet here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig

**To migrate to Free TON you need to update the endpoints specified in TonClient configuration
to Free TON endpoints.**

See the list of supported networks and endpoints here https://docs.ton.dev/86757ecb2/p/85c869-networks

## Install packages & run:

```sh
npm i
node index privateKey
```
