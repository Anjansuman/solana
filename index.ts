import init, { account, block, blockchain } from "./src/services/init";
import Node from "./src/node/node";
import p2p_server from "./src/p2p/p2p.server";
import rpc_server from "./src/rpc/rpc.server";
import type { NodeConfigType } from "./src/types/node-config.type";

init();

// blockchain.finalize();

const NODE_ID = Number(process.env.NODE_ID);
const RPC_PORT = Number(process.env.RPC_PORT);
const P2P_PORT = Number(process.env.P2P_PORT);
const BOOTSTRAP_P2P = process.env.BOOTSTRAP_P2P;

const node_configs: NodeConfigType = {
    peer_info: {
        nodeId: NODE_ID,
        rpc: `http://node${NODE_ID}:${RPC_PORT}`,
        p2p: `http://node${NODE_ID}:${P2P_PORT}`,
    },
    validators: [
        { nodeId: 0, rpc: '8899', p2p: '9000' },
        { nodeId: 1, rpc: '8898', p2p: '9001' },
        { nodeId: 2, rpc: '8897', p2p: '9002' },
    ],
    slot_duration: 1000,
    account_store: account,
    blockchain: blockchain,
    block: block,
    bootstrap_p2p: BOOTSTRAP_P2P,
}

const node = new Node(node_configs);

rpc_server(node, RPC_PORT);
p2p_server(node, P2P_PORT);

await node.start();