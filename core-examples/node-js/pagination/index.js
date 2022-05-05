const { abiContract, TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

const walletAddress = "-1:3333333333333333333333333333333333333333333333333333333333333333";
// time range
const start_time = 1633355388;// 04 October 2021 16.49 GMT
const end_time = 1633368052; // 05 october 2021 14.32 GMT
let client;



(async () => {
    try {
        // Link the platform-dependable ever-sdk binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary 
        // from `@eversdk/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ever-sdk-js )
        TonClient.useBinaryLibrary(libNode);
        client = new TonClient({
            network: {
                // Local node URL.
                endpoints: [
                    "eri01.net.everos.dev",
                    "rbx01.net.everos.dev",
                    "gra01.net.everos.dev",
                ]
            }
        });

        // In the following we query the first transaction within the specified time range for an account.
        // See https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_net.md#query_collection
        console.log(">> query the first account transaction within the specified time range");
        let result = (await client.net.query_collection({
            collection: 'transactions',
            filter: {
                account_addr:{
                    eq: walletAddress
                  },
                now:{
                      ge: start_time
                  }
            },
            limit: 1,
            order:[{direction: "ASC", path: "now"}],
            result: 'id, lt'
        })).result;
        if (result.length) {
            console.log(`Transaction id: ${result[0].id}, lt: ${parseInt(result[0].lt)}`);

        }
        else 
            console.log(`No transactions found`);

        console.log(">>paginate account transactions starting from the specified lt until end_time");

       let lt = result[0].lt;
       let count = 1;
       while (count){
            console.log(`Go to the next page, starting from lt = ${lt}. `);

            result = (await client.net.query_collection({
                collection: 'transactions',
                filter: {
                    account_addr:{
                    eq: walletAddress
                    },
                    lt:{
                        gt: lt
                    }, 
                    now:{
                        lt:end_time
                    }
                },
                limit: 50,
                order:[{direction: "ASC", path: "lt"}],
                result: 'id, lt'
            })).result;
            count = result.length;
            if (count){
                lt = result[count-1].lt
                console.log(`Next ${count} transactions:`);
                for(let i=0;i<count;i++){
                    console.log(`Transaction id: ${result[i].id}, lt: ${parseInt(result[i].lt)}`);
                }
            }
            console.log(`Page is printed.`);
       }


        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start Evernode SE using \`everdev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
})();
