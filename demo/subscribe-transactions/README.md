# Examples of working with multisig wallet, querying and subscribing.

## Prerequisites

Create a project at https://dashboard.evercloud.dev and export the API endpoint as an environment variable:
```
export ENDPOINT=https://devnet.evercloud.dev/<your_project_id>/graphql
```

## Subscribe to transactions of several accounts

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
