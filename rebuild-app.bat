@echo off
echo ========================================
echo  REBUILDING APP WITH NATIVE MODULES
echo ========================================
echo.
echo This will rebuild your Android app with expo-av native module
echo This may take 5-10 minutes...
echo.
echo Step 1: Cleaning and prebuilding...
call npx expo prebuild --clean
echo.
echo Step 2: Building Android app...
call npx expo run:android
echo.
echo ========================================
echo  BUILD COMPLETE!
echo ========================================
echo.
echo The app should now open on your device with video working!
pause
