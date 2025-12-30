/**
 * Document Model Tests
 * Tests for src/models/supabase/document.js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

// Mock database
jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const Document = require('../../src/models/supabase/document');

describe('Document Model', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    getSupabase.mockReturnValue(mockSupabase);
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new document successfully', async () => {
      const documentData = {
        entityType: 'Structure',
        entityId: 'structure-123',
        documentType: 'PPM',
        documentName: 'Private Placement Memorandum 2024',
        filePath: 'documents/ppm-2024.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-admin',
        version: 1,
        isActive: true,
        tags: ['legal', 'offering'],
        metadata: { year: 2024 },
        notes: 'Initial offering document',
        userId: 'user-admin',
      };

      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'Private Placement Memorandum 2024',
          file_path: 'documents/ppm-2024.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: ['legal', 'offering'],
          metadata: { year: 2024 },
          notes: 'Initial offering document',
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const document = await Document.create(documentData);

      expect(document).toBeDefined();
      expect(document.id).toBe('document-123');
      expect(document.entityType).toBe('Structure');
      expect(document.documentType).toBe('PPM');
      expect(document.documentName).toBe('Private Placement Memorandum 2024');
      expect(document.version).toBe(1);
      expect(document.isActive).toBe(true);
      expect(document.tags).toEqual(['legal', 'offering']);
    });

    test('should throw error if creation fails', async () => {
      const documentData = {
        entityType: 'Structure',
        entityId: 'structure-123',
        documentType: 'PPM',
      };

      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Database constraint violation' },
      });

      await expect(Document.create(documentData)).rejects.toThrow(
        'Error creating document: Database constraint violation'
      );
    });
  });

  describe('findById', () => {
    test('should find document by ID with user enrichment', async () => {
      // Mock document query
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: ['legal'],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      // Mock users query for enrichment
      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'user-admin',
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
          },
        ],
        error: null,
      });

      const document = await Document.findById('document-123');

      expect(document).toBeDefined();
      expect(document.id).toBe('document-123');
      expect(document.uploaderName).toBe('Admin User');
      expect(document.uploaderEmail).toBe('admin@example.com');
    });

    test('should return null if document not found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const document = await Document.findById('nonexistent-id');

      expect(document).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Connection error', code: 'DB_ERROR' },
      });

      await expect(Document.findById('document-123')).rejects.toThrow(
        'Error finding document: Connection error'
      );
    });
  });

  describe('find', () => {
    test('should find all documents with user enrichment', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-1',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: ['legal'],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [
          {
            id: 'user-admin',
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@example.com',
          },
        ],
        error: null,
      });

      const documents = await Document.find();

      expect(documents).toHaveLength(1);
      expect(documents[0].uploaderName).toBe('Admin User');
    });

    test('should return empty array if no documents found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [],
        error: null,
      });

      const documents = await Document.find({ entityId: 'nonexistent' });

      expect(documents).toEqual([]);
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(Document.find()).rejects.toThrow(
        'Error finding documents: Query error'
      );
    });
  });

  describe('findByEntity', () => {
    test('should find documents by entity type and ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-1',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const documents = await Document.findByEntity('Structure', 'structure-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].entityType).toBe('Structure');
      expect(documents[0].entityId).toBe('structure-123');
    });
  });

  describe('findByStructure', () => {
    test('should find documents by structure ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-1',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const documents = await Document.findByStructure('structure-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].entityType).toBe('Structure');
    });
  });

  describe('findByInvestor', () => {
    test('should find documents by investor ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-1',
            entity_type: 'Investor',
            entity_id: 'investor-123',
            document_type: 'Subscription Agreement',
            document_name: 'Sub Agreement',
            file_path: 'documents/sub.pdf',
            file_size: 1024000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'investor-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const documents = await Document.findByInvestor('investor-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].entityType).toBe('Investor');
    });
  });

  describe('findByInvestment', () => {
    test('should find documents by investment ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [],
        error: null,
      });

      const documents = await Document.findByInvestment('investment-123');

      expect(documents).toEqual([]);
    });
  });

  describe('findByCapitalCall', () => {
    test('should find documents by capital call ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [],
        error: null,
      });

      const documents = await Document.findByCapitalCall('capital-call-123');

      expect(documents).toEqual([]);
    });
  });

  describe('findByDistribution', () => {
    test('should find documents by distribution ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [],
        error: null,
      });

      const documents = await Document.findByDistribution('distribution-123');

      expect(documents).toEqual([]);
    });
  });

  describe('findByDocumentType', () => {
    test('should find documents by document type', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-ppm',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const documents = await Document.findByDocumentType('PPM', 'Structure', 'structure-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].documentType).toBe('PPM');
    });
  });

  describe('findByUserId', () => {
    test('should find documents by user ID', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-1',
            entity_type: 'Investor',
            entity_id: 'investor-123',
            document_type: 'W9',
            document_name: 'Tax Form W9',
            file_path: 'documents/w9.pdf',
            file_size: 512000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-123',
            version: 1,
            is_active: true,
            tags: ['tax'],
            metadata: {},
            notes: null,
            user_id: 'user-123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const documents = await Document.findByUserId('user-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].userId).toBe('user-123');
    });
  });

  describe('findByIdAndUpdate', () => {
    test('should update document successfully', async () => {
      const updateData = {
        documentName: 'Updated PPM 2024',
        notes: 'Updated notes',
      };

      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'Updated PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: [],
          metadata: {},
          notes: 'Updated notes',
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const updated = await Document.findByIdAndUpdate('document-123', updateData);

      expect(updated).toBeDefined();
      expect(updated.documentName).toBe('Updated PPM 2024');
      expect(updated.notes).toBe('Updated notes');
    });

    test('should throw error if update fails', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(
        Document.findByIdAndUpdate('document-123', { documentName: 'Test' })
      ).rejects.toThrow('Error updating document: Update failed');
    });
  });

  describe('softDelete', () => {
    test('should soft delete document by marking as inactive', async () => {
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: false,
          tags: [],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const deleted = await Document.softDelete('document-123');

      expect(deleted).toBeDefined();
      expect(deleted.isActive).toBe(false);
    });
  });

  describe('findByIdAndDelete', () => {
    test('should hard delete document successfully', async () => {
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: [],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

      const deleted = await Document.findByIdAndDelete('document-123');

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe('document-123');
    });

    test('should throw error if deletion fails', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Deletion failed' },
      });

      await expect(Document.findByIdAndDelete('document-123')).rejects.toThrow(
        'Error deleting document: Deletion failed'
      );
    });
  });

  describe('search', () => {
    test('should search documents by term', async () => {
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'document-1',
              entity_type: 'Structure',
              entity_id: 'structure-123',
              document_type: 'PPM',
              document_name: 'Private Placement Memorandum',
              file_path: 'documents/ppm.pdf',
              file_size: 2048000,
              mime_type: 'application/pdf',
              uploaded_by: 'user-admin',
              version: 1,
              is_active: true,
              tags: ['legal'],
              metadata: {},
              notes: null,
              user_id: 'user-admin',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
          error: null,
        }),
      };

      const userQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(searchQuery)
          .mockReturnValueOnce(userQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const documents = await Document.search('Placement', 'Structure', null);

      expect(documents).toHaveLength(1);
    });

    test('should throw error if search fails', async () => {
      const searchQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Search error' },
        }),
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue(searchQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      await expect(Document.search('test')).rejects.toThrow(
        'Error searching documents: Search error'
      );
    });
  });

  describe('getCountByEntity', () => {
    test('should count documents by entity', async () => {
      const countQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      // Chain returns itself twice, then resolves on third call
      countQuery.eq
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(countQuery)
        .mockResolvedValueOnce({
          count: 5,
          error: null,
        });

      const mockSupabase = {
        from: jest.fn().mockReturnValue(countQuery),
      };

      getSupabase.mockReturnValue(mockSupabase);

      const count = await Document.getCountByEntity('Structure', 'structure-123');

      expect(count).toBe(5);
    });

    test('should throw error if count fails', async () => {
      mockSupabase.setMockResponse('documents', {
        count: null,
        error: { message: 'Count error' },
      });

      await expect(
        Document.getCountByEntity('Structure', 'structure-123')
      ).rejects.toThrow('Error counting documents: Count error');
    });
  });

  describe('getLatestVersion', () => {
    test('should get latest document version', async () => {
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-v3',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm-v3.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 3,
          is_active: true,
          tags: [],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const latest = await Document.getLatestVersion('Structure', 'structure-123', 'PPM');

      expect(latest).toBeDefined();
      expect(latest.version).toBe(3);
    });

    test('should return null if no version found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      const latest = await Document.getLatestVersion('Structure', 'structure-123', 'PPM');

      expect(latest).toBeNull();
    });

    test('should throw error on database failure', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Query error', code: 'DB_ERROR' },
      });

      await expect(
        Document.getLatestVersion('Structure', 'structure-123', 'PPM')
      ).rejects.toThrow('Error finding latest version: Query error');
    });
  });

  describe('createNewVersion', () => {
    test('should create new version of document', async () => {
      // createNewVersion calls:
      // 1. findById (which queries documents + users)
      // 2. softDelete (which updates documents)
      // 3. create (which inserts documents)

      // Mock findById - documents query
      const findByIdDocQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'document-v1',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm-v1.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 1,
            is_active: true,
            tags: ['legal'],
            metadata: { year: 2024 },
            notes: 'Version 1',
            user_id: 'user-admin',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      };

      // Mock findById - users query
      const findByIdUserQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Mock softDelete - update query (calls findByIdAndUpdate)
      const softDeleteQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'document-v1',
            is_active: false,
          },
          error: null,
        }),
      };

      // Mock create - insert query
      const createQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'document-v2',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm-v2.pdf',
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            version: 2,
            is_active: true,
            tags: ['legal'],
            metadata: { year: 2024 },
            notes: 'Version 1',
            user_id: 'user-admin',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: jest.fn()
          .mockReturnValueOnce(findByIdDocQuery)     // findById - documents
          .mockReturnValueOnce(findByIdUserQuery)    // findById - users
          .mockReturnValueOnce(softDeleteQuery)      // softDelete - update
          .mockReturnValueOnce(createQuery),         // create - insert
      };

      getSupabase.mockReturnValue(mockSupabase);

      const newVersion = await Document.createNewVersion(
        'document-v1',
        'documents/ppm-v2.pdf',
        'user-admin'
      );

      expect(newVersion).toBeDefined();
      expect(newVersion.version).toBe(2);
      expect(newVersion.filePath).toBe('documents/ppm-v2.pdf');
    });

    test('should throw error if document not found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        Document.createNewVersion('nonexistent', 'new-path.pdf', 'user-admin')
      ).rejects.toThrow('Document not found');
    });
  });

  describe('getAllVersions', () => {
    test('should get all versions of a document', async () => {
      mockSupabase.setMockResponse('documents', {
        data: [
          {
            id: 'document-v3',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm-v3.pdf',
            version: 3,
            is_active: true,
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-03-01T00:00:00Z',
            updated_at: '2024-03-01T00:00:00Z',
          },
          {
            id: 'document-v2',
            entity_type: 'Structure',
            entity_id: 'structure-123',
            document_type: 'PPM',
            document_name: 'PPM 2024',
            file_path: 'documents/ppm-v2.pdf',
            version: 2,
            is_active: false,
            file_size: 2048000,
            mime_type: 'application/pdf',
            uploaded_by: 'user-admin',
            tags: [],
            metadata: {},
            notes: null,
            user_id: 'user-admin',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
          },
        ],
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const versions = await Document.getAllVersions('Structure', 'structure-123', 'PPM');

      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(3);
      expect(versions[1].version).toBe(2);
    });

    test('should throw error if query fails', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { message: 'Query error' },
      });

      await expect(
        Document.getAllVersions('Structure', 'structure-123', 'PPM')
      ).rejects.toThrow('Error finding document versions: Query error');
    });
  });

  describe('addTags', () => {
    test('should add tags to document', async () => {
      // Mock findById
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: ['legal', 'compliance', 'updated'],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const updated = await Document.addTags('document-123', ['compliance', 'updated']);

      expect(updated).toBeDefined();
      expect(updated.tags).toContain('legal');
      expect(updated.tags).toContain('compliance');
      expect(updated.tags).toContain('updated');
    });

    test('should throw error if document not found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(Document.addTags('nonexistent', ['tag'])).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('removeTags', () => {
    test('should remove tags from document', async () => {
      // Mock findById
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: ['legal'],
          metadata: {},
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const updated = await Document.removeTags('document-123', ['compliance']);

      expect(updated).toBeDefined();
      expect(updated.tags).toEqual(['legal']);
      expect(updated.tags).not.toContain('compliance');
    });

    test('should throw error if document not found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(Document.removeTags('nonexistent', ['tag'])).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('updateMetadata', () => {
    test('should update document metadata', async () => {
      // Mock findById
      mockSupabase.setMockResponse('documents', {
        data: {
          id: 'document-123',
          entity_type: 'Structure',
          entity_id: 'structure-123',
          document_type: 'PPM',
          document_name: 'PPM 2024',
          file_path: 'documents/ppm.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'user-admin',
          version: 1,
          is_active: true,
          tags: [],
          metadata: { year: 2024, status: 'approved' },
          notes: null,
          user_id: 'user-admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.setMockResponse('users', {
        data: [],
        error: null,
      });

      const updated = await Document.updateMetadata('document-123', { status: 'approved' });

      expect(updated).toBeDefined();
      expect(updated.metadata.year).toBe(2024);
      expect(updated.metadata.status).toBe('approved');
    });

    test('should throw error if document not found', async () => {
      mockSupabase.setMockResponse('documents', {
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        Document.updateMetadata('nonexistent', { key: 'value' })
      ).rejects.toThrow('Document not found');
    });
  });

  describe('Field transformation', () => {
    test('should correctly transform camelCase to snake_case', () => {
      const modelData = {
        id: 'document-123',
        entityType: 'Structure',
        entityId: 'structure-123',
        documentType: 'PPM',
        documentName: 'PPM 2024',
        filePath: 'documents/ppm.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
        uploadedBy: 'user-admin',
        version: 1,
        isActive: true,
        tags: ['legal'],
        metadata: { year: 2024 },
        notes: 'Test notes',
        userId: 'user-admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const dbData = Document._toDbFields(modelData);

      expect(dbData.id).toBe('document-123');
      expect(dbData.entity_type).toBe('Structure');
      expect(dbData.entity_id).toBe('structure-123');
      expect(dbData.document_type).toBe('PPM');
      expect(dbData.document_name).toBe('PPM 2024');
      expect(dbData.file_path).toBe('documents/ppm.pdf');
      expect(dbData.file_size).toBe(2048000);
      expect(dbData.mime_type).toBe('application/pdf');
      expect(dbData.uploaded_by).toBe('user-admin');
      expect(dbData.version).toBe(1);
      expect(dbData.is_active).toBe(true);
      expect(dbData.tags).toEqual(['legal']);
      expect(dbData.metadata).toEqual({ year: 2024 });
      expect(dbData.notes).toBe('Test notes');
      expect(dbData.user_id).toBe('user-admin');
      expect(dbData.created_at).toBe('2024-01-01T00:00:00Z');
      expect(dbData.updated_at).toBe('2024-01-01T00:00:00Z');
    });

    test('should correctly transform snake_case to camelCase', () => {
      const dbData = {
        id: 'document-123',
        entity_type: 'Structure',
        entity_id: 'structure-123',
        document_type: 'PPM',
        document_name: 'PPM 2024',
        file_path: 'documents/ppm.pdf',
        file_size: 2048000,
        mime_type: 'application/pdf',
        uploaded_by: 'user-admin',
        version: 1,
        is_active: true,
        tags: ['legal'],
        metadata: { year: 2024 },
        notes: 'Test',
        user_id: 'user-admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const modelData = Document._toModel(dbData);

      expect(modelData.id).toBe('document-123');
      expect(modelData.entityType).toBe('Structure');
      expect(modelData.entityId).toBe('structure-123');
      expect(modelData.documentType).toBe('PPM');
      expect(modelData.documentName).toBe('PPM 2024');
      expect(modelData.filePath).toBe('documents/ppm.pdf');
      expect(modelData.fileSize).toBe(2048000);
      expect(modelData.mimeType).toBe('application/pdf');
      expect(modelData.uploadedBy).toBe('user-admin');
      expect(modelData.version).toBe(1);
      expect(modelData.isActive).toBe(true);
      expect(modelData.tags).toEqual(['legal']);
      expect(modelData.metadata).toEqual({ year: 2024 });
      expect(modelData.notes).toBe('Test');
      expect(modelData.userId).toBe('user-admin');
      expect(modelData.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(modelData.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    test('should handle null values in transformation', () => {
      const modelData = Document._toModel(null);
      expect(modelData).toBeNull();
    });
  });
});
