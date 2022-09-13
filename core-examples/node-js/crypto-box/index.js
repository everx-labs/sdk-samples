const { libNode } = require("@eversdk/lib-node");
const {
    cryptoBoxSecretPredefinedSeedPhrase,
    TonClient,
    boxEncryptionAlgorithmNaclBox,
} = require("@eversdk/core");
TonClient.useBinaryLibrary(libNode);

/***
 *
 * @param {TonClient} client
 * @returns {Promise}
 */
async function simplePasswordProvider(client) {
    return {
        async get_password(params) {
            const tempKeys = await client.crypto.nacl_box_keypair();
            const encryptedPassword = (await client.crypto.nacl_box({
                decrypted: Buffer.from("1234").toString("base64"),
                nonce: params.encryption_public_key.substring(0, 48),
                their_public: params.encryption_public_key,
                secret: tempKeys.secret,
            })).encrypted;


            return {
                encrypted_password: encryptedPassword,
                app_encryption_pubkey: tempKeys.public,
            };
        },
    };
}

async function genRandomNonce(client) {
    const bytes = (await client.crypto.generate_random_bytes({ length: 24 })).bytes;
    return Buffer.from(bytes, "base64").toString("hex");
}

/**
 * @param {TonClient} client
 */
async function main(client) {

    // Create crypto box from known seed phrase

    const cryptoBox = (await client.crypto.create_crypto_box({
        secret: cryptoBoxSecretPredefinedSeedPhrase(
            "abandon math mimic master filter design carbon crystal rookie group knife young",
            1,
            12,
        ),
        secret_encryption_salt: "1",
    }, await simplePasswordProvider(client))).handle;

    // Use derived signing box

    const signingBox = (await client.crypto.get_signing_box_from_crypto_box({
        handle: cryptoBox,
        hdpath: "m/1",
    })).handle;

    const signature = (await client.crypto.signing_box_sign({
        signing_box: signingBox,
        unsigned: Buffer.from("Hello").toString("base64"),
    })).signature;

    console.log("String \"Hello\" signature is: ", signature);

    // Use derived encryption box

    const theirKeys = await client.crypto.nacl_box_keypair();
    const nonce = await genRandomNonce(client);
    const encryptionBox = await client.crypto.get_encryption_box_from_crypto_box({
        handle: cryptoBox,
        hdpath: "m/1",
        algorithm: {
            type: "NaclBox",
            value: {
                their_public: theirKeys.public,
                nonce,
            },
        },
    });
    const encrypted = (await client.crypto.encryption_box_encrypt({
        encryption_box: encryptionBox.handle,
        data: Buffer.from("Hello").toString("base64"),
    })).data;
    console.log("Encrypted string \"Hello\" is: ", encrypted);
    const decrypted = (await client.crypto.encryption_box_decrypt({
        encryption_box: encryptionBox.handle,
        data: encrypted,
    })).data;
    console.log("Decrypted string \"Hello\" is: ", Buffer.from(decrypted, "base64").toString());

    //
    // Finalise

    await client.crypto.remove_crypto_box({
        handle: cryptoBox,
    });

}

(async () => {
    try {
        const client = new TonClient()
        await main(client);
        await client.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
