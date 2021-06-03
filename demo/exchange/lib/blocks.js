const { SortDirection } = require("@tonclient/core");
const { Shard } = require("./sharding");

/**
 *  @typedef {{
 *      id: string,
 *      gen_utime: number,
 *      workchain_id: number,
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
 *                  gen_utime: number,
 *                  root_hash: string,
 *              },
 *          }[],
 *      },
 *  }} Block
 */


const BLOCK_TRAVERSE_FIELDS = `
    id
    gen_utime
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
    gen_utime
    master { 
        shard_hashes { 
            workchain_id 
            shard descr { 
                gen_utime
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
 *      shard: Shard
 *      blockId: string,
 *      updateTime: number,
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
 *
 * @param {TonClient} client
 * @param {string} collection
 * @param {string[]} ids
 * @param {string} resultFields
 * @return {Promise<any[]>}
 */
async function queryByIds(client, collection, ids, resultFields) {
    const items = [];
    const tailIds = [...ids];
    while (tailIds.length > 0) {
        const headIds = tailIds.splice(0, 40);
        const headById = new Map();
        const queryQueue = new Set(headIds);
        while (queryQueue.size > 0) {
            const portion = (await client.net.query_collection({
                collection,
                filter: { id: { in: [...queryQueue] } },
                result: resultFields,
            })).result;
            for (const item of portion) {
                const id = item.id;
                queryQueue.delete(id);
                headById.set(id, item);
            }
        }
        headIds.forEach(x => items.push(headById.get(x)));
    }
    return items;
}

/**
 * @typedef {{
 *      filter: {
 *          shard: string,
 *          startBlockTime: number,
 *          endBlockTime: ?number,
 *          fields: string,
 *      },
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
 * @property {Shard} shard
 * @property {number} startBlockTime
 * @property {?number} endBlockTime
 * @property {string} fields
 */
class BlockFilter {
    /**
     * @property {Shard} shard
     * @property {number} startBlockTime
     * @property {?number} endBlockTime
     * @property {string} [fields]
     */
    constructor(shard, startBlockTime, endBlockTime, fields) {
        this.shard = shard;
        this.startBlockTime = startBlockTime;
        this.endBlockTime = endBlockTime;
        this.fields = fields || "";
    }

    /**
     * @param {number} time
     * @return {boolean}
     */
    matchEndTime(time) {
        return !this.endBlockTime || time < this.endBlockTime;
    }

    /**
     * @param {Shard} shard
     * @return {boolean}
     */
    matchShard(shard) {
        return this.shard.isChildOrParentOf(shard);
    }

    /**
     * @param {Block} block
     * @return {boolean}
     */
    isRequiredToTraverse(block) {
        return this.matchShard(Shard.fromDescr(block)) && this.matchEndTime(block.gen_utime);
    }

    /**
     * @param {Block} block
     * @return {boolean}
     */
    isRequiredToIterate(block) {
        const time = block.gen_utime;
        return this.matchShard(Shard.fromDescr(block))
            && (time >= this.startBlockTime)
            && this.matchEndTime(time);
    }
}

function getNowSeconds() {
    return Math.round(Date.now() / 1000);
}

/**
 * @property {TonClient} client
 * @property {BlockFilter} filter

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
     * @param {BlockFilter} filter
     * @param {BranchIterator[]} branches
     * @param {Set.<string>} visitedMergeBlocks
     * @param {Block[]} portion
     * @param {number} nextIndex
     */
    constructor(
        client,
        filter,
        branches,
        visitedMergeBlocks,
        portion,
        nextIndex,
    ) {
        this.client = client;
        this.filter = filter;

        this._branches = branches;
        this._visitedMergeBlocks = visitedMergeBlocks;
        this._portion = portion;
        this._nextIndex = nextIndex;
    }

    /**
     *
     * @param {TonClient} client
     * @param {BlockFilter} filter
     * @return {Promise<BlockIterator>}
     */
    static async start(client, filter) {
        /** @type {Block} */
        const masterBlock = (await client.net.query_collection({
            collection: "blocks",
            filter: {
                workchain_id: { eq: -1 },
                gen_utime: { le: filter.startBlockTime },
            },
            order: [{ path: "gen_utime", direction: SortDirection.DESC }],
            result: BLOCK_MASTER_FIELDS,
            limit: 1,
        })).result[0];
        const updateTime = getNowSeconds();
        /** @type {BranchIterator[]} */
        const branches = masterBlock.master.shard_hashes
            .map(x => ({
                shard: Shard.fromDescr(x),
                blockId: x.descr.root_hash,
                updateTime,
                nextLink: NextLink.ByBoth,
            }))
            .filter(x => filter.matchShard(x.shard));
        const branchesBlocks = await BlockIterator._queryBlocks(
            client,
            branches.map(x => x.blockId),
            filter.fields,
        );
        return new BlockIterator(
            client,
            filter,
            branches,
            new Set(),
            branchesBlocks.filter(x => filter.isRequiredToIterate(x)),
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
            suspended.filter.fields,
        );
        const updateTime = getNowSeconds();
        return new BlockIterator(
            client,
            new BlockFilter(
                Shard.parse(suspended.filter.shard),
                suspended.filter.startBlockTime,
                suspended.filter.endBlockTime,
                suspended.filter.fields,
            ),
            suspended.branches.map(x => ({
                shard: Shard.parse(x.shard),
                updateTime,
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
            this.filter,
            this._branches.map(x => ({
                shard: x.shard.clone(),
                blockId: x.blockId,
                updateTime: x.updateTime,
                nextLink: x.nextLink,
            })),
            new Set(this._visitedMergeBlocks),
            this._portion.map(x => Object.assign({}, x)),
            this._nextIndex,
        );
    }

    /**
     * @return {boolean}
     */
    eof() {
        return this._branches.length === 0 && this._nextIndex >= this._portion.length;
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
            filter: {
                shard: this.filter.shard.toString(),
                startBlockTime: this.filter.startBlockTime,
                endBlockTime: this.filter.endBlockTime,
                fields: this.filter.fields,
            },
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
     * @param {TonClient} client
     * @param {string[]} blockIds
     * @param {string} fields
     * @return {Block[]}
     */
    static async _queryBlocks(client, blockIds, fields) {
        return await queryByIds(client, "blocks", blockIds, `${BLOCK_TRAVERSE_FIELDS} ${fields}`);
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
                result: `${BLOCK_TRAVERSE_FIELDS} ${this.filter.fields}`,
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
        if (this.filter.isRequiredToTraverse(block)) {
            builder.branches.push({
                blockId: block.id,
                updateTime: getNowSeconds(),
                shard: Shard.fromDescr(block),
                nextLink: nextLink || NextLink.ByBoth,
            });
        }
        if (this.filter.isRequiredToIterate(block)) {
            builder.blocks.push(block);
        }
    }
}

module.exports = {
    queryByIds,
    BlockIterator,
    BlockFilter,
    BLOCK_TRANSACTIONS_FIELDS,
};
