import type BlockType from "../types/block.type";


export default class Block {

    public create(prevBlock?: BlockType) {

        const timestamp = new Date();
        const block_hash = prevBlock ? this.create_hash(prevBlock.hash + timestamp) : this.create_hash(timestamp.toString());
        
        // if prev block is not provided that means, starting of the chain
        const new_block: BlockType = {
            index: prevBlock ? prevBlock.index + 1 : 0,
            timestamp: timestamp,
            transactions: [],
            previousHash: prevBlock ? prevBlock.previousHash : '0',
            hash: 'to be filled',
        };

        return new_block;

    }

    private create_hash(input: string): string {
        return Bun.SHA256.hash(input, 'hex');
    }

}