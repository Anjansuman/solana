import Block from "../block/block";
import Blockchain from "../chain/blockchain";


export let blockchain: Blockchain;
export let block: Block;

export default function init() {

    blockchain = new Blockchain(3);
    block = new Block();

    console.log('init executed successfully');
}