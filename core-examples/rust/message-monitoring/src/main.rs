use clap::{CommandFactory, Parser};
use serde_json::{from_value, json};
use std::{
    env,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::time::{sleep, Duration};
use ton_client::{
    abi::{encode_message, Abi, AbiContract, CallSet, ParamsOfEncodeMessage, Signer},
    crypto::{nacl_sign_keypair_from_secret_key, KeyPair, ParamsOfNaclSignKeyPairFromSecret},
    net::NetworkConfig,
    processing::{
        fetch_next_monitor_results, get_monitor_info, send_messages, MessageSendingParams, MonitorFetchWait, ParamsOfFetchNextMonitorResults,
        ParamsOfGetMonitorInfo, ParamsOfSendMessages,
    },
    ClientConfig, ClientContext,
};

#[derive(Parser, Debug)]
#[clap(version, about, long_about = None)]
struct Args {
    #[clap(long, short, action)]
    loop_nowait: bool,
    #[clap(long, short, action)]
    once_await: bool,
    #[clap(long, short, action)]
    await_all: bool,
    #[clap(long, short, default_value_t = 10)]
    message_count: u32,
    #[clap(long, short, default_value_t = 3)]
    wait_seconds: u32,
}

const LOOP_SLEEP_IN_SECONDS: u64 = 1;
const QUEUE: &str = "Foo";

#[tokio::main]
async fn main() {
    let args = Args::parse();
    if !args.await_all && !args.loop_nowait && !args.once_await {
        let mut cmd = Args::command();
        cmd.print_help().unwrap();
        std::process::exit(64);
    }
    let giver_abi = json!({
        "ABI version": 2,
        "header": ["time", "expire"],
        "functions": [
            {
                "name": "sendTransaction",
                "inputs": [
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
                "outputs": [],
            },
        ],
    });

    let network = match env::var("TON_NETWORK_ADDRESS") {
        Ok(val) => val,
        Err(_) => "http://localhost:4000/graphql".to_owned(), // gateway endpoint
    };
    let address = match env::var("TON_GIVER_ADDRESS") {
        Ok(val) => val,
        Err(_) => "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415".to_owned(),
    };
    let wait_until = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as u32
        + args.wait_seconds;

    println!("Message awaiting timeout {} sec.", args.wait_seconds);

    let context = Arc::new(
        ClientContext::new(ClientConfig {
            network: NetworkConfig {
                endpoints: Some(vec![network]),
                ..Default::default()
            },
            ..Default::default()
        })
        .unwrap(),
    );

    let mut giver_keys = match env::var("TON_GIVER_SECRET") {
        Ok(secret) => nacl_sign_keypair_from_secret_key(
            context.clone(),
            ParamsOfNaclSignKeyPairFromSecret { secret },
        )
        .unwrap(),
        Err(_) => KeyPair::new(
            "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16".to_owned(),
            "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3".to_owned(),
        ),
    };
    // The secret key is actually the concatenation of secret and public keys (128 symbols hex
    // string) by design of [NaCL](http://nacl.cr.yp.to/sign.html).
    giver_keys.secret.truncate(64);

    let mut messages = Vec::with_capacity(args.message_count as usize);

    for i in 0..args.message_count {
        let value: u64 = (i as u64 + 1) * 1_000_000_000;
        let msg = encode_message(
            context.clone(),
            ParamsOfEncodeMessage {
                abi: Abi::Contract(from_value::<AbiContract>(giver_abi.clone()).unwrap()),
                address: Some(address.clone()),
                call_set: CallSet::some_with_function_and_input(
                    "sendTransaction",
                    json!({
                        "dest": address,
                        "value": dbg!(value),
                        "bounce": false,
                    }),
                ),
                signer: Signer::Keys {
                    keys: giver_keys.clone(),
                },
                ..Default::default()
            },
        )
        .await
        .unwrap();
        dbg!(msg.message_id);
        messages.push(MessageSendingParams {
            boc: msg.message,
            wait_until,
            ..Default::default()
        });
    }

    let snd = send_messages(
        context.clone(),
        ParamsOfSendMessages {
            messages,
            monitor_queue: Some(QUEUE.to_owned()),
            ..Default::default()
        },
    )
    .await
    .unwrap();

    dbg!(snd.messages.len());

    if args.await_all {
        let fetch_res = fetch_next_monitor_results(
            context.clone(),
            ParamsOfFetchNextMonitorResults {
                queue: QUEUE.to_owned(),
                wait: Some(MonitorFetchWait::All),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        dbg!(fetch_res.results);
    }

    if args.once_await {
        let mut fetched_results = Vec::with_capacity(args.message_count as usize);

        loop {
            let fetch_res = fetch_next_monitor_results(
                context.clone(),
                ParamsOfFetchNextMonitorResults {
                    queue: QUEUE.to_owned(),
                    wait: Some(MonitorFetchWait::AtLeastOne),
                    ..Default::default()
                },
            )
            .await
            .unwrap();

            dbg!(fetch_res.results.len());

            // If monitor return empty results this indicates that all messages resolved and fetched
            if fetch_res.results.len() == 0 {
                break;
            }

            for item in fetch_res.results {
                fetched_results.push(item);
            }
        }
        dbg!(fetched_results);
    }

    if args.loop_nowait {
        let mut fetched_results = Vec::with_capacity(args.message_count as usize);

        loop {
            let fetch_res = fetch_next_monitor_results(
                context.clone(),
                ParamsOfFetchNextMonitorResults {
                    queue: QUEUE.to_owned(),
                    wait: Some(MonitorFetchWait::NoWait),
                    ..Default::default()
                },
            )
            .await
            .unwrap();

            dbg!(fetch_res.results.len());

            for item in fetch_res.results {
                fetched_results.push(item);
            }

            let monitor = get_monitor_info(
                context.clone(),
                ParamsOfGetMonitorInfo {
                    queue: QUEUE.to_owned(),
                },
            )
            .await
            .unwrap();

            if dbg!(monitor.unresolved) == 0 && dbg!(monitor.resolved) == 0 {
                // `unresolved` is the count of messages waiting to be resolved
                // `resolved` means the number of messages that have received status, but have not yet fetched
                break;
            }

            sleep(Duration::from_secs(LOOP_SLEEP_IN_SECONDS)).await;
        }
        dbg!(fetched_results);
    }

    println!("Done");
}
