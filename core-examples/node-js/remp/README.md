# REMP events

REMP events inform you about the progress of your message processing and
can predict with a high probability whether your message will be processed successfully.

## Before running the example

-   Create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev) if you don't have one.
-   Remember its Development Network HTTPS endpoint.
-   Pass this endpoint as a parameter when running the example.

## Install packages & run:

```sh
npm i
node index.js <HTTPS_DEVNET_ENDPOINT>
```

## Expected output

```
node index.js https://devnet.evercloud.dev/your-project-id/graphql

Sending messsage and waiting for REMP events.
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempOther, kind: PutIntoQueue
	REMP event type: RempIncludedIntoBlock, kind: IncludedIntoBlock
	^^^ this message is probably to be processed successfully
	REMP event type: RempOther, kind: Duplicate
	REMP event type: RempOther, kind: Duplicate
	REMP event type: RempOther, kind: Duplicate
	REMP event type: RempOther, kind: Duplicate
	REMP event type: RempOther, kind: Duplicate
	REMP event type: RempIncludedIntoAcceptedBlock, kind: IncludedIntoAcceptedBlock
	^^^ this message is highly likely to be processed successfully
The message has been processed.
13 REMP events received
Transaction id: effed4849898e08d1fe5759532d34f23dbec061c5fd666604f817be82732cfb9, status finalized
```
