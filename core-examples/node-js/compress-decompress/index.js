const { TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)

/*
 * To configure Ton Client, it needs to pass API endpoints as parameters.
 *
 * The public EVER OS API endpoints see here:
 * https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks
 *
 * To use DApp Server, specify its URL here the same way.
 *
 * This sample uses the Developer Network:
 */
const client = new TonClient({
    network: {
        endpoints: ['eri01.net.everos.dev', 'rbx01.net.everos.dev', 'gra01.net.everos.dev'],
    },
})

async function main() {
    const maxCompression = 21
    const helloWorld = "Hello World!"

    const helloWorldInBase64 = Buffer.from(helloWorld, "utf8").toString("base64")
    
    /*
     * @returns {Object} {compressed: base64_string}
     */
    const resultCompressed = await client.utils.compress_zstd({level: maxCompression, uncompressed: helloWorldInBase64})

    /*
     * @returns {Object} {decompressed: base64_string}
     */
    const resultDecompressed = await client.utils.decompress_zstd({...resultCompressed})

    
    const helloWorldAfter = Buffer.from(resultDecompressed.decompressed, "base64").toString("utf8")
    console.log(helloWorldAfter)
}

(async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
})()
