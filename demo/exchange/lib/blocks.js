const { SortDirection } = require("@tonclient/core");
const { ShardIdent } = require("./sharding");

/**
 *  @typedef {{
 *      id: string,
 *      workchain_id: string,
 *      shard: string,
 *      after_split: boolean,
 *      after_merge: boolean,
 *      prev_ref: {
 *          root_hash: string,
 *      },
 *      prev_alt_ref: {
 *          root_hash: string,
 *      },
 *      account_blocks: {
 *          account_addr: string,
 *          transactions: {
 *              transaction_id: string,
 *          }[],
 *      }[],
 *      master: {
 *          shard_hashes: {
 *              workchain_id: string,
 *              shard: string,
 *              descr: {
 *                  root_hash: string,
 *              },
 *          }[],
 *      },
 *  }} Block
 */


const BLOCK_TRAVERSE_FIELDS = `
    id
    workchain_id
    shard
    after_split
    after_merge
    prev_ref {
        root_hash
    }        
    prev_alt_ref {
        root_hash
    }
`;

const BLOCK_MASTER_FIELDS = `
    master { 
        shard_hashes { 
            workchain_id 
            shard descr { 
                root_hash 
            }
        }
    }
`;


const BLOCK_TRANSACTIONS_FIELDS = `
    account_blocks {
      account_addr
      transactions {
        transaction_id
      }
    }
`;


const NextLink = {
    ByBoth: 0,
    ByPrev: 1,
    ByPrevAlt: 2,
};

/**
 *  @typedef {{
 *      shard: ShardIdent
 *      blockId: string,
 *      nextLink: number,
 *  }} BranchIterator
 */

/**
 * @typedef {{
 *     blocks: Block[],
 *     branches: BranchIterator[],
 *     visitedMergeBlocks: Set<string>,
 * }} IteratorBuilder
 */

/**
 * @callback ItemFilter
 * @param {any} item
 * @return {boolean}
 */

/**
 *
 * @param {TonClient} client
 * @param {string} collection
 * @param {string[]} ids
 * @param {string} resultFields
 * @param {ItemFilter} [itemFilter]
 * @return {Promise<any[]>}
 */
async function queryByIds(client, collection, ids, resultFields, itemFilter) {
    const items = [];
    const tail = [...ids];
    while (tail.length > 0) {
        const head = tail.splice(0, 20);
        const portion = (await client.net.query_collection({
            collection,
            filter: { id: { in: head } },
            result: resultFields,
        })).result;
        if (itemFilter) {
            items.concat(portion.filter(itemFilter));
        } else {
            items.concat(portion);
        }
    }
    return items;
}

/**
 * @typedef {{
 *      fields: string,
 *      shardFilter: string,
 *      branches: {
 *          shard: string
 *          blockId: string,
 *          nextLink: number,
 *     }[],
 *     visitedMergeBlocks: string[],
 *     portion: string[],
 *     nextIndex: number,
 * }} BlockIteratorState
 */

/**
 * @property {TonClient} client
 * @property {string} fields
 * @property {ShardIdent} shardFilter

 * @property {BranchIterator[]} _branches
 * @property {Set.<string>} _visitedMergeBlocks
 * @property {Block[]} _portion
 * @property {number} _nextIndex
 */
class BlockIterator {
    static debugMode = false;
    static debugBlockLoaded = 0;

    /**
     *
     * @param {TonClient} client
     * @param {string} fields
     * @param {ShardIdent} shardFilter
     * @param {BranchIterator[]} branches
     * @param {Set.<string>} visitedMergeBlocks
     * @param {Block[]} portion
     * @param {number} nextIndex
     */
    constructor(
        client,
        fields,
        shardFilter,
        branches,
        visitedMergeBlocks,
        portion,
        nextIndex,
    ) {
        this.client = client;
        this.fields = fields;
        this.shardFilter = shardFilter;

        this._branches = branches;
        this._visitedMergeBlocks = visitedMergeBlocks;
        this._portion = portion;
        this._nextIndex = nextIndex;
    }

    /**
     *
     * @param {TonClient} client
     * @param {number} afterBlockTime
     * @param {ShardIdent} shardFilter
     * @param {string} fields
     * @return {Promise<BlockIterator>}
     */
    static async start(client, afterBlockTime, shardFilter, fields) {
        /** @type {Block} */
        const masterBlock = (await client.net.query_collection({
            collection: "blocks",
            filter: {
                workchain_id: { eq: -1 },
                gen_utime: { gt: afterBlockTime },
            },
            order: [{ path: "gen_utime", direction: SortDirection.ASC }],
            result: BLOCK_MASTER_FIELDS,
            limit: 1,
        })).result[0];
        /** @type {BranchIterator[]} */
        const branches = masterBlock.master.shard_hashes
            .map(x => ({
                shard: ShardIdent.fromDescr(x),
                blockId: x.descr.root_hash,
                nextLink: NextLink.ByBoth,
            }))
            .filter(x => shardFilter.isChildOrParentOf(x.shard));
        const portion = await BlockIterator._queryBlocks(
            client,
            branches.map(x => x.blockId),
            fields,
        );
        return new BlockIterator(
            client,
            fields,
            shardFilter,
            branches,
            new Set(),
            portion,
            0,
        );
    }

    /**
     * @param {TonClient} client
     * @param {BlockIteratorState} suspended
     * @return {Promise<BlockIterator>}
     */
    static async resume(client, suspended) {
        const portion = await BlockIterator._queryBlocks(
            client,
            suspended.portion,
            suspended.fields,
        );
        return new BlockIterator(
            client,
            suspended.fields,
            ShardIdent.parse(suspended.shardFilter),
            suspended.branches.map(x => ({
                shard: ShardIdent.parse(x.shard),
                blockId: x.blockId,
                nextLink: x.nextLink,
            })),
            new Set(suspended.visitedMergeBlocks),
            portion,
            suspended.nextIndex,
        );
    }

    /**
     * @return {BlockIterator}
     */
    clone() {
        return new BlockIterator(
            this.client,
            this.fields,
            this.shardFilter.clone(),
            this._branches.map(x => ({
                shard: x.shard.clone(),
                blockId: x.blockId,
                nextLink: x.nextLink,
            })),
            new Set(this._visitedMergeBlocks),
            this._portion.map(x => Object.assign({}, x)),
            this._nextIndex,
        );
    }

    /**
     *
     * @return {Promise<?Block>}
     */
    async next() {
        if (this._nextIndex >= this._portion.length) {
            await this._nextPortion();
        }
        if (this._nextIndex >= this._portion.length) {
            return null;
        }
        this._nextIndex += 1;
        return this._portion[this._nextIndex - 1];
    }

    /**
     * @return {BlockIteratorState}
     */
    suspend() {
        return {
            fields: this.fields,
            shardFilter: this.shardFilter.toString(),
            branches: this._branches.map(x => ({
                shard: x.shard.toString(),
                blockId: x.blockId,
                nextLink: x.nextLink,
            })),
            visitedMergeBlocks: [...this._visitedMergeBlocks],
            portion: this._portion.map(x => x.id),
            nextIndex: this._nextIndex,
        };
    }

    /**
     *
     * @param {Block} block
     * @return {boolean}
     */
    _wanted(block) {
        return this.shardFilter.isChildOrParentOf(ShardIdent.fromDescr(block));
    }

    /**
     * @param {TonClient} client
     * @param {string[]} blockIds
     * @param {string} fields
     * @return {Block[]}
     */
    static async _queryBlocks(client, blockIds, fields) {
        return queryByIds(client, "blocks", blockIds, `${BLOCK_TRAVERSE_FIELDS} ${fields}`);
    }

    async _nextPortion() {
        /** @type {IteratorBuilder} */
        const builder = {
            branches: [],
            blocks: [],
            visitedMergeBlocks: new Set(this._visitedMergeBlocks),
        };

        const nextBlocks = await this._queryNextBlocks(this._branches);

        for (const branch of this._branches) {
            /** @type {Block[]} */
            let next = nextBlocks.get(branch.blockId) || [];

            if (next.length === 0) {
                builder.branches.push(branch);
            } else if (next.length > 1) {
                this._splitToBoth(next, builder);
            } else if (next[0].after_merge) {
                this._mergeTo(next[0], builder);
            } else if (next[0].after_split) {
                this._splitToOne(branch, next[0], builder);
            } else {
                this._newWantedBranch(next[0], builder);
            }
        }
        if (BlockIterator.debugMode && nextBlocks.size > 0) {
            BlockIterator.debugBlockLoaded += nextBlocks.size;
            // console.log('>>>', `Load next blocks ${nextBlocks.size} [${[...nextBlocks.values()][0][0].id}, ...]`);
            process.stdout.write("🔗".repeat(nextBlocks.size));
        }
        this._branches = builder.branches;
        this._visitedMergeBlocks = builder.visitedMergeBlocks;
        this._portion = builder.blocks;
        this._nextIndex = 0;
    }

    /**
     * @param {BranchIterator[]} branches
     * @return {Promise<Map<string, Block[]>>}
     */
    async _queryNextBlocks(branches) {
        const branchIterator = [...branches];
        /** @type {Map.<string, Block[]>} */
        const nextBlocks = new Map();
        while (branchIterator.length > 0) {
            const portion = branchIterator.splice(0, 40);
            const portionBy = (l) => portion
                .filter(x => x.nextLink === NextLink.ByBoth || x === l)
                .map(x => x.blockId);
            const byPrevPortion = portionBy(NextLink.ByPrev);
            const byPrevAltPortion = portionBy(NextLink.ByPrevAlt);

            /** @type {Block[]} */
            const blocks = (await this.client.net.query_collection({
                collection: "blocks",
                filter: {
                    prev_ref: { root_hash: { in: byPrevPortion } },
                    OR: { prev_alt_ref: { root_hash: { in: byPrevAltPortion } } },
                },
                result: `${BLOCK_TRAVERSE_FIELDS} ${this.fields}`,
            })).result;
            blocks.forEach((block) => {
                const tryAdd = (prevId) => {
                    if (prevId) {
                        const existing = nextBlocks.get(prevId);
                        if (existing) {
                            existing.push(block);
                        } else {
                            nextBlocks.set(prevId, [block]);
                        }
                    }
                };
                tryAdd(block.prev_ref && block.prev_ref.root_hash);
                tryAdd(block.prev_alt_ref && block.prev_alt_ref.root_hash);
            });
        }
        return nextBlocks;
    }

    /**
     *
     * @param {Block} block
     * @param {IteratorBuilder} builder
     */
    _mergeTo(block, builder) {
        if (builder.visitedMergeBlocks.has(block.id)) {
            builder.visitedMergeBlocks.delete(block.id);
        } else {
            builder.visitedMergeBlocks.add(block.id);
            this._newWantedBranch(block, builder);
        }
    }

    /**
     *
     * @param {Block[]} blocks
     * @param {IteratorBuilder} builder
     */
    _splitToBoth(blocks, builder) {
        blocks.forEach((next) => {
            this._newWantedBranch(next, builder);
        });
    }

    /**
     *
     * @param {BranchIterator} branch
     * @param {Block} block
     * @param {IteratorBuilder} builder
     */
    _splitToOne(branch, block, builder) {
        this._newWantedBranch(block, builder);

        // Detect if we found it by prev_ref
        const traversedByPrev = block.prev_ref && block.prev_ref.root_hash === branch.blockId;

        // Continue waiting for second split branch and reduce traverse filter
        branch.nextLink = traversedByPrev ? NextLink.ByPrevAlt : NextLink.ByPrev;
        builder.branches.push(branch);
    }

    /**
     *
     * @param {Block} block
     * @param {IteratorBuilder} builder
     * @param {number} [nextLink]
     */
    _newWantedBranch(block, builder, nextLink) {
        if (this._wanted(block)) {
            builder.blocks.push(block);
            builder.branches.push({
                blockId: block.id,
                shard: ShardIdent.fromDescr(block),
                nextLink: nextLink || NextLink.ByBoth,
            });
        }
    }
}

module.exports = {
    queryByIds,
    BlockIterator,
    BLOCK_TRANSACTIONS_FIELDS,
};
