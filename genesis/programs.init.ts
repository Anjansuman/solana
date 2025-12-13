import Account from "../Account/Account";
import SystemProgram from "../SystemProgram/system_program";
import type { ProgramType } from "../types/program.type";


export function initialize_programs(): { account: Account, program_registry: Map<string, ProgramType> } {
    const account = new Account([
        {
            address: SystemProgram.PROGRAM_ID,
            lamports: 0n,
            owner: SystemProgram.PROGRAM_ID,
            data: new Uint8Array(),
            executable: true,
        },
        {
            address: 'Alice',
            lamports: 100000000n,
            owner: SystemProgram.PROGRAM_ID,
            data: new Uint8Array(),
            executable: false,
        },
        {
            address: 'Bob',
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