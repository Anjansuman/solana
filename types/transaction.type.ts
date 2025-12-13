import type { AccountMeta } from "./program-context.type"

export type TransactionInstruction = {
    programId: string,
    accounts: string[],
    data: Uint8Array,
}

export type TransactionType = {
    signatures: string[],
    accountMetas: AccountMeta[],
    instructions: TransactionInstruction[],
    recentBlockhash: string,
}

export type TransferType = 
| { type: 'transfer', amount: bigint };