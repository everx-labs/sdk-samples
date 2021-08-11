const {
	contracts: { giver }
} = require('../config')

module.exports = netClient => async account => {
	try {
		process.stdout.write(`Sending grams from giver ${giver.address} to ${account}...`)
		const result = await netClient.contracts.run({
			address: giver.address,
			functionName: 'sendTransaction',
			abi: giver.package.abi,
			input: {
				dest: account,
				value: 5000000000,
				bounce: false
			},
			keyPair: giver.keyPair
		})
		console.log(' ✓')
		process.stdout.write(`Pending account ${account} replenishment...`)
		const wait = await netClient.queries.accounts.waitFor(
			{
				id: { eq: account },
				balance: { gt: '0' }
			},
			'id balance'
		)
		console.log(` ✓`)
		return account
	} catch (e) {
		console.log(e)
	}
}