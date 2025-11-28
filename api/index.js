/**
 * Vercel Serverless Function Entry Point
 * This file is required for Vercel deployment
 */

// Import the Express app
const app = require('../src/app');

// Export the Express app as a serverless function
module.exports = app;
