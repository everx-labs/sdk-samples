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

        transfers = await TransferIterator.start(client, {
            shard: shardFilter,
            startBlockTime: time,
        }, []);
    }

    for (let i = 0; i < count; i += 1) {
        printTransfer(await transfers.next());
    }

    const suspended = transfers.suspend();
    fs.writeFileSync(suspendedPath, JSON.stringify(suspended, undefined, "    "));

    console.log(`\n💾 suspended state saved to ${suspendedPath}\n`);
}

/**
 *
 * @param {BlockIterator} blocks
 * @param {Set.<string>} reported
 */
function checkForStoppedBranches(blocks, reported) {
    const nowSeconds = Math.round(Date.now() / 1000);
    blocks._branches.forEach((branch) => {
        const lagInSeconds = nowSeconds - branch.updateTime;
        if (lagInSeconds > 120 && !reported.has(branch.blockId)) {
            reported.add(branch.blockId);
            console.log(`\nBranch with block ${branch.blockId} of shard ${branch.shard.prefixBits} has a lag of ${lagInSeconds} seconds: seems to missing block.`);
        }
    });
}

async function testBlocks(client) {
    const startTime = Math.round(Date.parse("2021-06-04T01:05:00.000+00:00") / 1000);
    const endTime = Math.round(Date.now() / 1000);

    const ids = [];
    const visited = new Set();
    const reported = new Set();

    console.log("First Pass");
    let blocks = await BlockIterator.start(
        client,
        new BlockFilter(Shard.zero(), startTime, endTime),
    );
    while (!blocks.eof()) {
        const block = await blocks.next();
        if (block) {
            const percent = Math.round((block.gen_utime - startTime) / (endTime - startTime) * 100);
            const time = new Date(block.gen_utime * 1000);
            process.stdout.write(`\r${percent}%  ${time.toUTCString()}   `);
            ids.push(block.id);
            if (visited.has(block.id)) {
                console.log("Duplicated", block.id);
            } else {
                visited.add(block.id);
            }
        }
        checkForStoppedBranches(blocks, reported);
    }

    console.log("Second Pass");
    blocks = await BlockIterator.start(
        client,
        new BlockFilter(Shard.zero(), startTime, endTime),
    );
    while (!blocks.eof()) {
        const block = await blocks.next();
        if (block) {
            process.stdout.write(`\r${Math.round((block.gen_utime - startTime) / (endTime - startTime) * 100)}%  `);
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
            const id = `${transfer.transaction} ${transfer.message}`;
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
            const id = `${transfer.transaction} ${transfer.message}`;
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
            endpoints: ["of1.net.validators.tonlabs.io"],
            // endpoints: ["main.ton.dev"],
        },
    });
    try {
        // BlockIterator.debugMode = true;
        await testBlocks(client);
        // await testTransfers(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
