/**
 * Tests for MessageAttachment Supabase Model
 */

const { createMockSupabaseClient } = require('../../helpers/mockSupabase');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../../src/config/database');
const MessageAttachment = require('../../../src/models/supabase/messageAttachment');

describe('MessageAttachment Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a PDF attachment successfully', async () => {
      const attachmentData = {
        messageId: 'msg-123',
        filePath: '/uploads/documents/report.pdf',
        fileName: 'report.pdf',
        fileSize: 1024567,
        mimeType: 'application/pdf'
      };

      const dbResponse = {
        id: 'att-123',
        message_id: 'msg-123',
        file_path: '/uploads/documents/report.pdf',
        file_name: 'report.pdf',
        file_size: 1024567,
        mime_type: 'application/pdf',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.create(attachmentData);

      expect(result.id).toBe('att-123');
      expect(result.messageId).toBe('msg-123');
      expect(result.filePath).toBe('/uploads/documents/report.pdf');
      expect(result.fileName).toBe('report.pdf');
      expect(result.fileSize).toBe(1024567);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    test('should create an image attachment successfully', async () => {
      const attachmentData = {
        messageId: 'msg-456',
        filePath: '/uploads/images/photo.jpg',
        fileName: 'photo.jpg',
        fileSize: 512000,
        mimeType: 'image/jpeg'
      };

      const dbResponse = {
        id: 'att-456',
        message_id: 'msg-456',
        file_path: '/uploads/images/photo.jpg',
        file_name: 'photo.jpg',
        file_size: 512000,
        mime_type: 'image/jpeg',
        created_at: '2024-01-15T11:00:00Z'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.create(attachmentData);

      expect(result.fileName).toBe('photo.jpg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.fileSize).toBe(512000);
    });

    test('should create a video attachment successfully', async () => {
      const attachmentData = {
        messageId: 'msg-789',
        filePath: '/uploads/videos/demo.mp4',
        fileName: 'demo.mp4',
        fileSize: 10485760,
        mimeType: 'video/mp4'
      };

      const dbResponse = {
        id: 'att-789',
        message_id: 'msg-789',
        file_path: '/uploads/videos/demo.mp4',
        file_name: 'demo.mp4',
        file_size: 10485760,
        mime_type: 'video/mp4'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.create(attachmentData);

      expect(result.fileName).toBe('demo.mp4');
      expect(result.mimeType).toBe('video/mp4');
      expect(result.fileSize).toBe(10485760);
    });

    test('should throw error if creation fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_attachments', {
        data: null,
        error: error
      });

      await expect(MessageAttachment.create({})).rejects.toThrow('Error creating message attachment');
    });
  });

  describe('findByMessageId', () => {
    test('should find all attachments for a message', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-123',
          file_path: '/uploads/file1.pdf',
          file_name: 'file1.pdf',
          file_size: 1000,
          mime_type: 'application/pdf'
        },
        {
          id: 'att-2',
          message_id: 'msg-123',
          file_path: '/uploads/file2.jpg',
          file_name: 'file2.jpg',
          file_size: 2000,
          mime_type: 'image/jpeg'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('att-1');
      expect(result[0].messageId).toBe('msg-123');
      expect(result[0].fileName).toBe('file1.pdf');
      expect(result[1].id).toBe('att-2');
      expect(result[1].fileName).toBe('file2.jpg');
    });

    test('should return empty array if message has no attachments', async () => {
      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-no-attachments');
      expect(result).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_attachments', {
        data: null,
        error: error
      });

      await expect(MessageAttachment.findByMessageId('msg-123')).rejects.toThrow('Error finding attachments');
    });
  });

  describe('findByIdAndDelete', () => {
    test('should delete attachment successfully', async () => {
      const dbResponse = {
        id: 'att-123',
        message_id: 'msg-123',
        file_path: '/uploads/deleted-file.pdf',
        file_name: 'deleted-file.pdf',
        file_size: 5000,
        mime_type: 'application/pdf'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByIdAndDelete('att-123');

      expect(result.id).toBe('att-123');
      expect(result.fileName).toBe('deleted-file.pdf');
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_attachments', {
        data: null,
        error: error
      });

      await expect(MessageAttachment.findByIdAndDelete('att-123')).rejects.toThrow('Error deleting attachment');
    });
  });

  describe('deleteByMessageId', () => {
    test('should delete all attachments for a message', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-123',
          file_path: '/uploads/file1.pdf',
          file_name: 'file1.pdf',
          file_size: 1000,
          mime_type: 'application/pdf'
        },
        {
          id: 'att-2',
          message_id: 'msg-123',
          file_path: '/uploads/file2.jpg',
          file_name: 'file2.jpg',
          file_size: 2000,
          mime_type: 'image/jpeg'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.deleteByMessageId('msg-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('att-1');
      expect(result[1].id).toBe('att-2');
    });

    test('should return empty array if message has no attachments', async () => {
      mockSupabase.setMockResponse('message_attachments', {
        data: [],
        error: null
      });

      const result = await MessageAttachment.deleteByMessageId('msg-no-attachments');
      expect(result).toEqual([]);
    });

    test('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockSupabase.setMockResponse('message_attachments', {
        data: null,
        error: error
      });

      await expect(MessageAttachment.deleteByMessageId('msg-123')).rejects.toThrow('Error deleting attachments');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', async () => {
      const attachmentData = {
        messageId: 'msg-123',
        filePath: '/uploads/document.pdf',
        fileName: 'document.pdf',
        fileSize: 123456,
        mimeType: 'application/pdf'
      };

      const dbResponse = {
        id: 'att-123',
        message_id: 'msg-123',
        file_path: '/uploads/document.pdf',
        file_name: 'document.pdf',
        file_size: 123456,
        mime_type: 'application/pdf',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.create(attachmentData);

      expect(result.messageId).toBe('msg-123');
      expect(result.filePath).toBe('/uploads/document.pdf');
      expect(result.fileName).toBe('document.pdf');
      expect(result.fileSize).toBe(123456);
      expect(result.mimeType).toBe('application/pdf');
    });

    test('should correctly transform snake_case to camelCase', async () => {
      const dbResponse = [
        {
          id: 'att-456',
          message_id: 'msg-456',
          file_path: '/uploads/images/photo.png',
          file_name: 'photo.png',
          file_size: 98765,
          mime_type: 'image/png',
          created_at: '2024-01-15T11:00:00Z'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-456');

      expect(result[0].messageId).toBe('msg-456');
      expect(result[0].filePath).toBe('/uploads/images/photo.png');
      expect(result[0].fileName).toBe('photo.png');
      expect(result[0].fileSize).toBe(98765);
      expect(result[0].mimeType).toBe('image/png');
      expect(result[0].createdAt).toBe('2024-01-15T11:00:00Z');
    });

    test('should handle partial data transformation', async () => {
      const attachmentData = {
        messageId: 'msg-789',
        filePath: '/uploads/file.txt',
        fileName: 'file.txt'
      };

      const dbResponse = {
        id: 'att-789',
        message_id: 'msg-789',
        file_path: '/uploads/file.txt',
        file_name: 'file.txt'
      };

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.create(attachmentData);

      expect(result.messageId).toBe('msg-789');
      expect(result.filePath).toBe('/uploads/file.txt');
      expect(result.fileName).toBe('file.txt');
    });
  });

  describe('File types', () => {
    test('should handle PDF document', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'contract.pdf',
          mime_type: 'application/pdf',
          file_size: 524288
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].mimeType).toBe('application/pdf');
      expect(result[0].fileName).toBe('contract.pdf');
    });

    test('should handle image files', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'photo.jpg',
          mime_type: 'image/jpeg',
          file_size: 204800
        },
        {
          id: 'att-2',
          message_id: 'msg-1',
          file_name: 'logo.png',
          mime_type: 'image/png',
          file_size: 102400
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].mimeType).toBe('image/jpeg');
      expect(result[1].mimeType).toBe('image/png');
    });

    test('should handle Word documents', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'report.docx',
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: 1048576
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileName).toBe('report.docx');
      expect(result[0].mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    test('should handle Excel spreadsheets', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'data.xlsx',
          mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          file_size: 2097152
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileName).toBe('data.xlsx');
      expect(result[0].mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    test('should handle video files', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'presentation.mp4',
          mime_type: 'video/mp4',
          file_size: 52428800
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileName).toBe('presentation.mp4');
      expect(result[0].mimeType).toBe('video/mp4');
    });

    test('should handle text files', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'notes.txt',
          mime_type: 'text/plain',
          file_size: 4096
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileName).toBe('notes.txt');
      expect(result[0].mimeType).toBe('text/plain');
    });

    test('should handle ZIP archives', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'archive.zip',
          mime_type: 'application/zip',
          file_size: 10485760
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileName).toBe('archive.zip');
      expect(result[0].mimeType).toBe('application/zip');
    });
  });

  describe('File size handling', () => {
    test('should handle small files (< 1KB)', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'tiny.txt',
          file_size: 512,
          mime_type: 'text/plain'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileSize).toBe(512);
    });

    test('should handle medium files (< 1MB)', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'medium.pdf',
          file_size: 524288, // 512KB
          mime_type: 'application/pdf'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileSize).toBe(524288);
    });

    test('should handle large files (> 10MB)', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-1',
          file_name: 'large-video.mp4',
          file_size: 52428800, // 50MB
          mime_type: 'video/mp4'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-1');

      expect(result[0].fileSize).toBe(52428800);
    });
  });

  describe('Multiple attachments per message', () => {
    test('should handle message with multiple different file types', async () => {
      const dbResponse = [
        {
          id: 'att-1',
          message_id: 'msg-multi',
          file_name: 'report.pdf',
          file_size: 1024000,
          mime_type: 'application/pdf'
        },
        {
          id: 'att-2',
          message_id: 'msg-multi',
          file_name: 'chart.png',
          file_size: 256000,
          mime_type: 'image/png'
        },
        {
          id: 'att-3',
          message_id: 'msg-multi',
          file_name: 'data.xlsx',
          file_size: 512000,
          mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ];

      mockSupabase.setMockResponse('message_attachments', {
        data: dbResponse,
        error: null
      });

      const result = await MessageAttachment.findByMessageId('msg-multi');

      expect(result).toHaveLength(3);
      expect(result[0].mimeType).toBe('application/pdf');
      expect(result[1].mimeType).toBe('image/png');
      expect(result[2].mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });
});
