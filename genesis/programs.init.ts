import Account from "../Account/Account";
import type Wallet from "../helpers/wallet";
import SystemProgram from "../SystemProgram/system_program";
import type { ProgramType } from "../src/types/program.type";


export function initialize_programs(
    wallet_1: Wallet,
    wallet_2: Wallet
): {
    account: Account,
    program_registry: Map<string, ProgramType>
} {
    const account = new Account([
        {
            address: SystemProgram.PROGRAM_ID,
            lamports: 0n,
            owner: SystemProgram.PROGRAM_ID,
            data: new Uint8Array(),
            executable: true,
        },
        {
            address: wallet_1.public_key,
            lamports: 100000000n,
            owner: SystemProgram.PROGRAM_ID,
            data: new Uint8Array(),
            executable: false,
        },
        {
            address: wallet_2.public_key,
            lamports: 0n,
            owner: SystemProgram.PROGRAM_ID,
            data: new Uint8Array(),
            executable: false,
        },
    ]);

    const program_registry = new Map().set(SystemProgram.PROGRAM_ID, SystemProgram);

    return {
        account: account,
        program_registry: program_registry,
    };
}