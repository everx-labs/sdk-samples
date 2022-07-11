const EventEmitter = require("node:events")

const Events = Object.freeze({
    DATA: "data",
    ERROR: "error",
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBED: "unsubscribed",
    RECONNECTED: "reconnnected",
})

class Subscriber extends EventEmitter {
    constructor(client, query) {
        super()
        this._client = client
        this._query = query
        this._running = false
        this._busy = false
        this._handle = 0
    }

    async _callback(params, responseType) {
        if (responseType === 100) {
            if (params.result) {
                this.emit(Events.DATA, params.result)
            }
        } else {
            this.emit(Events.ERROR, params)
            /*
             * When the library has successfully reconnected the application
             * receives callback with responseType == 101 and params.code == 614
             */
            if (responseType !== 101 || params.code !== 614) {
                // Create new subscription
                if (!this._busy) {
                    this._busy = true
                    await this._unsubscribe()
                    await this._subscribe()
                    this._busy = false
                }
            }
            this.emit(Events.RECONNECTED)
        }
    }

    async _subscribe() {
        if (this._running) {
            const { handle } = await this._client.net.subscribe_collection(
                this._query,
                this._callback.bind(this)
            )
            this._handle = handle
        }
    }

    async _unsubscribe() {
        if (this._handle !== 0) {
            const handle = this._handle
            this._handle = 0
            await this._client.net.unsubscribe({ handle })
        }
    }
    async subscribe() {
        this._running = true
        await this._subscribe()
        this.emit(Events.SUBSCRIBED)
    }

    async unsubscribe() {
        this._running = false
        await this._unsubscribe()
        this.emit(Events.UNSUBSCRIBED)
    }
}

module.exports = { Subscriber, Events }
