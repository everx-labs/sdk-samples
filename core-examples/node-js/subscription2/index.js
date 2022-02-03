const { ResponseType } = require('@tonclient/core/dist/bin')
const { TonClient } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const address1 = '-1:3333333333333333333333333333333333333333333333333333333333333333'
const address2 = '0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13'
const set = new Set()

TonClient.useBinaryLibrary(libNode)

const client = new TonClient({
    network: {
        endpoints: [
            'https://eri01.net.everos.dev',
            'https://rbx01.net.everos.dev',
            'https://gra01.net.everos.dev',
        ],
    },
})

main(client).catch((err) => {
    console.log(err)
    process.exit(1)
})

async function main(client) {
    /*
     * This function is triggered every time a message is received.
     */
    function subscrHandler(params, responseType) {
        if (responseType === ResponseType.Custom) {
            const msg = `Account ${params.result.id} balance is ${params.result.balance}`
            console.log(msg)

            if (set.has(msg) === false) {
                set.add(msg)
            } else {
                console.log('Bug found! Duplicate message!')
                process.exit(1)
            }
        }
    }

    console.log('Subscribing to ONE address:', address1)
    let mySubscription = await client.net.subscribe_collection(
        {
            collection: 'accounts',
            filter: { id: { eq: address1 } },
            result: 'id balance',
        },
        subscrHandler,
    )

    await sleep(120000) // 2 min
        .then((_) => console.log('Unsubscribing'))
        .then((_) => client.net.unsubscribe(mySubscription))

    console.log('Subscribing to TWO adresses:', address1, address2)
    mySubscription = await client.net.subscribe_collection(
        {
            collection: 'accounts',
            filter: {
                id: { eq: address1 },
                OR: { id: { eq: address2 } },
            },
            result: 'id balance',
        },
        subscrHandler,
    )

    await sleep(180000) // 3 min
        .then((_) => console.log('Unsubscribing'))
        .then((_) => client.net.unsubscribe(mySubscription))

    process.exit(0)
}
