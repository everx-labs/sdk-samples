import {
    signerKeys,
    TonClient,
} from "@tonclient/core";
import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";

import {HelloContract} from "./HelloContract";

TonClient.useBinaryLibrary(libWeb);
TonClient.defaultConfig = {
    network: {
        endpoints: ["http://localhost"],
    },
};

function setText(id, text) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.innerText = text;
    }
}

window.addEventListener("load", async () => {
    setText("version", (await TonClient.default.client.version()).version);

    const helloAcc = new Account(HelloContract, {
        signer: signerKeys(await TonClient.default.crypto.generate_random_sign_keys()),
    });

    setText("address", await helloAcc.getAddress());

    await helloAcc.deploy({useGiver: true});
    setText("deployed", "Success");

    const touchResponse = await helloAcc.run("touch", {});

    setText("touchOutput", JSON.stringify(touchResponse.decoded.output));

    // Execute the get method `getTimestamp` on the latest account's state
    const getTimestampResponse = await helloAcc.runLocal("getTimestamp", {});
    setText("getTimestampOutput", Number.parseInt(getTimestampResponse.decoded.output.value0 ?? 0).toString());
});
