import { block } from "../services/init";
import type BlockType from "../types/block.type";
import type TransactionType from "../types/transaction.type";


export default class Blockchain {

    // in future update this into a linked-list
    public readonly chain: BlockType[] = [];

    // using this value to actually say how many txs will my block contain, later make this in time wise
    public readonly block_size: number = 0;

    constructor(block_size: number) {
        this.block_size = block_size;
    }
    
    public add_block(block: BlockType) {
        this.chain.push(block);
    }

    public add_transaction(transaction: TransactionType) {

        // get current block
        // check if the block have been filled
        // if filled create new block and push it in chain
        // else add the current transaction in the same block

        const current_block = this.chain[this.chain.length - 1];

        // this will hit if the blockchain have no blocks
        if(!current_block) {
            // create a block with the transaction and add it here
            const new_block = block.create();
            new_block.transactions.push(transaction);
            this.add_block(new_block);
            return;
        }
        
        // push the transaction to the block
        current_block.transactions.push(transaction);

        // if the transaction size is full then create new block and push it to the chain
        if(current_block.transactions.length === this.block_size) {

            // re-compute the hash of the current block
            const combined_data = '' + current_block.index + current_block.timestamp + current_block.previousHash + JSON.stringify(current_block.transactions);
            current_block.hash = Bun.SHA256.hash(combined_data, 'hex');

            const new_block = block.create(current_block);
            this.add_block(new_block);
        }

    }

}