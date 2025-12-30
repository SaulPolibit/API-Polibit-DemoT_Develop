/**
 * Conversation Model Tests
 * Tests for src/models/supabase/conversation.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Conversation = require('../../src/models/supabase/conversation');

describe('Conversation Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new conversation successfully', async () => {
      const conversationData = {
        title: 'Project Discussion',
        type: 'group',
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-123',
          title: 'Project Discussion',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.create(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBe('conversation-123');
      expect(conversation.title).toBe('Project Discussion');
      expect(conversation.type).toBe('group');
      expect(conversation.createdBy).toBe('user-123');
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    test('should create a direct conversation', async () => {
      const conversationData = {
        title: 'Direct Chat',
        type: 'direct',
        createdBy: 'user-456',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-456',
          title: 'Direct Chat',
          type: 'direct',
          created_by: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.create(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe('direct');
      expect(conversation.title).toBe('Direct Chat');
    });

    test('should create conversation with minimal fields', async () => {
      const conversationData = {
        createdBy: 'user-789',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-789',
          title: null,
          type: null,
          created_by: 'user-789',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.create(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBe('conversation-789');
      expect(conversation.createdBy).toBe('user-789');
    });

    test('should throw error if creation fails', async () => {
      const conversationData = {
        title: 'Test Conversation',
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { message: 'Database constraint violation' },
      });

      await expect(Conversation.create(conversationData)).rejects.toThrow(
        'Error creating conversation: Database constraint violation'
      );
    });
  });

  describe('findById', () => {
    test('should find conversation by ID successfully', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-123',
          title: 'Team Meeting',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.findById('conversation-123');

      expect(conversation).toBeDefined();
      expect(conversation.id).toBe('conversation-123');
      expect(conversation.title).toBe('Team Meeting');
      expect(conversation.type).toBe('group');
      expect(conversation.createdBy).toBe('user-123');
    });

    test('should return null if conversation not found', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const conversation = await Conversation.findById('nonexistent-id');

      expect(conversation).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { message: 'Connection error', code: 'DB_ERROR' },
      });

      await expect(Conversation.findById('conversation-123')).rejects.toThrow(
        'Error finding conversation: Connection error'
      );
    });
  });

  describe('findByUserId', () => {
    test('should find all conversations for a user', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: [
          {
            id: 'conversation-1',
            title: 'Conversation 1',
            type: 'group',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            conversation_participants: [{ user_id: 'user-123' }],
          },
          {
            id: 'conversation-2',
            title: 'Conversation 2',
            type: 'direct',
            created_by: 'user-456',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            conversation_participants: [{ user_id: 'user-123' }],
          },
        ],
        error: null,
      });

      const conversations = await Conversation.findByUserId('user-123');

      expect(conversations).toHaveLength(2);
      expect(conversations[0].id).toBe('conversation-1');
      expect(conversations[1].id).toBe('conversation-2');
    });

    test('should return empty array if user has no conversations', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: [],
        error: null,
      });

      const conversations = await Conversation.findByUserId('user-new');

      expect(conversations).toEqual([]);
    });

    test('should return conversations ordered by updated_at descending', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: [
          {
            id: 'conversation-recent',
            title: 'Recent Conversation',
            type: 'group',
            created_by: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-05T00:00:00Z',
            conversation_participants: [{ user_id: 'user-123' }],
          },
          {
            id: 'conversation-old',
            title: 'Old Conversation',
            type: 'direct',
            created_by: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            conversation_participants: [{ user_id: 'user-123' }],
          },
        ],
        error: null,
      });

      const conversations = await Conversation.findByUserId('user-123');

      expect(conversations).toHaveLength(2);
      expect(conversations[0].id).toBe('conversation-recent');
      expect(conversations[1].id).toBe('conversation-old');
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(Conversation.findByUserId('user-123')).rejects.toThrow(
        'Error finding conversations: Query error'
      );
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update conversation title successfully', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-123',
          title: 'Updated Title',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Conversation.findByIdAndUpdate('conversation-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated Title');
      expect(updated.id).toBe('conversation-123');
    });

    test('should update conversation type', async () => {
      const updateData = {
        type: 'group',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-456',
          title: 'Chat',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Conversation.findByIdAndUpdate('conversation-456', updateData);

      expect(updated.type).toBe('group');
    });

    test('should update multiple fields', async () => {
      const updateData = {
        title: 'New Title',
        type: 'direct',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-789',
          title: 'New Title',
          type: 'direct',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      const updated = await Conversation.findByIdAndUpdate('conversation-789', updateData);

      expect(updated.title).toBe('New Title');
      expect(updated.type).toBe('direct');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        Conversation.findByIdAndUpdate('conversation-123', { title: 'Test' })
      ).rejects.toThrow('Error updating conversation: Update failed');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete conversation successfully', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-123',
          title: 'Deleted Conversation',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await Conversation.findByIdAndDelete('conversation-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('conversation-123');
      expect(deleted.title).toBe('Deleted Conversation');
    });

    test('should throw error if deletion fails', async () => {
      mockSupabase.setMockResponse('conversations', {
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(Conversation.findByIdAndDelete('conversation-123')).rejects.toThrow(
        'Error deleting conversation: Deletion failed'
      );
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'conversation-123',
        title: 'Test Conversation',
        type: 'group',
        createdBy: 'user-123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = Conversation._toDbFields(modelData);

      expect(dbData.id).toBe('conversation-123');
      expect(dbData.title).toBe('Test Conversation');
      expect(dbData.type).toBe('group');
      expect(dbData.created_by).toBe('user-123');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'conversation-123',
        title: 'Test Conversation',
        type: 'direct',
        created_by: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const modelData = Conversation._toModel(dbData);

      expect(modelData.id).toBe('conversation-123');
      expect(modelData.title).toBe('Test Conversation');
      expect(modelData.type).toBe('direct');
      expect(modelData.createdBy).toBe('user-456');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = Conversation._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        title: 'Partial Conversation',
        createdBy: 'user-123',
      };

      const dbData = Conversation._toDbFields(partialData);

      expect(dbData.title).toBe('Partial Conversation');
      expect(dbData.created_by).toBe('user-123');
      expect(dbData.id).toBeUndefined();
      expect(dbData.type).toBeUndefined();
    });
  });

  describe('Conversation types', () => {
    test('should handle group conversation type', async () => {
      const conversationData = {
        title: 'Team Group',
        type: 'group',
        createdBy: 'user-123',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-group',
          title: 'Team Group',
          type: 'group',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.create(conversationData);

      expect(conversation.type).toBe('group');
    });

    test('should handle direct conversation type', async () => {
      const conversationData = {
        title: 'Direct Message',
        type: 'direct',
        createdBy: 'user-456',
      };

      mockSupabase.setMockResponse('conversations', {
        data: {
          id: 'conversation-direct',
          title: 'Direct Message',
          type: 'direct',
          created_by: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const conversation = await Conversation.create(conversationData);

      expect(conversation.type).toBe('direct');
    });
  });
});
