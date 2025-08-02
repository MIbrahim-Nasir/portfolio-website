@echo off
echo 🎯 Ibrahim's Portfolio Deployment Script
echo ========================================

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📋 Pre-deployment checks...

:: Check if git is initialized
if not exist ".git" (
    echo 🔧 Initializing Git repository...
    git init
    if errorlevel 1 (
        echo ❌ Git initialization failed
        pause
        exit /b 1
    )
    echo ✅ Git initialized
)

:: Run build test
echo 🔨 Testing build...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)
echo ✅ Build successful

:: Check environment variables
if not exist ".env.local" (
    echo ⚠️  Warning: .env.local not found. Email functionality may not work in production.
    echo    Make sure to add environment variables in your deployment platform.
)

:: Add all files
echo 📦 Preparing files for deployment...
git add .

:: Commit changes
echo 💾 Committing changes...
git commit -m "Deploy: Portfolio ready for production %date% %time%"
if errorlevel 1 (
    echo ℹ️  No changes to commit
) else (
    echo ✅ Changes committed
)

echo.
echo 🚀 Ready for deployment!
echo.
echo Next steps:
echo 1. Push to GitHub: git push origin main
echo 2. Deploy on Vercel: https://vercel.com
echo 3. Add environment variables in Vercel dashboard:
echo    - EMAIL_USER: mibrahimnasir.engineer@gmail.com
echo    - EMAIL_PASS: your-app-password
echo 4. Test your live website
echo.
echo 📖 For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
echo 🎉 Your portfolio is ready to go live!
echo.
pause
