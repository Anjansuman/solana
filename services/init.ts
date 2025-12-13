import type Account from "../Account/Account";
import Block from "../block/block";
import Blockchain from "../chain/blockchain";
import { initialize_programs } from "../genesis/programs.init";
import initialize_wallets from "../genesis/wallet.init";
import type Wallet from "../helpers/wallet";
import Runtime from "../runtime/runtime";

export let account: Account;
export let runtime: Runtime;
export let blockchain: Blockchain;
export let block: Block;
export let init_wallets: { alice: Wallet, bob: Wallet };

export default function init() {

    block = new Block();
    blockchain = new Blockchain(3);

    init_wallets = initialize_wallets();
    const init = initialize_programs(init_wallets.alice, init_wallets.bob);
    account = init.account;

    runtime = new Runtime(account, init.program_registry, blockchain);


    console.log('init executed successfully');
}