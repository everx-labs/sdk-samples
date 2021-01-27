import { TonClient } from '@tonclient/core';
import { libWeb } from '@tonclient/lib-web';

TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({
    network: {
        server_address: "http://localhost:8080"
    }
})

async function onLoad() {
    document.getElementById("version").innerText = (await client.client.version()).version;
}

window.addEventListener('load', onLoad);
