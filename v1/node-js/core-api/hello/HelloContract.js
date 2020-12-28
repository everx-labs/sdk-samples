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
			"name": "touch",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "getTimestamp",
			"inputs": [
			],
			"outputs": [
				{"name":"value0","type":"uint256"}
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
    imageBase64: 'te6ccgECEgEAAisAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAib/APSkICLAAZL0oOGK7VNYMPShCAQBCvSkIPShBQIDzsAHBgAv12omhp/+mf6YBrhf/8NT/8MPwzfDH8MUAC/3whZGX//CHnhZ/8I2eFgHwlAOX/5PaqQCASALCQH+/38h7UTQINdJwgGOFNP/0z/TANcL//hqf/hh+Gb4Y/hijhv0BXD4anABgED0DvK91wv/+GJw+GNw+GZ/+GHi0wABn4ECANcYIPkBWPhC+RDyqN7TPwGOHvhDIbkgnzAg+COBA+iogggbd0Cgud6S+GPggDTyNNjTHwH4I7zyuQoAONMfIcEDIoIQ/////byxkvI84AHwAfhHbpLyPN4CASANDACzvUWq+f/CC3Rx52omgQa6ThAMcKaf/pn+mAa4X//DU//DD8M3wx/DFHDfoCuHw1OADAIHoHeV7rhf/8MTh8Mbh8Mz/8MPFvfCN5Obj8M2j8AHwR/DV4Ab/8M8AgEgDw4AL7tzEuRfhBbpLwBN7R+AD4I/hq8AN/+GeAIBIBEQAIO586yQfwgt0l4Am9o/CUQ4H/HEZHoaYD9IBgY5GfDkGdAMGegZ8DnwOfJPzrJBxDnhf/kuP2Abxhgf8l4Ae8//DPAAatxwItDWAjHSADDcIccAkOAh1w0fkvI84VMRkOHBAyKCEP////28sZLyPOAB8AH4R26S8jze',
};

class HelloContract {
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
     */
    touch() {
        return this.run('touch', {});
    }

    /**
     */
    touchLocal() {
        return this.runLocal('touch', {});
    }

    /**
     * @typedef HelloContract_getTimestamp
     * @type {object}
     * @property {string} value0  (uint256)
     */

    /**
     * @return {Promise.<HelloContract_getTimestamp>}
     */
    getTimestamp() {
        return this.run('getTimestamp', {});
    }

    /**
     * @return {Promise.<HelloContract_getTimestamp>}
     */
    getTimestampLocal() {
        return this.runLocal('getTimestamp', {});
    }

}

HelloContract.package = pkg;

module.exports = HelloContract;
