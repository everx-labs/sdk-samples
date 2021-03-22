pragma ton-solidity >= 0.38.2;
pragma AbiHeader expire;

contract HelloTON {
    // State variable storing the time of `constructor` call or `touch` function call
    uint timestamp;
    // Modifier that allows public function to accept all external calls.
    modifier alwaysAccept {
        // Runtime function that allows contract to process inbound messages spending
        // its own resources (it's necessary if contract should process all inbound messages,
        // not only those that carry value with them).
        tvm.accept();
        _;
    }
    // Constructor adds current time to the state variable. All contracts need tvm.accept(); for deploy
    constructor() public {
        tvm.accept();
        timestamp = uint(now);
    }
    // Function `touch` updates variable `timestamp`
    function touch() external alwaysAccept {
        timestamp = uint(now);
    }
    // Function returns value of state variable `timestamp`
    function getTimestamp() public view returns (uint) {
        return timestamp;
    }
}
