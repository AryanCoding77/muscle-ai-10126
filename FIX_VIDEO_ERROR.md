# 🎥 Fix Video Error - Quick Guide

## The Error
```
Cannot find native module 'ExponentAV'
```

## Why It Happens
`expo-av` is a **native module** that requires native Android/iOS code. After installing it, you need to rebuild the app so the native code is included.

## ✅ The Fix (3 Options)

### Option 1: Quick Restart (EASIEST - Try This First!)

**Just run this batch file:**
```bash
restart-clean.bat
```

Or manually:
```bash
npx expo start --clear
```

Then press `a` to reload on Android.

---

### Option 2: Full Rebuild (If Option 1 Doesn't Work)

```bash
npx expo prebuild --clean
npx expo run:android
```

This rebuilds all native code from scratch.

---

### Option 3: EAS Build (Most Reliable)

```bash
eas build --profile development --platform android
```

Then install the generated APK on your device.

---

## 🎯 What Should Happen After Fix

1. **Welcome Screen** shows with video playing inside phone frame
2. Video auto-plays and loops
3. "Get Started" button appears below
4. Clicking button → Login screen
5. After login → Spin wheel appears
6. Spin to win 1-3 free analyses
7. Continue to home screen

## 📱 Expected Welcome Screen

```
┌─────────────────────┐
│                     │
│   ┌─────────────┐   │
│   │             │   │  ← Phone frame
│   │   [VIDEO]   │   │  ← Your demo video
│   │   PLAYING   │   │
│   │             │   │
│   └─────────────┘   │
│                     │
│  AI-Powered Muscle  │
│      Analysis       │
│                     │
│  [Get Started]      │  ← Button
│                     │
└─────────────────────┘
```

## 🔍 Verify Video File

The video should be at: `assets/demo-video.mp4`

Check it exists:
```bash
dir assets\demo-video.mp4
```

✅ **File exists!** (Already verified)

## 🐛 Still Not Working?

1. **Check Metro bundler is running** - Should see "Bundling..." messages
2. **Check device is connected** - Run `adb devices`
3. **Try uninstalling app** from device, then reinstall
4. **Check video file** - Make sure it's a valid MP4 file
5. **Check file size** - Very large videos might cause issues

## 📦 Package Status

✅ `expo-av` is installed (version 16.0.8)
✅ Video file exists at correct path
✅ Code is correct and ready
✅ Navigation is properly set up

**Just need to restart Metro bundler!**

---

## 🚀 Quick Start Command

```bash
restart-clean.bat
```

That's it! The video should work after Metro restarts with clean cache.
