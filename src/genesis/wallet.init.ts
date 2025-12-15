import Wallet from "../src/helpers/wallet";


export default function initialize_wallets(): { alice: Wallet, bob: Wallet } {

    return {
        alice: new Wallet(),
        bob: new Wallet(),
    };
}