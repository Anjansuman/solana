import chalk from "chalk";
import type Account from "../Account/Account";
import type Blockchain from "../chain/blockchain";
import Runtime from "../runtime/runtime";
import type BlockType from "../types/block.type";
import type { ProgramType } from "../types/program.type";
import type { TransactionType } from "../types/transaction.type";
import type Block from "../block/block";


export default class Node {

    private node_id: number;
    private total_nodes: number;

    private slot_duration: number;
    private slot_timer: NodeJS.Timeout;
    private current_slot: number;

    private mem_pool: TransactionType[];

    public account_store: Account;
    public blockchain: Blockchain;
    private block: Block;

    private program_registry: Map<string, ProgramType>; // address -> program
    private runtime: Runtime;


    constructor(config: any) {

        this.node_id = config.node_id;
        this.total_nodes = config.total_nodes;

        this.slot_duration = config.slot_duration;
        this.current_slot = config.current_slot;

        this.mem_pool = config.mem_pool;

        this.account_store = config.account_store;
        this.blockchain = config.blockchain;
        this.block = config.block;

        this.program_registry = config.program_registry;
        this.runtime = new Runtime(
            this.account_store,
            this.program_registry,
            this.blockchain,
        );

    }

    public start() {
        this.tick_slot();
        this.slot_timer = setInterval(
            () => this.tick_slot(),
            this.slot_duration,
        );
    }

    private tick_slot() {
        if(this.is_leader(this.current_slot)) {
            this.produce_block();
        }
        this.current_slot += 1;
    }

    public receive_transaction(tx: TransactionType) {
        if(this.is_leader(this.current_slot)) {
            this.mem_pool.push(tx);
        } else {
            this.forward_to_leader(tx);
        }
    }

    private is_leader(slot: number) {
        return (slot % this.total_nodes) === this.node_id;
    }

    private produce_block() {
        if(this.mem_pool.length === 0) return;

        const block = this.create_block_from_last();

        for(const tx of this.mem_pool) {
            const result = this.runtime.execute_transaction(tx);
            if(result.ok) {
                block.transactions.push(tx);
            }
        }

        this.blockchain.seal_block(block);
        this.blockchain.add_block(block);

        this.broadcast_block(block);
        this.mem_pool = [];
    }

    private create_block_from_last() {
        const last_block = this.blockchain.chain.at(-1);

        if(!last_block) {
            throw new Error(chalk.red('Error: ') + 'genesis block missing');
        }
        return this.block.create(last_block);
    }

    private broadcast_block(block: BlockType) {
        console.log(chalk.yellow('Broadcast: '), block.index);
    }

    private forward_to_leader(tx: TransactionType) {
        const leader_id = this.current_slot % this.total_nodes;

        // 
        console.log(chalk.green('forwarding ' + this.node_id), ' tx to leader: ', leader_id);
    }

    public receive_block(block: BlockType) {

        // validate the txns inside the block here

        if(this.blockchain.is_valid_block(block)) {
            // add new block to the chain
            console.log(chalk.cyanBright('Block received: '), block.index);
        }
    }

}