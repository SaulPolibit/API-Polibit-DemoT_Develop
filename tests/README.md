# Testing Documentation

This directory contains comprehensive tests for all models in the API-Polibit-DemoT application.

## Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Troubleshooting](#troubleshooting)

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Jest (already installed in devDependencies)

### Environment Configuration

Tests use a separate environment configuration file `.env.test` to ensure isolation from development and production environments.

**Important:** The `.env.test` file contains test-specific credentials and should NOT contain real production data.

### Installation

All test dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Automatically re-runs tests when files change:

```bash
npm run test:watch
```

### Run Tests with Coverage

Generates a coverage report:

```bash
npm run test:coverage
```

### Run Tests in Verbose Mode

Shows detailed test output:

```bash
npm run test:verbose
```

### Run Specific Test Files

```bash
# Run only User model tests
npx jest tests/models/user.test.js

# Run only Investment model tests
npx jest tests/models/investment.test.js

# Run all model tests
npx jest tests/models/
```

### Run Tests Matching a Pattern

```bash
# Run tests with "create" in their name
npx jest -t create

# Run tests with "findById" in their name
npx jest -t findById
```

## Test Structure

```
tests/
├── README.md                 # This file
├── setup.js                  # Global test setup and configuration
├── helpers/
│   └── mockSupabase.js      # Mock Supabase client for testing
└── models/
    ├── user.test.js         # User model tests
    ├── structure.test.js    # Structure model tests
    ├── investment.test.js   # Investment model tests
    ├── payment.test.js      # Payment model tests
    ├── message.test.js      # Message model tests
    ├── smartContract.test.js # Smart Contract model tests
    └── mfaFactor.test.js    # MFA Factor model tests
```

## Test Coverage

### Current Test Files

✅ **Core Models**
- User Model (`user.test.js`)
- Smart Contract Model (`smartContract.test.js`)

✅ **Investment Manager Models**
- Structure Model (`structure.test.js`)
- Investment Model (`investment.test.js`)

✅ **Chat System Models**
- Message Model (`message.test.js`)

✅ **Payment System Models**
- Payment Model (`payment.test.js`)

✅ **Security Models**
- MFA Factor Model (`mfaFactor.test.js`)

### Coverage Thresholds

The project maintains the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View coverage report:

```bash
npm run test:coverage
```

The coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed coverage.

## Writing Tests

### Test File Template

```javascript
/**
 * [Model Name] Model Tests
 * Tests for src/models/supabase/[modelName].js
 */

const { createMockSupabaseClient } = require('../helpers/mockSupabase');

jest.mock('../../src/config/database', () => ({
  getSupabase: jest.fn(),
}));

const { getSupabase } = require('../../src/config/database');
const ModelName = require('../../src/models/supabase/modelName');

describe('ModelName Model', () => {
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
    test('should create a model successfully', async () => {
      const data = { /* test data */ };

      mockSupabase.setMockResponse('table_name', {
        data: { /* mock response */ },
        error: null,
      });

      const result = await ModelName.create(data);

      expect(result).toBeDefined();
      // Add more assertions
    });
  });

  // More test suites...
});
```

### Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Use `mockSupabase.setMockResponse()` to mock database responses
3. **Clear Names**: Test names should clearly describe what they're testing
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
5. **Edge Cases**: Test both happy paths and error cases

### Mock Helpers

#### Setting Mock Responses

```javascript
// Mock successful response
mockSupabase.setMockResponse('users', {
  data: { id: 'user-123', email: 'test@example.com' },
  error: null,
});

// Mock error response
mockSupabase.setMockResponse('users', {
  data: null,
  error: { message: 'User not found', code: 'PGRST116' },
});

// Mock RPC function
mockSupabase.setMockRpcResponse('get_portfolio_summary', {
  data: { total: 1000000 },
  error: null,
});
```

#### Global Test Utilities

Available via `global.testUtils`:

```javascript
// Generate random email
const email = global.testUtils.randomEmail();
// => 'test-1735433872142-a3f7@example.com'

// Generate random UUID
const id = global.testUtils.randomUUID();
// => '1735433872142-a3f7b2e4'

// Generate random string
const str = global.testUtils.randomString(10);
// => 'k3p9x2m5q8'

// Wait helper
await global.testUtils.wait(1000); // Wait 1 second
```

## Testing Models

### Common Test Scenarios

Every model should test:

1. **CRUD Operations**
   - `create()` - Creating new records
   - `findById()` - Finding by primary key
   - `find()` - Finding with filters
   - `findByIdAndUpdate()` - Updating records
   - `findByIdAndDelete()` - Deleting records

2. **Validation**
   - Required fields
   - Field types
   - Value constraints
   - Edge cases

3. **Field Mapping**
   - camelCase to snake_case conversion
   - snake_case to camelCase conversion

4. **Error Handling**
   - Database errors
   - Not found errors
   - Validation errors

5. **Business Logic**
   - Model-specific methods
   - Calculated fields
   - Status transitions

## Troubleshooting

### Tests are failing with "Cannot find module"

Make sure all dependencies are installed:

```bash
npm install
```

### Tests timeout

Increase the timeout in `jest.config.js`:

```javascript
testTimeout: 20000, // 20 seconds
```

### Mock not working

Ensure you're calling `jest.clearAllMocks()` in `beforeEach()` and `mockSupabase.reset()` in `afterEach()`.

### Coverage is not generated

Run tests with the coverage flag:

```bash
npm run test:coverage
```

### Tests pass locally but fail in CI

1. Check environment variables in `.env.test`
2. Ensure Node.js version matches
3. Clear node_modules and reinstall

## Continuous Integration

Tests should be run in CI/CD pipelines before deployment. Add to your CI configuration:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Adding New Tests

When adding a new model:

1. Create a test file in `tests/models/[modelName].test.js`
2. Follow the test file template above
3. Test all CRUD operations
4. Test validation and error cases
5. Test model-specific business logic
6. Run tests to ensure they pass
7. Check coverage to ensure adequate testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

## Support

For questions or issues with tests:

1. Check this README
2. Review existing test files for examples
3. Consult Jest documentation
4. Open an issue in the project repository
