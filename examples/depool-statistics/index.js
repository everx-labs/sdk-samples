const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
const {
    signerNone,
    TonClient,
    AggregationFn,
    SortDirection,
} = require("@tonclient/core");
const { DePoolContract } = require("./DePoolContract.js");

TonClient.useBinaryLibrary(libNode);

async function printDePool(client, address) {
    const dePoolAcc = new Account(DePoolContract, {
        address: address,
        client,
        signer: signerNone(),
    });

    // Get basic DePool information
    let response = await dePoolAcc.runLocal("getDePoolInfo", {});
    const dePoolInfo = response.decoded.output;

    console.log(`\nDePool ${address} Information:`);
    console.log("  Validator Wallet:", dePoolInfo.validatorWallet);
    console.log("  Proxy1:", dePoolInfo.proxies[0]);
    console.log("  Proxy2:", dePoolInfo.proxies[1]);
    console.log(`  DePool Fee: ${dePoolInfo.validatorRewardFraction}%`);
    console.log(`  Stake Fee: ${dePoolInfo.stakeFee} nanotokens`);
    console.log(`  Assurance: ${dePoolInfo.validatorAssurance} nanotokens`);
    console.log(`  Minimal Stake: ${dePoolInfo.minStake} nanotokens`);
    console.log("  Status:", dePoolInfo.poolClosed ? "Closed" : "Active");

    // Get DePool balance
    response = await dePoolAcc.runLocal("getDePoolBalance", {});
    console.log(`  Balance: ${response.decoded.output.value0} nanotokens`);

    // Get DePool rounds
    response = await dePoolAcc.runLocal("getRounds", {});
    const rounds = response.decoded.output.rounds;
    let totalStake = 0;
    console.log(`\n*** Rounds ***`);
    for (let [key, value] of Object.entries(rounds)) {
        printRound(key, value);
        totalStake += parseInt(value.stake);
    }

    console.log(`\nTotal Stake: ${totalStake} nanotokens`);

    // Get DePool participants
    response = await dePoolAcc.runLocal("getParticipants", {});
    const participants = response.decoded.output.participants;
    const participantCount = participants.length;
    // We print not more than 3 first participants
    const count = Math.min(3, participantCount);
    console.log(`\n*** First ${count} Participants of ${participantCount} ***`);
    for (let i = 0; i < count; i++) {
        await printParticipant(dePoolAcc, participants[i]);
    }
}

function printStakes(heading, stakes) {
    let entries = Object.entries(stakes);
    console.log(`  ${heading}:`, entries.length === 0 ? "(none)" : "");
    for (let [key, value] of entries) {
        console.log(`    Round #${key}: ${value} nanotokens`);
    }
}

function printSpecialStakes(heading, stakes) {
    let entries = Object.entries(stakes);
    console.log(`  ${heading}:`, entries.length === 0 ? "(none)" : "");
    for (let [key, value] of entries) {
        console.log(`    Round #${key}:`);
        console.log("      Owner:", value.owner);
        console.log(`      Remaining Amount: ${value.remainingAmount} nanotokens`);
        console.log("      Last Withdrawal Time:", unixTimeToString(parseInt(value.lastWithdrawalTime)));
        console.log(`      Withdrawal Period: ${value.withdrawalPeriod} seconds`);
        console.log(`      Withdrawal Value: ${value.withdrawalValue} nanotokens`);
    }
}

async function printParticipant(dePoolAcc, participant) {
    const response = await dePoolAcc.runLocal("getParticipantInfo", { addr: participant });
    const info = response.decoded.output;
    console.log(`\nParticipant ${participant}:`);
    console.log(`  Participant Total Stake: ${info.total} nanotokens`);
    console.log(`  Withdraw Value: ${info.withdrawValue} nanotokens`);
    console.log("  Reinvest:", info.reinvest);
    console.log(`  Reward: ${info.reward} nanotokens`);
    console.log("  Vesting Donor:", info.vestingDonor);
    console.log("  Lock Donor:", info.lockDonor);

    printStakes("Stakes", info.stakes);
    printSpecialStakes("Vestings", info.vestings);
    printSpecialStakes("Locks", info.locks);
}

function printRound(number, info) {
    console.log(`\nRound #${number}:`);
    console.log("  Participant Count:", info.participantQty);
    console.log(`  Stake: ${info.stake} nanotokens`);
    console.log(`  Recovered Stake: ${info.recoveredStake} nanotokens`);
    console.log(`  Unused: ${info.unused} nanotokens`);
    console.log(`  Validator Stake: ${info.validatorStake} nanotokens`);
    console.log(`  Validator Remaining Stake: ${info.validatorRemainingStake} nanotokens`);
}

function unixTimeToString(unixTimestamp) {
    return new Date(unixTimestamp * 1000).toLocaleString();
}

async function main(client) {
    const dePoolCodeHashes = [
        "b4ad6c42427a12a65d9a0bffb0c2730dd9cdf830a086d94636dab7784e13eb38", // DePool v1
        "a46c6872712ec49e481a7f3fc1f42469d8bd6ef3fae906aa5b9927e5a3fb3b6b", // DePool v2
        "14e20e304f53e6da152eb95fffc993dbd28245a775d847eed043f7c78a503885", // DePool v3 Final
    ];

    // Count all known DePool contracts
    const dePoolCount = (await client.net.aggregate_collection({
        collection: "accounts",
        filter: {
            code_hash: {
                in: dePoolCodeHashes
            },
        },
        fields: [ { field: "id", fn: AggregationFn.COUNT } ]
    })).values[0];

    console.log("DePool Count:", dePoolCount);

    // Query list of all known DePool contracts in main.ton.dev
    // There is impossible to get more than 50 records using single request, so we request in loop by portions,
    // using field `id` (address) as record number (sorting by this field).
    let lastId = "";
    let dePools;
    do {
        dePools = (await client.net.query_collection({
            collection: "accounts",
            filter: {
                code_hash: {
                    in: dePoolCodeHashes,
                },
                id: {
                    gt: lastId,
                }
            },
            result: "id",
            order: [{ path: "id", direction: SortDirection.ASC }],
        })).result;
        for (let i = 0; i < dePools.length; i++) {
            const id = dePools[i].id;
            console.log(id);
            lastId = id;
        }
    } while (dePools.length > 0);

    // Print information about one of DePools
    await printDePool(client, "0:919db8e740d50bf349df2eea03fa30c385d846b991ff5542e67098ee833fc7f7");
}

(async () => {
    const client = new TonClient({
        network: {
            /// https://docs.ton.dev/86757ecb2/p/85c869-networks
            endpoints: ["main2.ton.dev", "main3.ton.dev", "main4.ton.dev"],
        },
    });
    try {
        console.log("\nDePools Statistics Example\n");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
    client.close();
})();
