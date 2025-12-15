import chalk from "chalk";


export default function rpc_client(rpc_url: string) {
    async function call(method: string, params: any = {}) {
        const res = await Bun.fetch(rpc_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method,
                params,
            }),
        });

        const json: any = await res.json();
        if(!json.ok) {
            throw new Error(chalk.red('ERROR: ') + 'rpc ' + json.err);
        }

        return json.result;
    }

    return {
        get_latest_block_info: () => call("getLatestBlockInfo"),
        get_block_by_index: (index: number) => call('getBlock', index),
        get_blocks_till_end: (index: number) => call('getBlocksTillEnd', index),
    };
}