import chalk from "chalk";
import type Node from "../node/node";
import type { PeerType } from "../types/peer.type";

export default function p2p_server(node: Node, port: number) {
    Bun.serve({
        port,
        async fetch(req) {
            if(req.method !== 'POST') {
                return new Response('RPC only supports POST requests ', { status: 405 });
            }

            const body: any = await req.json();

            try {
                switch(body.type) {
                    case 'newBlock': {
                        // add checks for block type
                        node.receive_block(body.block);
                        return Response.json({ ok: true });
                    }

                    case 'forwardTx': {
                        // add checks of tx type
                        node.receive_transaction(body.tx);
                        return Response.json({ ok: true });
                    }

                    case 'hello': {
                        const incoming_peer: PeerType = {
                            nodeId: body.nodeId,
                            rpc: body.rpc,
                            p2p: body.p2p,
                        }
                        node.on_peer_hello(incoming_peer);
                        const existing_peers = node.get_peers();

                        return Response.json({
                            ok: true, 
                            result: {
                                peers: existing_peers,
                            },
                        });
                    }
                    
                    case 'peers': {
                        node.merge_peers(body.peers);
                        return Response.json({ ok: true});
                    }

                    default:
                        return Response.json({ ok: false, err: "Unknown P2P message" });

                }
            } catch (error: any) {
                return Response.json({ ok: false, err: error.message });
            }
        }
    });
    console.log('P2P SERVER started at: ', chalk.magenta(port));
}
