import BlockShape from "../metadata/block.metadata";
import type BlockType from "../types/block.type";


export default class Block extends BlockShape {

    public create(prev_block?: BlockType): BlockType {

        const timestamp = new Date();
        
        // if prev block is not provided that means, starting of the chain
        const new_block: BlockType = {
            index: prev_block ? prev_block.index + 1 : 0,
            timestamp: timestamp,
            transactions: [],
            previousHash: prev_block ? prev_block.hash : '0',
            hash: '',
        };

        return new_block;

    }

    protected create_hash(input: string): string {
        return Bun.SHA256.hash(input, 'hex');
    }

}