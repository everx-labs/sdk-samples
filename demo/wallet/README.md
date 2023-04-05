# Examples of working with multisig wallet, querying and subscribing.

## Prerequisites

Create a project at https://dashboard.evercloud.dev and export the API endpoint as an environment variable:
```
export ENDPOINT=https://devnet.evercloud.dev/<your_project_id>/graphql
```

## List of examples
1.  [Work with wallet](#1-work-with-wallet)
2.  [List all transactions in workchain 0](#2-list-all-transactions-in-workchain-0)
3.  [Subscribe to transactions of several accounts](#3-subscribe-to-transactions-of-several-accounts)

## 1. Work with wallet

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
npm run wallet
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

## 2. List all transactions in workchain 0 

This script paginates all transactions in wc 0 from beginning.

### Run this script

```
$ npm run list-tr
```
### Example output
```
Getting all transactions in workchain 0 from the beginning/
Most likely this process will never end, so press CTRL+C to interrupt it
Transaction id: transaction/bb04cdb68f4ef8b3ca9afe93e2eac063bd8fc341d38775a3bbb5fbe6c4eb32ba
Transaction id: transaction/b391dffce1534b445d86e089a5cf9bece2c5f756870157f413426d47cd5c5663
---%<---
```

## 3. Subscribe to transactions of several accounts

This script subscribes to transactions of several accounts (hardcoded) and prints \ 
their properties (id, account_addr, balance_delta)

### Run this script
```
npm run subscribe-tr
```
### Example output
```
Subscribed to transactions of accounts: ["-1:3333333333333333333333333333333333333333333333333333333333333333","0:40e593373fd9c972162812878ea1976ebaffe2bff030c637df2c08826cf1583b"]
Press CTRL+C to interrupt it
{
  transactions: {
    id: 'ef2e9c850e699e7821d3dd617b350b95843130e0ca524aaab05e205304f0041d',
    account_addr: '-1:3333333333333333333333333333333333333333333333333333333333333333',
    balance_delta: '0x0'
  }
}
{
  transactions: {
    id: '1c6b023b0fb72a877e3c32ad0f55d5ad321f8c979b22b50c59970e68dd4aaaea',
    account_addr: '-1:3333333333333333333333333333333333333333333333333333333333333333',
    balance_delta: '0xafd56d80'
  }
}
----%<-----------------
```
