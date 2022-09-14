const { TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)

const client = new TonClient()

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
