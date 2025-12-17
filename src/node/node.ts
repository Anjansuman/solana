import chalk from "chalk";
import type Account from "../Account/Account";
import type Blockchain from "../chain/blockchain";
import Runtime from "../runtime/runtime";
import type BlockType from "../types/block.type";
import type { ProgramType } from "../types/program.type";
import type { TransactionType } from "../types/transaction.type";
import type Block from "../block/block";
import type { PeerType } from "../types/peer.type";
import rpc_client from "../rpc/rpc.client";


export default class Node {

    private node_id: number;
    private peers: Map<number, PeerType>;

    private slot_duration: number;
    private current_slot: number;

    private mem_pool: TransactionType[];

    public account_store: Account;
    public blockchain: Blockchain;
    private block: Block;

    private program_registry: Map<string, ProgramType>; // address -> program
    private runtime: Runtime;

    // for now assume that only the 3 initial nodes can become the leader, later we'll add dynamic leaders based of nodes
    private validators: PeerType[];

    private syncing: boolean = false;
    private bootstrap_p2p?: string;

    constructor(config: any) {

        this.node_id = config.node_id;
        this.peers = new Map<number, PeerType>(); // start with some nodes eventually add more after starting

        // adding this node into the peer-list
        const rpc = `http://node${this.node_id}:${process.env.RPC_PORT}`;
        const p2p = `http://node${this.node_id}:${process.env.P2P_PORT}`;
        this.peers.set(this.node_id, {
            nodeId: this.node_id,
            rpc,
            p2p,
        });

        if(config.bootstrap_peer) {
            this.peers.set(config.bootstrap_peer.nodeId, config.bootstrap_peer);
        }
        
        this.validators = config.validators;

        this.slot_duration = config.slot_duration;
        this.current_slot = 0;

        this.mem_pool = [];

        this.account_store = config.account_store;
        this.blockchain = config.blockchain;
        this.block = config.block;
        this.bootstrap_p2p = config.bootstrap_p2p;

        // this should be fetched from other nodes
        this.program_registry = new Map<string, ProgramType>;
        this.runtime = new Runtime(
            this.account_store,
            this.program_registry,
            this.blockchain,
        );

    }

    public async start() {

        console.log(chalk.green(`NODE-${this.node_id}`), 'started');

        if(this.bootstrap_p2p) {
            await this.connect_to_bootstrap();
        }

        await this.sync_ledger();
        this.start_slot_clock();
    }

    private async connect_to_bootstrap() {
        try {

            let attempt = 0;

            while(attempt < 10) {

                try {
                    
                    console.log(chalk.green(`NODE-${this.node_id}`), 'connecting to bootstrap');

                    const res = await fetch(`${this.bootstrap_p2p}/p2p`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "hello",
                            nodeId: this.node_id,
                            rpc: `http://node${this.node_id}:${process.env.RPC_PORT}`,
                            p2p: `http://node${this.node_id}:${process.env.P2P_PORT}`,
                        }),
                    });

                    const data: any = await res.json();

                    if (data.ok) {
                        this.merge_peers(data.result.peers);
                        console.log(chalk.green('CONNECTED: '), `node-id ${this.node_id} connected to bootstrap`);
                        return;
                    }

                } catch (error: any) {
                    console.error(error.message);                    
                } finally {
                    console.log('attemp: ', attempt);
                    attempt++;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        } catch (error: any) {
            console.error(chalk.red('ERROR: '), `node-id: ${this.node_id} failed to bootstrap` + error.message);
        }
    }

    private async sync_ledger() {
        // make the syncing ledger true to not assign this node as a leader until syncing completes
        this.syncing = true;

        console.log(chalk.green(`NODE-${this.node_id}`), 'syncing ledger');

        while (this.peers.size <= 1) {
            console.log(`NODE-${this.node_id} waiting for peers...`);
            await new Promise(r => setTimeout(r, 1000));
        }


        const peer = this.pick_any_peer();

        const local_height = this.blockchain.chain.length - 1;
        const result = await rpc_client(peer.rpc).get_blocks_till_end(local_height + 1);
        const blocks: BlockType[] = result.blocks;

        for (const block of blocks) {

            if (!this.blockchain.is_valid_block(block)) {
                throw new Error(chalk.red('ERROR: ') + 'invalid block during sync');
            }

            for (const tx of block.transactions) {
                const result = this.runtime.execute_transaction(tx);
                if (!result.ok) {
                    throw new Error(chalk.red('ERROR: ') + 'invalid transaction during sync');
                }
            }

            this.blockchain.add_block(block);
        }

        this.syncing = false;
    }

    private start_slot_clock() {
        console.log('tick slot clock started');
        this.tick_slot();
        const slot_timer = setInterval(
            () => this.tick_slot(),
            this.slot_duration,
        );
    }

    private tick_slot() {
        if (this.syncing) {
            this.current_slot += 1;
            return;
        }

        if (this.is_leader(this.current_slot).ok) {
            this.produce_block();
        }
        this.current_slot += 1;
    }

    public receive_transaction(tx: TransactionType) {
        if (this.is_leader(this.current_slot).ok) {
            this.mem_pool.push(tx);
        } else {
            this.forward_to_leader(tx);
        }
    }

    private is_leader(slot: number): { ok: boolean, peer?: PeerType } {

        if (this.syncing) return { ok: false };

        const peer = this.validators[slot % this.validators.length];

        if (!peer) {
            console.log(chalk.red('ERROR: ') + 'Genesis block not found');
            return { ok: false };
        }

        if (peer.nodeId === this.node_id) return { ok: true, peer: peer };
        return { ok: false };

    }

    private produce_block() {
        if (this.mem_pool.length === 0) return;

        const block = this.create_block_from_last();

        for (const tx of this.mem_pool) {
            const result = this.runtime.execute_transaction(tx);
            if (result.ok) {
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

        if (!last_block) {
            throw new Error(chalk.red('Error: ') + 'genesis block missing');
        }
        return this.block.create(last_block);
    }

    private broadcast_block(block: BlockType) {
        console.log(chalk.yellow('Broadcast: '), block.index);
    }

    private forward_to_leader(tx: TransactionType) {
        const leader_id = this.is_leader(this.current_slot).peer?.nodeId;

        // 
        console.log(chalk.green('forwarding ' + this.node_id), ' tx to leader: ', leader_id);
    }

    public receive_block(block: BlockType) {

        // validate the txns inside the block here

        if (this.blockchain.is_valid_block(block)) {
            // add new block to the chain
            console.log(chalk.cyanBright('Block received: '), block.index);
        }
    }

    public get_peers() {
        const existing_peers = Array.from(this.peers.values());
        console.log('return peers: ', [...existing_peers.values().map(p => p.nodeId)]);
        return existing_peers;
    }

    public on_peer_hello(peer_info: PeerType): { ok: boolean, err?: string } {
        const adding_peer = this.add_peer(peer_info);
        if (adding_peer) return { ok: true };
        return { ok: false, err: `Peer with this node-id: ${peer_info.nodeId} already exists` };
    }

    public merge_peers(peer_list: PeerType[]) {
        for (const peer of peer_list) {
            this.add_peer(peer);
        }
    }

    private add_peer(peer_info: PeerType): boolean {
        if (this.peers.has(peer_info.nodeId)) return false;
        this.peers.set(peer_info.nodeId, peer_info);
        return true;
    }

    private pick_any_peer(): PeerType {
        const peer = this.peers.values().next().value;
        if (!peer) throw new Error(chalk.red('ERROR: ') + 'no peers found');
        return peer;
    }

}