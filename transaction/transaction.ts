import nacl from "tweetnacl";
import type Wallet from "../helpers/wallet";
import SystemProgram from "../SystemProgram/system_program";
import type { TransactionMessage, TransactionType } from "../src/types/transaction.type";


export default class Transaction {

    public static create(
        wallet: Wallet,
        to: string,
        amount: bigint,
        recent_blockhash: string,
    ): TransactionType {

        const message: TransactionMessage = {
            recentBlockhash: recent_blockhash,
            accountMetas: [
                { address: wallet.public_key, isSigner: true, isWritable: true },
                { address: to, isSigner: false, isWritable: true },
            ],
            instructions: [
                {
                    programId: SystemProgram.PROGRAM_ID,
                    accounts: [wallet.public_key, to],
                    data: this.encode_amount(amount),
                },
            ],
        };

        const signature = wallet.sign(this.serialize_message(message));

        const tx: TransactionType = {
            message: message,
            signatures: [
                { pubkey: wallet.public_key, signature: signature },
            ],
        };

        return tx;
    }

    public static encode_amount(amount: bigint): Uint8Array {
        // simple encoding for now
        // the json accepts a type created in transaction.type.ts
        return new TextEncoder().encode(
            JSON.stringify({ type: "transfer", amount: amount.toString() }),
        );
    }

    public static serialize_message(message: TransactionMessage): Uint8Array {
        return new TextEncoder().encode(
            JSON.stringify({
                recentBlockhash: message.recentBlockhash,
                accountMetas: message.accountMetas,
                instructions: message.instructions,
            }),
        );
    }

}