# Message monitor sample

This example shows how to send a batch of messages to the blockchain, which is currently the most efficient way to send messages, and get their status.

For API documentation see: https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_processing#send_messages

## Use cases

1.  I want to send 100 messages at 10 messages per second and get their processing status AS SOON as possible.

2.  I want to send 100 messages at 10 messages per second and only get their status when ALL messages have been processed.

## Prerequisites

-   npm, node.js
-   Development Network HTTPS endpoint required as an argument to run the sample. Copy it from https://dashboard.evercloud.dev

## Run the sample

```
npm i
npm run message-monitor https:///devnet.evercloud.dev/<your_project_id>/graphql
```

## Sample output

```

2023-05-15T13:07:10.724Z Starting use case #1
2023-05-15T13:07:12.050Z 10 messages of 100 were sent
2023-05-15T13:07:13.215Z 20 messages of 100 were sent
----%<--------
2023-05-15T13:07:19.201Z Result: message processed in 7696 ms. Status: Finalized
2023-05-15T13:07:19.201Z Result: message processed in 7711 ms. Status: Finalized
2023-05-15T13:07:19.202Z Result: message processed in 7728 ms. Status: Finalized
----%<--------
2023-05-15T13:07:22.549Z 100 messages of 100 were sent
----%<--------
2023-05-15T13:07:31.133Z Result: message processed in 8692 ms. Status: Finalized
2023-05-15T13:07:31.133Z Result: message processed in 8697 ms. Status: Finalized
2023-05-15T13:07:31.133Z Result: message processed in 8736 ms. Status: Finalized
2023-05-15T13:07:31.133Z monitor_info { unresolved: 0, resolved: 0 }
2023-05-15T13:07:31.133Z End of use case #1, all results received

2023-05-15T13:07:31.133Z Starting use case #2
2023-05-15T13:07:31.275Z 10 messages of 100 were sent
2023-05-15T13:07:32.409Z 20 messages of 100 were sent
----%<--------
2023-05-15T13:07:41.569Z 100 messages of 100 were sent
2023-05-15T13:07:48.847Z Result: message processed in 17709 ms. Status: Finalized
----%<--------
2023-05-15T13:07:48.852Z Result: message processed in 7378 ms. Status: Finalized
2023-05-15T13:07:48.852Z End of use case #2, all results received
```

## Troubleshooting

-   All messages rejected. Check the balance of the test account deployed at
    [0:435fcf8a845e46a4c8184adbc9eb0fcede6667022de7ed2470a2f28846171e1c](https://net.ever.live/accounts/accountDetails?id=0:435fcf8a845e46a4c8184adbc9eb0fcede6667022de7ed2470a2f28846171e1c).\
    Use dashboard to topup this account in devnet
