# Query statistics

## Before running the test
- create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev/projects)
- remember the "Development Network" HTTPS endpoint
- pass this endpoint as a parameter when running the test

## Run test
```
npm i
node index.js <HTTPS_DEVNET_ENDPOINT>  
```
## Sample run
```
$ node index.js https://devnet.evercloud.dev/cafe2eb2ca671ieeb2dbe8/graphql

{
  version: '1.0.1',
  blocks: {
    totalCount: 427898207,
    countByCurrentValidators: 30329,
    ratePerSecond: 0.7168141592920354
  },
  messages: { totalCount: 55888680, ratePerSecond: 0.8521739130434782 },
  transactions: {
    totalOrdinaryCount: 50949257,
    lastDayOrdinaryCount: 95271,
    ratePerSecond: 2.1478260869565218
  },
  accounts: {
    totalCount: 851894,
    totalSupply: '2062941974027568499',
    amountOnGivers: '826197200734626761',
    circulatingSupply: '1236744773292941738',
    lastDayCount: 711,
    accountTypesCount: 29645
  },
  validators: {
    totalCount: 222,
    lastCycleCountDelta: -3,
    totalStaked: '291248137865924102',
    rewardsPer30Days: '2533595199381283',
    apr: 0.11288604344108671
  },
  depools: {
    activeDepoolCount: 264,
    activeParticipantsCount: 4222,
    totalRewards: '19872285660231411',
    totalStaked: '294485102774540185'
  }
}```
