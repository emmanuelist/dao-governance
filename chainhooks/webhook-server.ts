import { createServer, IncomingMessage, ServerResponse } from 'http';

const PORT = process.env.PORT || 3000;

interface ChainhookPayload {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: {
        hash: string;
      };
      operations: any[];
      metadata?: {
        receipt?: any;
        description?: string;
      };
    }>;
  }>;
  rollback?: any[];
  chainhook?: {
    uuid: string;
    predicate: any;
  };
}

/**
 * Parse and handle DAO events from chainhook payloads
 */
function handleDaoEvent(payload: ChainhookPayload) {
  console.log('\n=== New Chainhook Event ===');
  
  if (payload.apply) {
    payload.apply.forEach(block => {
      console.log(`Block #${block.block_identifier.index}`);
      console.log(`Block Hash: ${block.block_identifier.hash}`);
      
      block.transactions.forEach(tx => {
        console.log(`\nTransaction: ${tx.transaction_identifier.hash}`);
        
        // Extract print events from the transaction
        if (tx.metadata?.receipt) {
          const events = tx.metadata.receipt.events || [];
          
          events.forEach((event: any) => {
            if (event.type === 'SmartContractEvent') {
              const data = event.data;
              console.log('\n--- Smart Contract Event ---');
              console.log('Contract:', data.contract_identifier);
              console.log('Topic:', data.topic);
              
              // Parse the event value (printed data from contract)
              if (data.value) {
                try {
                  console.log('Event Data:', JSON.stringify(data.value, null, 2));
                  
                  // Handle specific event types
                  const eventType = data.value?.event?.value;
                  
                  switch (eventType) {
                    case 'proposal-created':
                      handleProposalCreated(data.value);
                      break;
                    case 'vote-cast':
                      handleVoteCast(data.value);
                      break;
                    case 'proposal-executed':
                      handleProposalExecuted(data.value);
                      break;
                    case 'treasury-deposit':
                      handleTreasuryDeposit(data.value);
                      break;
                    case 'member-added':
                      handleMemberAdded(data.value);
                      break;
                  }
                } catch (error) {
                  console.error('Error parsing event data:', error);
                }
              }
            }
          });
        }
      });
    });
  }
  
  if (payload.rollback) {
    console.log('\n⚠️  Rollback detected');
    console.log(JSON.stringify(payload.rollback, null, 2));
  }
  
  console.log('\n=== End of Event ===\n');
}

function handleProposalCreated(data: any) {
  console.log('\n🆕 New Proposal Created');
  console.log(`Proposal ID: ${data['proposal-id']?.value}`);
  console.log(`Title: ${data.title?.value}`);
  console.log(`Proposer: ${data.proposer?.value}`);
  console.log(`Amount: ${data.amount?.value} µSTX`);
  console.log(`Recipient: ${data.recipient?.value}`);
  console.log(`Voting Ends: Block ${data['end-block']?.value}`);
}

function handleVoteCast(data: any) {
  console.log('\n🗳️  Vote Cast');
  console.log(`Proposal ID: ${data['proposal-id']?.value}`);
  console.log(`Voter: ${data.voter?.value}`);
  console.log(`Support: ${data.support?.value ? 'YES' : 'NO'}`);
  console.log(`Voting Power: ${data.power?.value}`);
}

function handleProposalExecuted(data: any) {
  console.log('\n✅ Proposal Executed');
  console.log(`Proposal ID: ${data['proposal-id']?.value}`);
  console.log(`Recipient: ${data.recipient?.value}`);
  console.log(`Amount: ${data.amount?.value} µSTX`);
  console.log(`Executor: ${data.executor?.value}`);
}

function handleTreasuryDeposit(data: any) {
  console.log('\n💰 Treasury Deposit');
  console.log(`From: ${data.from?.value}`);
  console.log(`Amount: ${data.amount?.value} µSTX`);
}

function handleMemberAdded(data: any) {
  console.log('\n👤 New Member Added');
  console.log(`Member: ${data.member?.value}`);
  console.log(`Added By: ${data['added-by']?.value}`);
}

/**
 * Simple HTTP server to receive webhook events
 */
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Webhook endpoint
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload: ChainhookPayload = JSON.parse(body);
        
        // Verify authorization if set
        const authHeader = process.env.WEBHOOK_AUTH_HEADER;
        if (authHeader) {
          const receivedAuth = req.headers.authorization;
          if (receivedAuth !== authHeader) {
            console.warn('⚠️  Invalid authorization header');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }
        }
        
        // Handle the event
        handleDaoEvent(payload);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received' }));
      } catch (error: any) {
        console.error('Error processing webhook:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    
    return;
  }
  
  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🎣 Webhook server listening on http://localhost:${PORT}`);
  console.log(`📥 Receiving events at http://localhost:${PORT}/webhook`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
  console.log('\nWaiting for chainhook events...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down webhook server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
