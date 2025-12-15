import type AccountType from "../src/types/account.type";


export default abstract class AccountShape {

    /**
     * this actually stores all the accounts
     * @type {Map<string, AccountType>} account-address -> Account
     */
    public abstract readonly accounts: Map<string, AccountType>;

}