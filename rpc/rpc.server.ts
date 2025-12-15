import chalk from "chalk";
import Node from "../node/node";


export default function rpc_server(node: Node, port: number) {

    Bun.serve({
        port,
        async fetch(req) {
            if(req.method !== 'POST') {
                return new Response('RPC only supports POST requests ', { status: 405 });
            }

            const body: any = await req.json();
            const { method, params } = body;

            try {
                switch(method) {
                    case 'sendTransaction': {
                        node.receive_transaction(params.tx);
                        return Response.json({ ok: true });
                    }

                    case 'getRecentBlockHash': {
                        const hash = node.blockchain.get_recent_block_hash();
                        return Response.json({
                            ok: true,
                            result: {
                                hash: hash,
                            },
                        });
                    }

                    case 'getBalance': {
                        const account = node.account_store.get(params.address);

                        if(!account) {
                            return Response.json({
                                ok: false,
                                err: 'Invalid account address',
                            });
                        }

                        return Response.json({
                            ok: true,
                            result: {
                                balance: account.lamports.toString(),
                            },
                        });
                    }

                    case 'getBlock': {
                        const block = node.blockchain.chain[params.index];
                        
                        if(!block) {
                            return Response.json({
                                ok: false,
                                err: 'Invalid block index',
                            });
                        }

                        return Response.json({
                            ok: true,
                            result: {
                                block: block,
                            },
                        });
                    }

                    case 'getLatestBlockInfo': {
                        const block = node.blockchain.chain.at(-1);
                        if(!block) {
                            return Response.json({ ok: false, err: 'Genesis block not found' });
                        }
                        return Response.json({
                            ok: true,
                            result: {
                                block: block,
                            },
                        })
                    }

                    case 'getBlocksTillEnd': {
                        const blocks = node.blockchain.chain.slice(params.index);
                        return Response.json({
                            ok: true,
                            result: {
                                blocks: blocks,
                            },
                        });
                    }

                    default:
                        return Response.json({
                            ok: false,
                            err: 'Unknown RPC method',
                        });
                }
            } catch (error: any) {
                return Response.json({
                    ok: false,
                    err: error.message,
                });
            }
        }
    });

    console.log('RPC SERVER started at: ', chalk.magenta(port));
}