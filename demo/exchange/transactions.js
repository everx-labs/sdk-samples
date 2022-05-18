const TRANSACTION_FIELDS = `
    id
    account_addr
    now
    bounce { bounce_type }
    in_message { 
        value(format:DEC)
        id
        src
    } 
    out_messages {
        value(format:DEC)
        id
        dst
    }
    ext_in_msg_fee(format:DEC)
    storage{
        storage_fees_collected(format:DEC)
    }
    compute{
        gas_fees(format:DEC)
    }
    action{
        total_fwd_fees(format:DEC)
    }
`;

// This API has additional consistency checks to ensure consistent pagination, which can lead to additional delay
const queryAccouont = `query MyQuery($address: String!, $cursor: String, $count: Int, $seq_no: Int) {
    blockchain {
        account(address: $address){
            transactions(
                master_seq_no_range: {
                    start: $seq_no
                }
                first: $count
                after: $cursor
            ){
                edges{
                    node{
                        ${TRANSACTION_FIELDS}
                    }
                }
                pageInfo{
                    endCursor
                    hasNextPage
                }
            }
        }
    }
}`;

// This API has additional consistency checks to ensure consistent pagination, which can lead to additional delay
const queryAllBackward = `query MyQuery($cursor: String, $count: Int) {
    blockchain {
        transactions(
            last: $count
            before: $cursor
        ){
            edges{
                node{
                    ${TRANSACTION_FIELDS}
                }
            }
            pageInfo{
                startCursor
                hasPreviousPage
            }
        }
    }
}`;

async function internalQueryTransactions(client, variables) {
    const isAccount = "address" in variables;
    const query = isAccount ? queryAccouont : queryAllBackward;
    const response = await client.net.query({query, variables});
    return isAccount ?
        response.result.data.blockchain.account.transactions
        :
        response.result.data.blockchain.transactions;
}

module.exports = {
    internalQueryTransactions,
};
