import type Account from "../Account/Account";
import type Block from "../block/block";
import type Blockchain from "../chain/blockchain";
import Runtime from "../runtime/runtime";
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

    private account_store: Account;
    private block: Block;
    private blockchain: Blockchain;
    private runtime: Runtime;

    constructor(config: NodeConfigType) {

        this.peer_info = config.peer_info;
        this.peers = new Map<number, PeerType>;

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

        this.start(config.bootstrap_p2p_url);
        
    }

    private start(bootstrap_p2p_url?: string) {

        if(bootstrap_p2p_url) {
            // get data from that node
        }

        // sync the ledger
        // start ticking
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
    
    private merge_peers(peer_list: PeerType[]) {
        for(const peer of peer_list) {
            this.add_peer(peer);
        }
    }

    private add_peer(peer_info: PeerType) {
        if(this.peers.has(peer_info.nodeId)) return;
        this.peers.set(peer_info.nodeId, peer_info);
    }

    private handle_error(
        error: unknown,
        coming_from: string,
    ) {
        console.error(`error in ${coming_from}: `, error instanceof Error ? error.message : 'unknown error');
    }

}