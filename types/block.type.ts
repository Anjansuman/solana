import type TransactionType from "./transaction.type";


export default interface BlockType {
    index: number,
    timestamp: Date,
    transactions: TransactionType[],
    previousHash: string,
    hash: string,
}