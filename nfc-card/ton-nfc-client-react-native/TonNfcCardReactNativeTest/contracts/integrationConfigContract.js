//
// This file was generated using TON Labs developer tools.
//

const abi = {
	"ABI version": 2,
	"header": ["time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "changeOwnerKey",
			"inputs": [
				{"name":"newOwnerKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "setAddress",
			"inputs": [
				{"name":"id","type":"uint16"},
				{"name":"addr","type":"address"}
			],
			"outputs": [
			]
		},
		{
			"name": "setKey",
			"inputs": [
				{"name":"id","type":"uint16"},
				{"name":"key","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "getPublicKey",
			"inputs": [
			],
			"outputs": [
				{"name":"publicKey","type":"uint256"}
			]
		},
		{
			"name": "getAddress",
			"inputs": [
				{"name":"id","type":"uint16"}
			],
			"outputs": [
				{"name":"addr","type":"address"}
			]
		},
		{
			"name": "getKey",
			"inputs": [
				{"name":"id","type":"uint16"}
			],
			"outputs": [
				{"name":"key","type":"uint256"}
			]
		}
	],
	"data": [
	],
	"events": [
	]
};

const pkg = {
    abi,
    imageBase64: 'te6ccgECHwEABVcAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAib/APSkICLAAZL0oOGK7VNYMPShBgQBCvSkIPShBQAAAgEgCQcBzv9/Ie1E0CDXScIBjhvT/9M/0wDT//QE9AX4bPhr+Gp/+GH4Zvhj+GKOIfQFcPhqbfhrbfhscAGAQPQO8r3XC//4YnD4Y3D4Zn/4YeLTAAGOEoECANcYIPkBWPhCIPhl+RDyqN7TPwEIAGqOHvhDIbkgnzAg+COBA+iogggbd0Cgud6S+GPggDTyNNjTHwH4I7zyudMfAfAB+EdukvI83gIBIBMKAgEgEAsCAUgPDAEJti1Xz+ANAfz4QW6OSe1E0CDXScIBjhvT/9M/0wDT//QE9AX4bPhr+Gp/+GH4Zvhj+GKOIfQFcPhqbfhrbfhscAGAQPQO8r3XC//4YnD4Y3D4Zn/4YeLe+Ebyc3H4ZtH4RSBukjBw3vhq+AD4QsjL//hDzws/+EbPCwD4SvhL+ExeIMv/9AAOABD0AMntVH/4ZwDttghtDH4QW6OHu1E0NP/0z/TANP/9AT0Bfhs+Gv4an/4Yfhm+GP4Yt7TD9P/0fhFIG6SMHDe+Eq68uBkIMMA8uBk+AD4TCIBIsjL/1mAEPRD+Gxb+ELIy//4Q88LP/hGzwsA+Er4S/hMXiDL//QA9ADJ7VR/+GeACASASEQD/uK4rkb8ILdHD3aiaGn/6Z/pgGn/+gJ6Avw2fDX8NT/8MPwzfDH8MW9ouHwlGJDgf8cRkehpgP0gGBjkZ8OQZ0AwZ6BnwOfA58mq4rkbEOeF/+S4/YBvGGB/xxB8IWRl//wh54Wf/CNnhYB8JXwl/CYvEGX/+gB6AGT2qm8//DPAA0bg0Ky5/CC3Rw92omhp/+mf6YBp//oCegL8Nnw1/DU//DD8M3wx/DFvaf/o/CKQN0kYOG98JV15cDIQYYB5cDJ8ABB8NRh8IWRl//wh54Wf/CNnhYB8JXwl/CYvEGX/+gB6AGT2qj/8M8AIBIBoUAgFuGBUBCbUMSdvAFgH6+EFujh7tRNDT/9M/0wDT//QE9AX4bPhr+Gp/+GH4Zvhj+GLe0w/6QNH4RSBukjBw3vhKuvLgZCCNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATHBbPy4Gf4APhLIgEiWYAQ9Bb4a1v4QsjL//hDzws/+EYXAC7PCwD4SvhL+ExeIMv/9AD0AMntVH/4ZwHTtHIBYnwgt0cPdqJoaf/pn+mAaf/6AnoC/DZ8Nfw1P/ww/DN8Mfwxb2mH6LgQ/CZACHoHSeuF/8i4cRiAmBDgf8cRkehpgP0gGBjkZ8OQZ0AwZ6BnwOfA58lxyAWJEOeF/+S4/YBvGGB/wBkATI4g+ELIy//4Q88LP/hGzwsA+Er4S/hMXiDL//QA9ADJ7VTef/hnAgEgHhsBCbj9ygrwHAH++EFujh7tRNDT/9M/0wDT//QE9AX4bPhr+Gp/+GH4Zvhj+GLe0w/RjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEIfhLgBD0Do4kjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE3zEBMCHA/x0AnI4iI9DTAfpAMDHIz4cgzoBgz0DPgc+Bz5JfuUFeIc8WyXH7AN4wwP+OIPhCyMv/+EPPCz/4Rs8LAPhK+Ev4TF4gy//0APQAye1U3n/4ZwBq3HAi0NYCMdIAMNwhxwCQ4CHXDR+S8jzhUxGQ4cEEIoIQ/////byxkvI84AHwAfhHbpLyPN4=',
};

class IntegrationConfigContract {
    /**
    * @param {TONClient} client
    * @param {string} address can be null if contract will be deployed
    * @param {TONKeyPairData} keys
    */
    constructor(client, address, keys) {
        this.client = client;
        this.address = address;
        this.keys = keys;
        this.package = pkg;
        this.abi = abi;
    }

    /**
     */
    async deploy() {
        if (!this.keys) {
            this.keys = await this.client.crypto.ed25519Keypair();
        }
        this.address = (await this.client.contracts.deploy({
            package: pkg,
            constructorParams: {},
            initParams: {},
            keyPair: this.keys,
        })).address;
    }

    /**
    * @param {string} functionName
    * @param {object} input
    * @return {Promise.<object>}
    */
    async run(functionName, input) {
        const result = await this.client.contracts.run({
            address: this.address,
            functionName,
            abi,
            input,
            keyPair: this.keys,
        });
        return result.output;
    }

   /**
    * @param {string} functionName
    * @param {object} input
    * @return {Promise.<object>}
    */
    async runLocal(functionName, input) {
        const result = await this.client.contracts.runLocal({
            address: this.address,
            functionName,
            abi,
            input,
            keyPair: this.keys,
        });
        return result.output;
    }

    /**
     * @param {object} params
     * @param {string} params.newOwnerKey (uint256)
     */
    changeOwnerKey(params) {
        return this.run('changeOwnerKey', params);
    }

    /**
     * @param {object} params
     * @param {string} params.newOwnerKey (uint256)
     */
    changeOwnerKeyLocal(params) {
        return this.runLocal('changeOwnerKey', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @param {string} params.addr (address)
     */
    setAddress(params) {
        return this.run('setAddress', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @param {string} params.addr (address)
     */
    setAddressLocal(params) {
        return this.runLocal('setAddress', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @param {string} params.key (uint256)
     */
    setKey(params) {
        return this.run('setKey', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @param {string} params.key (uint256)
     */
    setKeyLocal(params) {
        return this.runLocal('setKey', params);
    }

    /**
     * @typedef IntegrationConfigContract_getPublicKey
     * @type {object}
     * @property {string} publicKey  (uint256)
     */

    /**
     * @return {Promise.<IntegrationConfigContract_getPublicKey>}
     */
    getPublicKey() {
        return this.run('getPublicKey', {});
    }

    /**
     * @return {Promise.<IntegrationConfigContract_getPublicKey>}
     */
    getPublicKeyLocal() {
        return this.runLocal('getPublicKey', {});
    }

    /**
     * @typedef IntegrationConfigContract_getAddress
     * @type {object}
     * @property {string} addr  (address)
     */

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @return {Promise.<IntegrationConfigContract_getAddress>}
     */
    getAddress(params) {
        return this.run('getAddress', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @return {Promise.<IntegrationConfigContract_getAddress>}
     */
    getAddressLocal(params) {
        return this.runLocal('getAddress', params);
    }

    /**
     * @typedef IntegrationConfigContract_getKey
     * @type {object}
     * @property {string} key  (uint256)
     */

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @return {Promise.<IntegrationConfigContract_getKey>}
     */
    getKey(params) {
        return this.run('getKey', params);
    }

    /**
     * @param {object} params
     * @param {number} params.id (uint16)
     * @return {Promise.<IntegrationConfigContract_getKey>}
     */
    getKeyLocal(params) {
        return this.runLocal('getKey', params);
    }

}

IntegrationConfigContract.package = pkg;

module.exports = IntegrationConfigContract;
