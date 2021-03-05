import fs from "fs";

export const MultisigContract = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require("../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json"),
    // Compiled smart contract file
    tvc: fs.readFileSync("../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc").toString("base64"),
};
