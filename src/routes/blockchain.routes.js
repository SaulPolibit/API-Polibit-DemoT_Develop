/**
 * Blockchain API Routes
 * Smart contract interaction endpoints
 */

const express = require('express');
const { Web3 } = require('web3');
const { authenticate } = require('../middleware/auth');
const {
  catchAsync,
  validate
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/blockchain/contract/owner
 * @desc    Get the owner of a smart contract
 * @access  Private (requires Bearer token)
 * @body    { contractAddress: string }
 */
router.post('/contract/owner', authenticate, catchAsync(async (req, res) => {
  const { contractAddress } = req.body;

  validate(contractAddress, 'Contract address is required');

  // Get RPC URL from environment variables
  const rpcURL = process.env.RPC_URL;

  if (!rpcURL) {
    return res.status(500).json({
      success: false,
      error: 'Configuration error',
      message: 'RPC_URL not configured in environment variables'
    });
  }

  // Initialize Web3 with the RPC URL
  const web3 = new Web3(rpcURL);

  // Validate contract address format
  if (!web3.utils.isAddress(contractAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address',
      message: 'Please provide a valid Ethereum address'
    });
  }

  // Contract ABI for the owner function
  const contractAbi = [{
    'inputs': [],
    'name': 'owner',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  }];

  try {
    // Create contract instance
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    // Call the owner function
    const ownerAddress = await contract.methods.owner().call();

    // Validate the response
    if (!ownerAddress || ownerAddress === '0x0000000000000000000000000000000000000000') {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
        message: 'Contract owner could not be determined'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contract owner retrieved successfully',
      data: {
        contractAddress,
        ownerAddress: ownerAddress.toLowerCase(),
        network: rpcURL.includes('polygon') ? 'Polygon' : 'Ethereum'
      }
    });

  } catch (error) {
    // Handle specific Web3 errors
    if (error.message && error.message.includes('revert')) {
      return res.status(400).json({
        success: false,
        error: 'Contract error',
        message: 'Contract call reverted. The contract may not have an owner() function.'
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: 'Contract call failed',
      message: error.message || 'Failed to retrieve contract owner'
    });
  }
}));

/**
 * @route   POST /api/blockchain/contract/call
 * @desc    Call a read-only function on a smart contract
 * @access  Private (requires Bearer token)
 * @body    { contractAddress: string, abi: array, functionName: string, params: array }
 */
router.post('/contract/call', authenticate, catchAsync(async (req, res) => {
  const { contractAddress, abi, functionName, params = [] } = req.body;

  validate(contractAddress, 'Contract address is required');
  validate(abi, 'Contract ABI is required');
  validate(functionName, 'Function name is required');

  // Get RPC URL from environment variables
  const rpcURL = process.env.RPC_URL;

  if (!rpcURL) {
    return res.status(500).json({
      success: false,
      error: 'Configuration error',
      message: 'RPC_URL not configured in environment variables'
    });
  }

  // Initialize Web3 with the RPC URL
  const web3 = new Web3(rpcURL);

  // Validate contract address format
  if (!web3.utils.isAddress(contractAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address',
      message: 'Please provide a valid Ethereum address'
    });
  }

  try {
    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress);

    // Check if function exists
    if (!contract.methods[functionName]) {
      return res.status(400).json({
        success: false,
        error: 'Function not found',
        message: `Function '${functionName}' not found in contract ABI`
      });
    }

    // Call the function
    const result = await contract.methods[functionName](...params).call();

    res.status(200).json({
      success: true,
      message: 'Contract function called successfully',
      data: {
        contractAddress,
        functionName,
        params,
        result
      }
    });

  } catch (error) {
    // Handle specific Web3 errors
    if (error.message.includes('revert')) {
      return res.status(400).json({
        success: false,
        error: 'Contract error',
        message: 'Contract call reverted'
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: 'Contract call failed',
      message: error.message || 'Failed to call contract function'
    });
  }
}));

/**
 * @route   GET /api/blockchain/balance/:address
 * @desc    Get the balance of an Ethereum address
 * @access  Private (requires Bearer token)
 */
router.get('/balance/:address', authenticate, catchAsync(async (req, res) => {
  const { address } = req.params;

  validate(address, 'Address is required');

  // Get RPC URL from environment variables
  const rpcURL = process.env.RPC_URL;

  if (!rpcURL) {
    return res.status(500).json({
      success: false,
      error: 'Configuration error',
      message: 'RPC_URL not configured in environment variables'
    });
  }

  // Initialize Web3 with the RPC URL
  const web3 = new Web3(rpcURL);

  // Validate address format
  if (!web3.utils.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid address',
      message: 'Please provide a valid Ethereum address'
    });
  }

  try {
    // Get balance in wei
    const balanceWei = await web3.eth.getBalance(address);

    // Convert to ether
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

    res.status(200).json({
      success: true,
      message: 'Balance retrieved successfully',
      data: {
        address: address.toLowerCase(),
        balanceWei: balanceWei.toString(),
        balanceEther: balanceEther,
        network: rpcURL.includes('polygon') ? 'Polygon' : 'Ethereum'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      message: error.message || 'Failed to retrieve address balance'
    });
  }
}));

module.exports = router;
