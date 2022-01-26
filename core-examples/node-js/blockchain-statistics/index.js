const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

(async () => {
    try {
        // Link the platform-dependable TON-SDK binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary 
        // from `@tonclient/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ton-client-js )
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: {
                endpoints: [
                    "eri01.main.everos.dev",
                    "gra01.main.everos.dev",
                    "gra02.main.everos.dev",
                    "lim01.main.everos.dev",
                    "rbx01.main.everos.dev",
                ],
            }
        });

        const result = (await client.net.query({
            query: `{ 
                        statistics { 
                            version
                            blocks { 
                                totalCount
                                countByCurrentValidators
                                ratePerSecond
                                ratePerSecond
                            }
                            messages {
                                totalCount
                                ratePerSecond
                            }
                            transactions {
                                totalOrdinaryCount
                                lastDayOrdinaryCount
                                ratePerSecond
                            }
                            accounts {
                                totalCount
                                totalSupply
                                amountOnGivers
                                circulatingSupply
                                lastDayCount
                                accountTypesCount
                            }
                            validators {
                                totalCount
                                lastCycleCountDelta
                                totalStaked
                                rewardsPer30Days
                                apr
                            }
                            depools {
                                activeDepoolCount
                                activeParticipantsCount
                                totalRewards
                                totalStaked
                            }
                        }
                    }`
        }));

        console.log(result.result.data.statistics);

        /*
            Output:

            {
              version: '0.1.0',
              blocks: {
                totalCount: 341239481,
                countByCurrentValidators: 93574,
                ratePerSecond: 2.8421052631578947
              },
              messages: { totalCount: 26974447, ratePerSecond: 0.31140350877192985 },
              transactions: {
                totalOrdinaryCount: 25301634,
                lastDayOrdinaryCount: 56721,
                ratePerSecond: 0.9429824561403508
              },
              accounts: {
                totalCount: 539383,
                totalSupply: '2044321548399105428',
                amountOnGivers: '1023416009272518819',
                circulatingSupply: '1020905539126586609',
                lastDayCount: 0,
                accountTypesCount: 4048
              },
              validators: {
                totalCount: 435,
                lastCycleCountDelta: -5,
                totalStaked: '453260144095926003',
                rewardsPer30Days: '2184843848350979',
                apr: 0.06583275498507205
              },
              depools: {
                activeDepoolCount: 451,
                activeParticipantsCount: 3691,
                totalRewards: '15723079952864834',
                totalStaked: '420043195951224587'
              }
            }
         */

        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error("Network is inaccessible.");
        } else {
            console.error(error);
        }
        process.exit(1);
    }
})();
