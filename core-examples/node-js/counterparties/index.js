const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

(async () => {
    try {
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


        // Get first 5 counterparties:
        const N = 5;
        let result = (await client.net.query({
            query: `{
                        counterparties(
                            account: "-1:3333333333333333333333333333333333333333333333333333333333333333"
                            first: ${N}
                        ) {
                            account
                            counterparty
                            last_message_at
                            last_message_is_reverse
                            last_message_value(format: DEC)
                        }
                    }`
        }));

        console.log(`First ${N} counterparties of the Elector address:`);
        for (const counterparty of result.result.data.counterparties) {
            console.log(
                `${counterparty.counterparty}:`,
                (counterparty.last_message_is_reverse ? "-" : "")
                + counterparty.last_message_value,
                "nanotokens",
                "at",
                new Date(counterparty.last_message_at * 1000).toLocaleString()
            );
        }

        /*
            Sample output:

            First 5 counterparties of the Elector address:
            -1:0000000000000000000000000000000000000000000000000000000000000000: -2700735609 nanotokens at 19.01.2022, 15:01:37
            -1:c9b4d063f26f143bd1eda8fe45935c605d1c7299aee900f0250ba692574819e1: 1000000000 nanotokens at 19.01.2022, 15:01:21
            -1:90159f0447464201ba7256ddbb5bd8e7cd548e39b643bbd7bef4919de7ec9ad4: 1000000000 nanotokens at 19.01.2022, 15:01:21
            -1:8ac99aee6b90f5fa2f724cb64cbf7550e304925ec36d5fcc6a45ef1925905c6c: 470865010572206 nanotokens at 19.01.2022, 15:01:21
            -1:67d82d0ef837213d319ffb437b14bcca2dee1f143559734ebc46b92a75b6d798: 569591491824559 nanotokens at 19.01.2022, 15:01:21
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
