pragma ever-solidity >= 0.61.2;
pragma AbiHeader time;
pragma AbiHeader expire;

contract MyContract {

    uint8 constant MAX_CLEANUP_MSGS = 30;
    mapping(uint256 => uint32) m_messages;

    uint32 ts;

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
    function touch() public {
        ts =  block.timestamp;
        gc();
    }

    /*
     * Privates
     */

    /// @notice Function with predefined name called after signature check. Used to
    /// implement custom replay protection with parallel access.
    function afterSignatureCheck(TvmSlice body, TvmCell) private inline
    returns (TvmSlice)
    {
        // owner check
        require(msg.pubkey() == tvm.pubkey(), 101);
        uint256 bodyHash = tvm.hash(body);
        // load and drop message timestamp (uint64)
        (, uint32 expireAt) = body.decode(uint64, uint32);
        require(expireAt > block.timestamp, 57);
        require(!m_messages.exists(bodyHash), 102);

        tvm.accept();
        m_messages[bodyHash] = expireAt;

        return body;
    }

    /// @notice Allows to delete expired messages from dict.
    function gc() private inline {
        uint counter = 0;
        for ((uint256 bodyHash, uint32 expireAt) : m_messages) {
            if (counter >= MAX_CLEANUP_MSGS) {
                break;
            }
            counter++;
            if (expireAt <= block.timestamp) {
                delete m_messages[bodyHash];
            }
        }
    }

    /*
     * Get methods
     */
    struct Message {
        uint256 hash;
        uint32 expireAt;
    }
    function getMessages() public view returns (Message[] messages) {
        for ((uint256 msgHash, uint32 expireAt) : m_messages) {
            messages.push(Message(msgHash, expireAt));
        }
    }
}
