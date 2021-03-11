import * as fs from "fs";
import * as path from "path";
import {Contract} from "@tonclient/core";

export function loadContract(relativePath: string): Contract {
    function load(suffix: string): Buffer {
        return fs.readFileSync(
            path.resolve(__dirname, "../../ton-labs-contracts", `${relativePath}${suffix}`),
        );
    }

    return {
        // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
        abi: JSON.parse(load(".abi.json").toString()),
        // Compiled smart contract file.
        tvc: load(".tvc").toString("base64"),
    };

}
