/**
 * Tests for Message Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const Message = require('../../../src/models/supabase/message');

describe('Message Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a text message successfully', async () => {
      const messageData = {
        conversationId: 'conv-123',
        senderId: 'user-456',
        content: 'Hello, world!',
        type: 'text'
      };

      // Mock message creation
      const messageResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Hello, world!',
        type: 'text',
        created_at: '2024-01-15T10:00:00Z'
      };

      // Mock enrichment queries
      const userResponse = [
        {
          id: 'user-456',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: messageResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: userResponse,
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.create(messageData);

      expect(result.id).toBe('msg-123');
      expect(result.conversationId).toBe('conv-123');
      expect(result.senderId).toBe('user-456');
      expect(result.content).toBe('Hello, world!');
      expect(result.type).toBe('text');
      expect(result.senderName).toBe('John Doe');
      expect(result.senderEmail).toBe('john@example.com');
      expect(result.attachments).toEqual([]);
      expect(result.readBy).toEqual([]);
    });

    test('should create message with enriched sender details', async () => {
      const messageData = {
        conversationId: 'conv-123',
        senderId: 'user-789',
        content: 'Test message',
        type: 'text'
      };

      mockSupabase.setMockResponse('messages', {
        data: {
          id: 'msg-456',
          conversation_id: 'conv-123',
          sender_id: 'user-789',
          content: 'Test message',
          type: 'text'
        },
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'user-789',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com'
          }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.create(messageData);

      expect(result.senderName).toBe('Jane Smith');
      expect(result.senderEmail).toBe('jane@example.com');
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.create({})).rejects.toThrow('Error creating message');
    });
  });

  describe('findById', () => {
    test('should find message by ID successfully', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Hello',
        type: 'text',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'user-456',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com'
          }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.id).toBe('msg-123');
      expect(result.content).toBe('Hello');
      expect(result.senderName).toBe('John Doe');
    });

    test('should return null if message not found', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      const result = await Message.findById('nonexistent-id');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.findById('msg-123')).rejects.toThrow('Error finding message');
    });
  });

  describe('findByConversationId', () => {
    test('should find messages by conversation ID with pagination', async () => {
      const dbResponse = [
        {
          id: 'msg-1',
          conversation_id: 'conv-123',
          sender_id: 'user-1',
          content: 'Message 1',
          type: 'text',
          created_at: '2024-01-15T10:00:00Z',
          deleted_at: null
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-123',
          sender_id: 'user-2',
          content: 'Message 2',
          type: 'text',
          created_at: '2024-01-15T10:01:00Z',
          deleted_at: null
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-1', first_name: 'User', last_name: 'One', email: 'user1@example.com' },
          { id: 'user-2', first_name: 'User', last_name: 'Two', email: 'user2@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findByConversationId('conv-123');

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
      expect(result.hasMore).toBe(false);
    });

    test('should handle pagination with limit', async () => {
      const dbResponse = [
        { id: 'msg-1', conversation_id: 'conv-123', content: 'M1', deleted_at: null },
        { id: 'msg-2', conversation_id: 'conv-123', content: 'M2', deleted_at: null },
        { id: 'msg-3', conversation_id: 'conv-123', content: 'M3', deleted_at: null }
      ];

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findByConversationId('conv-123', { limit: 2 });

      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });

    test('should exclude deleted messages', async () => {
      const dbResponse = [
        {
          id: 'msg-1',
          conversation_id: 'conv-123',
          content: 'Active message',
          deleted_at: null
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findByConversationId('conv-123');

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].deletedAt).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.findByConversationId('conv-123')).rejects.toThrow('Error finding messages');
    });
  });

  describe('search', () => {
    test('should search messages by content', async () => {
      const dbResponse = [
        {
          id: 'msg-1',
          conversation_id: 'conv-123',
          sender_id: 'user-1',
          content: 'Hello world',
          deleted_at: null
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-123',
          sender_id: 'user-1',
          content: 'world peace',
          deleted_at: null
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-1', first_name: 'User', last_name: 'One', email: 'user1@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.search('conv-123', 'world');

      expect(result).toHaveLength(2);
      expect(result[0].content).toContain('world');
      expect(result[1].content).toContain('world');
    });

    test('should throw error if search fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.search('conv-123', 'test')).rejects.toThrow('Error searching messages');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update message content successfully', async () => {
      const updateData = {
        content: 'Updated content'
      };

      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Updated content',
        type: 'text',
        edited_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findByIdAndUpdate('msg-123', updateData);

      expect(result.id).toBe('msg-123');
      expect(result.content).toBe('Updated content');
      expect(result.editedAt).toBeDefined();
    });

    test('should throw error if update fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.findByIdAndUpdate('msg-123', {})).rejects.toThrow('Error updating message');
    });
  });

  describe('softDelete', () => {
    test('should soft delete message successfully', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Deleted message',
        deleted_at: new Date().toISOString()
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      const result = await Message.softDelete('msg-123');

      expect(result.id).toBe('msg-123');
      expect(result.deletedAt).toBeDefined();
    });

    test('should throw error if soft delete fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.softDelete('msg-123')).rejects.toThrow('Error deleting message');
    });
  });

  describe('getLastMessage', () => {
    test('should get last message in conversation', async () => {
      const dbResponse = {
        id: 'msg-latest',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Latest message',
        type: 'text',
        created_at: '2024-01-20T10:00:00Z',
        deleted_at: null
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.getLastMessage('conv-123');

      expect(result.id).toBe('msg-latest');
      expect(result.content).toBe('Latest message');
    });

    test('should return null if conversation has no messages', async () => {
      const error = new Error('Not found');
      error.code = 'PGRST116';

      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      const result = await Message.getLastMessage('conv-empty');
      expect(result).toBeNull();
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('messages', {
        data: null,
        error: error
      });

      await expect(Message.getLastMessage('conv-123')).rejects.toThrow('Error getting last message');
    });
  });

  describe('Enrichment with attachments', () => {
    test('should enrich message with attachments', async () => {
      const messageResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Message with attachment',
        type: 'text'
      };

      const attachmentsResponse = [
        {
          id: 'att-1',
          message_id: 'msg-123',
          file_name: 'document.pdf',
          file_size: 12345,
          file_path: '/uploads/document.pdf',
          mime_type: 'application/pdf',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: messageResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: attachmentsResponse,
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].fileName).toBe('document.pdf');
      expect(result.attachments[0].fileSize).toBe(12345);
      expect(result.attachments[0].mimeType).toBe('application/pdf');
    });

    test('should handle multiple attachments', async () => {
      const messageResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Multiple attachments'
      };

      const attachmentsResponse = [
        {
          id: 'att-1',
          message_id: 'msg-123',
          file_name: 'file1.pdf',
          file_size: 1000,
          file_path: '/uploads/file1.pdf',
          mime_type: 'application/pdf'
        },
        {
          id: 'att-2',
          message_id: 'msg-123',
          file_name: 'image.jpg',
          file_size: 2000,
          file_path: '/uploads/image.jpg',
          mime_type: 'image/jpeg'
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: messageResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: attachmentsResponse,
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.attachments).toHaveLength(2);
      expect(result.attachments[0].fileName).toBe('file1.pdf');
      expect(result.attachments[1].fileName).toBe('image.jpg');
    });
  });

  describe('Enrichment with read status', () => {
    test('should enrich message with read status', async () => {
      const messageResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Read message'
      };

      const readsResponse = [
        {
          message_id: 'msg-123',
          user_id: 'user-1'
        },
        {
          message_id: 'msg-123',
          user_id: 'user-2'
        }
      ];

      mockSupabase.setMockResponse('messages', {
        data: messageResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: readsResponse,
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.readBy).toHaveLength(2);
      expect(result.readBy).toContain('user-1');
      expect(result.readBy).toContain('user-2');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const messageData = {
        conversationId: 'conv-123',
        senderId: 'user-456',
        content: 'Test message',
        type: 'text'
      };

      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-456',
        content: 'Test message',
        type: 'text',
        created_at: '2024-01-15T10:00:00Z',
        edited_at: null,
        deleted_at: null
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-456', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.create(messageData);

      expect(result.conversationId).toBe('conv-123');
      expect(result.senderId).toBe('user-456');
      expect(result.content).toBe('Test message');
      expect(result.type).toBe('text');
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-456',
        sender_id: 'user-789',
        content: 'Another message',
        type: 'text',
        created_at: '2024-01-15T10:00:00Z',
        edited_at: '2024-01-15T11:00:00Z',
        deleted_at: null
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-789', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.conversationId).toBe('conv-456');
      expect(result.senderId).toBe('user-789');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
      expect(result.editedAt).toBe('2024-01-15T11:00:00Z');
      expect(result.deletedAt).toBeNull();
    });

    test('should handle null values in transformation', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-123',
        content: 'Message',
        edited_at: null,
        deleted_at: null
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [
          { id: 'user-123', first_name: 'User', last_name: 'Name', email: 'user@example.com' }
        ],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.editedAt).toBeNull();
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('Message types', () => {
    test('should handle text message type', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        content: 'Text message',
        type: 'text'
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.type).toBe('text');
    });

    test('should handle image message type', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        content: 'Image description',
        type: 'image'
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.type).toBe('image');
    });

    test('should handle file message type', async () => {
      const dbResponse = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        content: 'File uploaded',
        type: 'file'
      };

      mockSupabase.setMockResponse('messages', {
        data: dbResponse,
        error: null
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      mockSupabase.setMockResponse('message_reads', {
        data: [],
        error: null
      });

      const result = await Message.findById('msg-123');

      expect(result.type).toBe('file');
    });
  });
});
