@echo off
echo Deploying google-play-rtdn function...
npx supabase functions deploy google-play-rtdn
if %errorlevel% neq 0 (
    echo.
    echo Trying alternative...
    supabase functions deploy google-play-rtdn
)
echo.
echo Done! Now test again in Supabase dashboard.
pause
