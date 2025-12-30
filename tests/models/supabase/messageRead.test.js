/**
 * Tests for MessageRead Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const MessageRead = require('../../../src/models/supabase/messageRead');

describe('MessageRead Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('markAsRead', () => {
    test('should mark message as read successfully', async () => {
      const dbResponse = {
        id: 'read-123',
        message_id: 'msg-456',
        user_id: 'user-789',
        read_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-456', 'user-789');

      expect(result.id).toBe('read-123');
      expect(result.messageId).toBe('msg-456');
      expect(result.userId).toBe('user-789');
      expect(result.readAt).toBeDefined();
    });

    test('should be idempotent when marking same message as read twice', async () => {
      const dbResponse = {
        id: 'read-123',
        message_id: 'msg-456',
        user_id: 'user-789',
        read_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-456', 'user-789');

      expect(result.messageId).toBe('msg-456');
      expect(result.userId).toBe('user-789');
    });

    test('should handle marking message as read for different users', async () => {
      const dbResponse = {
        id: 'read-456',
        message_id: 'msg-123',
        user_id: 'user-different',
        read_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-123', 'user-different');

      expect(result.messageId).toBe('msg-123');
      expect(result.userId).toBe('user-different');
    });

    test('should throw error if marking as read fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      await expect(MessageRead.markAsRead('msg-456', 'user-789')).rejects.toThrow('Error marking message as read');
    });
  });

  describe('isRead', () => {
    test('should return true if message was read by user', async () => {
      const dbResponse = {
        id: 'read-123'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.isRead('msg-456', 'user-789');

      expect(result).toBe(true);
    });

    test('should return false if message was not read by user', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      const result = await MessageRead.isRead('msg-unread', 'user-789');

      expect(result).toBe(false);
    });

    test('should return false for different user who has not read message', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      const result = await MessageRead.isRead('msg-456', 'user-other');

      expect(result).toBe(false);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      await expect(MessageRead.isRead('msg-456', 'user-789')).rejects.toThrow('Error checking read status');
    });
  });

  describe('getReadBy', () => {
    test('should get all users who read a message', async () => {
      const dbResponse = [
        { user_id: 'user-1' },
        { user_id: 'user-2' },
        { user_id: 'user-3' }
      ];

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.getReadBy('msg-123');

      expect(result).toEqual(['user-1', 'user-2', 'user-3']);
      expect(result).toHaveLength(3);
    });

    test('should return empty array if no one has read the message', async () => {
      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await MessageRead.getReadBy('msg-unread');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should return single user who read the message', async () => {
      const dbResponse = [
        { user_id: 'user-solo' }
      ];

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.getReadBy('msg-single-reader');

      expect(result).toEqual(['user-solo']);
      expect(result).toHaveLength(1);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      await expect(MessageRead.getReadBy('msg-123')).rejects.toThrow('Error getting read status');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'read-123',
        message_id: 'msg-456',
        user_id: 'user-789',
        read_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-456', 'user-789');

      expect(result.id).toBe('read-123');
      expect(result.messageId).toBe('msg-456');
      expect(result.userId).toBe('user-789');
      expect(result.readAt).toBe('2024-01-15T10:00:00Z');
    });

    test('should handle transformation in markAsRead', async () => {
      const dbResponse = {
        id: 'read-new',
        message_id: 'msg-new',
        user_id: 'user-new',
        read_at: '2024-01-20T15:30:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-new', 'user-new');

      expect(result.messageId).toBe('msg-new');
      expect(result.userId).toBe('user-new');
      expect(result.readAt).toBe('2024-01-20T15:30:00Z');
    });
  });

  describe('Read tracking scenarios', () => {
    test('should track when message is read immediately after sending', async () => {
      const readAt = new Date().toISOString();
      const dbResponse = {
        id: 'read-immediate',
        message_id: 'msg-sent',
        user_id: 'user-recipient',
        read_at: readAt
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.markAsRead('msg-sent', 'user-recipient');

      expect(result.readAt).toBeDefined();
    });

    test('should track multiple users reading the same message', async () => {
      // First user reads
      const dbResponse1 = {
        id: 'read-1',
        message_id: 'msg-group',
        user_id: 'user-1',
        read_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse1,
        error: null
      });

      const result1 = await MessageRead.markAsRead('msg-group', 'user-1');
      expect(result1.userId).toBe('user-1');

      // Second user reads
      const dbResponse2 = {
        id: 'read-2',
        message_id: 'msg-group',
        user_id: 'user-2',
        read_at: '2024-01-15T10:05:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse2,
        error: null
      });

      const result2 = await MessageRead.markAsRead('msg-group', 'user-2');
      expect(result2.userId).toBe('user-2');
    });

    test('should handle group conversation with multiple readers', async () => {
      const dbResponse = [
        { user_id: 'user-1' },
        { user_id: 'user-2' },
        { user_id: 'user-3' },
        { user_id: 'user-4' },
        { user_id: 'user-5' }
      ];

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result = await MessageRead.getReadBy('msg-group-chat');

      expect(result).toHaveLength(5);
      expect(result).toContain('user-1');
      expect(result).toContain('user-5');
    });

    test('should verify sender can check if recipient read their message', async () => {
      // Recipient reads the message
      const markResponse = {
        id: 'read-confirm',
        message_id: 'msg-dm',
        user_id: 'user-recipient',
        read_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: markResponse,
        error: null
      });

      await MessageRead.markAsRead('msg-dm', 'user-recipient');

      // Sender checks if message was read
      const checkResponse = {
        id: 'read-confirm'
      };

      mockSupabase.setMockResponse('message_reads', {
        data: checkResponse,
        error: null
      });

      const isRead = await MessageRead.isRead('msg-dm', 'user-recipient');
      expect(isRead).toBe(true);
    });

    test('should distinguish between unread and read messages in conversation', async () => {
      // Message 1 is read
      mockSupabase.setMockResponse('message_reads', {
        data: { id: 'read-1' },
        error: null
      });

      const isMsg1Read = await MessageRead.isRead('msg-1', 'user-123');
      expect(isMsg1Read).toBe(true);

      // Message 2 is not read
      const notFoundError = new Error('Not found');
      notFoundError.code = 'PGRST116';

      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: notFoundError
      });

      const isMsg2Read = await MessageRead.isRead('msg-2', 'user-123');
      expect(isMsg2Read).toBe(false);
    });
  });

  describe('Upsert behavior', () => {
    test('should update read_at timestamp on second read', async () => {
      const firstReadTime = '2024-01-15T10:00:00Z';
      const secondReadTime = '2024-01-15T11:00:00Z';

      // First read
      mockSupabase.setMockResponse('message_reads', {
        data: {
          id: 'read-123',
          message_id: 'msg-456',
          user_id: 'user-789',
          read_at: firstReadTime
        },
        error: null
      });

      const firstResult = await MessageRead.markAsRead('msg-456', 'user-789');
      expect(firstResult.readAt).toBe(firstReadTime);

      // Second read (should update)
      mockSupabase.setMockResponse('message_reads', {
        data: {
          id: 'read-123',
          message_id: 'msg-456',
          user_id: 'user-789',
          read_at: secondReadTime
        },
        error: null
      });

      const secondResult = await MessageRead.markAsRead('msg-456', 'user-789');
      expect(secondResult.readAt).toBe(secondReadTime);
    });
  });

  describe('Edge cases', () => {
    test('should handle marking message as read by same user multiple times', async () => {
      const dbResponse = {
        id: 'read-same',
        message_id: 'msg-repeat',
        user_id: 'user-persistent',
        read_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      // Mark as read first time
      const result1 = await MessageRead.markAsRead('msg-repeat', 'user-persistent');
      expect(result1.userId).toBe('user-persistent');

      // Mark as read second time (should not error)
      mockSupabase.setMockResponse('message_reads', {
        data: dbResponse,
        error: null
      });

      const result2 = await MessageRead.markAsRead('msg-repeat', 'user-persistent');
      expect(result2.userId).toBe('user-persistent');
    });

    test('should handle checking read status for non-existent message', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('message_reads', {
        data: null,
        error: error
      });

      const result = await MessageRead.isRead('msg-nonexistent', 'user-123');
      expect(result).toBe(false);
    });

    test('should handle getting readers for message with no reads', async () => {
      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await MessageRead.getReadBy('msg-zero-readers');
      expect(result).toEqual([]);
    });
  });
});
