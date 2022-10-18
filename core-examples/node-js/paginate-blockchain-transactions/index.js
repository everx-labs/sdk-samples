const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node")

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js )
TonClient.useBinaryLibrary(libNode);

// Create a project on https://dashboard.evercloud.dev and pass
// its Development Network HTTPS endpoint as a parameter:
const HTTPS_DEVNET_ENDPOINT = process.argv[2] 

if (HTTPS_DEVNET_ENDPOINT === undefined) {
    throw new Error("HTTPS endpoint required")
}
const client = new TonClient({
    network: {
        endpoints: [ HTTPS_DEVNET_ENDPOINT ],
    }
});

;(async () => {
    try {
        // Get masterchain `seq_no` range for the last 3 days
        // `time_end` is 60 seconds before now, so that we 100% have the end seq_no.
        // If you try to get master seq_no for `now` time you may receive `null` because
        // data is not consistent yet.  If you need the most fresh data, do not specify the
        // `time_end` value at all. 
        const days = 3;
        const now = Math.trunc(Date.now() / 1000);
        let result = await client.net.query({
            query: `{
                      blockchain {
                        master_seq_no_range(
                            time_start: ${now - days * 24 * 60 * 60}
                            time_end: ${now-60} 
                        ) {
                            start
                            end
                        }
                      }
                    }`,
        });

        const range = result.result.data.blockchain.master_seq_no_range;
        console.log(`Masterchain seq_no range for the last ${days} days: [${range.start}..${range.end}]`);

        /*
            Sample output:

            Masterchain seq_no range for the last 3 days: [14158087..14241248]
         */

       
        // Get workchain transactions with amount more than 1 token for in this range:
        result = await client.net.query({
            query: `{ 
                   blockchain {
                     transactions(
                      master_seq_no_range: {
                          start: ${range.start}
                          end: ${range.end}
                      }
                   
                      min_balance_delta: "1000000000"
                     ) {
                       edges {
                         node {
                           now_string
                           balance_delta(format: DEC) 
                           aborted
                         }
                       }
                       pageInfo{
                        endCursor
                        hasNextPage
                      }
                     }
                   }
                 }`,
        });

        console.log(
            `\nFirst batch of transactions:`,
        );

        for (const transaction of result.result.data.blockchain.transactions.edges) {
            const trans = transaction.node;
            console.log(
                `Tx hash: ${trans.hash}, timestamp: ${trans.now_string}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`,
            );
        }

        let cursor = result.result.data.blockchain.transactions.pageInfo.endCursor;

        console.log(
          `\nLast cursor: ${cursor}. Has next page? : ${result.result.data.blockchain.transactions.pageInfo.hasNextPage}`,
      );

        while (result.result.data.blockchain.transactions.pageInfo.hasNextPage) {
          result = await client.net.query({
            query: `{ 
                   blockchain {
                     transactions(
                      master_seq_no_range: {
                          start: ${range.start}
                          end: ${range.end}
                      }
                   
                      min_balance_delta: "1000000000"
                      after: ${cursor}
                     ) {
                       edges {
                         node {
                           now_string
                           balance_delta(format: DEC) 
                           aborted
                         }
                       }
                       pageInfo{
                        endCursor
                        hasNextPage
                      }
                     }
                   }
                 }`,
        }); 

        console.log(
          `\nNext batch of transactions:`,
      );

      for (const transaction of result.result.data.blockchain.transactions.edges) {
          const trans = transaction.node;
          console.log(
              `Tx hash: ${trans.hash}, timestamp: ${trans.now_string}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`,
          );
      }
        }

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
