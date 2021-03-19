const { loadContract } = require ( "utils");

module.exports = {
    MultisigContract: loadContract("solidity/safemultisig/SafeMultisigWallet"),
};
