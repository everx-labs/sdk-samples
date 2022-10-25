# NodeJS SDK Subscription example

You will learn how to
- query accounts with filters and ordering
  - show accounts with top 20 balances
- query blocks with filters and ordering:
  - show last 10 blocks with transaction count > 50
- query transactions with filters and ordering
  - show top 10 balance_delta transactions in last 7 days
- perform aggregation query: 
  - number of accounts with specified code_hash
  - number of transactions of an account
  - total fee paid by an account
  - total value withdrawn from an account
  - total value received to an account
  
Read more about collections here: https://docs.everos.dev/ever-sdk/reference/ever-os-api/query_language


## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* [Docker](https://docs.docker.com/desktop/#download-and-install)


## Install packages & run:

```sh
npm install
node index.jss
```
