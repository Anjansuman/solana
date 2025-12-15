import type BlockType from "../src/types/block.type";
import type TransactionType from "../src/types/transaction.type";


export default abstract class BlockchainShape {

    /**
     * this basically stores the chain of blocks
     * @type {BlockType[]}
     */
    public abstract readonly chain: BlockType[];

    /**
     * this stores a temp block which on filled get's appended to the chain
     * @type {BlockType}
     */
    protected abstract open_block: BlockType | null;

    /**
     * this stores how many txns does a block will contain
     * chain it in future to timestamp wise changing
     * @type {number}
     */
    public abstract readonly block_size: number;

    /**
     * this should be used to initialize a blockchain with txn capacity
     * @param {number} block_size 
     */
    constructor(block_size: number) {}

    /**
     * this adds a txn to the temp block
     * if the block gets filled, it seals the current block and creates a new temp block
     * @param {TransactionType} txn 
     * @returns {void}
     */
    public abstract add_transaction(txn: TransactionType): void;

    /**
     * this verifies whether a block is part of the chain or not
     * @param {BlockType} block 
     * @returns {boolean}
     */
    public abstract is_valid_block(block: BlockType): boolean;

    /**
     * this is to end the chain
     */
    public abstract finalize(): void;

    /**
     * this appends a block into the chain
     * @param {BlockType} block 
     * @returns {void}
     */
    protected abstract add_block(block: BlockType): void;

    /**
     * this seals a block to stop appending more txns to it
     * @param {BlockType} block 
     * @returns {void}
     */
    protected abstract seal_block(block: BlockType): void;

    /**
     * this hashes a block with all it's components
     * @param {BlockType} block 
     * @returns {string} hash
     */
    protected abstract block_hash(block: BlockType): string;
}