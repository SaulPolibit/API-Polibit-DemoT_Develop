/**
 * Message Model Tests
 * Tests for src/models/supabase/message.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Message = require('../../src/models/supabase/message');

describe('Message Model', () => {
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
    test('should create a text message', async () => {
      const messageData = {
        conversationId: 'conversation-123',
        senderId: 'user-123',
        content: 'Hello, this is a test message',
        type: 'text',
      };

      mockSupabase.setMockResponse('messages', {
        data: {
          id: 'message-123',
          conversation_id: 'conversation-123',
          sender_id: 'user-123',
          content: 'Hello, this is a test message',
          type: 'text',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock user fetch for enrichment
      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      // Mock attachments fetch
      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null,
      });

      // Mock reads fetch
      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null,
      });

      const result = await Message.create(messageData);

      expect(result).toBeDefined();
      expect(result.id).toBe('message-123');
      expect(result.content).toBe('Hello, this is a test message');
    });
  });

  describe('findById', () => {
    test('should find message by ID', async () => {
      mockSupabase.setMockResponse('messages', {
        data: {
          id: 'message-123',
          conversation_id: 'conversation-123',
          content: 'Test message',
          sender_id: 'user-123',
          type: 'text',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock enrichment queries
      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null,
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null,
      });

      const result = await Message.findById('message-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('message-123');
    });

    test('should return null if message not found', async () => {
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await Message.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByConversationId', () => {
    test('should find all messages in a conversation', async () => {
      mockSupabase.setMockResponse('messages', {
        data: [
          {
            id: 'message-1',
            conversation_id: 'conversation-123',
            content: 'First message',
            sender_id: 'user-1',
            type: 'text',
            deleted_at: null,
            created_at: '2024-01-01T10:00:00Z',
          },
          {
            id: 'message-2',
            conversation_id: 'conversation-123',
            content: 'Second message',
            sender_id: 'user-2',
            type: 'text',
            deleted_at: null,
            created_at: '2024-01-01T10:05:00Z',
          },
        ],
        error: null,
      });

      // Mock enrichment
      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null,
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null,
      });

      const result = await Message.findByConversationId('conversation-123');

      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].conversationId).toBe('conversation-123');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update message content', async () => {
      const updateData = {
        content: 'Updated message content',
      };

      mockSupabase.setMockResponse('messages', {
        data: {
          id: 'message-123',
          content: 'Updated message content',
          conversation_id: 'conversation-123',
          sender_id: 'user-123',
          type: 'text',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Message.findByIdAndUpdate('message-123', updateData);

      expect(result.content).toBe('Updated message content');
    });
  });

  describe('softDelete', () => {
    test('should soft delete message successfully', async () => {
      mockSupabase.setMockResponse('messages', {
        data: {
          id: 'message-123',
          conversation_id: 'conversation-123',
          sender_id: 'user-123',
          content: 'Test message',
          type: 'text',
          created_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await Message.softDelete('message-123');

      expect(result.id).toBe('message-123');
      expect(result.deletedAt).toBeDefined();
    });
  });
});
