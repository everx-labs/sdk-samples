# Samples of requests with cursor-based pagination to the Basic Blockchain API

## Problem

There is a limit on the number of records that the Blockchain API can return.
Now it is 50.

## Solution

If you expect your query to get more records, you can use pagination.

See examples of how this can be done. Some explanations are given below.

### The pageInfo field

Each connection returns a `PageInfo` object with fields:

-   `hasPreviousPage` (Boolean!) — Whether there are results in the connection before the current page.
-   `hasNextPage` (Boolean!) — Whether there are results in the connection after the current page.
-   `startCursor` (String) - The cursor of the first node in the nodes list
-   `endCursor` (String) - The cursor of the last node in the nodes list

### To do "forward in time" pagination

Check if `PageInfo.hasNextPage == true`, set query variables, then repeat your query:

-   `first` (Int!) - The requested number of nodes per page.
-   `after` (String) - Pass the `endCursor` of the previous page.

### Backward in time pagination

Check if `PageInfo,hasPreviousPage == true`, set query variables and repeat your query:

Set query variables:

-   last (Int!) - The requested number of nodes per page.
-   before (String) - Pass the `startCursor` of the previous page.

### Define time interval for pagination

Sometimes you want to define starting point for pagination.

To do that set query variable `master_seq_no_range: {start: (Int), end: (Int)}`,
where `start` and `end` are seq_no's of corresponding master blocks.
See how these variables are calculated:
[./requests/getLastMasterBlockSeqNoByTime.js](requests/getLastMasterBlockSeqNoByTime.js)

### Notes

If you need to access data older than 7 days (archive data) make sure to specify `archive:true` flag in query filers.

Don't request the API too aggressively or you'll get an HTTP 429 status code.

You can read more about cursor-based pagination here:
[graphql.org/learn/pagination](https://graphql.org/learn/pagination/#pagination-and-edges)

## Before running the example

-   Create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev) if you don't have one.
-   Remember its Development Network HTTPS endpoint.
-   Pass this endpoint as a parameter when running the example.


## Run examples

```
npm i
node index.js <HTTPS_DEVNET_ENDPOINT>
```
