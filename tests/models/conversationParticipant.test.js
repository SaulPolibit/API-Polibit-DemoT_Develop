/**
 * ConversationParticipant Model Tests
 * Tests for src/models/supabase/conversationParticipant.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const ConversationParticipant = require('../../src/models/supabase/conversationParticipant');

describe('ConversationParticipant Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new conversation participant successfully', async () => {
      const participantData = {
        conversationId: 'conversation-123',
        userId: 'user-456',
        role: 'member',
        joinedAt: '2024-01-01T00:00:00Z',
      };

      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
          conversation_id: 'conversation-123',
          user_id: 'user-456',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.create(participantData);

      expect(participant).toBeDefined();
      expect(participant.id).toBe('participant-123');
      expect(participant.conversationId).toBe('conversation-123');
      expect(participant.userId).toBe('user-456');
      expect(participant.role).toBe('member');
      expect(participant.joinedAt).toBe('2024-01-01T00:00:00Z');
      expect(participant.lastReadAt).toBeNull();
    });

    test('should create participant with admin role', async () => {
      const participantData = {
        conversationId: 'conversation-123',
        userId: 'user-admin',
        role: 'admin',
        joinedAt: '2024-01-01T00:00:00Z',
      };

      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-admin',
          conversation_id: 'conversation-123',
          user_id: 'user-admin',
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.create(participantData);

      expect(participant).toBeDefined();
      expect(participant.role).toBe('admin');
    });

    test('should create participant with minimal fields', async () => {
      const participantData = {
        conversationId: 'conversation-123',
        userId: 'user-789',
      };

      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-789',
          conversation_id: 'conversation-123',
          user_id: 'user-789',
          role: null,
          joined_at: null,
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.create(participantData);

      expect(participant).toBeDefined();
      expect(participant.conversationId).toBe('conversation-123');
      expect(participant.userId).toBe('user-789');
    });

    test('should throw error if creation fails', async () => {
      const participantData = {
        conversationId: 'conversation-123',
        userId: 'user-456',
      };

      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Unique constraint violation' },
      });

      await expect(ConversationParticipant.create(participantData)).rejects.toThrow(
        'Error creating conversation participant: Unique constraint violation'
      );
    });
  });

  describe('createMany', () => {
    test('should create multiple participants successfully', async () => {
      const participantsData = [
        {
          conversationId: 'conversation-123',
          userId: 'user-1',
          role: 'member',
          joinedAt: '2024-01-01T00:00:00Z',
        },
        {
          conversationId: 'conversation-123',
          userId: 'user-2',
          role: 'member',
          joinedAt: '2024-01-01T00:00:00Z',
        },
        {
          conversationId: 'conversation-123',
          userId: 'user-3',
          role: 'admin',
          joinedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.setMockResponse('conversation_participants', {
        data: [
          {
            id: 'participant-1',
            conversation_id: 'conversation-123',
            user_id: 'user-1',
            role: 'member',
            joined_at: '2024-01-01T00:00:00Z',
            last_read_at: null,
          },
          {
            id: 'participant-2',
            conversation_id: 'conversation-123',
            user_id: 'user-2',
            role: 'member',
            joined_at: '2024-01-01T00:00:00Z',
            last_read_at: null,
          },
          {
            id: 'participant-3',
            conversation_id: 'conversation-123',
            user_id: 'user-3',
            role: 'admin',
            joined_at: '2024-01-01T00:00:00Z',
            last_read_at: null,
          },
        ],
        error: null,
      });

      const participants = await ConversationParticipant.createMany(participantsData);

      expect(participants).toHaveLength(3);
      expect(participants[0].userId).toBe('user-1');
      expect(participants[1].userId).toBe('user-2');
      expect(participants[2].userId).toBe('user-3');
      expect(participants[2].role).toBe('admin');
    });

    test('should throw error if bulk creation fails', async () => {
      const participantsData = [
        { conversationId: 'conversation-123', userId: 'user-1' },
        { conversationId: 'conversation-123', userId: 'user-2' },
      ];

      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Bulk insert failed' },
      });

      await expect(ConversationParticipant.createMany(participantsData)).rejects.toThrow(
        'Error creating conversation participants: Bulk insert failed'
      );
    });
  });

  describe('findByConversationId', () => {
    test('should find all participants in a conversation', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: [
          {
            id: 'participant-1',
            conversation_id: 'conversation-123',
            user_id: 'user-1',
            role: 'admin',
            joined_at: '2024-01-01T00:00:00Z',
            last_read_at: '2024-01-02T00:00:00Z',
          },
          {
            id: 'participant-2',
            conversation_id: 'conversation-123',
            user_id: 'user-2',
            role: 'member',
            joined_at: '2024-01-01T00:00:00Z',
            last_read_at: null,
          },
        ],
        error: null,
      });

      const participants = await ConversationParticipant.findByConversationId('conversation-123');

      expect(participants).toHaveLength(2);
      expect(participants[0].conversationId).toBe('conversation-123');
      expect(participants[1].conversationId).toBe('conversation-123');
      expect(participants[0].role).toBe('admin');
      expect(participants[1].role).toBe('member');
    });

    test('should return empty array if no participants found', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: [],
        error: null,
      });

      const participants = await ConversationParticipant.findByConversationId('empty-conversation');

      expect(participants).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(
        ConversationParticipant.findByConversationId('conversation-123')
      ).rejects.toThrow('Error finding participants: Query error');
    });
  });

  describe('isParticipant', () => {
    test('should return true if user is participant', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
        },
        error: null,
      });

      const result = await ConversationParticipant.isParticipant('conversation-123', 'user-456');

      expect(result).toBe(true);
    });

    test('should return false if user is not participant', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await ConversationParticipant.isParticipant('conversation-123', 'user-999');

      expect(result).toBe(false);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Connection error', code: 'DB_ERROR' },
      });

      await expect(
        ConversationParticipant.isParticipant('conversation-123', 'user-456')
      ).rejects.toThrow('Error checking participant: Connection error');
    });
  });

  describe('findByConversationAndUser', () => {
    test('should find participant by conversation and user', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
          conversation_id: 'conversation-123',
          user_id: 'user-456',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: '2024-01-05T10:00:00Z',
        },
        error: null,
      });

      const participant = await ConversationParticipant.findByConversationAndUser(
        'conversation-123',
        'user-456'
      );

      expect(participant).toBeDefined();
      expect(participant.id).toBe('participant-123');
      expect(participant.conversationId).toBe('conversation-123');
      expect(participant.userId).toBe('user-456');
      expect(participant.role).toBe('member');
      expect(participant.lastReadAt).toBe('2024-01-05T10:00:00Z');
    });

    test('should return null if participant not found', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const participant = await ConversationParticipant.findByConversationAndUser(
        'conversation-123',
        'user-999'
      );

      expect(participant).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Query failed', code: 'DB_ERROR' },
      });

      await expect(
        ConversationParticipant.findByConversationAndUser('conversation-123', 'user-456')
      ).rejects.toThrow('Error finding participant: Query failed');
    });
  });

  describe('updateLastRead', () => {
    test('should update last read timestamp', async () => {
      const now = new Date().toISOString();

      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
          conversation_id: 'conversation-123',
          user_id: 'user-456',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: now,
        },
        error: null,
      });

      const updated = await ConversationParticipant.updateLastRead(
        'conversation-123',
        'user-456'
      );

      expect(updated).toBeDefined();
      expect(updated.lastReadAt).toBeDefined();
      expect(updated.conversationId).toBe('conversation-123');
      expect(updated.userId).toBe('user-456');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        ConversationParticipant.updateLastRead('conversation-123', 'user-456')
      ).rejects.toThrow('Error updating last read: Update failed');
    });
  });

  describe('getUnreadCount', () => {
    test('should return unread count when user has last_read_at', async () => {
      // Create individual query mocks for each database call
      const participantQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { last_read_at: '2024-01-05T10:00:00Z' },
          error: null,
        }),
      };

      const messageQuery1 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          count: null, // This count is not used when last_read_at exists
          error: null,
        }),
      };

      const messageQuery2 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValue({
          count: 5, // This is the actual unread count
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(participantQuery)
          .mockReturnValueOnce(messageQuery1)
          .mockReturnValueOnce(messageQuery2),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const unreadCount = await ConversationParticipant.getUnreadCount(
        'conversation-123',
        'user-456'
      );

      expect(unreadCount).toBe(5);
    });

    test('should return total count when user has never read', async () => {
      const participantQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { last_read_at: null },
          error: null,
        }),
      };

      const messageQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(participantQuery)
          .mockReturnValueOnce(messageQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const unreadCount = await ConversationParticipant.getUnreadCount(
        'conversation-123',
        'user-new'
      );

      expect(unreadCount).toBe(10);
    });

    test('should return 0 when all messages are read', async () => {
      const participantQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { last_read_at: '2024-01-10T00:00:00Z' },
          error: null,
        }),
      };

      const messageQuery1 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          count: null,
          error: null,
        }),
      };

      const messageQuery2 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(participantQuery)
          .mockReturnValueOnce(messageQuery1)
          .mockReturnValueOnce(messageQuery2),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const unreadCount = await ConversationParticipant.getUnreadCount(
        'conversation-123',
        'user-456'
      );

      expect(unreadCount).toBe(0);
    });

    test('should throw error if participant lookup fails', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: null,
        error: { message: 'Participant not found' },
      });

      await expect(
        ConversationParticipant.getUnreadCount('conversation-123', 'user-999')
      ).rejects.toThrow('Error getting participant: Participant not found');
    });

    test('should throw error if message count query fails with last_read_at', async () => {
      // Mock participant lookup
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
          conversation_id: 'conversation-123',
          user_id: 'user-456',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: '2024-01-05T10:00:00Z',
        },
        error: null,
      });

      // Mock messages count query error
      mockSupabase.setMockResponse('messages', {
        count: null,
        error: { message: 'Count query failed' },
      });

      await expect(
        ConversationParticipant.getUnreadCount('conversation-123', 'user-456')
      ).rejects.toThrow('Error counting unread messages: Count query failed');
    });

    test('should throw error if message count query fails without last_read_at', async () => {
      // Mock participant lookup with null last_read_at
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-123',
          conversation_id: 'conversation-123',
          user_id: 'user-new',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      // Mock messages count query error
      mockSupabase.setMockResponse('messages', {
        count: null,
        error: { message: 'Count query failed' },
      });

      await expect(
        ConversationParticipant.getUnreadCount('conversation-123', 'user-new')
      ).rejects.toThrow('Error counting messages: Count query failed');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'participant-123',
        conversationId: 'conversation-123',
        userId: 'user-456',
        role: 'member',
        joinedAt: '2024-01-01T00:00:00Z',
        lastReadAt: '2024-01-05T10:00:00Z',
      };

      const dbData = ConversationParticipant._toDbFields(modelData);

      expect(dbData.id).toBe('participant-123');
      expect(dbData.conversation_id).toBe('conversation-123');
      expect(dbData.user_id).toBe('user-456');
      expect(dbData.role).toBe('member');
      expect(dbData.joined_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.last_read_at).toBe('2024-01-05T10:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'participant-123',
        conversation_id: 'conversation-123',
        user_id: 'user-456',
        role: 'admin',
        joined_at: '2024-01-01T00:00:00Z',
        last_read_at: '2024-01-05T10:00:00Z',
      };

      const modelData = ConversationParticipant._toModel(dbData);

      expect(modelData.id).toBe('participant-123');
      expect(modelData.conversationId).toBe('conversation-123');
      expect(modelData.userId).toBe('user-456');
      expect(modelData.role).toBe('admin');
      expect(modelData.joinedAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.lastReadAt).toBe('2024-01-05T10:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = ConversationParticipant._toModel(null);
      expect(modelData).toBeNull();
    });

    test('should handle partial data transformation', () => {
      const partialData = {
        conversationId: 'conversation-123',
        userId: 'user-456',
      };

      const dbData = ConversationParticipant._toDbFields(partialData);

      expect(dbData.conversation_id).toBe('conversation-123');
      expect(dbData.user_id).toBe('user-456');
      expect(dbData.id).toBeUndefined();
      expect(dbData.role).toBeUndefined();
    });
  });

  describe('Participant roles', () => {
    test('should handle admin role', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-admin',
          conversation_id: 'conversation-123',
          user_id: 'user-admin',
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.create({
        conversationId: 'conversation-123',
        userId: 'user-admin',
        role: 'admin',
      });

      expect(participant.role).toBe('admin');
    });

    test('should handle member role', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-member',
          conversation_id: 'conversation-123',
          user_id: 'user-member',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.create({
        conversationId: 'conversation-123',
        userId: 'user-member',
        role: 'member',
      });

      expect(participant.role).toBe('member');
    });
  });

  describe('Last read tracking', () => {
    test('should handle participant with no last read', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-new',
          conversation_id: 'conversation-123',
          user_id: 'user-new',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: null,
        },
        error: null,
      });

      const participant = await ConversationParticipant.findByConversationAndUser(
        'conversation-123',
        'user-new'
      );

      expect(participant.lastReadAt).toBeNull();
    });

    test('should handle participant with last read timestamp', async () => {
      mockSupabase.setMockResponse('conversation_participants', {
        data: {
          id: 'participant-active',
          conversation_id: 'conversation-123',
          user_id: 'user-active',
          role: 'member',
          joined_at: '2024-01-01T00:00:00Z',
          last_read_at: '2024-01-10T15:30:00Z',
        },
        error: null,
      });

      const participant = await ConversationParticipant.findByConversationAndUser(
        'conversation-123',
        'user-active'
      );

      expect(participant.lastReadAt).toBe('2024-01-10T15:30:00Z');
    });
  });
});
