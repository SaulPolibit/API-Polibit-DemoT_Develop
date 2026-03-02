---
title: "Reference: Smart Contract Operations"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# Smart Contract Operations

## Web3Service Class (`src/services/web3Service.js`)

The Web3Service wraps the `web3` library (v4) for all on-chain interactions. Created via factory pattern.

```javascript
const { createWeb3Service } = require('./web3ServiceFactory');
const web3Service = createWeb3Service(process.env.RPC_URL);
```

## Core Methods

### Address Validation
```javascript
isValidAddress(address)  // Returns boolean
```

### Balance Check
```javascript
async getBalance(address)  // Returns balance in wei (string)
```

### Contract Owner
```javascript
async getContractOwner(contractAddress, abi)
// Calls owner() function on contract
```

### Generic Contract Call (Read-Only)
```javascript
async callContractFunction(contractAddress, abi, functionName, params = [])
// Returns decoded result from view/pure function
```

## Transaction Methods

### Sign and Send Transaction
```javascript
async signAndSendTransaction(contractAddress, abi, functionName, params, privateKey, options = {}) {
  const contract = new web3.eth.Contract(abi, contractAddress);
  const data = contract.methods[functionName](...params).encodeABI();

  const gasEstimate = await web3.eth.estimateGas({
    to: contractAddress,
    data,
    from: account.address,
  });

  const tx = {
    to: contractAddress,
    data,
    gas: Math.ceil(gasEstimate * 1.2),  // 20% buffer
    gasPrice: await web3.eth.getGasPrice(),
    nonce: await web3.eth.getTransactionCount(account.address),
    chainId: parseInt(process.env.CHAIN_ID),
  };

  const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return receipt;
}
```

### Gas Estimation
```javascript
async estimateGas(contractAddress, abi, functionName, params, fromAddress)
// Returns estimated gas units (number)
```

## ERC20 Token Operations

### Mint
```javascript
async mintTokens(contractAddress, abi, toAddress, amount, privateKey)
// Calls: contract.methods.mint(toAddress, amount)
```

### Transfer
```javascript
async transferTokens(contractAddress, abi, toAddress, amount, privateKey)
// Calls: contract.methods.transfer(toAddress, amount)
```

### Balance
```javascript
async getTokenBalance(contractAddress, abi, walletAddress)
// Calls: contract.methods.balanceOf(walletAddress)
```

### Allowance Management
```javascript
async getAllowance(contractAddress, abi, ownerAddress, spenderAddress)
// Calls: contract.methods.allowance(owner, spender)

async approveAllowance(contractAddress, abi, spenderAddress, amount, privateKey)
// Calls: contract.methods.approve(spender, amount)
```

## ERC3643 Identity & Compliance

### Identity Registry
```javascript
// Register user in identity registry
async registerUser(contractAddress, abi, userAddress, identityAddress, countryCode, privateKey)
// Calls: contract.methods.registerIdentity(userAddress, identityAddress, countryCode)

// Register agent (can manage identities)
async registerAgent(contractAddress, abi, agentAddress, privateKey)
// Calls: contract.methods.addAgent(agentAddress)

// Remove agent
async removeAgent(contractAddress, abi, agentAddress, privateKey)
```

### Compliance Operations
```javascript
// Add allowed country (ISO 3166-1 numeric code)
async addAllowedCountry(contractAddress, abi, countryCode, privateKey)
// Calls: contract.methods.addCountry(countryCode)

// Remove allowed country
async removeAllowedCountry(contractAddress, abi, countryCode, privateKey)
```

### Country Codes
The blockchain routes file includes a comprehensive mapping of ISO 3166-1 numeric codes:
```javascript
const countryCodes = {
  'AF': 4, 'US': 840, 'HN': 340, 'MX': 484, 'GB': 826, // etc.
};
```

## Event Parsing
```javascript
async parseEvents(receipt, abi, eventName)
// Decodes events from transaction receipt logs
// Returns array of decoded event objects
```

## Token Holders
```javascript
async getTokenHolders(contractAddress, abi)
// Queries Transfer events to build holder list
// Returns array of { address, balance }
```

## Contract Deployment

Contracts are deployed via external Firebase Cloud Functions:

```javascript
// ERC20 Deployment
const response = await axios.post(process.env.DEPLOY_ERC20_URL, {
  name: 'Token Name',
  symbol: 'TKN',
  decimals: 18,
  initialSupply: '1000000',
  ownerAddress: '0x...',
});
// Returns: { contractAddress, transactionHash }

// ERC3643 Deployment
const response = await axios.post(process.env.DEPLOY_ERC3643_URL, {
  name: 'Security Token',
  symbol: 'ST',
  decimals: 18,
  ownerAddress: '0x...',
  complianceModules: [...],
});
```

## Network Configuration

| Environment | Chain | Chain ID | RPC |
|-------------|-------|----------|-----|
| Staging | Polygon Amoy | 80002 | Configured via `RPC_URL` |
| Production | Polygon Mainnet | 137 | Configured via `RPC_URL` |
