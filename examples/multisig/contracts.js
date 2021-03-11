import { loadContract } from "utils";

module.exports = {
    MultisigContract: loadContract("solidity/safemultisig/SafeMultisigWallet"),
};
