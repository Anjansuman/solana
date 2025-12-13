import nacl from "tweetnacl";
import type Account from "../Account/Account";
import Transaction from "../transaction/transaction";
import type { AccountMeta, ProgramContext } from "../types/program-context.type";
import type { ProgramType } from "../types/program.type";
import type { TransactionType } from "../types/transaction.type";
import bs58 from 'bs58';
import type Blockchain from "../chain/blockchain";
import crypto from "crypto";


export default class Runtime {

    constructor(
        private account_store: Account,
        private program_registry: Map<string, ProgramType>,
        private blockchain: Blockchain,
    ) {}

    public execute_transaction(tx: TransactionType): { ok: boolean, txid?: string, err?: string } {

        if(!this.blockchain.get_recent_block_hashes().includes(tx.message.recentBlockhash)) {
            return { ok: false, err: 'transaction block hash expired' };
        }

        if(!tx.message.accountMetas.length) return { ok: false, err: 'No account metas found' };
        if(!tx.message.instructions.length) return { ok: false, err: 'No instructions found' };

        const meta_map = new Map<string, AccountMeta>();
        const unique_addresses = new Set<string>();
        for(const meta of tx.message.accountMetas) {
            meta_map.set(meta.address, meta);
            unique_addresses.add(meta.address);
        }

        for(const ix of tx.message.instructions) {
            for(const addr of ix.accounts) unique_addresses.add(addr);
        }

        // get all the accounts associated to this transaction
        const snapshot = this.account_store.load_accounts_snapshot(
            [...unique_addresses]
        );

        // validate signers
        const message_bytes = Transaction.serialize_message(tx.message);

        for(const meta of tx.message.accountMetas) {
            if(!meta.isSigner) continue;

            const sig_entry = tx.signatures.find(s => s.pubkey === meta.address);
            if(!sig_entry) return { ok: false, err: `Missing signature for ${meta.address}` };

            const pubkey_bytes = bs58.decode(sig_entry.pubkey);

            const valid = nacl.sign.detached.verify(
                message_bytes,
                sig_entry.signature,
                pubkey_bytes,
            );

            if(!valid) return { ok: false, err: `Invalid signature for ${meta.address}` };
        }

        // execution of each instruction
        for(const ix of tx.message.instructions) {
            const program = this.program_registry.get(ix.programId);
            if(!program) return { ok: false, err: `Unknown program: ${ix.programId}` };

            const ctx: ProgramContext = {
                accounts: snapshot,
                metas: meta_map,
                programId: ix.programId,
                instructionData: ix.data,
            };

            const result = program.entry(ctx, ix);
            if(!result.ok) return result;
        }

        // now after success of every ixs, commit the changes
        this.account_store.commit_snapshot(snapshot);

        // create txn id
        const txid = crypto
            .createHash('sha256')
            .update(message_bytes)
            .update(Buffer.concat(tx.signatures.map(s => s.signature)))
            .digest('hex');

        return { ok: true, txid: txid };
    }

}