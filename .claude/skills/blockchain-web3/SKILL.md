---
name: blockchain-web3
description: "Activate when working with blockchain, smart contracts, Web3, ERC20, ERC3643, Crossmint wallets, Portal HQ MPC wallets, or token operations. Trigger phrases: 'blockchain', 'web3', 'contract', 'token', 'wallet', 'Crossmint', 'Portal HQ', 'mint', 'ERC20', 'ERC3643', 'deploy'. NOT for Stripe Connect payouts or fiat payment rails."
---

# Blockchain & Web3 — Smart Contracts, Crossmint & Portal HQ

## Purpose

This skill covers all blockchain operations: Web3 contract interactions (ERC20 mint/transfer, ERC3643 identity/compliance), Crossmint custodial wallet management, Portal HQ MPC wallet generation, and smart contract deployment via Firebase Cloud Functions. Operates on Polygon Amoy (staging) / Polygon Mainnet (production).

## Architecture

```
src/services/web3Service.js         → Core Web3 contract operations (487 lines)
src/services/web3ServiceFactory.js  → Factory for creating Web3Service instances
src/services/crossmint.service.js   → Crossmint custodial wallet service (357 lines)
src/services/apiManager.js          → Portal HQ API methods (within larger file)
src/routes/blockchain.routes.js     → 104KB — all blockchain endpoints
src/routes/portalHQ.routes.js       → Portal HQ wallet endpoints
src/models/supabase/smartContract.js → Smart contract metadata storage
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/web3Service.js` | Address validation, contract calls, TX signing, ERC20 ops, identity registry, compliance |
| `src/services/web3ServiceFactory.js` | Factory: `createWeb3Service(rpcUrl)` |
| `src/services/crossmint.service.js` | Singleton — wallet CRUD, token transfers, NFT retrieval |
| `src/services/apiManager.js` | Portal HQ client/wallet management (partial) |
| `src/routes/blockchain.routes.js` | Largest route file (104KB) — all blockchain endpoints |
| `src/routes/portalHQ.routes.js` | MPC wallet management routes |
| `src/config/constants.js` | `PORTAL_HQ_BASE_URL`, `ERC20_DEPLOY_URL`, `ERC3643_DEPLOY_URL` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Blockchain RPC endpoint (Polygon Amoy / Mainnet) |
| `CHAIN_ID` | Network chain ID (`80002` for Polygon Amoy) |
| `NETWORK_NAME` | Display name (`Polygon Amoy`) |
| `PORTAL_HQ_PRIVATE_KEY` | Portal HQ signing key |
| `PORTAL_API_KEY` | Portal HQ API key |
| `DEPLOY_ERC20_URL` | Firebase Cloud Function URL for ERC20 deployment |
| `DEPLOY_ERC3643_URL` | Firebase Cloud Function URL for ERC3643 deployment |
| `CROSSMINT_API_KEY` | Crossmint API key |
| `CROSSMINT_ENVIRONMENT` | `staging` or `production` |

## API Endpoints

### Contract Operations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/blockchain/contract/owner` | Bearer | Get contract owner |
| POST | `/api/blockchain/contract/call` | Bearer | Call read-only contract function |
| POST | `/api/blockchain/contract/deploy/erc20` | Bearer | Deploy ERC20 contract |
| POST | `/api/blockchain/contract/deploy/erc3643` | Bearer | Deploy ERC3643 contract |

### Token Operations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/blockchain/token/mint` | Bearer | Mint tokens |
| POST | `/api/blockchain/token/transfer` | Bearer | Transfer tokens |
| POST | `/api/blockchain/token/balance` | Bearer | Get token balance |
| POST | `/api/blockchain/token/allowance` | Bearer | Check/set allowance |

### Identity & Compliance (ERC3643)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/blockchain/identity/register-user` | Bearer | Register user in identity registry |
| POST | `/api/blockchain/identity/register-agent` | Bearer | Register agent |
| POST | `/api/blockchain/compliance/add-country` | Bearer | Add allowed country |
| POST | `/api/blockchain/compliance/remove-country` | Bearer | Remove allowed country |

### Crossmint Wallets
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/blockchain/crossmint/wallet` | Bearer | Create custodial wallet |
| GET | `/api/blockchain/crossmint/wallet/:id` | Bearer | Get wallet details |
| GET | `/api/blockchain/crossmint/wallet/:id/balance` | Bearer | Get wallet balances |
| POST | `/api/blockchain/crossmint/transfer` | Bearer | Transfer tokens |

### Portal HQ
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/portal-hq/clients` | Bearer | Create MPC client |
| POST | `/api/portal-hq/wallets` | Bearer | Generate MPC wallet |
| GET | `/api/portal-hq/wallets/:id/balance` | Bearer | Get wallet balance |

## Common Tasks

### Call a smart contract function
```javascript
const web3Service = createWeb3Service(process.env.RPC_URL);
const result = await web3Service.callContractFunction(
  contractAddress, abi, 'functionName', [arg1, arg2]
);
```

### Create a Crossmint custodial wallet
```javascript
const crossmintService = require('../services/crossmint.service');
const wallet = await crossmintService.createWallet(userId, chain);
// Idempotent: returns existing wallet if userId already has one (409 handled)
```

### Deploy a contract
```javascript
// Via Firebase Cloud Function
const response = await axios.post(process.env.DEPLOY_ERC20_URL, {
  name, symbol, decimals, initialSupply, ownerAddress
});
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid RPC URL" | `RPC_URL` not set or unreachable | Check env var and network connectivity |
| Crossmint 409 | Wallet already exists for this userId | Handled internally — returns existing wallet |
| Gas estimation fails | Contract revert or insufficient balance | Check contract state and deployer balance |
| ERC3643 identity check fails | User not registered in identity registry | Call `registerUser` first |
| Transaction timeout | Network congestion | Increase gas price or retry |

## References

- [Smart Contract Operations](references/smart-contract-ops.md)
- [Crossmint Service API](references/crossmint-service.md)
