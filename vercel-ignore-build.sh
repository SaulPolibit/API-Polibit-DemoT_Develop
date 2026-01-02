#!/bin/bash

# This script tells Vercel to ignore auto-deployments from Git
# Deployments will only happen via GitHub Actions workflow

echo "🚫 Ignoring Vercel auto-deployment"
echo "✅ Deployment will be triggered by GitHub Actions after tests pass"

# Exit 0 = Skip deployment
exit 0
