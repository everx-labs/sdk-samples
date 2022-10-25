const { abiContract, TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({});

const address = "EQAwj_RolhwutAINo6aEMyPf81iCZxHQrVrySE5s0nQUFSXs";

(async () => {
    try {
        let initialAddressType = await client.utils.get_address_type({address});
        console.log(`Convert address ${address} of type ${JSON.stringify(initialAddressType)} to different formats: \n`);

        let convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "Hex"
            },
        })).address;
        console.log(`Address in raw format: ${convertedAddress}`);

        convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "AccountId",
            },
        })).address;
        console.log(`Address in HEX: ${convertedAddress}`);

        convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: false,
            },
        })).address;
        console.log(`Address in non-bounce Base64: ${convertedAddress}`);

        convertedAddress = (await client.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: true,
            },
        })).address;
        console.log(`Address in bounce Base64: ${convertedAddress}`);


        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();

