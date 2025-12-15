import type BlockType from "../src/types/block.type";


export default abstract class BlockShape {

    /**
     * this creates and returns a block based on the prev block
     * but it doesn't seal the block, it gives empty hash, further after filling the txns the block get's sealed
     * @param {BlockType?} prev_block 
     * @returns {BlockType} the new block
     */
    public abstract create(prev_block?: BlockType): BlockType;

    /**
     * uses SHA-256 to hash the input provided
     * @param {string} input 
     * @returns {string} the hash of the input
     */
    protected abstract create_hash(input: string): string;

}