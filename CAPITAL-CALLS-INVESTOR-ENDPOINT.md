# New Endpoint: Get Capital Calls by Investor

## Summary

A new endpoint has been added to retrieve all capital calls for a specific investor.

## Changes Made

### 1. Model Method Added

**File:** `src/models/supabase/capitalCall.js`

Added a new method `findByInvestorId()` at line 158-181:

```javascript
/**
 * Find capital calls by investor ID
 * Gets all capital calls that have allocations for the specified investor
 */
static async findByInvestorId(investorId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('capital_calls')
    .select(`
      *,
      capital_call_allocations!inner (
        investor_id
      )
    `)
    .eq('capital_call_allocations.investor_id', investorId)
    .order('call_date', { ascending: false });

  if (error) {
    throw new Error(`Error finding capital calls by investor: ${error.message}`);
  }

  return data.map(item => this._toModel(item));
}
```

**How it works:**
- Uses Supabase's inner join to fetch only capital calls that have allocations for the specified investor
- Returns capital calls ordered by call date (most recent first)
- Uses the existing `_toModel()` method to transform database fields to camelCase

### 2. Route Endpoint Added

**File:** `src/routes/capitalCall.routes.js`

Added a new GET endpoint at line 180-207:

```javascript
/**
 * @route   GET /api/capital-calls/investor/:investorId
 * @desc    Get all capital calls for a specific investor
 * @access  Private (requires authentication, Root/Admin only)
 */
router.get('/investor/:investorId', authenticate, requireInvestmentManagerAccess, catchAsync(async (req, res) => {
  const { userId, userRole } = getUserContext(req);
  const { investorId } = req.params;

  validate(investorId, 'Investor ID is required');

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  validate(uuidRegex.test(investorId), 'Invalid investor ID format');

  const capitalCalls = await CapitalCall.findByInvestorId(investorId);

  // Role-based filtering: Root sees all, Admin sees only their own
  const userCapitalCalls = userRole === ROLES.ROOT
    ? capitalCalls
    : capitalCalls.filter(call => call.createdBy === userId);

  res.status(200).json({
    success: true,
    count: userCapitalCalls.length,
    data: userCapitalCalls
  });
}));
```

## API Documentation

### Endpoint Details

**URL:** `GET /api/capital-calls/investor/:investorId`

**Access:** Private (Root/Admin only)

**Authentication:** Required (Bearer token)

**Parameters:**
- `investorId` (path parameter) - UUID of the investor

### Request Example

```bash
GET /api/capital-calls/investor/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <your_auth_token>
```

### Validation Rules

1. **investorId**: Required, must be a valid UUID format
2. **Role-based access**:
   - Root (role 0): Can see all capital calls for any investor
   - Admin (role 1): Can only see capital calls they created for the investor

### Success Response (200)

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "capital-call-id",
      "structureId": "structure-id",
      "callNumber": "CC-2024-001",
      "callDate": "2024-02-01T00:00:00Z",
      "dueDate": "2024-03-01T00:00:00Z",
      "totalCallAmount": 5000000,
      "totalPaidAmount": 3000000,
      "totalUnpaidAmount": 2000000,
      "status": "Partially Paid",
      "purpose": "Investment in TechCo",
      "notes": "First capital call for Q1 2024",
      "investmentId": "investment-id",
      "sentDate": "2024-02-01T09:00:00Z",
      "createdBy": "user-id",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-02-15T14:20:00.000Z"
    },
    {
      "id": "capital-call-id-2",
      "structureId": "structure-id",
      "callNumber": "CC-2024-002",
      "callDate": "2024-03-01T00:00:00Z",
      "dueDate": "2024-04-01T00:00:00Z",
      "totalCallAmount": 3000000,
      "totalPaidAmount": 0,
      "totalUnpaidAmount": 3000000,
      "status": "Sent",
      "purpose": "Additional investment",
      "notes": "",
      "investmentId": null,
      "sentDate": "2024-03-01T10:00:00Z",
      "createdBy": "user-id",
      "createdAt": "2024-02-20T11:30:00.000Z",
      "updatedAt": "2024-03-01T10:00:00.000Z"
    }
  ]
}
```

### Error Responses

**400 Bad Request - Invalid UUID:**
```json
{
  "success": false,
  "message": "Invalid investor ID format"
}
```

**400 Bad Request - Missing ID:**
```json
{
  "success": false,
  "message": "Investor ID is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Investment manager access required."
}
```

## Frontend Implementation Example

### Using Fetch API

```javascript
async function getInvestorCapitalCalls(investorId, authToken) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/capital-calls/investor/${investorId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    console.log(`Found ${result.count} capital calls for investor`);
    return result.data;

  } catch (error) {
    console.error('Error fetching capital calls:', error);
    throw error;
  }
}

// Usage
const capitalCalls = await getInvestorCapitalCalls(
  '550e8400-e29b-41d4-a716-446655440000',
  userAuthToken
);
```

### Using Axios

```javascript
import axios from 'axios';

async function getInvestorCapitalCalls(investorId) {
  try {
    const response = await axios.get(
      `/api/capital-calls/investor/${investorId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    return response.data.data; // Returns array of capital calls

  } catch (error) {
    if (error.response?.status === 400) {
      console.error('Invalid investor ID format');
    } else if (error.response?.status === 401) {
      console.error('Authentication required');
    }
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface CapitalCall {
  id: string;
  structureId: string;
  callNumber: string;
  callDate: string;
  dueDate: string;
  totalCallAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  status: string;
  purpose: string;
  // ... other fields
}

export function useInvestorCapitalCalls(investorId: string | null) {
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!investorId) return;

    const fetchCapitalCalls = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/capital-calls/investor/${investorId}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        setCapitalCalls(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCapitalCalls();
  }, [investorId]);

  return { capitalCalls, loading, error };
}

// Usage in component
function InvestorCapitalCallsList({ investorId }: { investorId: string }) {
  const { capitalCalls, loading, error } = useInvestorCapitalCalls(investorId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Capital Calls ({capitalCalls.length})</h2>
      {capitalCalls.map(call => (
        <div key={call.id}>
          <h3>{call.callNumber}</h3>
          <p>Amount: ${call.totalCallAmount.toLocaleString()}</p>
          <p>Status: {call.status}</p>
          <p>Due: {new Date(call.dueDate).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## Use Cases

1. **Investor Portal**: Display all capital calls for a logged-in investor
2. **Admin Dashboard**: View capital calls specific to an investor for tracking
3. **Reporting**: Generate investor-specific capital call reports
4. **Notifications**: Send reminders for upcoming or overdue capital calls to specific investors
5. **Payment Tracking**: Monitor payment status across all capital calls for an investor

## Notes

- The endpoint returns capital calls ordered by call date (most recent first)
- Only capital calls with allocations for the specified investor are returned
- Role-based access control is applied after fetching data
- The endpoint uses an inner join on `capital_call_allocations` table for efficient querying
- All date fields are in ISO 8601 format
- Currency amounts are in the structure's base currency (default: USD)

## Testing

You can test the endpoint using curl:

```bash
curl -X GET \
  'http://localhost:3000/api/capital-calls/investor/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json'
```

Expected response should include all capital calls where the investor has allocations.
