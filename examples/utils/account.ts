import {
    signerNone,
    TonClient,
    accountForExecutorAccount,
    ParamsOfEncodeMessage,
    ResultOfProcessMessage,
    ResultOfRunExecutor,
    Signer,
    Abi,
    AbiContract,
    abiContract,
    ClientConfig,
    KeyPair,
    signerKeys,
} from "@tonclient/core";

/**
 * Options for an account instance
 */
export type AccountOptions = {
    /**
     * Initial data
     */
    initData?: object,
    /**
     * Default is `signerNone`
     */
    signer?: Signer,
    /**
     * If not specified will be calculated on contracts init state.
     */
    address?: string,
    /**
     * If not specified the Account.getDefaultClient() will be used.
     */
    client?: TonClient,
}

/**
 * Run options
 */
export type AccountRunOptions = {
    /**
     * Is not specified then this.signer
     */
    signer?: Signer,
}

/**
 * Run Local options
 */
export type AccountRunLocalOptions = {
    /**
     * If `true` then performs all checks and calculations as node do.
     * If `false` then simplified execution is used.
     */
    performAllChecks?: boolean,
}

/**
 * Object that can be used to send some value before
 * deploying account.
 */
export type AccountGiver = (address: string, value: number) => Promise<void>;

/**
 * Deploy options
 */
export type AccountDeployOptions = {
    /**
     * Function name that will be run on deploy. Special values:
     * - `undefined` (omitted): library will use `constructor` as a function name.
     * - `null`: library will not produce message body (no init function invocation).
     */
    initFunctionName?: string | null,
    /**
     * Parameters of init function.
     * Note: library ignores this parameter if `initFunctionName` is `null`.
     */
    initInput?: object,
    /**
     * Giver to be used to send amount of value to deploying address
     * before deploying.
     *
     * If `true` then Account.getDefaultGiver() will be used.
     * If omitted then application must prepay address
     * using own logic.
     */
    useGiver?: true | AccountGiver,
}

/**
 * Smart Contract
 *
 * This object contains information about smart contract class.
 */
export type Contract = {
    /**
     * ABI of smart contract
     */
    abi: AbiContract,
    /**
     * Compiled artifact of the smart contract.
     * This field contains BOC with code and initial data (init state).
     * If it is missing, then application can't deploy account of this contracts.
     */
    tvc?: string,
}

export class AccountError extends Error {
    static missingTVC(): AccountError {
        return new AccountError("Can't calculate deploy params: missing required TVC.");
    }
}

export class TonClientEx {
    private static _defaultConfig: ClientConfig = {
        network: {
            endpoints: ["main.ton.dev"],
        },
    };
    private static _default: TonClient | null = null;

    static useBinaryLibrary(lib: any) {
        TonClient.useBinaryLibrary(lib);
    }

    static set default(client: TonClient) {
        this._default = client;
    }

    static get default(): TonClient {
        if (this._default === null) {
            this._default = new TonClient(this._defaultConfig);
        }
        return this._default;
    }

    static set defaultConfig(config: ClientConfig) {
        this._defaultConfig = config;
    }

    static get defaultConfig(): ClientConfig {
        return this._defaultConfig;
    }

}

export class Account {
    private static _giver: AccountGiver | null = null;
    static set giver(giver: AccountGiver) {
        this._giver = giver;
    }

    private static createGiver(): AccountGiver {
        const giver = new Account(GiverContract, {
            client: TonClientEx.default,
            address: GiverContract.defaultAddress,
            signer: signerKeys(GiverContract.defaultKeys),
        });
        return async (address, value) => {
            await giver.run("sendTransaction", {
                dest: address,
                value,
                bounce: false,
            });
        };
    }

    static get giver(): AccountGiver {
        if (this._giver === null) {
            this._giver = this.createGiver();
        }
        return this._giver;
    }

    private readonly client: TonClient;
    private readonly abi: Abi;
    private readonly initData: object | null;
    private readonly signer: Signer;
    private address: string | null;
    private cachedBoc: string | null;

    constructor(
        private contract: Contract,
        options?: AccountOptions,
    ) {
        this.client = options?.client ?? TonClientEx.default;
        this.abi = abiContract(contract.abi);
        this.signer = options?.signer ?? signerNone();
        this.address = options?.address ?? null;
        this.initData = options?.initData ?? null;
        this.cachedBoc = null;
    }

    async getAddress(): Promise<string> {
        let address = this.address;
        if (address === null) {
            const deployParams = this.getParamsOfDeployMessage({
                initFunctionName: null,
            });
            address = (await this.client.abi.encode_message(deployParams)).address;
            this.address = address;
        }
        return address;
    }

    getParamsOfDeployMessage(
        options?: AccountDeployOptions,
    ): ParamsOfEncodeMessage {
        if (!this.contract.tvc) {
            throw AccountError.missingTVC();
        }
        const params: ParamsOfEncodeMessage = {
            abi: this.abi,
            signer: this.signer,
            deploy_set: {
                tvc: this.contract.tvc,
            },
        };
        if (this.initData) {
            (params.deploy_set as any).initial_data = this.initData;
        }
        if (options?.initFunctionName !== null) {
            params.call_set = {
                function_name: options?.initFunctionName ?? "constructor",
            };
            if (options?.initInput !== undefined) {
                params.call_set.input = options.initInput;

            }
        }
        return params;
    }

    /**
     * Deploys account into network
     * @param options
     */
    async deploy(options?: AccountDeployOptions): Promise<ResultOfProcessMessage> {
        const deployParams = this.getParamsOfDeployMessage(options);
        const useGiver = options?.useGiver;
        const giver = useGiver === true ? Account.giver : useGiver;
        this.address = (await this.client.abi.encode_message(deployParams)).address;
        if (giver) {
            await giver(this.address, 10_000_000_000);
        }
        return await this.client.processing.process_message({
            message_encode_params: deployParams,
            send_events: false,
        });
    }

    /**
     * Process message on network and returns detailed information
     * about results including produced transaction and messages.
     * @param functionName
     * @param input
     * @param options
     */
    async run(
        functionName: string,
        input: object,
        options?: AccountRunOptions,
    ): Promise<ResultOfProcessMessage> {
        return (await this.client.processing.process_message({
            message_encode_params: {
                address: await this.getAddress(),
                abi: this.abi,
                signer: options?.signer ?? this.signer,
                call_set: {
                    function_name: functionName,
                    input,
                },
            },
            send_events: false,
        }));
    }

    /**
     * Evaluates message on local TVM and returns decoded output
     * @param functionName
     * @param input
     * @param options
     */
    async runLocal(
        functionName: string,
        input: object,
        options?: AccountRunLocalOptions,
    ): Promise<ResultOfRunExecutor> {
        const message = await this.client.abi.encode_message({
            address: await this.getAddress(),
            abi: this.abi,
            signer: this.signer,
            call_set: {
                function_name: functionName,
                input,
            },
        });
        let result;
        if (options?.performAllChecks) {
            result = await this.client.tvm.run_executor({
                account: accountForExecutorAccount(await this.boc()),
                abi: this.abi,
                message: message.message,
                return_updated_account: true,
            });
        } else {
            result = (await this.client.tvm.run_tvm({
                account: await this.boc(),
                abi: this.abi,
                message: message.message,
                return_updated_account: true,
            }) as ResultOfRunExecutor);
        }
        if (result.account) {
            this.cachedBoc = result.account;
        }
        return result;
    }

    /**
     * Returns raw data of the account in form of BOC.
     */
    async boc(): Promise<string> {
        if (this.cachedBoc) {
            return this.cachedBoc;
        }
        const boc = (
            await this.client.net.wait_for_collection({
                collection: "accounts",
                filter: {id: {eq: this.address}},
                result: "boc",
                timeout: 1000,
            })
        ).result.boc;
        this.cachedBoc = boc;
        return boc;
    }

    /**
     * Drops all cached and local data.
     */
    refresh() {
        this.cachedBoc = null;
    }

    /**
     * Returns parsed data of the account.
     */
    async getAccount(): Promise<any> {
        return (
            await this.client.boc.parse_account({
                boc: await this.boc(),
            })
        ).parsed;
    }
}

const GiverContract: Contract & {
    defaultAddress: string,
    defaultKeys: KeyPair
} = {
    abi: {
        "ABI version": 2,
        header: ["time", "expire"],
        functions: [
            {
                name: "sendTransaction",
                inputs: [
                    {
                        "name": "dest",
                        "type": "address",
                    },
                    {
                        "name": "value",
                        "type": "uint128",
                    },
                    {
                        "name": "bounce",
                        "type": "bool",
                    },
                ],
                outputs: [],
            },
            {
                name: "getMessages",
                inputs: [],
                outputs: [
                    {
                        components: [
                            {
                                name: "hash",
                                type: "uint256",
                            },
                            {
                                name: "expireAt",
                                type: "uint64",
                            },
                        ],
                        name: "messages",
                        type: "tuple[]",
                    },
                ],
            },
            {
                name: "upgrade",
                inputs: [
                    {
                        name: "newcode",
                        type: "cell",
                    },
                ],
                outputs: [],
            },
            {
                name: "constructor",
                inputs: [],
                outputs: [],
            },
        ],
        data: [],
        events: [],
    },
    tvc: "",
    defaultAddress: "0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5",
    defaultKeys: {
        "public": "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
        "secret": "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
    },
};
