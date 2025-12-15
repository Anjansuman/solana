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

const node_configs: NodeConfigType = {
    node_id: NODE_ID,
    validators: [],
    slot_duration: 1000,
    account_store: account,
    blockchain: blockchain,
    block: block,
}

const node = new Node(node_configs);

rpc_server(node, RPC_PORT);
p2p_server(node, P2P_PORT);

await node.start();