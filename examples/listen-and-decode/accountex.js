const { TonClient, Account } = require("@tonclient/core");

class AccountEx extends Account {
    async subscribeAccount(result, listener) {
        await this.subscribe(
            "accounts",
            { id: { eq: await this.getAddress() } },
            result,
            listener
        );
    }

    async subscribeTransactions(result, listener) {
        const address = await this.getAddress();
        await this.subscribe(
            "transactions",
            {
                account_addr: { eq: address },
                status: { eq: 5 },
            },
            result,
            listener
        );
    }

    async subscribeMessages(result, listener) {
        const address = await this.getAddress();
        await this.subscribe(
            "messages",
            {
                status: { eq: 5 },
                src: { eq: address },
                OR: {
                    status: { eq: 5 },
                    dst: { eq: address }
                }
            },
            result,
            listener
        );
    }

    async decodeMessage(message) {
        return await TonClient.default.abi.decode_message({
            abi: this.abi,
            message,
        });
    }

    async decodeMessageBody(body, isInternal) {
        return await TonClient.default.abi.decode_message_body({
            abi: this.abi,
            body,
            is_internal: isInternal,
        });
    }

    async getBalance() {
        return (await this.getAccount()).balance;
    }

    async subscribe(collection, filter, result, listener) {
        const prevSubscription = this.subscriptions && this.subscriptions.get(collection);
        if (prevSubscription) {
            this.subscriptions.delete(collection);
            await TonClient.default.net.unsubscribe(prevSubscription);
        } else if (!this.subscriptions) {
            this.subscriptions = new Map();
        }
        const subscription = await TonClient.default.net.subscribe_collection({
            collection, filter, result
        }, ((params, responseType) => {
            if (responseType === 100) {
                listener(params.result);
            }
        }));
        this.subscriptions.set(collection, subscription);
    }

    async free() {
        if (this.subscriptions) {
            const subscriptions = this.subscriptions.values();
            this.subscriptions = null;
            for (const subscription of subscriptions) {
                await TonClient.default.net.unsubscribe(subscription);
            }
        }
        return super.free();
    }

}

module.exports.AccountEx = AccountEx;
