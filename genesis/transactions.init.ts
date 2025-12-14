import chalk from "chalk";
import { blockchain, init_wallets, runtime } from "../services/init";
import Transaction from "../transaction/transaction";


export default function initialize_transaction() {
    for(let i = 0; i < 3; i++) {

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

        console.log(chalk.green('tx-id: '), result.txid);

        blockchain.add_transaction(tx);
    }
}