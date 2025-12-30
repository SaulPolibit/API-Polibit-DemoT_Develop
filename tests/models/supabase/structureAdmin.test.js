/**
 * Tests for StructureAdmin Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const StructureAdmin = require('../../../src/models/supabase/structureAdmin');

describe('StructureAdmin Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should add admin user to structure successfully', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        added_by: 'user-creator',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.create({
        structureId: 'struct-456',
        userId: 'user-789',
        role: 'admin',
        canEdit: true,
        canDelete: true,
        canManageInvestors: true,
        canManageDocuments: true,
        addedBy: 'user-creator'
      });

      expect(result.id).toBe('admin-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.role).toBe('admin');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canManageInvestors).toBe(true);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should add support user to structure with limited permissions', async () => {
      const dbResponse = {
        id: 'support-123',
        structure_id: 'struct-456',
        user_id: 'user-support',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true,
        added_by: 'user-admin',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.create({
        structureId: 'struct-456',
        userId: 'user-support',
        role: 'support',
        canEdit: true,
        canDelete: false,
        canManageInvestors: false,
        canManageDocuments: true,
        addedBy: 'user-admin'
      });

      expect(result.role).toBe('support');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(false);
      expect(result.canManageInvestors).toBe(false);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Duplicate entry');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.create({
        structureId: 'struct-456',
        userId: 'user-789'
      })).rejects.toThrow('Error adding user to structure');
    });
  });

  describe('findById', () => {
    test('should find structure admin relationship by ID', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findById('admin-123');

      expect(result.id).toBe('admin-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.role).toBe('admin');
    });

    test('should return null if relationship not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      const result = await StructureAdmin.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.findById('admin-123')).rejects.toThrow('Error finding structure admin');
    });
  });

  describe('findByStructureId', () => {
    test('should find all admins for a structure with user details', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-456',
          user_id: 'user-1',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin1@example.com',
            first_name: 'John',
            last_name: 'Admin',
            role: 'admin'
          }
        },
        {
          id: 'admin-2',
          structure_id: 'struct-456',
          user_id: 'user-2',
          role: 'support',
          can_edit: true,
          can_delete: false,
          can_manage_investors: false,
          can_manage_documents: true,
          created_at: '2024-01-14T10:00:00Z',
          user: {
            id: 'user-2',
            email: 'support@example.com',
            first_name: 'Jane',
            last_name: 'Support',
            role: 'support'
          }
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByStructureId('struct-456');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('admin-1');
      expect(result[0].role).toBe('admin');
      expect(result[0].user.email).toBe('admin1@example.com');
      expect(result[0].user.firstName).toBe('John');
      expect(result[0].user.lastName).toBe('Admin');
      expect(result[1].id).toBe('admin-2');
      expect(result[1].role).toBe('support');
      expect(result[1].user.email).toBe('support@example.com');
    });

    test('should handle structure with no user details', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-456',
          user_id: 'user-1',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          user: null
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByStructureId('struct-456');

      expect(result).toHaveLength(1);
      expect(result[0].user).toBeNull();
    });

    test('should return empty array if structure has no admins', async () => {
      mockSupabase.setMockResponse('structure_admins', {
        data: [],
        error: null
      });

      const result = await StructureAdmin.findByStructureId('struct-empty');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.findByStructureId('struct-456')).rejects.toThrow('Error finding structure admins');
    });
  });

  describe('findByUserId', () => {
    test('should find all structures for a user with structure details', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-1',
          user_id: 'user-789',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          structure: {
            id: 'struct-1',
            name: 'Real Estate Fund I',
            type: 'fund',
            status: 'active'
          }
        },
        {
          id: 'admin-2',
          structure_id: 'struct-2',
          user_id: 'user-789',
          role: 'support',
          can_edit: true,
          can_delete: false,
          can_manage_investors: false,
          can_manage_documents: true,
          created_at: '2024-01-14T10:00:00Z',
          structure: {
            id: 'struct-2',
            name: 'Tech Ventures LLC',
            type: 'llc',
            status: 'active'
          }
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByUserId('user-789');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('admin-1');
      expect(result[0].role).toBe('admin');
      expect(result[0].structure.name).toBe('Real Estate Fund I');
      expect(result[0].structure.type).toBe('fund');
      expect(result[0].structure.status).toBe('active');
      expect(result[1].id).toBe('admin-2');
      expect(result[1].role).toBe('support');
      expect(result[1].structure.name).toBe('Tech Ventures LLC');
    });

    test('should handle relationships with no structure details', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-1',
          user_id: 'user-789',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          structure: null
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByUserId('user-789');

      expect(result).toHaveLength(1);
      expect(result[0].structure).toBeNull();
    });

    test('should return empty array if user has no structure access', async () => {
      mockSupabase.setMockResponse('structure_admins', {
        data: [],
        error: null
      });

      const result = await StructureAdmin.findByUserId('user-no-access');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.findByUserId('user-789')).rejects.toThrow('Error finding user structures');
    });
  });

  describe('hasAccess', () => {
    test('should return true if user has access to structure', async () => {
      const dbResponse = {
        id: 'admin-123'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.hasAccess('struct-456', 'user-789');

      expect(result).toBe(true);
    });

    test('should return false if user does not have access', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      const result = await StructureAdmin.hasAccess('struct-456', 'user-no-access');

      expect(result).toBe(false);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.hasAccess('struct-456', 'user-789')).rejects.toThrow('Error checking access');
    });
  });

  describe('getUserPermissions', () => {
    test('should get user permissions for admin role', async () => {
      const dbResponse = {
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.getUserPermissions('struct-456', 'user-789');

      expect(result.role).toBe('admin');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canManageInvestors).toBe(true);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should get user permissions for support role', async () => {
      const dbResponse = {
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.getUserPermissions('struct-456', 'user-support');

      expect(result.role).toBe('support');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(false);
      expect(result.canManageInvestors).toBe(false);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should return null if user has no permissions for structure', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      const result = await StructureAdmin.getUserPermissions('struct-456', 'user-no-access');

      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.getUserPermissions('struct-456', 'user-789'))
        .rejects.toThrow('Error getting permissions');
    });
  });

  describe('updatePermissions', () => {
    test('should update all permissions successfully', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: false,
        can_delete: false,
        can_manage_investors: true,
        can_manage_documents: false,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.updatePermissions('admin-123', {
        canEdit: false,
        canDelete: false,
        canManageInvestors: true,
        canManageDocuments: false
      });

      expect(result.id).toBe('admin-123');
      expect(result.canEdit).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.canManageInvestors).toBe(true);
      expect(result.canManageDocuments).toBe(false);
    });

    test('should update partial permissions', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.updatePermissions('admin-123', {
        canEdit: true
      });

      expect(result.canEdit).toBe(true);
    });

    test('should update role', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.updatePermissions('admin-123', {
        role: 'admin'
      });

      expect(result.role).toBe('admin');
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Update failed');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.updatePermissions('admin-123', { canEdit: false }))
        .rejects.toThrow('Error updating permissions');
    });
  });

  describe('delete', () => {
    test('should remove user from structure successfully', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.delete('struct-456', 'user-789');

      expect(result.id).toBe('admin-123');
      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.delete('struct-456', 'user-789'))
        .rejects.toThrow('Error removing user from structure');
    });
  });

  describe('deleteById', () => {
    test('should delete structure admin relationship by ID', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.deleteById('admin-123');

      expect(result.id).toBe('admin-123');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      await expect(StructureAdmin.deleteById('admin-123'))
        .rejects.toThrow('Error deleting structure admin');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'admin-123',
        structure_id: 'struct-456',
        user_id: 'user-789',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        added_by: 'user-creator',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findById('admin-123');

      expect(result.structureId).toBe('struct-456');
      expect(result.userId).toBe('user-789');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canManageInvestors).toBe(true);
      expect(result.canManageDocuments).toBe(true);
      expect(result.addedBy).toBe('user-creator');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.updatedAt).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('Permission scenarios', () => {
    test('should handle admin with full permissions', async () => {
      const dbResponse = {
        id: 'admin-full',
        structure_id: 'struct-456',
        user_id: 'user-admin',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findById('admin-full');

      expect(result.role).toBe('admin');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.canManageInvestors).toBe(true);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should handle support with limited permissions', async () => {
      const dbResponse = {
        id: 'support-limited',
        structure_id: 'struct-456',
        user_id: 'user-support',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findById('support-limited');

      expect(result.role).toBe('support');
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(false);
      expect(result.canManageInvestors).toBe(false);
      expect(result.canManageDocuments).toBe(true);
    });

    test('should handle viewer with minimal permissions', async () => {
      const dbResponse = {
        id: 'viewer-minimal',
        structure_id: 'struct-456',
        user_id: 'user-viewer',
        role: 'viewer',
        can_edit: false,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: false,
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findById('viewer-minimal');

      expect(result.role).toBe('viewer');
      expect(result.canEdit).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.canManageInvestors).toBe(false);
      expect(result.canManageDocuments).toBe(false);
    });
  });

  describe('Multi-structure scenarios', () => {
    test('should handle user with access to multiple structures', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-1',
          user_id: 'user-multi',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          structure: {
            id: 'struct-1',
            name: 'Fund I',
            type: 'fund',
            status: 'active'
          }
        },
        {
          id: 'admin-2',
          structure_id: 'struct-2',
          user_id: 'user-multi',
          role: 'support',
          can_edit: true,
          can_delete: false,
          can_manage_investors: false,
          can_manage_documents: true,
          created_at: '2024-01-14T10:00:00Z',
          structure: {
            id: 'struct-2',
            name: 'LLC II',
            type: 'llc',
            status: 'active'
          }
        },
        {
          id: 'admin-3',
          structure_id: 'struct-3',
          user_id: 'user-multi',
          role: 'viewer',
          can_edit: false,
          can_delete: false,
          can_manage_investors: false,
          can_manage_documents: false,
          created_at: '2024-01-13T10:00:00Z',
          structure: {
            id: 'struct-3',
            name: 'Trust III',
            type: 'trust',
            status: 'active'
          }
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByUserId('user-multi');

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('admin');
      expect(result[0].structure.name).toBe('Fund I');
      expect(result[1].role).toBe('support');
      expect(result[1].structure.name).toBe('LLC II');
      expect(result[2].role).toBe('viewer');
      expect(result[2].structure.name).toBe('Trust III');
    });

    test('should handle structure with multiple admins and support users', async () => {
      const dbResponse = [
        {
          id: 'admin-1',
          structure_id: 'struct-multi',
          user_id: 'user-1',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-15T10:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin1@example.com',
            first_name: 'John',
            last_name: 'Admin',
            role: 'admin'
          }
        },
        {
          id: 'admin-2',
          structure_id: 'struct-multi',
          user_id: 'user-2',
          role: 'admin',
          can_edit: true,
          can_delete: true,
          can_manage_investors: true,
          can_manage_documents: true,
          created_at: '2024-01-14T10:00:00Z',
          user: {
            id: 'user-2',
            email: 'admin2@example.com',
            first_name: 'Jane',
            last_name: 'Admin',
            role: 'admin'
          }
        },
        {
          id: 'support-1',
          structure_id: 'struct-multi',
          user_id: 'user-3',
          role: 'support',
          can_edit: true,
          can_delete: false,
          can_manage_investors: false,
          can_manage_documents: true,
          created_at: '2024-01-13T10:00:00Z',
          user: {
            id: 'user-3',
            email: 'support@example.com',
            first_name: 'Bob',
            last_name: 'Support',
            role: 'support'
          }
        }
      ];

      mockSupabase.setMockResponse('structure_admins', {
        data: dbResponse,
        error: null
      });

      const result = await StructureAdmin.findByStructureId('struct-multi');

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('admin');
      expect(result[0].user.email).toBe('admin1@example.com');
      expect(result[1].role).toBe('admin');
      expect(result[1].user.email).toBe('admin2@example.com');
      expect(result[2].role).toBe('support');
      expect(result[2].user.email).toBe('support@example.com');
    });
  });

  describe('Access control workflow', () => {
    test('should handle complete access grant workflow', async () => {
      // Create access
      const createResponse = {
        id: 'admin-workflow',
        structure_id: 'struct-456',
        user_id: 'user-new',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true,
        added_by: 'user-admin',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: createResponse,
        error: null
      });

      const created = await StructureAdmin.create({
        structureId: 'struct-456',
        userId: 'user-new',
        role: 'support',
        canEdit: true,
        canDelete: false,
        canManageInvestors: false,
        canManageDocuments: true,
        addedBy: 'user-admin'
      });

      expect(created.role).toBe('support');

      // Check access
      const accessResponse = {
        id: 'admin-workflow'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: accessResponse,
        error: null
      });

      const hasAccess = await StructureAdmin.hasAccess('struct-456', 'user-new');
      expect(hasAccess).toBe(true);

      // Update permissions
      const updateResponse = {
        id: 'admin-workflow',
        structure_id: 'struct-456',
        user_id: 'user-new',
        role: 'admin',
        can_edit: true,
        can_delete: true,
        can_manage_investors: true,
        can_manage_documents: true,
        updated_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: updateResponse,
        error: null
      });

      const updated = await StructureAdmin.updatePermissions('admin-workflow', {
        role: 'admin',
        canDelete: true,
        canManageInvestors: true
      });

      expect(updated.role).toBe('admin');
      expect(updated.canDelete).toBe(true);
      expect(updated.canManageInvestors).toBe(true);
    });

    test('should handle access revocation workflow', async () => {
      // Check access exists
      const accessResponse = {
        id: 'admin-revoke'
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: accessResponse,
        error: null
      });

      const hasAccess = await StructureAdmin.hasAccess('struct-456', 'user-revoke');
      expect(hasAccess).toBe(true);

      // Revoke access
      const deleteResponse = {
        id: 'admin-revoke',
        structure_id: 'struct-456',
        user_id: 'user-revoke',
        role: 'support',
        can_edit: true,
        can_delete: false,
        can_manage_investors: false,
        can_manage_documents: true
      };

      mockSupabase.setMockResponse('structure_admins', {
        data: deleteResponse,
        error: null
      });

      const deleted = await StructureAdmin.delete('struct-456', 'user-revoke');
      expect(deleted.userId).toBe('user-revoke');

      // Verify no access
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('structure_admins', {
        data: null,
        error: error
      });

      const noAccess = await StructureAdmin.hasAccess('struct-456', 'user-revoke');
      expect(noAccess).toBe(false);
    });
  });
});
