# Examples of working with multisig wallet, querying and subscribing.

## Prerequisites

Create a project at https://dashboard.evercloud.dev and export the API endpoint as an environment variable:
```
export ENDPOINT=https://devnet.evercloud.dev/<your_project_id>/graphql
```


## List all transactions in workchain 0 

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