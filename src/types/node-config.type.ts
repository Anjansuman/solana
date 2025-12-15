import type Account from "../Account/Account"
import type Block from "../block/block"
import type Blockchain from "../chain/blockchain"
import type { PeerType } from "./peer.type"
import type { ProgramType } from "./program.type"


export type NodeConfigType = {
    node_id: number,
    validators: PeerType[],
    slot_duration: number,
    account_store: Account,
    blockchain: Blockchain,
    block: Block,
    bootstrap_peer?: PeerType,
}