const config = {
    url2FA: 'https://jessie.tonlabs.io/card-service/'/*'https://dev.services.tonlabs.io/card-service/'*/,
    user: 'ton',
    pass: 'integration',
    networks: {
        ton: {
            servers: ['https://net.ton.dev/' /*'https://cinet.tonlabs.io'*/],
            log_verbose: false,
            messageRetriesCount: 3 ,
            messageExpirationTimeout: 20000
        },
    },
    //
    // Контракты отсюда: https://github.com/tonlabs/ton-contracts/tree/testing/solidity
    //
    contracts: {
        giver: require('./contracts/giver.json'), 
        integrationConfig: {
            ...require('./contracts/integrationConfigContract.js'),
            /*address: '0:fd9e546f99f14b3e430233ac970288e3da0c9f40afe7b959649c3add02c35bea',*/
            address: '0:a5855888aa9eff478421b04687702e661022f0c77f4b1fdc41218d3a96323945', // jessie
        },
        uTracking: require('./contracts/userTrackingContract.js'),
        scsc: require('./contracts/serviceSCardContract.js'),
        multisig: require('./contracts/multisig.json'),
    },

    nonce: '000000000000000000000000000000000000000000000000',
    errors: {
        E_NO_PROP: 'E_NO_PROP',
    },
}
const get = (target, prop) => target[prop] || (console.log(config.errors.E_NO_PROP, prop))
module.exports = config
//new Proxy(Object.freeze(config), { get })