import type Account from "../Account/Account";
import type Block from "../block/block";
import type Blockchain from "../chain/blockchain";
import rpc_client from "../rpc/rpc.client";
import Runtime from "../runtime/runtime";
import type BlockType from "../types/block.type";
import type { NodeConfigType } from "../types/node-config.type";
import type { PeerType } from "../types/peer.type";
import type { ProgramType } from "../types/program.type";
import type { TransactionType } from "../types/transaction.type";


export default class Node {

    private peer_info: PeerType;
    private peers: Map<number, PeerType>; // node-id -> Peer

    private validators: number[];

    private program_registry: Map<string, ProgramType> // programId -> Program

    private mem_pool: TransactionType[];

    private slot_duration: number;
    private current_slot: number;

    public readonly account_store: Account;
    private block: Block;
    public readonly blockchain: Blockchain;
    private runtime: Runtime;

    private syncing: boolean = false;
    private bootstrap_p2p_url?: string;

    constructor(config: NodeConfigType) {

        this.peer_info = config.peer_info;
        this.peers = new Map<number, PeerType>;
        // setting this peers info to the peers list
        this.peers.set(this.peer_info.nodeId, this.peer_info);

        this.validators = config.validators;

        this.program_registry = new Map<string, ProgramType>();

        this.mem_pool = [];

        this.slot_duration = config.slot_duration;
        this.current_slot = 0;

        this.account_store = config.account_store;
        this.block = config.block;
        this.blockchain = config.blockchain;

        this.runtime = new Runtime(
            this.account_store,
            this.program_registry,
            this.blockchain,
        );

        this.syncing = false;

    }

    public async start() {
        if(this.bootstrap_p2p_url) {
            // get data from that node
            await this.connect_to_bootstrap(this.bootstrap_p2p_url);
        }
        // sync the ledger
        await this.sync_ledger();
        // start ticking
        this.start_slot_clock();
    }

    private async connect_to_bootstrap(bootstrap_p2p_url: string) {
        try {

            // have 10 attempts
            let attempt = 0;

            while(attempt < 10) {
                try {

                    const res = await fetch(`${bootstrap_p2p_url}`, {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: 'hello',
                            peer: this.peer_info,
                        }),
                    });
                    
                    const data: any = await res.json();

                    if(data.ok) {
                        // merge the peers
                        this.merge_peers(data.result.peers);
                        return;
                    }
                    
                } catch (error) {
                    console.error('attempt: ', attempt, ' failed');
                } finally {
                    attempt++;
                }
            }
            
        } catch (error: unknown) {
            this.handle_error(error, 'connect to bootstrap');
        }
    }
    
    private async sync_ledger() {
        try {
            
            this.syncing = true;

            // checking if the peer size increased
            while(this.peers.size <= 1) {
                await new Promise(r => setTimeout(r, 1000));
            }

            const random_peer = this.pick_random_peer();

            // calculate the local height of the chain
            const local_height = this.blockchain.chain.length - 1;

            const result = await rpc_client(random_peer.rpc).get_blocks_till_end(local_height);
            const new_blocks: BlockType[] = result.blocks;

            for(const block of new_blocks) {

                // check if the block is valid
                if(!this.blockchain.is_valid_block(block)) {
                    // don't add the block instead throw error
                    throw new Error('invalid block during sync');
                }
                
                // check if all txns inside the block are valid
                for(const txn of block.transactions) {
                    const result = this.runtime.execute_transaction(txn);
                    if(!result.ok) {
                        throw new Error('invalid transaction during sync');
                    }
                }
                
                // finally add the block to the chain
                this.blockchain.add_block(block);

            }
        } catch (error: unknown) {
            this.handle_error(error, 'sync ledger');
        } finally {
            this.syncing = false;
        }
    }

    private start_slot_clock() {
        this.tick_slot();
        setInterval(
            () => this.tick_slot(),
            this.slot_duration,
        );
    }
    
    public receive_transaction(tx: TransactionType) {
        console.log('transaction received');
        if(this.is_leader()) {
            this.mem_pool.push(tx);
        } else {
            this.forward_to_leader(tx);
        }
    }
    
    public receive_block(block: BlockType) {
        if(this.blockchain.is_valid_block(block)) {

            for(const txn of block.transactions) {
                const result = this.runtime.execute_transaction(txn);
                if(!result.ok) {
                    console.log('invalid txn found in the received block');
                    // add voting instead of returning
                    return;
                }
            }

            this.blockchain.seal_block(block);
            this.blockchain.add_block(block);

        }
    }
    
    public get_peers(): PeerType[] {
        const existing_peers = Array.from(this.peers.values())
        return existing_peers;
    }
    
    public on_peer_hello(peer_info: PeerType): { ok: boolean, err?: string } {
        const adding_peer = this.add_peer(peer_info);
        if(adding_peer) return { ok: true };
        return { ok: false, err: `Peer with this node-id: ${peer_info.nodeId} already existis` };
    }
    
    public merge_peers(peer_list: PeerType[]) {
        for(const peer of peer_list) {
            this.add_peer(peer);
        }
    }

    private tick_slot() {
        if(this.is_leader()) {
            // produce block
            this.produce_block();
        }
        this.current_slot += 1;
    }

    private is_leader(): boolean {
        try {
            // check this once, as this means if the node is syncing then don't make it the leader
            if(this.syncing) return false;

            const leading_node_id = this.validators[this.current_slot % this.validators.length];

            if(!leading_node_id) throw new Error('Genesis block not found');

            if(leading_node_id === this.peer_info.nodeId) return true;

        } catch (error: unknown) {
            this.handle_error(error, 'is leader');
        } finally {
            return false;
        }
    }

    private produce_block() {
        if(this.mem_pool.length === 0) return;

        const block = this.create_block_from_last();

        for(const txn of this.mem_pool) {
            const result = this.runtime.execute_transaction(txn);
            if(result.ok) {
                block.transactions.push(txn);
            }
        }

        this.blockchain.seal_block(block);
        this.blockchain.add_block(block);

        this.broadcast_block(block);
        this.mem_pool = [];
    }
    
    private broadcast_block(block: BlockType) {
        // handle broadcasting here
        console.log('broadcasting: ', block.index);
    }
    
    private forward_to_leader(tx: TransactionType) {
        // forward this txn to leader
        console.log('forwarding txn');
    }
    
    private create_block_from_last(): BlockType {
        try {
            
            const last_block = this.blockchain.chain.at(-1);

            if(!last_block) throw new Error('Genesis block not found');

            const new_block = this.block.create(last_block);

            return new_block;

        } catch (error: unknown) {
            this.handle_error(error, 'create block from last') 
            // this is not how you should handle the error
            return this.block.create();
        }
    }
    
    private pick_random_peer(): PeerType {
        const peer = this.peers.values().next().value;
        return peer ? peer : this.peer_info;
    }

    private add_peer(peer_info: PeerType): boolean {
        if(this.peers.has(peer_info.nodeId)) return false;
        this.peers.set(peer_info.nodeId, peer_info);
        return true;
    }

    private handle_error(
        error: unknown,
        coming_from: string,
    ) {
        console.error(`error in ${coming_from}: `, error instanceof Error ? error.message : 'unknown error');
    }

}