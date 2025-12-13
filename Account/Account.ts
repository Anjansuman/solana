import type AccountType from "../types/account.type";


export default class Account {

    private store: Map<string, AccountType>;

    constructor(initial_accounts?: Iterable<AccountType>) {
        this.store = new Map<string, AccountType>();
        if(initial_accounts) {
            for(const acc of initial_accounts) {
                this.store.set(acc.address, this.deep_clone_account(acc));
            }
        }
    }

    public get(address: string): AccountType | null {
        const acc = this.store.get(address);

        return acc ? this.deep_clone_account(acc) : null;
    }    

    public exists(address: string): boolean {
        return this.store.has(address);
    }

    public create(account: AccountType): boolean {
        if(this.exists(account.address)) return false;

        this.store.set(account.address, this.deep_clone_account(account));
        return true;
    }

    public set(account: AccountType): void {
        if(!this.store.has(account.address)) throw new Error(`can't update to an account which doesn't exist.`);

        this.store.set(account.address, this.deep_clone_account(account));
    }

    // this is used to return all the accounts related to a txn
    public load_accounts_snapshot(addresses: string[]): Map<string, AccountType> {
        const snapshot = new Map<string, AccountType>();
        for(const addr of addresses) {
            const acc = this.store.get(addr);

            if(!acc) throw new Error(`Account associated to ${addr} doesn't exist.`);

            snapshot.set(addr, this.deep_clone_account(acc));
        }

        return snapshot;
    }

    // this creates a commit out of the snapshot accounts
    public commit_snapshot(snapshot: Map<string, AccountType>): void {
        for(const [addr, acc] of snapshot) {
            // in future handle creation and updation differently with checks
            this.store.set(addr, this.deep_clone_account(acc));
        }
    }

    // this returns all the accounts available in account store for debugging
    public get_all(): AccountType[] {
        return Array.from(this.store.values().map(this.deep_clone_account));
    }

    // this helps to remove the actual Account and make a new one to restrict further changes to the stored account
    private deep_clone_account(acc: AccountType): AccountType {
        return {
            address: acc.address,
            lamports: acc.lamports,
            owner: acc.owner,
            data: new Uint8Array(acc.data),
            rentEpoch: acc.rentEpoch,
            executable: acc.executable,
        }
    }

}