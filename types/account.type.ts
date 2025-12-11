

export default interface AccountType {
    address: string,
    lamports: number, // should always be positive
    data: Uint8Array | string,
    owner: string,
    executable: boolean,
    rentEpoch?: string,
    isWritable?: boolean,
}