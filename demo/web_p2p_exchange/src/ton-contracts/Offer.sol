pragma ton-solidity >= 0.38.2;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

contract Offer {
    /*
     * ERROR CODES
     * 101 - Unauthorized
     * Contract specific (12X):
     * 120 - Public key required
     * 121 - Wallet address required
     * 122 - Deposit already paid
     * 123 - Insufficient deposit amount
     * 124 - Deposit not paid yet
     * 125 - Deposit is zero
     */

    uint256 m_moderPubkey = 0xa0aee23f3f4572fb9c664713e67f72fbbf1dcc72ca4891b9a0d07432aad83d8c; // must be hardcoded 

    uint256 m_depositAmount;  // in nanotokens
    uint16 m_fiatAmount;      // 50 
    bytes m_fiatCurrency;     // hex('EUR')
    bytes m_text;             // any text

    uint256 m_sellerPubkey;
    address m_sellerWallet;

    uint256 m_buyerPubkey; 
    address m_buyerWallet;

    uint64 m_sellerClaimsDiscardTs; // timestamp
    uint64 m_buyerClaimsTransferTs; // timestamp


    constructor( uint256 pubkey, address sellerWallet, uint16 amount, bytes currency, uint256 deposit, bytes text) public {
        require(pubkey != 0, 120);
        require(deposit != 0, 125);
        require(sellerWallet != address(0), 121);
        tvm.accept();

        m_sellerPubkey = pubkey;
        m_sellerWallet = sellerWallet;

        m_fiatAmount = amount;
        m_fiatCurrency = currency;
        m_depositAmount = deposit;
        m_text =  text;
    }

    // Seller can discard the offer if 
    // the deposit has not already been made,
    // otherwise flag will be set
    //
    function sellerDiscardsOffer() public {
        require(msg.pubkey() == m_sellerPubkey, 101);
        tvm.accept();
        if (m_buyerPubkey == 0) {  
            // Deposit not paid, discard the offer
            selfdestruct(m_sellerWallet);
        } else {
            // Deposit has been maid, just set flag
            m_sellerClaimsDiscardTs = now;
        }
    }
    
    // Seller can transfer tokens to the buyer wallet without any conditions 
    //
    function sellerDoesTransfer() public {
        require(msg.pubkey() == m_sellerPubkey, 101);
        require(m_buyerWallet != address(0), 121);
        tvm.accept();
        selfdestruct(m_buyerWallet);
    }


    function buyerPlacesDeposit( uint256 buyerPubkey ) public {
        require(buyerPubkey != 0,  120);  
        require(m_buyerPubkey == 0, 122); // Deposit is not paid yet
        require(msg.value >= m_depositAmount, 123);  
        tvm.accept();
        m_buyerPubkey = buyerPubkey;
        m_buyerWallet = msg.sender;
    }

    // Buyer can only inform that payment has been made
    //
    function buyerClaimsTransfer() public {
        require(msg.pubkey() == m_buyerPubkey, 101);
        tvm.accept();
        m_buyerClaimsTransferTs = now;
    }

    //  Buyer can discard the offer (and lose the deposit) without any conditions 
    //
    function buyerDiscardsOffer() public {
        require(msg.pubkey() == m_buyerPubkey, 101);
        tvm.accept();
        selfdestruct(m_sellerWallet);
    }

    // Moderator can make their own decision
    // flag = true - tokens is sending to Buyer
    // flag = false - tokens is sending to Seller
    //
    function moderatorDoesTransfer(bool flag) public {
        require(msg.pubkey() == m_moderPubkey, 101);
        require(m_buyerWallet != address(0),  124);
        tvm.accept();

        if (flag == true ) {
            selfdestruct(m_buyerWallet);
        } else {
            selfdestruct(m_sellerWallet);
        }
    }


    function getOfferState() public view returns (
            uint16 fiatAmount,     
            uint256 depositAmount, 
            bytes fiatCurrency,   
            bytes text,
            uint256 sellerPubkey,
            address sellerWallet,
            uint256 buyerPubkey, 
            address buyerWallet,
            uint64 sellerClaimsDiscardTs, 
            uint64 buyerClaimsTransferTs
    ) {
        fiatAmount = m_fiatAmount;     
        depositAmount = m_depositAmount; 
        fiatCurrency = m_fiatCurrency;   
        text = m_text;
        sellerPubkey = m_sellerPubkey;
        sellerWallet = m_sellerWallet;
        buyerPubkey = m_buyerPubkey; 
        buyerWallet = m_buyerWallet;
        sellerClaimsDiscardTs = m_sellerClaimsDiscardTs; 
        buyerClaimsTransferTs = m_buyerClaimsTransferTs;
    }
}
