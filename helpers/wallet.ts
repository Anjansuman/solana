import nacl from "tweetnacl";
import bs58 from "bs58";


export default class Wallet {
    public readonly public_key: string;
    private secret_key: Uint8Array;

    constructor() {
        const new_keypair = nacl.sign.keyPair();
        this.public_key = bs58.encode(new_keypair.publicKey);
        this.secret_key = new_keypair.secretKey;
    }

    sign(message: Uint8Array): Uint8Array {
        return nacl.sign.detached(message, this.secret_key);
    }

}