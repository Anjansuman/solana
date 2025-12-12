import type AccountType from "./account.type"

// this is what solana uses in signing a txn
export type AccountMeta = {
    address: string,
    isWritable: boolean,
    isSigner: boolean,
}

// this is what a program will have context of what to call
export type ProgramContext = {

    // this contains all the accounts which will get affected in an txn
    accounts: Map<string, AccountType>, // address -> account

    // meta-data of the accounts
    metas: Map<string, AccountMeta>, // address -> account-meta

    // the program which will get invoked
    programId: string,

    // instructions to that invokation
    instructions: Uint8Array,

    // this can be used to store things like recent-block-hash, etc.
    extra?: Record<string, unknown>,
    
}