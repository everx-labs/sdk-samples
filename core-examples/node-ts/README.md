# Everscale TypeScript examples

Examples of Ever SDK usage using TypeScript

## Pre-requisites

```
node: v16.16.0 or newer
yarn: v1.22.19 or newer
```

Log in into [evercloud](https://evercloud.dev), create project and get
your graphql endpoint. Then you need to set environment variable `GQLURL`:
```
export GQLURL=https://{network}.evercloud.dev/{API_TOKEN}
```

We recommend using `devnet` (one of testnets in Everscale) to test the following examples.
Also you can explore [evercloud palform documentation](https://docs.evercloud.dev/).

## Run it and test

**setcode-multisig**

This example demonstrate the basic features of
[`Multisignature Wallet 2.0`](https://github.com/EverSurf/contracts/tree/main/multisig2).
This example doesn't show multi-signature functionality, but
you can easily implement it using ABI, similar to the example.

1. Run `npx ts-node src/setcode-multisig/main.ts`
2. Send >= 0.5 coins to `generated wallet address`

After coins arrived at the specified account(`generated wallet address`), the example will automatically deploy the `Multisignature Wallet 2.0` contract to the Everscale blockchain using specifed graphql endpoint. And then it will send all the funds back from the wallet to the guessed address from which they originally came.

**ever-wallet**

`TODO: implement me`
