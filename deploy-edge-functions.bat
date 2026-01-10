@echo off
echo ========================================
echo  DEPLOYING SUPABASE EDGE FUNCTIONS
echo ========================================
echo.

echo Deploying create-subscription...
call supabase functions deploy create-subscription
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy create-subscription
    pause
    exit /b 1
)
echo.

echo Deploying verify-google-play-purchase...
call supabase functions deploy verify-google-play-purchase
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy verify-google-play-purchase
    pause
    exit /b 1
)
echo.

echo Deploying change-subscription-plan...
call supabase functions deploy change-subscription-plan
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy change-subscription-plan
    pause
    exit /b 1
)
echo.

echo Deploying cancel-subscription...
call supabase functions deploy cancel-subscription
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy cancel-subscription
    pause
    exit /b 1
)
echo.

echo ========================================
echo  ALL FUNCTIONS DEPLOYED SUCCESSFULLY!
echo ========================================
echo.
echo Next steps:
echo 1. Set environment variables in Supabase Dashboard
echo 2. Test each function
echo 3. Update your app to use the new endpoints
echo.
pause
