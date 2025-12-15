

export default interface AccountType {
    address: string,
    lamports: bigint, // should always be positive
    owner: string,
    data: Uint8Array,
    executable: boolean,
    rentEpoch?: string,
    isWritable?: boolean,
}