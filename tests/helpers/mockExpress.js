/**
 * Mock Express Request and Response Helper
 * Provides mocked req and res objects for testing routes
 */

/**
 * Create a mock request object
 * @param {Object} options - Request options
 * @returns {Object} Mock request
 */
function createMockRequest(options = {}) {
  return {
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    headers: options.headers || {},
    file: options.file || null,
    files: options.files || null,
    // Authentication data
    auth: options.auth || {},
    user: options.user || {},
    // Method helpers
    get: jest.fn((header) => options.headers?.[header]),
    ...options
  };
}

/**
 * Create a mock response object
 * @returns {Object} Mock response with jest spies
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    headers: {},
  };

  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.send = jest.fn((data) => {
    res.data = data;
    return res;
  });

  res.setHeader = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });

  res.header = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });

  return res;
}

/**
 * Create a mock next function for middleware testing
 * @returns {Function} Mock next function
 */
function createMockNext() {
  return jest.fn();
}

/**
 * Mock authenticated user in request
 * @param {Object} req - Request object
 * @param {Object} userData - User data
 * @returns {Object} Modified request
 */
function mockAuthenticatedUser(req, userData = {}) {
  req.auth = {
    userId: userData.id || 'user-123',
    userRole: userData.role !== undefined ? userData.role : 1,
    ...userData
  };
  req.user = {
    id: userData.id || 'user-123',
    email: userData.email || 'test@example.com',
    role: userData.role !== undefined ? userData.role : 1,
    ...userData
  };
  return req;
}

/**
 * Mock file upload in request
 * @param {Object} req - Request object
 * @param {Object} fileData - File data
 * @returns {Object} Modified request
 */
function mockFileUpload(req, fileData = {}) {
  req.file = {
    buffer: Buffer.from(fileData.content || 'test file content'),
    originalname: fileData.originalname || 'test.jpg',
    mimetype: fileData.mimetype || 'image/jpeg',
    size: fileData.size || 1024,
    ...fileData
  };
  return req;
}

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockAuthenticatedUser,
  mockFileUpload
};
