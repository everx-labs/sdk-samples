const { abiContract, TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({});

const address = "EQAwj_RolhwutAINo6aEMyPf81iCZxHQrVrySE5s0nQUFSXs";

(async () => {
    try {
        console.log(`Convert address: ${address} to different formats: \n`);

        let convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "AccountId",
            },
        })).address;
        console.log(`Multisig address in HEX: ${convertedAddress}`);

        convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: false,
            },
        })).address;
        console.log(`Multisig non-bounce address in Base64: ${convertedAddress}`);

        convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: true,
            },
        })).address;
        console.log(`Multisig bounce address in Base64: ${convertedAddress}`);

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();

