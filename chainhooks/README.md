# DAO Governance Chainhooks

This directory contains the chainhooks integration for monitoring DAO governance events in real-time.

## Overview

Chainhooks allow you to listen to blockchain events and trigger actions when specific conditions are met. This setup monitors:

- **Proposals**: When new proposals are created
- **Votes**: When members vote on proposals
- **Executions**: When proposals are executed
- **Treasury**: When deposits are made to the treasury
- **Members**: When new members are added

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `CHAINHOOKS_API_KEY`: Your Hiro API key
   - `CONTRACT_ADDRESS`: Your deployed DAO contract address
   - `NETWORK`: `testnet` or `mainnet`
   - `WEBHOOK_URL`: URL where events will be sent (default: http://localhost:3000/webhook)

3. **Get an API key**:
   - Visit [Hiro Platform](https://platform.hiro.so/)
   - Create an account and generate an API key
   - Add it to your `.env` file

## Usage

### Start the webhook server

This server receives events from the chainhooks:

```bash
npm run chainhooks:server
```

The server will listen on port 3000 (or the PORT in your .env) and log all DAO events to the console.

### Register chainhooks

In a new terminal, register the chainhooks to start monitoring:

```bash
npm run chainhooks:register
```

This will register all 5 chainhooks:
- DAO Proposals Monitor
- DAO Votes Monitor
- DAO Proposal Execution Monitor
- DAO Treasury Deposits Monitor
- DAO Members Monitor

### List registered chainhooks

```bash
npm run chainhooks:list
```

### Delete a specific chainhook

```bash
npm run chainhooks:delete <uuid>
```

### Delete all DAO chainhooks

```bash
npm run chainhooks:delete-all
```

## Event Examples

### Proposal Created
```json
{
  "event": "proposal-created",
  "proposal-id": 1,
  "title": "Fund Marketing Campaign",
  "proposer": "ST1PQHQKV0...",
  "amount": 1000000,
  "recipient": "ST2CY5V39N...",
  "end-block": 1050
}
```

### Vote Cast
```json
{
  "event": "vote-cast",
  "proposal-id": 1,
  "voter": "ST1PQHQKV0...",
  "support": true,
  "power": 100
}
```

### Proposal Executed
```json
{
  "event": "proposal-executed",
  "proposal-id": 1,
  "recipient": "ST2CY5V39N...",
  "amount": 1000000,
  "executor": "ST1PQHQKV0..."
}
```

## Webhook Integration

To integrate with your own backend:

1. Update `WEBHOOK_URL` in `.env` to point to your server
2. Set `WEBHOOK_AUTH_HEADER` for security
3. Your server should handle POST requests with chainhook payloads

Example payload structure:
```typescript
{
  "apply": [{
    "block_identifier": {
      "index": 1000,
      "hash": "0x..."
    },
    "transactions": [{
      "transaction_identifier": {
        "hash": "0x..."
      },
      "metadata": {
        "receipt": {
          "events": [...]
        }
      }
    }]
  }]
}
```

## Production Deployment

For production:

1. Deploy the webhook server to a public URL (e.g., Railway, Render, AWS)
2. Update `WEBHOOK_URL` to your public endpoint
3. Set `NETWORK=mainnet`
4. Use a secure `WEBHOOK_AUTH_HEADER`
5. Register the chainhooks with the production configuration

## Troubleshooting

### Chainhooks not receiving events
- Ensure the webhook server is running and accessible
- Check that the `CONTRACT_ADDRESS` matches your deployed contract
- Verify the contract has transactions happening
- Check Hiro API status at https://status.hiro.so/

### Authentication errors
- Verify your `CHAINHOOKS_API_KEY` is correct
- Check if the API key has the necessary permissions

### Connection errors
- Ensure your webhook URL is publicly accessible (if not local)
- For local testing, consider using ngrok to expose localhost

## Resources

- [Chainhooks Documentation](https://docs.hiro.so/chainhooks)
- [Chainhooks Client NPM](https://www.npmjs.com/package/@hirosystems/chainhooks-client)
- [Hiro Platform](https://platform.hiro.so/)
