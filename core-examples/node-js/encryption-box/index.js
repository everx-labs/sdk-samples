const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

function fromBase64(base64) {
    return Buffer.from(base64, 'base64')
        .toString('utf8');
}

function toBase64(str) {
    return Buffer.from(str, 'utf8')
        .toString('base64');
}

/**
 *
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {
    // Sample implementation of Encryption Box, duplicates given string.
    // All data is transferred using Base64 encoding.
    const encryption_box = {
        get_info: async () => {
            return {
                info: {
                    algorithm: "duplicator",
                }
            };
        },
        encrypt: async (params) => {
            const data = fromBase64(params.data);
            return {
                data:  toBase64(data + data),
            };
        },
        decrypt: async (params) => {
            const data = fromBase64(params.data);
            return {
                data: toBase64(data.substr(0, data.length / 2)),
            }
        }
    };

    // Registering our implementation in SDK
    const handle = (await client.crypto.register_encryption_box(encryption_box)).handle;

    // Getting information, provided by our implementation
    const info = (await client.crypto.encryption_box_get_info({
        encryption_box: handle,
    })).info;

    console.log("Algorithm: " + info.algorithm);

    const data = "12345";
    console.log("Data: " + data);

    // Encrypting sample data using our implementation
    const encrypted = fromBase64((await client.crypto.encryption_box_encrypt({
        encryption_box: handle,
        data: toBase64(data),
    })).data);

    console.log("Encrypted: " + encrypted);

    // Decrypting encrypted data back
    const decrypted = fromBase64((await client.crypto.encryption_box_decrypt({
        encryption_box: handle,
        data: toBase64(encrypted),
    })).data);

    console.log("Decrypted: " + decrypted);

    // Removing our implementation from SDK
    await client.crypto.remove_encryption_box({
        handle: handle,
    });
}

(async () => {
    try {
        console.log("*** Encryption Box Example ***");
        const client = new TonClient({});
        await main(client);
        client.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();


