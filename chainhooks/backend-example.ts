import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// In-memory store (replace with database in production)
const proposals = new Map();
const votes = new Map();
const members = new Set();

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Webhook endpoint for chainhook events
 */
app.post('/webhook', (req: Request, res: Response) => {
  // Verify authorization
  const authHeader = process.env.WEBHOOK_AUTH_HEADER;
  if (authHeader && req.headers.authorization !== authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body;
  
  try {
    // Process the chainhook payload
    if (payload.apply) {
      payload.apply.forEach((block: any) => {
        block.transactions.forEach((tx: any) => {
          const events = tx.metadata?.receipt?.events || [];
          
          events.forEach((event: any) => {
            if (event.type === 'SmartContractEvent') {
              processEvent(event.data.value);
            }
          });
        });
      });
    }

    res.json({ status: 'received' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Process DAO events and update state
 */
function processEvent(data: any) {
  const eventType = data?.event?.value;

  switch (eventType) {
    case 'proposal-created':
      handleProposalCreated(data);
      break;
    case 'vote-cast':
      handleVoteCast(data);
      break;
    case 'proposal-executed':
      handleProposalExecuted(data);
      break;
    case 'member-added':
      handleMemberAdded(data);
      break;
  }
}

function handleProposalCreated(data: any) {
  const proposalId = data['proposal-id']?.value;
  const proposal = {
    id: proposalId,
    title: data.title?.value,
    description: data.description?.value,
    proposer: data.proposer?.value,
    recipient: data.recipient?.value,
    amount: data.amount?.value,
    endBlock: data['end-block']?.value,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  proposals.set(proposalId, proposal);
  console.log(`✅ Proposal ${proposalId} created:`, proposal.title);

  // Here you could:
  // - Send notifications to DAO members
  // - Update a database
  // - Trigger analytics
  // - Post to Discord/Slack
}

function handleVoteCast(data: any) {
  const proposalId = data['proposal-id']?.value;
  const vote = {
    proposalId,
    voter: data.voter?.value,
    support: data.support?.value,
    power: data.power?.value,
    timestamp: new Date().toISOString(),
  };

  if (!votes.has(proposalId)) {
    votes.set(proposalId, []);
  }
  votes.get(proposalId).push(vote);

  console.log(`🗳️  Vote cast on proposal ${proposalId}:`, vote.support ? 'YES' : 'NO');

  // Here you could:
  // - Update vote tallies
  // - Notify the proposer
  // - Update UI in real-time via WebSocket
}

function handleProposalExecuted(data: any) {
  const proposalId = data['proposal-id']?.value;
  const proposal = proposals.get(proposalId);
  
  if (proposal) {
    proposal.status = 'executed';
    proposal.executedAt = new Date().toISOString();
    proposal.executor = data.executor?.value;
    proposals.set(proposalId, proposal);
  }

  console.log(`✅ Proposal ${proposalId} executed`);

  // Here you could:
  // - Send success notifications
  // - Trigger follow-up actions
  // - Update treasury balance displays
}

function handleMemberAdded(data: any) {
  const member = data.member?.value;
  members.add(member);
  
  console.log(`👤 New member added:`, member);

  // Here you could:
  // - Send welcome email
  // - Grant Discord/Telegram roles
  // - Update member directory
}

/**
 * API endpoints to query DAO state
 */

app.get('/proposals', (req: Request, res: Response) => {
  const proposalList = Array.from(proposals.values());
  res.json({ proposals: proposalList, total: proposalList.length });
});

app.get('/proposals/:id', (req: Request, res: Response) => {
  const proposalId = parseInt(req.params.id);
  const proposal = proposals.get(proposalId);
  
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  const proposalVotes = votes.get(proposalId) || [];
  res.json({ proposal, votes: proposalVotes });
});

app.get('/members', (req: Request, res: Response) => {
  res.json({ members: Array.from(members), total: members.size });
});

app.get('/stats', (req: Request, res: Response) => {
  const stats = {
    totalProposals: proposals.size,
    activeProposals: Array.from(proposals.values()).filter(p => p.status === 'active').length,
    executedProposals: Array.from(proposals.values()).filter(p => p.status === 'executed').length,
    totalMembers: members.size,
    totalVotes: Array.from(votes.values()).reduce((sum, v) => sum + v.length, 0),
  };

  res.json(stats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DAO Backend API running on http://localhost:${PORT}`);
  console.log(`📥 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`📊 Stats endpoint: http://localhost:${PORT}/stats`);
});

export default app;
