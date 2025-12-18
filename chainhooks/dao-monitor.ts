import {
  ChainhooksClient,
  CHAINHOOKS_BASE_URL,
  ChainhookDefinition,
} from '@hirosystems/chainhooks-client';

// Configuration
const NETWORK = process.env.NETWORK || 'testnet';
const API_KEY = process.env.CHAINHOOKS_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'dao-governance';

// Initialize client
const client = new ChainhooksClient({
  baseUrl: NETWORK === 'mainnet' ? CHAINHOOKS_BASE_URL.mainnet : CHAINHOOKS_BASE_URL.testnet,
  apiKey: API_KEY,
});

// Webhook URL where events will be sent
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';

/**
 * Chainhook to monitor all DAO proposal events
 */
export const proposalsChainhook: ChainhookDefinition = {
  name: 'DAO Proposals Monitor',
  chain: 'stacks',
  network: NETWORK as 'mainnet' | 'testnet',
  version: 1,
  filters: {
    contract_identifier: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    method: 'create-proposal',
  },
  action: {
    http_post: {
      url: WEBHOOK_URL,
      authorization_header: process.env.WEBHOOK_AUTH_HEADER || '',
    },
  },
};

/**
 * Chainhook to monitor voting events
 */
export const votesChainhook: ChainhookDefinition = {
  name: 'DAO Votes Monitor',
  chain: 'stacks',
  network: NETWORK as 'mainnet' | 'testnet',
  version: 1,
  filters: {
    contract_identifier: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    method: 'vote',
  },
  action: {
    http_post: {
      url: WEBHOOK_URL,
      authorization_header: process.env.WEBHOOK_AUTH_HEADER || '',
    },
  },
};

/**
 * Chainhook to monitor proposal execution
 */
export const executionChainhook: ChainhookDefinition = {
  name: 'DAO Proposal Execution Monitor',
  chain: 'stacks',
  network: NETWORK as 'mainnet' | 'testnet',
  version: 1,
  filters: {
    contract_identifier: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    method: 'execute-proposal',
  },
  action: {
    http_post: {
      url: WEBHOOK_URL,
      authorization_header: process.env.WEBHOOK_AUTH_HEADER || '',
    },
  },
};

/**
 * Chainhook to monitor treasury deposits
 */
export const treasuryDepositsChainhook: ChainhookDefinition = {
  name: 'DAO Treasury Deposits Monitor',
  chain: 'stacks',
  network: NETWORK as 'mainnet' | 'testnet',
  version: 1,
  filters: {
    contract_identifier: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    method: 'deposit-to-treasury',
  },
  action: {
    http_post: {
      url: WEBHOOK_URL,
      authorization_header: process.env.WEBHOOK_AUTH_HEADER || '',
    },
  },
};

/**
 * Chainhook to monitor member additions
 */
export const membersChainhook: ChainhookDefinition = {
  name: 'DAO Members Monitor',
  chain: 'stacks',
  network: NETWORK as 'mainnet' | 'testnet',
  version: 1,
  filters: {
    contract_identifier: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    method: 'add-member',
  },
  action: {
    http_post: {
      url: WEBHOOK_URL,
      authorization_header: process.env.WEBHOOK_AUTH_HEADER || '',
    },
  },
};

/**
 * Register all DAO chainhooks
 */
export async function registerAllChainhooks() {
  console.log(`Registering chainhooks for ${NETWORK}...`);
  
  try {
    const chainhooks = [
      { def: proposalsChainhook, name: 'Proposals' },
      { def: votesChainhook, name: 'Votes' },
      { def: executionChainhook, name: 'Execution' },
      { def: treasuryDepositsChainhook, name: 'Treasury Deposits' },
      { def: membersChainhook, name: 'Members' },
    ];

    const results = [];
    for (const { def, name } of chainhooks) {
      try {
        const result = await client.registerChainhook(def);
        console.log(`✓ ${name} chainhook registered: ${result.uuid}`);
        results.push({ name, uuid: result.uuid, success: true });
      } catch (error: any) {
        console.error(`✗ Failed to register ${name} chainhook:`, error.message);
        results.push({ name, error: error.message, success: false });
      }
    }

    return results;
  } catch (error: any) {
    console.error('Failed to register chainhooks:', error.message);
    throw error;
  }
}

/**
 * List all registered chainhooks
 */
export async function listChainhooks() {
  try {
    const { results, total } = await client.getChainhooks({ limit: 50 });
    console.log(`\nFound ${total} registered chainhooks:\n`);
    
    results.forEach((hook) => {
      console.log(`UUID: ${hook.uuid}`);
      console.log(`Name: ${hook.definition.name}`);
      console.log(`Chain: ${hook.definition.chain}`);
      console.log(`Network: ${hook.definition.network}`);
      console.log(`Enabled: ${hook.enabled}`);
      console.log('---');
    });

    return results;
  } catch (error: any) {
    console.error('Failed to list chainhooks:', error.message);
    throw error;
  }
}

/**
 * Delete a chainhook by UUID
 */
export async function deleteChainhook(uuid: string) {
  try {
    await client.deleteChainhook(uuid);
    console.log(`✓ Chainhook ${uuid} deleted successfully`);
  } catch (error: any) {
    console.error(`✗ Failed to delete chainhook ${uuid}:`, error.message);
    throw error;
  }
}

/**
 * Delete all DAO-related chainhooks
 */
export async function deleteAllDaoChainhooks() {
  try {
    const { results } = await client.getChainhooks({ limit: 50 });
    const daoChainhooks = results.filter(hook => 
      hook.definition.name.startsWith('DAO ')
    );

    console.log(`Found ${daoChainhooks.length} DAO chainhooks to delete`);

    for (const hook of daoChainhooks) {
      await deleteChainhook(hook.uuid);
    }

    console.log('✓ All DAO chainhooks deleted');
  } catch (error: any) {
    console.error('Failed to delete chainhooks:', error.message);
    throw error;
  }
}

/**
 * Check API status
 */
export async function checkStatus() {
  try {
    const status = await client.getStatus();
    console.log('\nChainhooks API Status:');
    console.log(`Status: ${status.status}`);
    console.log(`Server Version: ${status.server_version}`);
    return status;
  } catch (error: any) {
    console.error('Failed to check status:', error.message);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  (async () => {
    try {
      await checkStatus();

      switch (command) {
        case 'register':
          await registerAllChainhooks();
          break;
        case 'list':
          await listChainhooks();
          break;
        case 'delete-all':
          await deleteAllDaoChainhooks();
          break;
        case 'delete':
          const uuid = process.argv[3];
          if (!uuid) {
            console.error('Please provide a UUID to delete');
            process.exit(1);
          }
          await deleteChainhook(uuid);
          break;
        default:
          console.log(`
Usage: tsx chainhooks/dao-monitor.ts <command>

Commands:
  register     - Register all DAO chainhooks
  list         - List all registered chainhooks
  delete <uuid> - Delete a specific chainhook
  delete-all   - Delete all DAO chainhooks

Environment Variables:
  NETWORK              - Network to use (mainnet or testnet, default: testnet)
  CHAINHOOKS_API_KEY   - API key for Chainhooks API
  CONTRACT_ADDRESS     - DAO contract address
  WEBHOOK_URL          - URL where events will be sent
  WEBHOOK_AUTH_HEADER  - Authorization header for webhook
          `);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
