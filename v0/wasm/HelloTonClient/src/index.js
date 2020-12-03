import { TONClient, setWasmOptions } from 'ton-client-web-js';

function addHTML(message) {
    document.body.insertAdjacentHTML("beforeend", `<p>${message}</p>`);
}

window.addEventListener('load', () => {
    (async () => {
        // Adding an HTML update function
        setWasmOptions({
            addHTML,
        });
        let createStart = Date.now();
        // creating a TONClient wit a net.ton.dev connection
        const client = await TONClient.create({
            servers: ['net.ton.dev']
        });
        // requesting TONClient creation time stamp
        addHTML(`Client creation time: ${(Date.now() - createStart)} ms`);
        // displaying the current client version
        addHTML(`Client version: ${await client.config.getVersion()}`);
        addHTML(`Client connected to: ${await client.config.data.servers}`);
        const queryStart = Date.now();
        // requesting top 10 accounts sorted by balance from net.ton.dev/graphql
        const accounts = await client.queries.accounts.query({}, 'id balance', [{path:'balance', direction:'DESC'}], 10);
        addHTML(`Query time: ${(Date.now() - queryStart)} ms`);
        // displaying the data
        addHTML(`<table>${accounts.map(x => `<tr><td>${x.id}</td><td>${BigInt(x.balance)}</td></tr>`).join('')}</table>`);
        // displaying the data received time stamp
        addHTML(`Now is: ${new Date()}`);
    })();
});