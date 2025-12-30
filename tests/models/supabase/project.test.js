/**
 * Tests for Project Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Project = require('../../../src/models/supabase/project');

describe('Project Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create project with full data successfully', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Luxury Apartments Downtown',
        address: '123 Main St, New York, NY',
        image: 'https://example.com/project.jpg',
        anual_rate: '12.5',
        estimate_gain: '15000.00',
        minimum_ticket_usd: '5000.00',
        minumum_ticket_mxn: '90000.00',
        available: true,
        paused: false,
        user_creator_id: 'user-456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.create({
        name: 'Luxury Apartments Downtown',
        address: '123 Main St, New York, NY',
        image: 'https://example.com/project.jpg',
        anualRate: 12.5,
        estimateGain: 15000,
        minimumTicketUSD: 5000,
        minumumTicketMXN: 90000,
        available: true,
        paused: false,
        userCreatorId: 'user-456'
      });

      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Luxury Apartments Downtown');
      expect(result.anualRate).toBe(12.5);
      expect(result.minimumTicketUSD).toBe(5000);
      expect(result.available).toBe(true);
      expect(result.paused).toBe(false);
    });

    test('should create project with minimal data', async () => {
      const dbResponse = {
        id: 'project-minimal',
        name: 'Simple Project',
        anual_rate: '10.0',
        estimate_gain: '1000.00',
        minimum_ticket_usd: '1000.00',
        minumum_ticket_mxn: '18000.00',
        available: false,
        paused: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.create({
        name: 'Simple Project',
        anualRate: 10,
        estimateGain: 1000,
        minimumTicketUSD: 1000,
        minumumTicketMXN: 18000,
        available: false,
        paused: true
      });

      expect(result.id).toBe('project-minimal');
      expect(result.name).toBe('Simple Project');
      expect(result.anualRate).toBe(10);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      await expect(Project.create({ name: 'Test Project' })).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    test('should find project by ID successfully', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Test Project',
        address: '123 Test St',
        anual_rate: '8.5',
        estimate_gain: '5000.00',
        minimum_ticket_usd: '2500.00',
        minumum_ticket_mxn: '45000.00',
        available: true,
        paused: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findById('project-123');

      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Test Project');
      expect(result.anualRate).toBe(8.5);
      expect(result.minimumTicketUSD).toBe(2500);
    });

    test('should return null if project not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      const result = await Project.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      await expect(Project.findById('project-123')).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    test('should find one project by criteria', async () => {
      const dbResponse = {
        id: 'project-unique',
        name: 'Unique Project',
        address: '456 Unique Ave',
        anual_rate: '10.0',
        estimate_gain: '10000.00',
        minimum_ticket_usd: '5000.00',
        minumum_ticket_mxn: '90000.00',
        available: true,
        paused: false
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findOne({ name: 'Unique Project' });

      expect(result.id).toBe('project-unique');
      expect(result.name).toBe('Unique Project');
    });

    test('should return null if no project matches criteria', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      const result = await Project.findOne({ name: 'Nonexistent Project' });
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      await expect(Project.findOne({ name: 'Test' })).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    test('should find all projects with no criteria', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'Project One',
          anual_rate: '12.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        },
        {
          id: 'project-2',
          name: 'Project Two',
          anual_rate: '10.0',
          estimate_gain: '8000.00',
          minimum_ticket_usd: '3000.00',
          minumum_ticket_mxn: '54000.00',
          available: false,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.find();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('project-1');
      expect(result[1].id).toBe('project-2');
    });

    test('should find projects by single criteria', async () => {
      const dbResponse = [
        {
          id: 'project-available',
          name: 'Available Project',
          anual_rate: '9.0',
          estimate_gain: '7000.00',
          minimum_ticket_usd: '2000.00',
          minumum_ticket_mxn: '36000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.find({ available: true });

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(true);
    });

    test('should find projects by multiple criteria', async () => {
      const dbResponse = [
        {
          id: 'project-match',
          name: 'Matching Project',
          anual_rate: '11.0',
          estimate_gain: '9000.00',
          minimum_ticket_usd: '4000.00',
          minumum_ticket_mxn: '72000.00',
          available: true,
          paused: false,
          user_creator_id: 'user-123'
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.find({
        available: true,
        paused: false,
        userCreatorId: 'user-123'
      });

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(true);
      expect(result[0].paused).toBe(false);
      expect(result[0].userCreatorId).toBe('user-123');
    });

    test('should return empty array if no projects match', async () => {
      mockSupabase.setMockResponse('projects', {
        data: [],
        error: null
      });

      const result = await Project.find({ available: true });
      expect(result).toEqual([]);
    });
  });

  describe('findAvailable', () => {
    test('should find all available and not paused projects', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'High Rate Project',
          anual_rate: '15.0',
          estimate_gain: '15000.00',
          minimum_ticket_usd: '10000.00',
          minumum_ticket_mxn: '180000.00',
          available: true,
          paused: false
        },
        {
          id: 'project-2',
          name: 'Medium Rate Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findAvailable();

      expect(result).toHaveLength(2);
      expect(result[0].available).toBe(true);
      expect(result[0].paused).toBe(false);
      expect(result[1].available).toBe(true);
      expect(result[1].paused).toBe(false);
    });

    test('should return projects sorted by annual rate descending', async () => {
      const dbResponse = [
        {
          id: 'project-high',
          name: 'High Rate',
          anual_rate: '15.0',
          estimate_gain: '15000.00',
          minimum_ticket_usd: '10000.00',
          minumum_ticket_mxn: '180000.00',
          available: true,
          paused: false
        },
        {
          id: 'project-low',
          name: 'Low Rate',
          anual_rate: '8.0',
          estimate_gain: '8000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findAvailable();

      expect(result[0].anualRate).toBe(15);
      expect(result[1].anualRate).toBe(8);
    });

    test('should return empty array if no available projects', async () => {
      mockSupabase.setMockResponse('projects', {
        data: [],
        error: null
      });

      const result = await Project.findAvailable();
      expect(result).toEqual([]);
    });
  });

  describe('findByTicketRange', () => {
    test('should find projects within ticket range', async () => {
      const dbResponse = [
        {
          id: 'project-range',
          name: 'Mid Range Project',
          anual_rate: '12.0',
          estimate_gain: '12000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByTicketRange(3000, 7000);

      expect(result).toHaveLength(1);
      expect(result[0].minimumTicketUSD).toBe(5000);
    });

    test('should only return available and not paused projects', async () => {
      const dbResponse = [
        {
          id: 'project-available-range',
          name: 'Available in Range',
          anual_rate: '11.0',
          estimate_gain: '11000.00',
          minimum_ticket_usd: '4000.00',
          minumum_ticket_mxn: '72000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByTicketRange(2000, 6000);

      expect(result).toHaveLength(1);
      expect(result[0].available).toBe(true);
      expect(result[0].paused).toBe(false);
    });

    test('should return projects sorted by annual rate descending', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'High Rate',
          anual_rate: '14.0',
          estimate_gain: '14000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        },
        {
          id: 'project-2',
          name: 'Low Rate',
          anual_rate: '9.0',
          estimate_gain: '9000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByTicketRange(4000, 6000);

      expect(result[0].anualRate).toBe(14);
      expect(result[1].anualRate).toBe(9);
    });

    test('should return empty array if no projects in range', async () => {
      mockSupabase.setMockResponse('projects', {
        data: [],
        error: null
      });

      const result = await Project.findByTicketRange(100000, 200000);
      expect(result).toEqual([]);
    });
  });

  describe('findByAddress', () => {
    test('should find projects by partial address match', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'Downtown Project',
          address: '123 Main Street, New York, NY',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByAddress('Main Street');

      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Main Street');
    });

    test('should perform case-insensitive search', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'Test Project',
          address: '456 Oak Avenue, Los Angeles, CA',
          anual_rate: '11.0',
          estimate_gain: '11000.00',
          minimum_ticket_usd: '6000.00',
          minumum_ticket_mxn: '108000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByAddress('oak avenue');

      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Oak Avenue');
    });

    test('should return multiple matching projects', async () => {
      const dbResponse = [
        {
          id: 'project-1',
          name: 'NYC Project 1',
          address: '100 Broadway, New York, NY',
          anual_rate: '12.0',
          estimate_gain: '12000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        },
        {
          id: 'project-2',
          name: 'NYC Project 2',
          address: '200 Fifth Avenue, New York, NY',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '4000.00',
          minumum_ticket_mxn: '72000.00',
          available: true,
          paused: false
        }
      ];

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByAddress('New York');

      expect(result).toHaveLength(2);
      expect(result[0].address).toContain('New York');
      expect(result[1].address).toContain('New York');
    });

    test('should return empty array if no matches', async () => {
      mockSupabase.setMockResponse('projects', {
        data: [],
        error: null
      });

      const result = await Project.findByAddress('Nonexistent Street');
      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update project successfully', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Updated Project Name',
        address: '123 Main St',
        anual_rate: '13.5',
        estimate_gain: '13500.00',
        minimum_ticket_usd: '7000.00',
        minumum_ticket_mxn: '126000.00',
        available: true,
        paused: false,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByIdAndUpdate('project-123', {
        name: 'Updated Project Name',
        anualRate: 13.5,
        minimumTicketUSD: 7000
      });

      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Updated Project Name');
      expect(result.anualRate).toBe(13.5);
      expect(result.minimumTicketUSD).toBe(7000);
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      await expect(Project.findByIdAndUpdate('project-123', { name: 'New Name' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete project successfully', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Deleted Project',
        anual_rate: '10.0',
        estimate_gain: '10000.00',
        minimum_ticket_usd: '5000.00',
        minumum_ticket_mxn: '90000.00',
        available: false,
        paused: true
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findByIdAndDelete('project-123');

      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Deleted Project');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('projects', {
        data: null,
        error: error
      });

      await expect(Project.findByIdAndDelete('project-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Test Project',
        address: '123 Test St',
        image: 'https://example.com/image.jpg',
        anual_rate: '12.5',
        estimate_gain: '15000.00',
        minimum_ticket_usd: '5000.00',
        minumum_ticket_mxn: '90000.00',
        available: true,
        paused: false,
        user_creator_id: 'user-456',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findById('project-123');

      expect(result.anualRate).toBe(12.5);
      expect(result.estimateGain).toBe(15000);
      expect(result.minimumTicketUSD).toBe(5000);
      expect(result.minumumTicketMXN).toBe(90000);
      expect(result.userCreatorId).toBe('user-456');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-15T10:00:00Z');
    });

    test('should parse numeric fields correctly', async () => {
      const dbResponse = {
        id: 'project-123',
        name: 'Numeric Test',
        anual_rate: '8.75',
        estimate_gain: '12345.67',
        minimum_ticket_usd: '3500.50',
        minumum_ticket_mxn: '63009.00',
        available: true,
        paused: false
      };

      mockSupabase.setMockResponse('projects', {
        data: dbResponse,
        error: null
      });

      const result = await Project.findById('project-123');

      expect(result.anualRate).toBe(8.75);
      expect(typeof result.anualRate).toBe('number');
      expect(result.estimateGain).toBe(12345.67);
      expect(typeof result.estimateGain).toBe('number');
      expect(result.minimumTicketUSD).toBe(3500.50);
      expect(typeof result.minimumTicketUSD).toBe('number');
    });
  });

  describe('Instance methods', () => {
    describe('isActive getter', () => {
      test('should return true when available and not paused', async () => {
        const dbResponse = {
          id: 'project-active',
          name: 'Active Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const result = await Project.findById('project-active');

        expect(result.isActive).toBe(true);
      });

      test('should return false when not available', async () => {
        const dbResponse = {
          id: 'project-inactive',
          name: 'Inactive Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: false,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const result = await Project.findById('project-inactive');

        expect(result.isActive).toBe(false);
      });

      test('should return false when paused', async () => {
        const dbResponse = {
          id: 'project-paused',
          name: 'Paused Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: true
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const result = await Project.findById('project-paused');

        expect(result.isActive).toBe(false);
      });
    });

    describe('isActivelyAvailable', () => {
      test('should return true when available and not paused', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const result = await Project.findById('project-123');

        expect(result.isActivelyAvailable()).toBe(true);
      });

      test('should return false when paused', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: true
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const result = await Project.findById('project-123');

        expect(result.isActivelyAvailable()).toBe(false);
      });
    });

    describe('calculateEstimatedReturn', () => {
      test('should calculate return for USD investment', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '5000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');
        const returnInfo = project.calculateEstimatedReturn(10000, 'USD');

        expect(returnInfo.investmentAmount).toBe(10000);
        expect(returnInfo.currency).toBe('USD');
        expect(returnInfo.annualRate).toBe(10);
        expect(returnInfo.estimatedAnnualReturn).toBe(1000);
        expect(returnInfo.estimatedTotalReturn).toBe(11000);
        expect(returnInfo.estimatedGain).toBe(5000);
      });

      test('should calculate return for MXN investment', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '12.0',
          estimate_gain: '5000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');
        const returnInfo = project.calculateEstimatedReturn(100000, 'MXN');

        expect(returnInfo.investmentAmount).toBe(100000);
        expect(returnInfo.currency).toBe('MXN');
        expect(returnInfo.annualRate).toBe(12);
        expect(returnInfo.estimatedAnnualReturn).toBe(12000);
        expect(returnInfo.estimatedTotalReturn).toBe(112000);
      });

      test('should throw error if investment below minimum USD', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '5000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        expect(() => project.calculateEstimatedReturn(3000, 'USD'))
          .toThrow('Investment amount must be at least 5000 USD');
      });

      test('should throw error if investment below minimum MXN', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '5000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        expect(() => project.calculateEstimatedReturn(50000, 'MXN'))
          .toThrow('Investment amount must be at least 90000 MXN');
      });
    });

    describe('makeAvailable', () => {
      test('should mark project as available', async () => {
        const initialResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: false,
          paused: true
        };

        mockSupabase.setMockResponse('projects', {
          data: initialResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        const updatedResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: updatedResponse,
          error: null
        });

        const result = await project.makeAvailable();

        expect(result.available).toBe(true);
        expect(result.paused).toBe(false);
      });
    });

    describe('makeUnavailable', () => {
      test('should mark project as unavailable', async () => {
        const initialResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: initialResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        const updatedResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: false,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: updatedResponse,
          error: null
        });

        const result = await project.makeUnavailable();

        expect(result.available).toBe(false);
      });
    });

    describe('pause', () => {
      test('should pause project', async () => {
        const initialResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: initialResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        const updatedResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: true
        };

        mockSupabase.setMockResponse('projects', {
          data: updatedResponse,
          error: null
        });

        const result = await project.pause();

        expect(result.paused).toBe(true);
      });
    });

    describe('unpause', () => {
      test('should unpause project', async () => {
        const initialResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: true
        };

        mockSupabase.setMockResponse('projects', {
          data: initialResponse,
          error: null
        });

        const project = await Project.findById('project-123');

        const updatedResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: updatedResponse,
          error: null
        });

        const result = await project.unpause();

        expect(result.paused).toBe(false);
      });
    });

    describe('toJSON', () => {
      test('should include isActive in JSON output', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');
        const json = project.toJSON();

        expect(json.isActive).toBe(true);
        expect(json.toJSON).toBeUndefined();
      });
    });

    describe('toObject', () => {
      test('should include isActive in object output', async () => {
        const dbResponse = {
          id: 'project-123',
          name: 'Test Project',
          anual_rate: '10.0',
          estimate_gain: '10000.00',
          minimum_ticket_usd: '5000.00',
          minumum_ticket_mxn: '90000.00',
          available: true,
          paused: false
        };

        mockSupabase.setMockResponse('projects', {
          data: dbResponse,
          error: null
        });

        const project = await Project.findById('project-123');
        const obj = project.toObject();

        expect(obj.isActive).toBe(true);
        expect(obj.toObject).toBeUndefined();
      });
    });
  });
});
