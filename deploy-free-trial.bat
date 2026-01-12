@echo off
echo ========================================
echo Deploying Free Trial System to Supabase
echo ========================================
echo.

REM Load environment variables
if exist .env (
    echo Loading environment variables from .env...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        set %%a=%%b
    )
) else (
    echo ERROR: .env file not found!
    pause
    exit /b 1
)

REM Check if required variables are set
if "%EXPO_PUBLIC_SUPABASE_URL%"=="" (
    echo ERROR: EXPO_PUBLIC_SUPABASE_URL not found in .env
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env
    pause
    exit /b 1
)

echo Supabase URL: %EXPO_PUBLIC_SUPABASE_URL%
echo.

REM Read SQL file
set SQL_FILE=add-free-trial-system.sql
if not exist %SQL_FILE% (
    echo ERROR: %SQL_FILE% not found!
    pause
    exit /b 1
)

echo Reading SQL file: %SQL_FILE%
echo.

REM Execute SQL using curl
echo Executing SQL commands...
curl -X POST "%EXPO_PUBLIC_SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
  -H "apikey: %SUPABASE_SERVICE_ROLE_KEY%" ^
  -H "Authorization: Bearer %SUPABASE_SERVICE_ROLE_KEY%" ^
  -H "Content-Type: application/json" ^
  --data-binary "@%SQL_FILE%"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Verify the changes in Supabase Dashboard
echo 2. Test the free trial system in your app
echo 3. Check that users get 2 free analyses
echo.
pause
