# Examples of working with multisig wallet, querying and subscribing.

## Prerequisites

Create a project at https://dashboard.evercloud.dev and export the API endpoint as an environment variable:
```
export ENDPOINT=https://devnet.evercloud.dev/<your_project_id>/graphql
```

## Work with wallet

This script:
-   Generates a key pair for the wallet to be deployed.
-   Calculates future wallet address.
-   Waits for account replenishment.
-   Deploys multisig wallet.
-   Transfers 0.5 tokens from the wallet to some account.
-   Lists all made transactions.

### Run this script

During this test you need to send 1 token to the specified account.\
You can topup your wallet from dashboard at https://dashboard.evercloud.dev

```
npm i
npm run msig-wallet
```
### Example output
```
Generated wallet keys: {
    "public":"c3044c02c49e9249fc0e3969e6f1eafa8b9f1caa0a38b867146f64216e904a34","secret":"3d3985b24f65099e811d4183e39581f2866d9cb7a53cb1f43f0fae8359002b7c"}
Do not forget to save the keys!
You can topup your wallet from dashboard at https://dashboard.evercloud.dev
Please send >= 1 tokens to 0:1bbe56f5a95eafb7a747afd97a4815e8555a3d0aa595a4f3e2f9d1aa196d6b75
awaiting...
Account balance is: 100 tokens
Deploying wallet contract to address: 0:1bbe56f5a95eafb7a747afd97a4815e8555a3d0aa595a4f3e2f9d1aa196d6b75 and waiting for transaction...
Contract deployed. Transaction id 0b7675a425ec02b119d215fde78f28d88351e816b1de4172541277b22d5b7990
Sending 0.5 token to -1:3333333333333333333333333333333333333333333333333333333333333333
Transfer completed. Transaction id 5e844dfa6c3d0b580eeb5b8827d32f0b0b0e7ffeeffacdf907cb1f2657990c62
Transaction id: transaction/ed500bae44b4441e3aa5bb6da1a07339d9d70adbd0c04a603ad16ab19b583727
Transaction id: transaction/0b7675a425ec02b119d215fde78f28d88351e816b1de4172541277b22d5b7990
Transaction id: transaction/5e844dfa6c3d0b580eeb5b8827d32f0b0b0e7ffeeffacdf907cb1f2657990c62
```