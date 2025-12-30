/**
 * Jest Test Setup
 * This file runs before all tests to configure the testing environment
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  error: jest.fn(), // Mock console.error
  warn: jest.fn(), // Mock console.warn
  info: jest.fn(), // Mock console.info
  debug: jest.fn(), // Mock console.debug
};

// Global test utilities
global.testUtils = {
  // Generate random email
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,

  // Generate random UUID
  randomUUID: () => `${Date.now()}-${Math.random().toString(36).substring(7)}`,

  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),

  // Wait helper
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
  await new Promise(resolve => setTimeout(resolve, 500));
});
