/**
 * Tests for SmartContract Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const SmartContract = require('../../../src/models/supabase/smartContract');

describe('SmartContract Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create smart contract with full data successfully', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'pending',
        compliance_registry_address: '0x1234567890abcdef',
        contract_address: '0xabcdef1234567890',
        factory_address: '0xfactory123456',
        identity_registry_address: '0xidentity123456',
        transaction_hash: '0xtxhash123456',
        network: 'polygon',
        company: 'Tech Ventures LLC',
        currency: 'USD',
        max_tokens: '1000000',
        minted_tokens: '0',
        project_name: 'Real Estate Fund I',
        token_name: 'Real Estate Token',
        token_symbol: 'RET',
        token_value: '100',
        deployed_by: 'user-789',
        operating_agreement_hash: '0xagreement123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.create({
        structureId: 'struct-456',
        contractType: 'ERC3643',
        deploymentStatus: 'pending',
        complianceRegistryAddress: '0x1234567890abcdef',
        contractAddress: '0xabcdef1234567890',
        factoryAddress: '0xfactory123456',
        identityRegistryAddress: '0xidentity123456',
        transactionHash: '0xtxhash123456',
        network: 'polygon',
        company: 'Tech Ventures LLC',
        currency: 'USD',
        maxTokens: '1000000',
        mintedTokens: '0',
        projectName: 'Real Estate Fund I',
        tokenName: 'Real Estate Token',
        tokenSymbol: 'RET',
        tokenValue: '100',
        deployedBy: 'user-789',
        operatingAgreementHash: '0xagreement123'
      });

      expect(result.id).toBe('contract-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.contractType).toBe('ERC3643');
      expect(result.deploymentStatus).toBe('pending');
      expect(result.network).toBe('polygon');
      expect(result.tokenSymbol).toBe('RET');
      expect(result.maxTokens).toBe(1000000);
    });

    test('should create smart contract with minimal data', async () => {
      const dbResponse = {
        id: 'contract-minimal',
        structure_id: 'struct-123',
        contract_type: 'ERC20',
        deployment_status: 'pending',
        network: 'ethereum',
        max_tokens: '100000',
        minted_tokens: '0',
        token_symbol: 'MIN',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.create({
        structureId: 'struct-123',
        contractType: 'ERC20',
        deploymentStatus: 'pending',
        network: 'ethereum',
        maxTokens: '100000',
        mintedTokens: '0',
        tokenSymbol: 'MIN'
      });

      expect(result.id).toBe('contract-minimal');
      expect(result.contractType).toBe('ERC20');
      expect(result.maxTokens).toBe(100000);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      await expect(SmartContract.create({ structureId: 'struct-123' })).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find smart contract by ID successfully', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        contract_address: '0xcontract123',
        network: 'polygon',
        max_tokens: '500000',
        minted_tokens: '250000',
        token_symbol: 'TEST',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-123');

      expect(result.id).toBe('contract-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.deploymentStatus).toBe('deployed');
      expect(result.maxTokens).toBe(500000);
    });

    test('should return null if contract not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      const result = await SmartContract.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      await expect(SmartContract.findById('contract-123')).rejects.toThrow('Database error');
    });
  });

  describe('findByProjectId', () => {
    test('should find smart contract by project ID', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '500000',
        token_symbol: 'PROJ'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByProjectId('struct-456');

      expect(result.id).toBe('contract-123');
      expect(result.structureId).toBe('struct-456');
    });

    test('should return null if project has no contract', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      const result = await SmartContract.findByProjectId('nonexistent-project');
      expect(result).toBeNull();
    });
  });

  describe('findByContractAddress', () => {
    test('should find smart contract by contract address', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        contract_address: '0xabcdef1234567890',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '100000',
        token_symbol: 'ADDR'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByContractAddress('0xabcdef1234567890');

      expect(result.id).toBe('contract-123');
      expect(result.contractAddress).toBe('0xabcdef1234567890');
    });

    test('should trim whitespace from contract address', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_address: '0xabcdef1234567890',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'TRIM'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByContractAddress('  0xabcdef1234567890  ');

      expect(result.contractAddress).toBe('0xabcdef1234567890');
    });

    test('should return null if contract address not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      const result = await SmartContract.findByContractAddress('0xnonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findByCompany', () => {
    test('should find contracts by company name', async () => {
      const dbResponse = [
        {
          id: 'contract-1',
          structure_id: 'struct-1',
          company: 'Tech Ventures LLC',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0',
          token_symbol: 'TV1'
        },
        {
          id: 'contract-2',
          structure_id: 'struct-2',
          company: 'Tech Ventures International',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'ethereum',
          max_tokens: '500000',
          minted_tokens: '0',
          token_symbol: 'TV2'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByCompany('Tech Ventures');

      expect(result).toHaveLength(2);
      expect(result[0].company).toContain('Tech Ventures');
      expect(result[1].company).toContain('Tech Ventures');
    });

    test('should perform case-insensitive search', async () => {
      const dbResponse = [
        {
          id: 'contract-1',
          structure_id: 'struct-1',
          company: 'Real Estate Holdings',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0',
          token_symbol: 'REH'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByCompany('real estate');

      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Real Estate Holdings');
    });

    test('should return empty array if no matches', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [],
        error: null
      });

      const result = await SmartContract.findByCompany('Nonexistent Company');
      expect(result).toEqual([]);
    });
  });

  describe('findByTokenSymbol', () => {
    test('should find contracts by token symbol', async () => {
      const dbResponse = [
        {
          id: 'contract-1',
          structure_id: 'struct-1',
          company: 'Company A',
          token_symbol: 'ABC',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByTokenSymbol('ABC');

      expect(result).toHaveLength(1);
      expect(result[0].tokenSymbol).toBe('ABC');
    });

    test('should convert symbol to uppercase when searching', async () => {
      const dbResponse = [
        {
          id: 'contract-1',
          structure_id: 'struct-1',
          company: 'Company A',
          token_symbol: 'XYZ',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByTokenSymbol('xyz');

      expect(result).toHaveLength(1);
      expect(result[0].tokenSymbol).toBe('XYZ');
    });

    test('should return empty array if no matches', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [],
        error: null
      });

      const result = await SmartContract.findByTokenSymbol('NONE');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    test('should find one contract by criteria', async () => {
      const dbResponse = {
        id: 'contract-unique',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'UNQ'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findOne({ structureId: 'struct-456' });

      expect(result.id).toBe('contract-unique');
      expect(result.structureId).toBe('struct-456');
    });

    test('should return null if no contract matches criteria', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      const result = await SmartContract.findOne({ network: 'nonexistent' });
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      await expect(SmartContract.findOne({ network: 'polygon' })).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    test('should find all contracts with no criteria', async () => {
      const dbResponse = [
        {
          id: 'contract-1',
          structure_id: 'struct-1',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0',
          token_symbol: 'C1'
        },
        {
          id: 'contract-2',
          structure_id: 'struct-2',
          contract_type: 'ERC20',
          deployment_status: 'pending',
          network: 'ethereum',
          max_tokens: '500000',
          minted_tokens: '0',
          token_symbol: 'C2'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('contract-1');
      expect(result[1].id).toBe('contract-2');
    });

    test('should find contracts by single criteria', async () => {
      const dbResponse = [
        {
          id: 'contract-deployed',
          structure_id: 'struct-1',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0',
          token_symbol: 'DEP'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.find({ deploymentStatus: 'deployed' });

      expect(result).toHaveLength(1);
      expect(result[0].deploymentStatus).toBe('deployed');
    });

    test('should find contracts by multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'contract-match',
          structure_id: 'struct-1',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '0',
          token_symbol: 'MATCH'
        }
      ];

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.find({
        deploymentStatus: 'deployed',
        network: 'polygon',
        contractType: 'ERC3643'
      });

      expect(result).toHaveLength(1);
      expect(result[0].deploymentStatus).toBe('deployed');
      expect(result[0].network).toBe('polygon');
      expect(result[0].contractType).toBe('ERC3643');
    });

    test('should return empty array if no contracts match', async () => {
      mockSupabase.setMockResponse('smart_contracts', {
        data: [],
        error: null
      });

      const result = await SmartContract.find({ network: 'unknown' });
      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update smart contract successfully', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        contract_address: '0xupdated123',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '250000',
        token_symbol: 'UPD',
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByIdAndUpdate('contract-123', {
        deploymentStatus: 'deployed',
        contractAddress: '0xupdated123',
        mintedTokens: '250000'
      });

      expect(result.id).toBe('contract-123');
      expect(result.deploymentStatus).toBe('deployed');
      expect(result.contractAddress).toBe('0xupdated123');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      await expect(SmartContract.findByIdAndUpdate('contract-123', { deploymentStatus: 'deployed' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete smart contract successfully', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'failed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'DEL'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findByIdAndDelete('contract-123');

      expect(result.id).toBe('contract-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('smart_contracts', {
        data: null,
        error: error
      });

      await expect(SmartContract.findByIdAndDelete('contract-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('markAsDeployed', () => {
    test('should mark contract as deployed with full deployment data', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        contract_address: '0xdeployed123',
        transaction_hash: '0xtx123',
        compliance_registry_address: '0xcompliance123',
        factory_address: '0xfactory123',
        identity_registry_address: '0xidentity123',
        deployment_response: { deployment: { tokenAddress: '0xdeployed123' } },
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'DEPL'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const deploymentData = {
        deployment: {
          tokenAddress: '0xdeployed123',
          transactionHash: '0xtx123',
          complianceRegistryAddress: '0xcompliance123',
          factoryAddress: '0xfactory123',
          identityRegistryAddress: '0xidentity123'
        }
      };

      const result = await SmartContract.markAsDeployed('contract-123', deploymentData);

      expect(result.deploymentStatus).toBe('deployed');
      expect(result.contractAddress).toBe('0xdeployed123');
      expect(result.transactionHash).toBe('0xtx123');
    });

    test('should mark contract as deployed with tokenAddress mapping', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        contract_address: '0xtoken123',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'TOKEN'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const deploymentData = {
        deployment: {
          tokenAddress: '0xtoken123'
        }
      };

      const result = await SmartContract.markAsDeployed('contract-123', deploymentData);

      expect(result.deploymentStatus).toBe('deployed');
      expect(result.contractAddress).toBe('0xtoken123');
    });

    test('should mark contract as deployed without deployment data', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'SIMPLE'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.markAsDeployed('contract-123');

      expect(result.deploymentStatus).toBe('deployed');
    });
  });

  describe('markAsFailed', () => {
    test('should mark contract as failed with error message', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'failed',
        deployment_error: 'Insufficient gas',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'FAIL'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.markAsFailed('contract-123', 'Insufficient gas');

      expect(result.deploymentStatus).toBe('failed');
      expect(result.deploymentError).toBe('Insufficient gas');
    });
  });

  describe('markAsDeploying', () => {
    test('should mark contract as deploying', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deploying',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'DEPLOY'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.markAsDeploying('contract-123');

      expect(result.deploymentStatus).toBe('deploying');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        compliance_registry_address: '0xcompliance123',
        contract_address: '0xcontract123',
        factory_address: '0xfactory123',
        identity_registry_address: '0xidentity123',
        transaction_hash: '0xtx123',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '500000',
        project_name: 'Test Project',
        token_name: 'Test Token',
        token_symbol: 'TST',
        token_value: '100',
        deployed_by: 'user-123',
        operating_agreement_hash: '0xagreement123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-123');

      expect(result.structureId).toBe('struct-456');
      expect(result.contractType).toBe('ERC3643');
      expect(result.deploymentStatus).toBe('deployed');
      expect(result.complianceRegistryAddress).toBe('0xcompliance123');
      expect(result.contractAddress).toBe('0xcontract123');
      expect(result.factoryAddress).toBe('0xfactory123');
      expect(result.identityRegistryAddress).toBe('0xidentity123');
      expect(result.transactionHash).toBe('0xtx123');
      expect(result.projectName).toBe('Test Project');
      expect(result.tokenName).toBe('Test Token');
      expect(result.tokenSymbol).toBe('TST');
      expect(result.tokenValue).toBe('100');
      expect(result.deployedBy).toBe('user-123');
      expect(result.operatingAgreementHash).toBe('0xagreement123');
    });

    test('should parse max_tokens as integer', async () => {
      const dbResponse = {
        id: 'contract-123',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '500000',
        token_symbol: 'INT'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-123');

      expect(result.maxTokens).toBe(1000000);
      expect(typeof result.maxTokens).toBe('number');
    });
  });

  describe('Instance methods', () => {
    describe('isFullyMinted getter', () => {
      test('should return true when all tokens are minted', async () => {
        const dbResponse = {
          id: 'contract-full',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '1000000',
          token_symbol: 'FULL'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const result = await SmartContract.findById('contract-full');

        expect(result.isFullyMinted).toBe(true);
      });

      test('should return true when minted exceeds max', async () => {
        const dbResponse = {
          id: 'contract-over',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '1500000',
          token_symbol: 'OVER'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const result = await SmartContract.findById('contract-over');

        expect(result.isFullyMinted).toBe(true);
      });

      test('should return false when not all tokens are minted', async () => {
        const dbResponse = {
          id: 'contract-partial',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '500000',
          token_symbol: 'PART'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const result = await SmartContract.findById('contract-partial');

        expect(result.isFullyMinted).toBe(false);
      });
    });

    describe('updateMintedTokens', () => {
      test('should update minted tokens amount', async () => {
        const initialResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '100000',
          token_symbol: 'MINT'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: initialResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');

        const updatedResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '250000',
          token_symbol: 'MINT'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: updatedResponse,
          error: null
        });

        const result = await contract.updateMintedTokens(250000);

        expect(result.mintedTokens).toBe('250000');
      });
    });

    describe('getMintingProgress', () => {
      test('should calculate minting progress correctly', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '250000',
          token_symbol: 'PROG'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');
        const progress = contract.getMintingProgress();

        expect(progress.mintedTokens).toBe(250000);
        expect(progress.maxTokens).toBe(1000000);
        expect(progress.remainingTokens).toBe(750000);
        expect(progress.progressPercentage).toBe('25.00');
        expect(progress.isFullyMinted).toBe(false);
      });

      test('should show 100% when fully minted', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '1000000',
          token_symbol: '100'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');
        const progress = contract.getMintingProgress();

        expect(progress.progressPercentage).toBe('100.00');
        expect(progress.remainingTokens).toBe(0);
        expect(progress.isFullyMinted).toBe(true);
      });

      test('should handle zero max tokens', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '0',
          minted_tokens: '0',
          token_symbol: 'ZERO'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');
        const progress = contract.getMintingProgress();

        expect(progress.progressPercentage).toBe('0.00');
      });
    });

    describe('canMintMore', () => {
      test('should return true when tokens can still be minted', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '500000',
          token_symbol: 'CAN'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');

        expect(contract.canMintMore()).toBe(true);
      });

      test('should return false when fully minted', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '1000000',
          token_symbol: 'CANT'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');

        expect(contract.canMintMore()).toBe(false);
      });
    });

    describe('toJSON', () => {
      test('should include isFullyMinted in JSON output', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '1000000',
          token_symbol: 'JSON'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');
        const json = contract.toJSON();

        expect(json.isFullyMinted).toBe(true);
        expect(json.toJSON).toBeUndefined();
        expect(json.toObject).toBeUndefined();
      });
    });

    describe('toObject', () => {
      test('should include isFullyMinted in object output', async () => {
        const dbResponse = {
          id: 'contract-123',
          structure_id: 'struct-456',
          contract_type: 'ERC3643',
          deployment_status: 'deployed',
          network: 'polygon',
          max_tokens: '1000000',
          minted_tokens: '500000',
          token_symbol: 'OBJ'
        };

        mockSupabase.setMockResponse('smart_contracts', {
          data: dbResponse,
          error: null
        });

        const contract = await SmartContract.findById('contract-123');
        const obj = contract.toObject();

        expect(obj.isFullyMinted).toBe(false);
        expect(obj.toJSON).toBeUndefined();
        expect(obj.toObject).toBeUndefined();
      });
    });
  });

  describe('Deployment workflow scenarios', () => {
    test('should handle complete deployment workflow', async () => {
      // Create contract
      const createResponse = {
        id: 'contract-workflow',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'pending',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'WORK'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: createResponse,
        error: null
      });

      const created = await SmartContract.create({
        structureId: 'struct-123',
        contractType: 'ERC3643',
        deploymentStatus: 'pending',
        network: 'polygon',
        maxTokens: '1000000',
        mintedTokens: '0',
        tokenSymbol: 'WORK'
      });

      expect(created.deploymentStatus).toBe('pending');

      // Mark as deploying
      const deployingResponse = {
        id: 'contract-workflow',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'deploying',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'WORK'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: deployingResponse,
        error: null
      });

      const deploying = await SmartContract.markAsDeploying('contract-workflow');
      expect(deploying.deploymentStatus).toBe('deploying');

      // Mark as deployed
      const deployedResponse = {
        id: 'contract-workflow',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        contract_address: '0xdeployed123',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'WORK'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: deployedResponse,
        error: null
      });

      const deployed = await SmartContract.markAsDeployed('contract-workflow', {
        deployment: { tokenAddress: '0xdeployed123' }
      });

      expect(deployed.deploymentStatus).toBe('deployed');
      expect(deployed.contractAddress).toBe('0xdeployed123');
    });

    test('should handle failed deployment workflow', async () => {
      // Create contract
      const createResponse = {
        id: 'contract-fail',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'pending',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'FAIL'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: createResponse,
        error: null
      });

      const created = await SmartContract.create({
        structureId: 'struct-456',
        contractType: 'ERC3643',
        deploymentStatus: 'pending',
        network: 'polygon',
        maxTokens: '1000000',
        mintedTokens: '0',
        tokenSymbol: 'FAIL'
      });

      expect(created.deploymentStatus).toBe('pending');

      // Mark as failed
      const failedResponse = {
        id: 'contract-fail',
        structure_id: 'struct-456',
        contract_type: 'ERC3643',
        deployment_status: 'failed',
        deployment_error: 'Network timeout',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'FAIL'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: failedResponse,
        error: null
      });

      const failed = await SmartContract.markAsFailed('contract-fail', 'Network timeout');

      expect(failed.deploymentStatus).toBe('failed');
      expect(failed.deploymentError).toBe('Network timeout');
    });
  });

  describe('Contract types and networks', () => {
    test('should handle ERC3643 contract type', async () => {
      const dbResponse = {
        id: 'contract-3643',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: '3643'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-3643');

      expect(result.contractType).toBe('ERC3643');
    });

    test('should handle ERC20 contract type', async () => {
      const dbResponse = {
        id: 'contract-20',
        structure_id: 'struct-123',
        contract_type: 'ERC20',
        deployment_status: 'deployed',
        network: 'ethereum',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'E20'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-20');

      expect(result.contractType).toBe('ERC20');
    });

    test('should handle polygon network', async () => {
      const dbResponse = {
        id: 'contract-poly',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'polygon',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'POLY'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-poly');

      expect(result.network).toBe('polygon');
    });

    test('should handle ethereum network', async () => {
      const dbResponse = {
        id: 'contract-eth',
        structure_id: 'struct-123',
        contract_type: 'ERC3643',
        deployment_status: 'deployed',
        network: 'ethereum',
        max_tokens: '1000000',
        minted_tokens: '0',
        token_symbol: 'ETH'
      };

      mockSupabase.setMockResponse('smart_contracts', {
        data: dbResponse,
        error: null
      });

      const result = await SmartContract.findById('contract-eth');

      expect(result.network).toBe('ethereum');
    });
  });
});
