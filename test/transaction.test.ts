import initialize_wallets from "../src/genesis/wallet.init";

async function transact() {

    // create wallets
    const { alice, bob } = initialize_wallets();


    // get recent block hash
    const res = await Bun.fetch('http://localhost:8899', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            method: 'getRecentBlockHash',
        }),
    });

    const data: any = await res.json();

    if(!data.ok) {
        console.log('get recent hash returned false');
        return;
    }

    const hash = data.result.hash;

    // create transaction

    // const res = await Bun.fetch('http://localhost:8899' {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
            
    //     }),
    // });

}

