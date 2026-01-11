@echo off
echo ========================================
echo Deploying RTDN Function (Updated)
echo ========================================
echo.

echo Deploying google-play-rtdn function...
echo.
npx supabase functions deploy google-play-rtdn
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy function
    echo.
    echo Trying alternative method...
    supabase functions deploy google-play-rtdn
)
echo.
echo ✅ Function deployed successfully
echo.
echo ========================================
echo Next: Test the function again
echo ========================================
echo.
echo 1. Go to Supabase Dashboard
echo 2. Edge Functions → google-play-rtdn
echo 3. Click "Test" button
echo 4. Use this JSON:
echo.
echo {
echo   "message": {
echo     "data": "eyJ0ZXN0Tm90aWZpY2F0aW9uIjp7InZlcnNpb24iOiIxLjAifX0=",
echo     "messageId": "test123",
echo     "publishTime": "2026-01-10T00:00:00Z"
echo   }
echo }
echo.
echo 5. Click "Run"
echo 6. Should see: {"success":true}
echo.
pause
