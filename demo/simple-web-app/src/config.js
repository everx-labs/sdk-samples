/*
 * CONTRACTS ABI and code. You hardly need to change the following values
 */
const SAFE_MSIG_PACKAGE = require('./ton-contracts/SafeMultisigWallet.package')
const OFFER_PACKAGE = require('./ton-contracts/Offer.package')
const GIVER_PACKAGE = require('./ton-contracts/giver.package')
const NODE_SE_GIVER_PACKAGE = require('./ton-contracts/giver.package')

/*
 * IMPORTANT! Set this value appropriately
 */
const NODE_SE = true

/*
 * TON SDK configuration
 */
const NODE_SE_TON_SERVER_ADDRESS = 'http://0.0.0.0' // or 127.0.0.1 or  http://45.86.181.59

const TON_SERVER_ADDRESS = 'https://net.ton.dev'
const TON_MESSAGE_PROCESSING_TIMEOUT = 60000
const TON_MESSAGE_RETRIES_COUNT = 1 // Retries will be done at the application level

/*
 * IMPORTANT! Update all 3 lines after deploying the Giver contract
 */
const GIVER_ADDRESS = ''
const GIVER_PUBLIC_KEY = ''
const GIVER_SECRET_KEY = ''

/*
 * Change the following value if the offer contract has been modified and recompiled
 */
const OFFER_CONTRACT_CODE_HASH = 'd4f02afd27b2dac96acf3b21cde89fdb390ff18a35bc8fbff8fa87434f61f06f'

/*
 * You never need to change next line
 */
const NODE_SE_GIVER_ADDRESS = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5'
const NODE_SE_GIVER_PUBLIC_KEY = '2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16'
const NODE_SE_GIVER_SECRET_KEY = '172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3'

module.exports = {
    clientParams: {
        network: {
            server_address: NODE_SE ? NODE_SE_TON_SERVER_ADDRESS : TON_SERVER_ADDRESS,
            message_retries_count: TON_MESSAGE_RETRIES_COUNT,
        },
        abi: {
            message_processing_timeout: TON_MESSAGE_PROCESSING_TIMEOUT,
        },
    },
    contracts: {
        walletContract: {
            package: SAFE_MSIG_PACKAGE,
        },

        offerContract: {
            package: OFFER_PACKAGE,
            codeHash: OFFER_CONTRACT_CODE_HASH,
        },

        giver: NODE_SE
            ? {
                  address: NODE_SE_GIVER_ADDRESS,
                  package: NODE_SE_GIVER_PACKAGE,
                  keyPair: {
                      public: NODE_SE_GIVER_PUBLIC_KEY,
                      secret: NODE_SE_GIVER_SECRET_KEY,
                  },
              }
            : {
                  address: GIVER_ADDRESS,
                  package: GIVER_PACKAGE,
                  keyPair: {
                      public: GIVER_PUBLIC_KEY,
                      secret: GIVER_SECRET_KEY,
                  },
              },
    },
}
