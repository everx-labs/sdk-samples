import { useState } from 'react';
import { TonClient, abiContract } from '@eversdk/core';
import { libWeb, libWebSetup } from '@eversdk/lib-web';
import { EverWalletAccount } from 'everscale-standalone-client';

export default function Home() {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(100000000); // initial value is 0.1 EVER || VENOM
  const [hash, setHash] = useState('');

  // TonClient
  libWebSetup({
    disableSeparateWorker: true,
  });
  TonClient.useBinaryLibrary(libWeb as any);

  const client = new TonClient({
    network: { endpoints: ['https://gql-testnet.venom.foundation/graphql'] },
  });

  // ABI
  const everWalletABI = {
    'ABI version': 2,
    version: '2.3',
    header: ['pubkey', 'time', 'expire'],
    functions: [
      {
        name: 'sendTransaction',
        inputs: [
          {
            name: 'dest',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint128',
          },
          {
            name: 'bounce',
            type: 'bool',
          },
          {
            name: 'flags',
            type: 'uint8',
          },
          {
            name: 'payload',
            type: 'cell',
          },
        ],
        outputs: [],
      },
      {
        name: 'sendTransactionRaw',
        inputs: [
          {
            name: 'flags',
            type: 'uint8',
          },
          {
            name: 'message',
            type: 'cell',
          },
        ],
        outputs: [],
      },
    ],
    data: [],
    events: [],
    fields: [
      {
        name: '_pubkey',
        type: 'uint256',
      },
      {
        name: '_timestamp',
        type: 'uint64',
      },
    ],
  };

  // Get your wallet address using your public key
  const genWalletAddress = async () => {
    const publicKey =
      'b303ef0dba533b0798eaa216c658cf975494331ebf0a999171be37f391c74d80';
    const account = await EverWalletAccount.fromPubkey({
      publicKey: publicKey,
      workchain: 0,
    });
    console.log(account.address);
  };

  // Please provide the wallet address of key pair mentioned below:
  // the token will transfer from this address to destination address
  const everWalletAddress =
    '0:4497ea5547b5bf7ef6a2f1407a53bc9655630496d790601f39f26fe58b5f006d';

  // Key pair or above wallet address.
  const keypair = {
    public: 'b303ef0dba533b0798eaa216c658cf975494331ebf0a999171be37f391c74d80', // YOUR_PUBLIC_KEY
    secret: '1891ef3a16e80e30d5eab93933a06d074764819651f3be9c460db4cb2754f73a', // YOUR_PRIVATE_KEY
  };

  //          or
  //      Generate using this new key pair

  // Generate an ed25519 key pair
  const genKeyPair = async () => {
    const walletKeys = await client.crypto.generate_random_sign_keys();
    console.log(walletKeys);
  };

  // encode message body by ever-wallet ABI
  const transfer = async () => {
    const body = (
      await client.abi.encode_message_body({
        address: everWalletAddress,
        abi: abiContract(everWalletABI),
        call_set: {
          function_name: 'sendTransaction',
          input: {
            dest: address, // destination wallet address fund will transfer to this wallet
            value: amount, // amount in units (nano) 1000000000 = 1 EVER | TON | VENOM
            bounce: false,
            flags: 3,
            payload: '',
          },
        },
        is_internal: false,
        signer: {
          type: 'Keys',
          keys: keypair,
        },
      })
    ).body;

    let transferMsg = await client.boc.encode_external_in_message({
      dst: everWalletAddress,
      body: body,
    });

    const sendRequestResult = await client.processing.send_message({
      message: transferMsg.message,
      send_events: false,
    });

    // Transaction will trigger
    const transaction = (
      await client.processing.wait_for_transaction(
        {
          abi: abiContract(everWalletABI),
          message: transferMsg.message,
          shard_block_id: sendRequestResult.shard_block_id,
          send_events: true,
        }
        // (tx_detail) => console.log(tx_detail)
      )
    ).transaction;
    setHash(transaction.id);
    console.log('Transaction hash', transaction.id);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Transfer-normal Client-Side
        </p>
      </div>
      <div className="flex flex-col items-center w-[588px] mt-[10%]">
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-black text-white focus:outline-none  mb-8"
          id="message"
          type="text"
          placeholder="Enter your destination address"
          onChange={(e) => setAddress(e.target.value)}
        />

        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-black text-white focus:outline-none  mb-8"
          id="message"
          type="text"
          placeholder="Enter the amount"
          // onChange={(e) => setAmount(e.target.value)}
          onChange={(e) => setAmount(parseInt(e.target.value))}
        />
        <button
          className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={transfer}
        >
          Transfer
        </button>
        <div className="mt-9">
          {hash && (
            <button
              onClick={() =>
                window.open(
                  `https://testnet.venomscan.com/transactions/${hash}`,
                  '_blank'
                )
              }
            >
              View on explorer
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
