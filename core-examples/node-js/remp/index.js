const assert = require('assert');
const { libNode } = require('@eversdk/lib-node');
const { abiContract, signerNone, NetworkQueriesProtocol, TonClient } = require('@eversdk/core');

// This test contract has been deployed in `fld` and `devnet` networks
const CONTRACT_ABI = require('./Contract.abi.json');
const CONTRACT_ADDRESS = '0:15f61f8dca472c159ee5b3ab5892ee434d66e3744f03e8e35717f78b0b0f75ec';

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js)
TonClient.useBinaryLibrary(libNode);

// Create a project on https://dashboard.evercloud.dev and
// pass its Development Network HTTPS endpoint as a parameter:
const ENDPOINT = process.argv[2];
assert.ok(ENDPOINT, 'HTTPS endpoint required');

const client = new TonClient({
    network: {
        endpoints: [ENDPOINT],
        queries_protocol: NetworkQueriesProtocol.HTTP,
    },
});

let rempEventCnt = 0;

(async () => {
    try {
        console.log('Sending messsage and waiting for REMP events.');
        const { transaction } = await client.processing.process_message(
            {
                send_events: true,
                message_encode_params: {
                    address: CONTRACT_ADDRESS,
                    abi: abiContract(CONTRACT_ABI),
                    call_set: {
                        function_name: 'touch',
                    },
                    signer: signerNone(),
                },
            },
            responseHandler,
        );

        console.log(
            [
                `The message ${transaction.in_msg} has been processed.`,
                `${rempEventCnt} REMP events received`,
                `Transaction id: ${transaction.id}, status ${transaction.status_name}`,
            ].join('\n'),
        );
        client.close();
    } catch (error) {
        if (error.code === 504) {
            console.error('Network is inaccessible.');
        } else {
            console.error(error);
        }
        process.exit(1);
    }
})();

function responseHandler(params, responseType) {
    // Tip: Always wrap the logic inside responseHandler in a try-catch block
    // or you will be surprised by non-informative errors due to the context
    // in which the handler is executed
    try {
        if (responseType === 100 /* GraphQL data received */) {
            const { type, json, error } = params;

            assert.ok(type, 'Event always has type');

            if (type.startsWith('Remp')) {
                rempEventCnt++;
                // All REMP event types starts with `Remp`
                // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_processing#processingevent
                assert.ok(json || error, 'All REMP event has `json` or `error` property');
                if (json) {
                    // We print all REMP events.
                    console.log(`\tREMP event type: ${type}, kind: ${json.kind}`);

                    // but you can pay attention to only a few kinds of events:
                    if (json.kind === 'IncludedIntoBlock') {
                        console.log('\t^^^ this message is probably to be processed successfully');
                    }
                    if (json.kind === 'IncludedIntoAcceptedBlock') {
                        console.log(
                            '\t^^^ this message is highly likely to be processed successfully',
                        );
                    }
                }
                if (error) {
                    // Errors here indicate that there was a problem processing the REMP.
                    // This does not mean that the message cannot be processed successfully,
                    // it only means that the SDK just didn't get the next status at the expected time, see
                    // TonClient config params: `first_remp_status_timeout`, `next_remp_status_timeout`
                    // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_client#networkconfig
                    //
                    // In this case, the SDK switches to the scenario of waiting for a standby transaction (sequential block reading).
                    console.log(
                        `\tREMP event type: ${type}, code: ${error.code}, message: ${error.message}`,
                    );
                }
            } else {
                // In this example we are interested only in REMP events, so we skip
                // other events like `WillFetchFirstBlock`, `WillSend`, `DidSend`.
                // console.log(`Basic event ${type}`);
            }
        } else {
            // See full list of error codes here:
            // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_net#neterrorcode
            console.log('ERROR', params, responseType);
        }
    } catch (err) {
        console.log(err);
    }
}
