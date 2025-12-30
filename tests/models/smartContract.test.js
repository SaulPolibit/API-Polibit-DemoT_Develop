/**
 * SmartContract Model Tests
 * Tests for src/models/supabase/smartContract.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const SmartContract = require('../../src/models/supabase/smartContract');

describe('SmartContract Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSupabase.reset();
  });

  describe('create', () => {
    test('should create an ERC3643 contract record', async () => {
      const contractData = {
        structureId: 'structure-123',
        contractType: 'ERC3643',
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        maxTokens: 1000000,
        tokenValue: 100,
        deploymentStatus: 'deploying',
        deployedBy: 'user-123',
        network: 'polygon',
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          structure_id: 'structure-123',
          contract_type: 'ERC3643',
          token_name: 'Test Token',
          token_symbol: 'TEST',
          max_tokens: 1000000,
          token_value: 100,
          deployment_status: 'deploying',
          deployed_by: 'user-123',
          network: 'polygon',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await SmartContract.create(contractData);

      expect(result).toBeDefined();
      expect(result.id).toBe('contract-123');
      expect(result.contractType).toBe('ERC3643');
      expect(result.tokenSymbol).toBe('TEST');
    });

    test('should create an ERC20 contract record', async () => {
      const contractData = {
        structureId: 'structure-123',
        contractType: 'ERC20',
        tokenName: 'Basic Token',
        tokenSymbol: 'BASIC',
        deploymentStatus: 'pending',
        deployedBy: 'user-123',
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-erc20',
          contract_type: 'ERC20',
          token_name: 'Basic Token',
          token_symbol: 'BASIC',
        },
        error: null,
      });

      const result = await SmartContract.create(contractData);

      expect(result.contractType).toBe('ERC20');
    });
  });

  describe('findById', () => {
    test('should find contract by ID', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          contract_type: 'ERC3643',
          token_name: 'Test Token',
          deployment_status: 'deployed',
        },
        error: null,
      });

      const result = await SmartContract.findById('contract-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('contract-123');
      expect(result.deploymentStatus).toBe('deployed');
    });

    test('should return null if contract not found', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await SmartContract.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    test('should find contracts by structure ID', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [
          {
            id: 'contract-1',
            structure_id: 'structure-123',
            contract_type: 'ERC3643',
          },
          {
            id: 'contract-2',
            structure_id: 'structure-123',
            contract_type: 'ERC20',
          },
        ],
        error: null,
      });

      const result = await SmartContract.find({ structureId: 'structure-123' });

      expect(result).toHaveLength(2);
    });

    test('should filter by contract type', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [
          {
            id: 'contract-erc3643',
            contract_type: 'ERC3643',
          },
        ],
        error: null,
      });

      const result = await SmartContract.find({ contractType: 'ERC3643' });

      expect(result).toHaveLength(1);
      expect(result[0].contractType).toBe('ERC3643');
    });

    test('should filter by deployment status', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [
          {
            id: 'contract-deployed',
            deployment_status: 'deployed',
          },
        ],
        error: null,
      });

      const result = await SmartContract.find({ deploymentStatus: 'deployed' });

      expect(result[0].deploymentStatus).toBe('deployed');
    });
  });

  describe('markAsDeployed', () => {
    test('should mark contract as successfully deployed', async () => {
      const deploymentData = {
        contractAddress: '0x1234567890abcdef',
        transactionHash: '0xabcdef1234567890',
        blockNumber: 12345,
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'deployed',
          contract_address: '0x1234567890abcdef',
          transaction_hash: '0xabcdef1234567890',
          block_number: 12345,
          deployed_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await SmartContract.markAsDeployed('contract-123', deploymentData);

      expect(result.deploymentStatus).toBe('deployed');
      expect(result.contractAddress).toBe('0x1234567890abcdef');
      expect(result.transactionHash).toBe('0xabcdef1234567890');
    });
  });

  describe('markAsFailed', () => {
    test('should mark contract deployment as failed', async () => {
      const errorMessage = 'Deployment failed: insufficient funds';

      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'failed',
          deployment_error: 'Deployment failed: insufficient funds',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await SmartContract.markAsFailed('contract-123', errorMessage);

      expect(result.deploymentStatus).toBe('failed');
      expect(result.deploymentError).toBe('Deployment failed: insufficient funds');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update contract metadata', async () => {
      const updateData = {
        tokenName: 'Updated Token Name',
        tokenSymbol: 'UPD',
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          token_name: 'Updated Token Name',
          token_symbol: 'UPD',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await SmartContract.findByIdAndUpdate('contract-123', updateData);

      expect(result.tokenName).toBe('Updated Token Name');
      expect(result.tokenSymbol).toBe('UPD');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete contract successfully', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          contract_type: 'ERC3643',
        },
        error: null,
      });

      const result = await SmartContract.findByIdAndDelete('contract-123');

      expect(result.id).toBe('contract-123');
    });
  });

  describe('Deployment Status Transitions', () => {
    test('should handle status: pending -> deploying -> deployed', async () => {
      // Pending
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'pending',
        },
        error: null,
      });

      let result = await SmartContract.create({
        contractType: 'ERC3643',
        deploymentStatus: 'pending',
        deployedBy: 'user-123',
      });

      expect(result.deploymentStatus).toBe('pending');

      // Deploying
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'deploying',
        },
        error: null,
      });

      result = await SmartContract.findByIdAndUpdate('contract-123', {
        deploymentStatus: 'deploying',
      });

      expect(result.deploymentStatus).toBe('deploying');

      // Deployed
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'deployed',
          contract_address: '0xABCD',
        },
        error: null,
      });

      result = await SmartContract.markAsDeployed('contract-123', {
        contractAddress: '0xABCD',
      });

      expect(result.deploymentStatus).toBe('deployed');
    });

    test('should handle failed deployment', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-123',
          deployment_status: 'failed',
          error_message: 'Gas estimation failed',
        },
        error: null,
      });

      const result = await SmartContract.markAsFailed(
        'contract-123',
        'Gas estimation failed'
      );

      expect(result.deploymentStatus).toBe('failed');
    });
  });

  describe('Contract Types', () => {
    test('should handle ERC3643 contract type', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-erc3643',
          contract_type: 'ERC3643',
          token_name: 'Security Token',
        },
        error: null,
      });

      const result = await SmartContract.create({
        contractType: 'ERC3643',
        tokenName: 'Security Token',
        deployedBy: 'user-123',
      });

      expect(result.contractType).toBe('ERC3643');
    });

    test('should handle ERC20 contract type', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: {
          id: 'contract-erc20',
          contract_type: 'ERC20',
        },
        error: null,
      });

      const result = await SmartContract.create({
        contractType: 'ERC20',
        deployedBy: 'user-123',
      });

      expect(result.contractType).toBe('ERC20');
    });
  });

  describe('Network Support', () => {
    test('should support different networks', async () => {
      const networks = ['polygon', 'ethereum', 'binance'];

      for (const network of networks) {
        mockSupabase.setMockResponse('smart_contracts', {
          data: {
            id: `contract-${network}`,
            network: network,
          },
          error: null,
        });

        const result = await SmartContract.create({
          contractType: 'ERC3643',
          network: network,
          deployedBy: 'user-123',
        });

        expect(result.network).toBe(network);
      }
    });
  });
});
