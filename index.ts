import chalk from "chalk";
import init, { blockchain, init_wallets, runtime } from "./services/init";
import Transaction from "./transaction/transaction";

init();


const tx = Transaction.create(
    init_wallets.alice,
    init_wallets.bob.public_key,
    100n,
    blockchain.get_recent_block_hash().hash!,
);

const result = runtime.execute_transaction(tx);

if(!result.ok) {
    console.log(chalk.red('tx failed: '), result.err);
    process.exit(1);
}

blockchain.add_transaction(tx);
blockchain.finalize();

console.log(chalk.blue('Alice: '), runtime['account_store'].get(init_wallets.alice.public_key));
console.log(chalk.blue('Bob: '), runtime['account_store'].get(init_wallets.bob.public_key));