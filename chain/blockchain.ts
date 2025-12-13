import BlockchainShape from "../metadata/blockchain.metadata";
import { block } from "../services/init";
import type BlockType from "../types/block.type";
import { type TransactionType } from "../types/transaction.type";


export default class Blockchain extends BlockchainShape {

    // in future update this into a linked-list
    public readonly chain: BlockType[] = [];

    // this acts as a temporary block which stores txns until it the block get's full and appended to the chain
    protected open_block: BlockType | null = null;

    // using this value to actually say how many txs will my block contain, later make this in time wise
    public readonly block_size: number = 0;

    constructor(block_size: number) {
        if(block_size <= 0) throw new Error('block size must be greater than 0');

        super(block_size);
        this.block_size = block_size;

        // create the genesis block
        const genesis = block.create(undefined);
        genesis.transactions = [];
        this.seal_block(genesis);
        this.chain.push(genesis);
    }

    public add_transaction(txn: TransactionType): void {

        // check if an open block exists
        if(!this.open_block) {
            const new_block = block.create(this.chain[this.chain.length - 1]);
            new_block.transactions.push(txn);
            this.open_block = new_block;
            return;
        }

        // push txns normally to the open block
        this.open_block.transactions.push(txn);

        // now check for the filling of block
        if(this.open_block.transactions.length === this.block_size) {
            // seal the block
            this.seal_block(this.open_block);

            this.add_block(this.open_block);
            this.open_block = null;
        }

    }

    public is_valid_block(block: BlockType): boolean {

        const block_index = this.chain.findIndex(b => b.hash === block.hash);

        if(block_index === -1) return false;

        // the block is genesis block
        if(block_index === 0) return true;

        const prev_block = this.chain[block_index - 1];

        if(!prev_block) return false;

        const block_hash = this.block_hash(block);

        if(
            prev_block.index + 1 === block.index &&
            prev_block.hash === block.previousHash &&
            prev_block.timestamp < block.timestamp &&
            block_hash === block.hash
        ) {
            return true;
        }

        return false;

    }

    public finalize() {
        if(this.open_block && this.open_block.transactions.length > 0) {
            this.seal_block(this.open_block);
            this.add_block(this.open_block);
            this.open_block = null;
        }
    }

    protected add_block(block: BlockType): void {
        this.chain.push(block);
    }

    protected seal_block(block: BlockType): void {

        // re-compute the hash of the current block
        block.hash = this.block_hash(block);
    }

    protected block_hash(block: BlockType): string {
        const combined_data = 
            '' +
            block.index +
            block.timestamp.toISOString() +
            block.previousHash +
            JSON.stringify(block.transactions);
        
        return Bun.SHA256.hash(combined_data, 'hex');
    }

    public get_recent_block_hashes(limit = 10): string[] {
        return this.chain.slice(-limit).map(block => block.hash);
    }

    public get_recent_block_hash(): { ok: boolean, hash?: string, err?: string } {
        const last_block = this.chain[this.chain.length - 1];
        if(!last_block) return { ok: false, err: `Unable to find last block` };

        return { ok: true, hash: last_block.hash };
    }

}