# Blockchain API Testing Guide

## Endpoint: Get Contract Owner

### POST /api/blockchain/contract/owner

Retrieves the owner address from a smart contract.

## Requirements

1. Valid JWT Bearer token
2. RPC_URL configured in `.env` file
3. Valid contract address with an owner function

## Testing

### Step 1: Get a Bearer Token

First, login to get a token:

```bash
curl -X POST http://localhost:3000/api/custom/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Copy the `token` from the response.

### Step 2: Call the Contract Owner Endpoint

```bash
curl -X POST http://localhost:3000/api/blockchain/contract/owner \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x6191061e26fc03805612536729c83980807ede63"
  }'
```

### Expected Response

Success (200):
```json
{
  "success": true,
  "message": "Contract owner retrieved successfully",
  "data": {
    "contractAddress": "0x6191061e26fc03805612536729c83980807ede63",
    "ownerAddress": "0x1234567890abcdef...",
    "functionUsed": "_owner",
    "network": "Polygon"
  }
}
```

Error - Owner not found (404):
```json
{
  "success": false,
  "error": "Owner not found",
  "message": "Contract owner could not be determined. The contract may not have owner(), _owner(), or getOwner() functions."
}
```

Error - Invalid address (400):
```json
{
  "success": false,
  "error": "Invalid address",
  "message": "Please provide a valid Ethereum address"
}
```

Error - No token (401):
```json
{
  "error": "Authentication required",
  "message": "Please provide Authorization header (Bearer token)"
}
```

## How It Works

The endpoint tries three common owner function patterns:

1. `_owner()` - Common in custom contracts
2. `owner()` - Standard Ownable pattern (OpenZeppelin)
3. `getOwner()` - Alternative naming convention

It will use the first function that returns a valid address.

## Test Contract Addresses

### Polygon Amoy Testnet
- PoliBit Contract: `0x6191061e26fc03805612536729c83980807ede63`
- Your contract address from .env: `ContractOwnerWalletAddress`

### Checking Logs

The server will log the attempts:
```
[Blockchain] Trying function: _owner on contract: 0x...
[Blockchain] Result for _owner: 0x...
[Blockchain] Successfully found owner using _owner: 0x...
```

## Troubleshooting

### "No matching error abi found for error data 0x"

This error means the contract doesn't have the function being called. The updated implementation now tries multiple function names automatically.

### "Contract call reverted"

The contract exists but the function call failed. Check:
- The contract is deployed at the address
- The RPC_URL is correct and accessible
- The network matches (Polygon Amoy vs Mainnet)

### "RPC_URL not configured"

Add `RPC_URL` to your `.env` file:
```env
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
```

## Additional Endpoints

### Get Balance
```bash
curl -X GET http://localhost:3000/api/blockchain/balance/0xYOUR_ADDRESS \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Generic Contract Call
```bash
curl -X POST http://localhost:3000/api/blockchain/contract/call \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x...",
    "abi": [...],
    "functionName": "balanceOf",
    "params": ["0x..."]
  }'
```
