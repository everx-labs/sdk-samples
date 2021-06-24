/**
 *  @typedef {{
 *      workchain_id: string,
 *      shard: string,
 *  }} ShardDescr
 */

/**
 *
 * @param {string} s
 * @return {string}
 */
function trimEndZeros(s) {
    let len = s.length;
    while (len > 0 && s[len - 1] === "0") {
        len -= 1;
    }
    return s.substr(0, len);
}

/**
 *
 * @param {string} hex
 * @return {string}
 */
function hexToBits(hex) {
    let bits = "";
    for (let i = 0; i < hex.length; i += 1) {
        bits += Number.parseInt(hex[i], 16).toString(2).padStart(4, "0");
    }
    return bits;
}

/**
 *
 * @param {string} s
 * @return {{
 *      workchainId: number,
 *      tail: string,
 * }}
 */
function parseWorkchainIdPrefix(s) {
    const colonIndex = s.indexOf(":");
    return {
        workchainId: colonIndex >= 0 ? Number(s.substr(0, colonIndex)) : 0,
        tail: colonIndex >= 0 ? s.substr(colonIndex + 1) : s,
    };
}

/**
 * @property {number} workchainId
 * @property {string} prefixBits
 */
class Shard {

    /**
     *
     * @param {number} workchainId
     * @param {string} prefixBits
     * @return {Shard}
     */
    constructor(workchainId, prefixBits) {
        this.workchainId = workchainId;
        this.prefixBits = prefixBits;
    }


    static zero() {
        return new Shard(0, "");
    }

    /**
     *
     * @param {string} s
     * @return {Shard}
     */
    static parse(s) {
        const { workchainId, tail } = parseWorkchainIdPrefix(s);
        return new Shard(workchainId, tail);
    }

    toString() {
        return `${this.workchainId}:${this.prefixBits}`;
    }

    clone() {
        return new Shard(this.workchainId, this.prefixBits);
    }

    static fromDescr(descr) {
        return new Shard(
            Number(descr.workchain_id),
            trimEndZeros(hexToBits(descr.shard.padStart(16, "0"))).slice(0, -1),
        );
    }

    /**
     *
     * @param address
     * @return {Shard}
     */
    static fromAddress(address) {
        const { workchainId, tail } = parseWorkchainIdPrefix(address);
        const accountIdHead = tail.substr(0, 16);
        return new Shard(
            workchainId,
            hexToBits(accountIdHead).substr(0, 64),
        );
    }

    /**
     *
     * @param {string} address
     * @return {boolean}
     */
    containsAddress(address) {
        return this.isParentOf(Shard.fromAddress(address));
    }

    /**
     *
     * @param {Shard} child
     * @return {boolean}
     */
    isParentOf(child) {
        return child.workchainId === this.workchainId
            && child.prefixBits.startsWith(this.prefixBits);
    }

    /**
     *
     * @param {Shard} shard
     * @return {boolean}
     */
    isChildOrParentOf(shard) {
        return shard.workchainId === this.workchainId
            && (
                shard.prefixBits.startsWith(this.prefixBits)
                || this.prefixBits.startsWith(shard.prefixBits)
            );
    }
}

module.exports = {
    Shard,
    parseWorkchainIdPrefix,
};
