import chalk from "chalk";
import init, { blockchain, runtime } from "./services/init";
import Transaction from "./transaction/transaction";

init();


const tx = Transaction.transfer(
    'Alice',
    'Bob',
    100n,
    'GENESIS_HASH',
);

const result = runtime.execute_transaction(tx);

if(!result.ok) {
    console.log(chalk.red('tx failed: '), result.err);
    process.exit(1);
}

blockchain.add_transaction(tx);
blockchain.finalize();

console.log(chalk.blue('Alice: '), runtime['account_store'].get('Alice'));
console.log(chalk.blue('Bob: '), runtime['account_store'].get('Bob'));