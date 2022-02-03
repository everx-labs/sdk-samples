const { ResponseType } = require('@tonclient/core/dist/bin')
const { TonClient } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')

const address1 = '-1:3333333333333333333333333333333333333333333333333333333333333333'

TonClient.useBinaryLibrary(libNode)

const client = new TonClient({
    network: {
        endpoints: [
            'https://eri01.net.everos.dev',
            // 'https://rbx01.net.everos.dev',
            // 'https://gra01.net.everos.dev',
        ],
    },
})

main(client).catch(console.log)

async function main(client) {
    console.log('Subscribing to ONE address:', address1)
    let mySubscription = await client.net.subscribe_collection(
        {
            collection: 'accounts',
            filter: { id: { eq: address1 } },
            // result: 'balance',         // gives an error
            result: 'id balance',   // shoud work
        },
        (params, responseType) => {
            console.log(params, responseType)
        },
    )
}
