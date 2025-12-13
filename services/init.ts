import type Account from "../Account/Account";
import Block from "../block/block";
import Blockchain from "../chain/blockchain";
import { initialize_programs } from "../genesis/programs.init";
import Runtime from "../runtime/runtime";

export let account: Account;
export let runtime: Runtime;
export let blockchain: Blockchain;
export let block: Block;

export default function init() {

    const init = initialize_programs();

    account = init.account;

    runtime = new Runtime(account, init.program_registry);

    blockchain = new Blockchain(3);
    block = new Block();

    console.log('init executed successfully');
}