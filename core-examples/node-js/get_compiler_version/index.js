const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();

    try {
        // Get the compiler version from the specified code BOC
        const compilerVersion = await client.boc.get_compiler_version({
            code: "te6ccgECEAEAAYkABCSK7VMg4wMgwP/jAiDA/uMC8gsNAgEPAoTtRNDXScMB+GYh2zzTAAGfgQIA1xgg+QFY+EL5EPKo3tM/Af" +
                "hDIbnytCD4I4ED6KiCCBt3QKC58rT4Y9MfAds88jwFAwNK7UTQ10nDAfhmItDXCwOpOADcIccA4wIh1w0f8rwh4wMB2zzyPAwMAw" +
                "IoIIIQBoFGw7rjAiCCEGi1Xz+64wIIBAIiMPhCbuMA+Ebyc9H4ANs88gAFCQIW7UTQ10nCAYqOgOILBgFccO1E0PQFcSGAQPQOk9" +
                "cLB5Fw4vhqciGAQPQPjoDf+GuAQPQO8r3XC//4YnD4YwcBAogPA3Aw+Eby4Ez4Qm7jANHbPCKOICTQ0wH6QDAxyM+HIM6AYs9AXg" +
                "HPkhoFGw7LB8zJcPsAkVvi4wDyAAsKCQAq+Ev4SvhD+ELIy//LP8+DywfMye1UAAj4SvhLACztRNDT/9M/0wAx0wfU0fhr+Gr4Y/" +
                "hiAAr4RvLgTAIK9KQg9KEPDgAUc29sIDAuNTEuMAAA",
        });

        // Output some of decoded data
        console.log("Contract compiled with:", compilerVersion);

        /*
            Outputs:
            Contract compiled with: { version: 'sol 0.51.0' }
         */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();