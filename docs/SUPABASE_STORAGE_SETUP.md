# Supabase Storage Setup for Document Uploads

This guide explains how to set up Supabase Storage for document file uploads.

## Prerequisites

- Supabase project created
- Supabase client configured in your application

## Steps to Configure Supabase Storage

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: ✅ Check this (to allow public file access)
   - **File size limit**: 10 MB (or as needed)
   - **Allowed MIME types**: Leave empty to allow all types defined in middleware

### 2. Set Storage Policies (Required)

You need to configure Row Level Security (RLS) policies for the storage bucket. Go to **SQL Editor** in Supabase and run these queries:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Allow public access to read files (since bucket is public)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

**⚠️ IMPORTANT**: Run these policies in your Supabase SQL Editor **after** creating the bucket, otherwise file uploads will fail with "row-level security policy" error.

### 3. Bucket Structure

Files will be organized in folders by entity type and ID:

```
documents/
├── structures/
│   └── {structure-id}/
│       ├── document1_timestamp.pdf
│       └── document2_timestamp.docx
├── investors/
│   └── {investor-id}/
│       └── kyc_timestamp.pdf
├── investments/
│   └── {investment-id}/
│       └── agreement_timestamp.pdf
├── capitalcalls/
│   └── {capital-call-id}/
│       └── notice_timestamp.pdf
└── distributions/
    └── {distribution-id}/
        └── report_timestamp.pdf
```

## API Usage

### Upload Document

**Endpoint**: `POST /api/documents`

**Headers**:
- `Authorization`: Bearer token
- `Content-Type`: multipart/form-data

**Form Data**:
- `file`: The file to upload (required)
- `entityType`: Structure | Investor | Investment | CapitalCall | Distribution
- `entityId`: UUID of the entity
- `documentType`: Type of document (e.g., "Contract", "Invoice", "Report")
- `documentName`: Display name for the document
- `tags`: JSON array of tags (optional)
- `metadata`: JSON object with additional metadata (optional)
- `notes`: Additional notes (optional)

**Example using cURL**:
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "entityType=Structure" \
  -F "entityId=123e4567-e89b-12d3-a456-426614174000" \
  -F "documentType=Contract" \
  -F "documentName=Investment Agreement" \
  -F "tags=[\"legal\",\"important\"]" \
  -F "notes=Signed on 2024-01-01"
```

**Example using Postman**:
1. Set method to POST
2. URL: `http://localhost:3000/api/documents`
3. Headers:
   - Add Authorization: `Bearer YOUR_TOKEN`
4. Body → form-data:
   - `file`: Select file
   - `entityType`: Structure
   - `entityId`: 123e4567-e89b-12d3-a456-426614174000
   - `documentType`: Contract
   - `documentName`: Investment Agreement
   - `tags`: ["legal","important"]
   - `notes`: Signed on 2024-01-01

### Create New Document Version

**Endpoint**: `POST /api/documents/:id/new-version`

**Form Data**:
- `file`: The new version file (required)

**Example**:
```bash
curl -X POST http://localhost:3000/api/documents/{document-id}/new-version \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/new-version.pdf"
```

## File Restrictions

**Allowed File Types**:
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
- Images: JPEG, PNG, GIF, WebP, SVG
- Archives: ZIP, RAR, 7Z

**Maximum File Size**: 10 MB

## Response Format

Successful upload response:
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": "doc-uuid",
    "entityType": "Structure",
    "entityId": "entity-uuid",
    "documentType": "Contract",
    "documentName": "Investment Agreement",
    "filePath": "https://your-project.supabase.co/storage/v1/object/public/documents/structures/entity-uuid/document_timestamp.pdf",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "uploadedBy": "user-uuid",
    "version": 1,
    "isActive": true,
    "tags": ["legal", "important"],
    "metadata": {},
    "notes": "Signed on 2024-01-01",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "uploadDetails": {
      "storagePath": "structures/entity-uuid/document_timestamp.pdf",
      "fileName": "document_timestamp.pdf"
    }
  }
}
```

## Troubleshooting

### Error: "new row violates row-level security policy"

**Solution**: You need to configure storage policies. Run the SQL file `docs/setup-storage-policies.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → **SQL Editor**
2. Create a new query
3. Copy and paste the content from `docs/setup-storage-policies.sql`
4. Click **Run**

This will create the necessary policies to allow authenticated users to upload, update, and delete files.

### Error: "Error uploading file to storage"

**Solution**:
1. Make sure the `documents` bucket exists in Supabase Storage
2. Make sure the bucket is marked as **public**
3. Ensure storage policies are configured (see above)

### Error: "File type not allowed"

**Solution**: Check that the file MIME type is in the allowed list in `/src/middleware/upload.js`.

### Error: "File too large"

**Solution**: The maximum file size is 10MB. Reduce the file size or update the limit in `/src/middleware/upload.js`.

## Security Notes

1. **Authentication Required**: All upload endpoints require authentication
2. **Entity Validation**: The system validates that the entity exists and belongs to the authenticated user
3. **File Type Validation**: Only allowed file types can be uploaded
4. **File Size Limits**: Files larger than 10MB are rejected
5. **Public URLs**: Files are stored with public URLs for easy access (authenticated users only via API)
