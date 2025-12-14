import chalk from "chalk";
import init, { blockchain, init_wallets, runtime } from "./services/init";
import Transaction from "./transaction/transaction";
import initialize_transaction from "./genesis/transactions.init";

init();

initialize_transaction();

blockchain.finalize();

console.log(chalk.blue('Alice: '), runtime['account_store'].get(init_wallets.alice.public_key));
console.log(chalk.blue('Bob: '), runtime['account_store'].get(init_wallets.bob.public_key));