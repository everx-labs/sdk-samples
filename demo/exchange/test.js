const { libNode } = require("@tonclient/lib-node");
const { TonClient } = require("@tonclient/core");
const { TransferIterator } = require("./lib/transfers");
const { Shard, parseWorkchainIdPrefix } = require("./lib/sharding");
const { BlockIterator, BlockFilter } = require("./lib/blocks");

const path = require("path");
const fs = require("fs");

TonClient.useBinaryLibrary(libNode);

function shorten(s) {
    return `${s.substr(0, 3)}‧‧${s.slice(-3)}`;
}

function shortenAddress(address) {
    const { workchainId, tail } = parseWorkchainIdPrefix(address);
    return `${workchainId}:${shorten(tail)}`;
}

/**
 * @param {Transfer} transfer
 */
function printTransfer(transfer) {
    if (BlockIterator.debugBlockLoaded > 0) {
        BlockIterator.debugBlockLoaded = 0;
        process.stdout.write("\n");
    }
    const op = transfer.isDeposit
        ? ["💰", "deposits ", "from"]
        : ["💸", "withdraws", "  to"];
    const account = shortenAddress(transfer.account);
    const other = shortenAddress(transfer.counterparty);
    const value = transfer.value.toString().padStart(12, "․");
    const time = new Date(transfer.time * 1000).toUTCString();
    console.log(`👥 ${account} ${op[0]} ${op[1]} ${value}💎 ${op[2]} ${other} at 📅${time} (${transfer.time})`);
}

function invalidArgs() {
    console.log("USAGE: node list-transfers name [ time count [ shard-filter ] ]");
    process.exit(0);
}

async function listTransfers(client) {
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
        invalidArgs();
    }

    /** @type {string} */
    const name = argv.shift();

    /** @type {number} */
    let count = 20;

    /** @type {TransferIterator} */
    let transfers;

    /** @type {string} */
    const suspendedPath = path.resolve(__dirname, `${name}.transfers.json`);

    if (argv.length === 0) {
        console.log(`\n⏭️  resume from saved state ${suspendedPath}\n`);
        const suspended = JSON.parse(fs.readFileSync(suspendedPath, "utf8"));

        transfers = await TransferIterator.resume(client, [], suspended);
    } else {
        /** @type {number} */
        const time = Math.round(new Date(argv.shift()).getTime() / 1000);
        count = argv.shift() || count;
        const shardFilter = Shard.parse(argv.shift() || "");
        console.log(`\n🏁 start from ${time} ${new Date(time * 1000).toUTCString()} (${time}))\n`);

        transfers = await TransferIterator.start(client, time, shardFilter, []);
    }

    for (let i = 0; i < count; i += 1) {
        printTransfer(await transfers.next());
    }

    const suspended = transfers.suspend();
    fs.writeFileSync(suspendedPath, JSON.stringify(suspended, undefined, "    "));

    console.log(`\n💾 suspended state saved to ${suspendedPath}\n`);
}

async function testBlocks(client) {
    const startTime = 1622636544;
    const endTime = startTime + 30 * 60;

    const ids = [];
    const visited = new Set();

    console.log("First Pass");
    let blocks = await BlockIterator.start(
        client,
        new BlockFilter(Shard.zero(), startTime, endTime),
    );
    while (!blocks.eof()) {
        const block = await blocks.next();
        if (block) {
            ids.push(block.id);
            if (visited.has(block.id)) {
                console.log("Duplicated", block.id);
            } else {
                visited.add(block.id);
            }
        }
    }

    console.log("Second Pass");
    blocks = await BlockIterator.start(
        client,
        new BlockFilter(Shard.zero(), startTime, endTime),
    );
    while (!blocks.eof()) {
        const block = await blocks.next();
        if (block) {
            if (block.id !== ids.shift()) {
                console.log("Wrong order", block.id);
            }
        }
    }

    console.log("Complete");
}

async function testTransfers(client) {
    const startTime = 1622636544;
    const endTime = startTime + 30 * 60;

    const ids = [];
    const visited = new Set();

    console.log("First Pass");
    let transfers = await TransferIterator.start(
        client,
        {
            shard: Shard.zero(),
            startBlockTime: startTime,
            endBlockTime: endTime,
        },
        [],
    );
    while (!transfers.eof()) {
        const transfer = await transfers.next();
        if (transfer) {
            const id = `${transfer.transaction} ${transfer.message}`
            ids.push(id);
            if (visited.has(id)) {
                console.log("Duplicated", id);
            } else {
                visited.add(id);
            }
        }
    }

    console.log("Second Pass");
    transfers = await TransferIterator.start(
        client,
        {
            shard: Shard.zero(),
            startBlockTime: startTime,
            endBlockTime: endTime,
        },
        [],
    );
    while (!transfers.eof()) {
        const transfer = await transfers.next();
        if (transfer) {
            const id = `${transfer.transaction} ${transfer.message}`
            if (id !== ids.shift()) {
                console.log("Wrong order", id);
            }
        }
    }
    console.log("Complete");
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["net.ton.dev"],
            // endpoints: ["main.ton.dev"],
        },
    });
    try {
        // BlockIterator.debugMode = true;
        // await testBlocks(client);
        await testTransfers(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
