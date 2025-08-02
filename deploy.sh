#!/bin/bash

# 🚀 Portfolio Deployment Script
# Run this script to prepare and deploy your portfolio

echo "🎯 Ibrahim's Portfolio Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checks..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
fi

# Run build test
echo "🔨 Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi
echo "✅ Build successful"

# Check environment variables
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Email functionality may not work in production."
    echo "   Make sure to add environment variables in your deployment platform."
fi

# Add all files
echo "📦 Preparing files for deployment..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Deploy: Portfolio ready for production $(date +%Y-%m-%d)"
    echo "✅ Changes committed"
fi

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy on Vercel: https://vercel.com"
echo "3. Add environment variables in Vercel dashboard"
echo "4. Test your live website"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Your portfolio is ready to go live!"
