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
class ShardIdent {

    /**
     *
     * @param {number} workchainId
     * @param {string} prefixBits
     * @return {ShardIdent}
     */
    constructor(workchainId, prefixBits) {
        this.workchainId = workchainId;
        this.prefixBits = prefixBits;
    }


    /**
     *
     * @param {string} s
     * @return {ShardIdent}
     */
    static parse(s) {
        const { workchainId, tail } = parseWorkchainIdPrefix(s);
        return new ShardIdent(workchainId, tail);
    }

    toString() {
        return `${this.workchainId}:${this.prefixBits}`;
    }

    clone() {
        return new ShardIdent(this.workchainId, this.prefixBits);
    }

    static fromDescr(descr) {
        return new ShardIdent(
            Number(descr.workchain_id),
            trimEndZeros(hexToBits(trimEndZeros(descr.shard))).slice(0, -1),
        );
    }

    /**
     *
     * @param address
     * @return {ShardIdent}
     */
    static fromAddress(address) {
        const { workchainId, tail } = parseWorkchainIdPrefix(address);
        const accountIdHead = tail.substr(0, 64 / 4 + 1);
        return new ShardIdent(
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
        return this.isParentOf(ShardIdent.fromAddress(address));
    }

    /**
     *
     * @param {ShardIdent} child
     * @return {boolean}
     */
    isParentOf(child) {
        return child.workchainId === this.workchainId
            && child.prefixBits.startsWith(this.prefixBits);
    }

    /**
     *
     * @param {ShardIdent} shard
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
    ShardIdent,
    parseWorkchainIdPrefix,
};
