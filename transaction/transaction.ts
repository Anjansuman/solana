import SystemProgram from "../SystemProgram/system_program";
import type { TransactionType } from "../types/transaction.type";


export default class Transaction {

    public static transfer(
        from: string,
        to: string,
        amount: bigint,
        recent_blockhash: string,
   ): TransactionType {
        return {
            signatures: [from], // for now mocking it
            accountMetas: [
                { address: from, isSigner: true, isWritable: true },
                { address: to, isSigner: false, isWritable: true },
            ],
            instructions: [
                {
                    programId: SystemProgram.PROGRAM_ID,
                    accounts: [from, to],
                    data: Transaction.encode_amount(amount),
                }
            ],
            recentBlockhash: recent_blockhash,
        }
    }

    public static encode_amount(amount: bigint): Uint8Array {
        // simple encoding for now
        // the json accepts a type created in transaction.type.ts
        return new TextEncoder().encode(
            JSON.stringify({ type: "transfer", amount: amount.toString() }),
        );
    }

}