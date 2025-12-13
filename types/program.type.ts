import type { ProgramContext } from "./program-context.type"
import type { TransactionInstruction } from "./transaction.type"


export type ProgramType = {
    programId: string,
    entry(ctx: ProgramContext, ix: TransactionInstruction): { ok: boolean, err?: string },
}