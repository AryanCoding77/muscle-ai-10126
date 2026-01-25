# 🔨 Rebuild Instructions - Fix Native Module Error

## The Problem

`expo-av` is a **native module** that requires native Android code. Simply running `npm install` doesn't add the native code - you need to **rebuild the entire Android app**.

## ✅ Solution: Rebuild the App

### Step 1: Prebuild (Already Done ✅)
```bash
npx expo prebuild --clean
```
This generates the native Android code with expo-av included.

### Step 2: Build and Run Android App
```bash
npx expo run:android
```

**OR use the batch file:**
```bash
rebuild-app.bat
```

This will:
1. Compile the Android app with native modules
2. Install it on your connected device
3. Launch the app

**⏱️ Time**: 5-10 minutes (first build is slow)

---

## 🚀 Quick Alternative: Use Image Instead of Video

If you don't want to wait for the rebuild, I can temporarily replace the video with a static image. This will work immediately without rebuilding.

**Want me to do this?** Let me know and I'll update WelcomeScreen to use an image instead.

---

## 📱 What to Expect After Rebuild

1. App will compile (takes 5-10 minutes)
2. App will install on your device
3. App will launch automatically
4. Video will play in the welcome screen ✅
5. No more "Cannot find native module" error ✅

---

## 🔍 Troubleshooting

### If build fails:
```bash
# Clean everything
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
npx expo run:android
```

### If device not found:
```bash
# Check connected devices
adb devices

# If no devices, connect your phone via USB and enable USB debugging
```

### If still having issues:
Use EAS Build (cloud build):
```bash
eas build --profile development --platform android --local
```

---

## 💡 Why This Happens

- **JavaScript modules** (like axios, react-navigation) → Just `npm install` works
- **Native modules** (like expo-av, expo-camera) → Need full app rebuild

When you add a native module:
1. `npm install` downloads the JavaScript code ✅
2. `npx expo prebuild` generates native Android/iOS code ✅
3. `npx expo run:android` compiles and installs the app ⏳ (you need to do this)

---

## 🎯 Next Steps

**Option 1: Rebuild (Recommended)**
```bash
npx expo run:android
```

**Option 2: Use Image Instead (Quick Fix)**
Let me know and I'll update the code to use a static image instead of video.

**Option 3: EAS Build**
```bash
eas build --profile development --platform android
```

---

**Choose your option and let me know!**
