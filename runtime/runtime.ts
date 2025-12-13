import type Account from "../Account/Account";
import type { AccountMeta, ProgramContext } from "../types/program-context.type";
import type { ProgramType } from "../types/program.type";
import type { TransactionType } from "../types/transaction.type";


export default class Runtime {

    constructor(
        private account_store: Account,
        private program_registry: Map<string, ProgramType>,
    ) {}

    public execute_transaction(tx: TransactionType): { ok: boolean, err?: string } {

        if(!tx.accountMetas.length) return { ok: false, err: 'No account metas found' };
        if(!tx.instructions.length) return { ok: false, err: 'No instructions found' };

        const meta_map = new Map<string, AccountMeta>();
        const unique_addresses = new Set<string>();
        for(const meta of tx.accountMetas) {
            meta_map.set(meta.address, meta);
            unique_addresses.add(meta.address);
        }

        for(const ix of tx.instructions) {
            for(const addr of ix.accounts) unique_addresses.add(addr);
        }

        // get all the accounts associated to this transaction
        const snapshot = this.account_store.load_accounts_snapshot(
            [...unique_addresses]
        );

        // validate signers
        for(const meta of tx.accountMetas) {
            if(meta.isSigner && !tx.signatures.includes(meta.address)) {
                return { ok: false, err: `Missing required signature ${meta.address}` };
            }
        }

        // execution of each instruction
        for(const ix of tx.instructions) {
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
        return { ok: true };
    }

}