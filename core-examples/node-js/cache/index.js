const { TonClient, abiContract, signerNone, bocCacheTypePinned, bocCacheTypeUnpinned } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')

TonClient.useBinaryLibrary(libNode)

const address = "-1:7777777777777777777777777777777777777777777777777777777777777777";

async function main(client) {
    // Download account BOC
    const account = (await client.net.query_collection({
        collection: "accounts",
        filter: { id: { eq: address } },
        result: "boc",
    })).result[0];
    
    // Save account BOC into cache to use in local calls. Pin the BOC with some name to prevent 
    // replacing it by another BOCs
    const bocRef = (await client.boc.cache_set({
        boc: account.boc,
        cache_type: bocCacheTypePinned('testPin')
    })).boc_ref;

    console.log('Cached account BOC reference', bocRef);

    // Use received BOC reference in local call
    const result = await client.tvm.run_tvm({
        abi,
        account: bocRef,
        message: (await client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getCustodians',
            },
            signer: signerNone(),
        })).message,
        // Use ouput caching to reduce returned data serialization overhead. Don't pin since it 
        // is not needed in consequent calls
        boc_cache: bocCacheTypeUnpinned()
    });
    //console.log(result.decoded.output);

    // Unpin all the BOCs pinned with the specified name to remove them from cache
    await client.boc.cache_unpin({
        pin: 'testPin'
    }).boc_ref;

    // BOC can be received from cache
    const out_message = (await client.boc.cache_get({
        boc_ref: result.out_messages[0],
    })).boc;

    console.log('Message received from cache', out_message);
}

(async () => {
    const client = new TonClient({
        network: { endpoints: ["main2.ton.dev","main3.ton.dev", "main4.ton.dev" ]}
    });
    try {
        await main(client);
    } catch (e) {
        console.log(e);
    }
    client.close();
})();


const abi = abiContract({
	"ABI version": 2,
	"header": ["pubkey", "time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
				{"name":"owners","type":"uint256[]"},
				{"name":"reqConfirms","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "acceptTransfer",
			"inputs": [
				{"name":"payload","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "sendTransaction",
			"inputs": [
				{"name":"dest","type":"address"},
				{"name":"value","type":"uint128"},
				{"name":"bounce","type":"bool"},
				{"name":"flags","type":"uint8"},
				{"name":"payload","type":"cell"}
			],
			"outputs": [
			]
		},
		{
			"name": "submitTransaction",
			"inputs": [
				{"name":"dest","type":"address"},
				{"name":"value","type":"uint128"},
				{"name":"bounce","type":"bool"},
				{"name":"allBalance","type":"bool"},
				{"name":"payload","type":"cell"}
			],
			"outputs": [
				{"name":"transId","type":"uint64"}
			]
		},
		{
			"name": "confirmTransaction",
			"inputs": [
				{"name":"transactionId","type":"uint64"}
			],
			"outputs": [
			]
		},
		{
			"name": "isConfirmed",
			"inputs": [
				{"name":"mask","type":"uint32"},
				{"name":"index","type":"uint8"}
			],
			"outputs": [
				{"name":"confirmed","type":"bool"}
			]
		},
		{
			"name": "getParameters",
			"inputs": [
			],
			"outputs": [
				{"name":"maxQueuedTransactions","type":"uint8"},
				{"name":"maxCustodianCount","type":"uint8"},
				{"name":"expirationTime","type":"uint64"},
				{"name":"minValue","type":"uint128"},
				{"name":"requiredTxnConfirms","type":"uint8"}
			]
		},
		{
			"name": "getTransaction",
			"inputs": [
				{"name":"transactionId","type":"uint64"}
			],
			"outputs": [
				{"components":[{"name":"id","type":"uint64"},{"name":"confirmationsMask","type":"uint32"},{"name":"signsRequired","type":"uint8"},{"name":"signsReceived","type":"uint8"},{"name":"creator","type":"uint256"},{"name":"index","type":"uint8"},{"name":"dest","type":"address"},{"name":"value","type":"uint128"},{"name":"sendFlags","type":"uint16"},{"name":"payload","type":"cell"},{"name":"bounce","type":"bool"}],"name":"trans","type":"tuple"}
			]
		},
		{
			"name": "getTransactions",
			"inputs": [
			],
			"outputs": [
				{"components":[{"name":"id","type":"uint64"},{"name":"confirmationsMask","type":"uint32"},{"name":"signsRequired","type":"uint8"},{"name":"signsReceived","type":"uint8"},{"name":"creator","type":"uint256"},{"name":"index","type":"uint8"},{"name":"dest","type":"address"},{"name":"value","type":"uint128"},{"name":"sendFlags","type":"uint16"},{"name":"payload","type":"cell"},{"name":"bounce","type":"bool"}],"name":"transactions","type":"tuple[]"}
			]
		},
		{
			"name": "getTransactionIds",
			"inputs": [
			],
			"outputs": [
				{"name":"ids","type":"uint64[]"}
			]
		},
		{
			"name": "getCustodians",
			"inputs": [
			],
			"outputs": [
				{"components":[{"name":"index","type":"uint8"},{"name":"pubkey","type":"uint256"}],"name":"custodians","type":"tuple[]"}
			]
		}
	],
	"data": [
	],
	"events": [
		{
			"name": "TransferAccepted",
			"inputs": [
				{"name":"payload","type":"bytes"}
			],
			"outputs": [
			]
		}
	]
});
