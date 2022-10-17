pragma ton-solidity >= 0.59.0;
pragma AbiHeader time;
pragma AbiHeader expire;

abstract contract Upgradable {
	/*
     * Set code
     */

	function upgrade(TvmCell newcode) public virtual {
		require(msg.pubkey() == tvm.pubkey(), 101);
		tvm.accept();
		tvm.commit();
		tvm.setcode(newcode);
		tvm.setCurrentCode(newcode);
		onCodeUpgrade();
	}

	function onCodeUpgrade() internal virtual;
}

contract GiverV2 is Upgradable {

	modifier acceptOnlyOwner {
		require(msg.pubkey() == tvm.pubkey(), 101);
		tvm.accept();
		_;
	}

	/*
     * Publics
     */

	/// @notice Allows to accept simple transfers.
	receive() external {}

	/// @notice Transfers grams to other contracts.
	function sendTransaction(address dest, uint128 value, bool bounce) public {
		dest.transfer(value, bounce, 3);
	}

	/*
     * Privates
     */

	/// @notice Function with predefined name called after signature check. Used to
	/// implement custom replay protection with parallel access.
	function afterSignatureCheck(TvmSlice body, TvmCell /*message*/) private inline
	returns (TvmSlice)
	{
		// owner check
		require(msg.pubkey() == tvm.pubkey(), 101);
		// load and drop message timestamp (uint64)
		(, uint64 expireAt) = body.decode(uint64, uint32);
		require(expireAt > now, 57);
		tvm.accept();
		return body;
	}

	function onCodeUpgrade() internal override {}
}
