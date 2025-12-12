import Account from "../Account/Account";
import type AccountType from "../types/account.type";


export default class SystemProgram extends Account {

    public create_account(owner: string, address: string, balance: number): boolean {

        const account: AccountType = {
            address: address,
            lamports: 0,
            data: '',
            owner: owner,
            executable: false,
        };

        return super._create_account(account);

    }

    public transfer(
        from: string,
        to: string,
        amount: number,
    ) {
        
        // this is not the correct and secure way to take from address,
        // take user data, like req.user works in server

        if(!this.exists(from)) return false;
        if(!this.exists(to)) return false;

        const sender_account = this.accounts.get(from)!;
        const receiver_account = this.accounts.get(to)!;
        
        if(sender_account.owner !== from) return false;

        if(sender_account.lamports < amount) return false;

        // create a txn here
        
        sender_account.lamports -= amount;
        receiver_account.lamports += amount;

    }

    public change_ownership(
        address: string,
        to: string,
    ): boolean {

        if(!this.exists(address)) return false;
        if(!this.exists(to)) return false;

        const account = this.accounts.get(address);

        
    }

}