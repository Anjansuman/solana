import type { AccountMeta } from "./program-context.type"

export type SignatureEntry = {
    pubkey: string,
    signature: Uint8Array,
}

export type TransactionInstruction = {
    programId: string,
    accounts: string[],
    data: Uint8Array,
}

export type TransactionMessage = {
    recentBlockhash: string,
    accountMetas: AccountMeta[],
    instructions: TransactionInstruction[],
}

export type TransactionType = {
    message: TransactionMessage,
    signatures: SignatureEntry[],
}

export type _TransactionType = {
    signatures: string[],
    accountMetas: AccountMeta[],
    instructions: TransactionInstruction[],
    recentBlockhash: string,
}

export type TransferType = 
| { type: 'transfer', amount: bigint };