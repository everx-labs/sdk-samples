const { abiContract } = require("@eversdk/core");
const { ResponseType } = require("@eversdk/core/dist/bin");

const {
    signerKeys,
    signerNone,
    TonClient,
    MessageBodyType,
} = require("@eversdk/core");

const { libNode } = require("@eversdk/lib-node");

TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ['http://localhost']
    },
});


const { HelloEventsContract } = require("./contracts");

// Address of giver on Evernode SE
const giverAddress = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';

// Giver ABI on Evernode SE
const giverAbi = abiContract({
    'ABI version': 2,
    header: ['time', 'expire'],
    functions: [
        {
            name: 'sendTransaction',
            inputs: [
                { 'name': 'dest', 'type': 'address' },
                { 'name': 'value', 'type': 'uint128' },
                { 'name': 'bounce', 'type': 'bool' }
            ],
            outputs: []
        },
        {
            name: 'getMessages',
            inputs: [],
            outputs: [
                {
                    components: [
                        { name: 'hash', type: 'uint256' },
                        { name: 'expireAt', type: 'uint64' }
                    ],
                    name: 'messages',
                    type: 'tuple[]'
                }
            ]
        },
        {
            name: 'upgrade',
            inputs: [
                { name: 'newcode', type: 'cell' }
            ],
            outputs: []
        },
        {
            name: 'constructor',
            inputs: [],
            outputs: []
        }
    ],
    data: [],
    events: []
});

// Requesting 10 local test tokens from Evernode SE giver
async function get_tokens_from_giver(client, account) {
    const giverKeyPair = {
        "public": "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
        "secret": "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3"
    };

    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: 10_000_000_000,
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}


/**
 * @param text {string}
 * @returns {Promise<{address:string, signer: Signer}>}
 */
async function deployNew(text, signer) {
    const deployParams = {
        abi: abiContract(HelloEventsContract.abi),
        deploy_set: {
            tvc: HelloEventsContract.tvc,
        },
        call_set: {
            function_name: "constructor",
            input: {
                text: Buffer.from(text).toString("hex"),
            },
        },
        signer
    };
    const address = (await client.abi.encode_message(deployParams)).address;
    await get_tokens_from_giver(client, address);
    await client.processing.process_message({
        message_encode_params: deployParams,
        send_events: false,
    });
    return { address, signer };
}

/**
 * @param sigher 
 * @returns {Promise<{address:string}>}
 */
 async function calcAddr(signer) {
    const deployParams = {
        abi: abiContract(HelloEventsContract.abi),
        deploy_set: {
            tvc: HelloEventsContract.tvc,
        },
        signer
    };
    let address = (await client.abi.encode_message(deployParams)).address;
    return { address};
}

/**
 * @param address {string}
 * @param signer {Signer}
 * @param text {string}
 * @returns {Promise<void>}
 */
async function setHelloText(address, signer, text) {
    await client.processing.process_message({
        message_encode_params: {
            abi: abiContract(HelloEventsContract.abi),
            call_set: {
                function_name: "setHelloText",
                input: {
                    text: Buffer.from(text).toString("hex"),
                },
            },
            signer,
            address,
        },
        send_events: false,
    });
}

/**
 *
 * @returns {Promise<string>}
 */
async function getHelloText(address) {
    const account = (await client.net.wait_for_collection({
        collection: "accounts",
        filter: { id: { eq: address } },
        result: "boc"
    })).result.boc;
    const abi = abiContract(HelloEventsContract.abi);
    const { decoded } = await client.tvm.run_tvm({
        abi,
        account,
        message: (await client.abi.encode_message({
            address: address,
            signer: signerNone(),
            abi,
            call_set: {
                function_name: "getHelloText",
                input: {},
            }
        })).message
    });
    return Buffer.from(decoded.output.text, "hex").toString();
}

(async () => {
    try {
        const signer =  signerKeys(await client.crypto.generate_random_sign_keys());
        let {address} = await calcAddr(signer);
        console.log(`Account ${address}"`);

        const accountSubscription = await client.net.subscribe_collection({
            collection: "accounts",
            filter: { id: { eq: address } },
            result: "balance",
        }, (params, responseType) => {
            if (responseType === ResponseType.Custom) {
                console.log("Account has updated. Current balance is ", parseInt(params.result.balance));
            }
        });

        const messageSubscription = await client.net.subscribe_collection({
            collection: "messages",
            filter: {
                src: { eq: address },
                OR: {
                    dst: { eq: address },
                }
            },
            result: "boc",
        }, async (params, responseType) => {
            try {
                if (responseType === ResponseType.Custom) {
                    console.log(`msg_type: ${params.result.body_type} boc: ${params.result.boc}`)
                    const decoded = (await client.abi.decode_message({
                        abi: abiContract(HelloEventsContract.abi),
                        message: params.result.boc,
                    }));
                    switch (decoded.body_type) {
                    case MessageBodyType.Input:
                        console.log(`External inbound message, function "${decoded.name}", parameters: `, JSON.stringify(decoded.value));
                        break;
                    case MessageBodyType.Output:
                        console.log(`External outbound message, function "${decoded.name}", result`, JSON.stringify(decoded.value));
                        break;
                    case MessageBodyType.Event:
                        console.log(`External outbound message, event "${decoded.name}", parameters`, JSON.stringify(decoded.value));
                        break;
                    }
                }
            } catch (err) {
                console.log('>>>', err);
            }
        });

        await new Promise(r => setTimeout(r, 20000));

        await deployNew("Hello World!", signer);
        console.log(`Initial hello text is "${await getHelloText(address)}"`);

        await setHelloText(address, signer, "Hello there1!");
        console.log(`Updated hello text is ${await getHelloText(address)}`);

        /** Free up all internal resources associated with wallets. */
        await client.net.unsubscribe(accountSubscription);
        await client.net.unsubscribe(messageSubscription);
    } catch (error) {
        console.error(error);
    }
    client.close();
})();
