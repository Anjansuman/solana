import type AccountType from "../types/account.type";


export default class Account {

    public readonly accounts: Map<string, AccountType[]>;

    constructor() {
        this.accounts = new Map<string, AccountType[]>();
    }

    public createAccount(): void {

    }

}