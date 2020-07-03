pragma solidity >= 0.6.0;

contract HelloTON {
    // State variable storing the time of calling constructor or touch function
    uint timestamp;
    // Modifier that allows public function to accept all external calls.
    modifier alwaysAccept {
        // Runtime function that allows contract to process inbound messages spending
		// its own resources (it's necessary if contract should process all inbound messages,
		// not only those that carry value with them).
       tvm.accept();
      _;
    }
    // constructor adds current time to the state variable. All contracts need tvm.accept(); for deploy
    constructor() public {
        tvm.accept();
        timestamp = uint(now);
    }
   // function `touch` updates variable `timestamp`
    function touch() external alwaysAccept {
        timestamp = uint(now);
    }
   //Function returns value of state variable `timestamp`
    function sayHello() external view returns (uint) {
        return timestamp;
    }
}