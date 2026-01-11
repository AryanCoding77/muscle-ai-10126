@echo off
echo ========================================
echo Deploying Onboarding Schema Updates
echo ========================================
echo.

REM Load environment variables
if exist .env (
    echo Loading environment variables from .env...
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
) else (
    echo ERROR: .env file not found!
    echo Please create a .env file with your Supabase credentials.
    pause
    exit /b 1
)

REM Check if required environment variables are set
if "%SUPABASE_URL%"=="" (
    echo ERROR: SUPABASE_URL not found in .env
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env
    pause
    exit /b 1
)

echo.
echo Step 1: Adding onboarding fields to profiles table...
echo ========================================

REM Execute the SQL migration
npx supabase db execute --file add-onboarding-fields.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to add onboarding fields
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Onboarding schema deployed successfully!
echo ========================================
echo.
echo The following fields have been added to the profiles table:
echo   - height (INTEGER)
echo   - weight (INTEGER)
echo   - unit_preference (TEXT)
echo   - birth_date (TIMESTAMP)
echo   - referral_source (TEXT)
echo   - onboarding_completed (BOOLEAN)
echo.
echo You can now use the onboarding flow in your app!
echo.
pause
