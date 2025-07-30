#!/bin/bash

# Deployment Script für Vercel

echo "🚀 Deploying Token Transfer Claim Service to Vercel..."

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "🔧 Environment variables setup:"
echo "Please set the following environment variables in Vercel dashboard:"
echo "1. PRIVATE_KEY - Your wallet's private key (without 0x prefix)"
echo "2. ETH_AMOUNT - Amount of ETH to send (e.g., 0.001)"

echo ""
echo "You can also set these using:"
echo "vercel env add PRIVATE_KEY"
echo "vercel env add ETH_AMOUNT"

echo ""
echo "✅ Deployment completed!"
echo "Your endpoints will be available at:"
echo "- Main dashboard: https://your-domain.vercel.app/"
echo "- Webhook endpoint: https://your-domain.vercel.app/api/webhook"  
echo "- Status API: https://your-domain.vercel.app/api/status"
echo "- Dashboard API: https://your-domain.vercel.app/api/dashboard"
