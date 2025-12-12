import type AccountType from "../types/account.type";
import type { ProgramContext } from "../types/program-context.type";

export default class SystemProgram {

    public static readonly PROGRAM_ID = '11111111111111111111111111111111';

    public static create_account(
        ctx: ProgramContext,
        payer_address: string,
        new_account_address: string,
        lamports: bigint,
        space: number,
        owner: string,
    ): { ok: boolean, err?: string } {
        
        const payer = ctx.accounts.get(payer_address);
        const new_acc = ctx.accounts.get(new_account_address);

        const payer_meta = ctx.metas.get(payer_address);

        if(!payer) return { ok: false, err: 'Payer account is not present in the snapshot' };
        if(!payer_meta || !payer_meta.isSigner) return { ok: false, err: 'Payer needs to sign the txn' };
        if(!payer_meta.isWritable) return { ok: false, err: 'Payer must be writable to deduct lamports' };

        if(new_acc) return { ok: false, err: 'Account already exists' };

        if(lamports < 0) return { ok: false, err: 'Invalid lamports' };

        if(payer.lamports < lamports) return { ok: false, err: 'Insufficient lamports in payer' };

        const new_account: AccountType = {
            address: new_account_address,
            lamports: lamports,
            owner: owner,
            data: new Uint8Array(space),
            executable: false,
        };

        payer.lamports -= lamports;

        ctx.accounts.set(new_account_address, new_account);

        return { ok: true };
    }

    public static transfer(
        ctx: ProgramContext,
        from_address: string,
        to_address: string,
        amount: bigint,
    ): { ok: boolean, err?: string } {
        
        const from = ctx.accounts.get(from_address);
        const to = ctx.accounts.get(to_address);

        if(!from) return { ok: false, err: `Account associated with address ${from_address} not found in the snapshot` };
        if(!to) return { ok: false, err: `Account associated with address ${from_address} not found in the snapshot` };

        const from_meta = ctx.metas.get(from_address);
        const to_meta = ctx.metas.get(to_address);

        if(!from_meta || from_meta.isWritable) return { ok: false, err: `Address: ${from_address} must be writable` };
        if(!to_meta || to_meta.isWritable) return { ok: false, err: `Address: ${to_address} must be writable` };

        if(!from_meta.isSigner) return { ok: false, err: `Address: ${from_address} must be the signer` };

        if(amount <= 0) return { ok: false, err: 'Amount must be greater than 0' };

        if(from.lamports < amount) return { ok: false, err: 'Insufficient lamports' };

        from.lamports -= amount;

        to.lamports += amount;
        
        return { ok: true };
    }

    public static assign(
        ctx: ProgramContext,
        address: string,
        new_owner: string,
    ): { ok: boolean, err?: string } {

        const acc = ctx.accounts.get(address);
        if(!acc) return { ok: false, err: 'account not found in snapshot' };

        if(!ctx.metas.get(address)?.isWritable) return { ok: false, err: `account is not writable` };

        if(acc.owner !== SystemProgram.PROGRAM_ID) return { ok: false, err: 'Only System Program owned accounts can be re-assigned' };

        acc.owner = new_owner;

        return { ok: true };
    }

}