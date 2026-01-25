# 🚀 Production Deployment Checklist

## ⚠️ CRITICAL: Before You Deploy

### Current Status
- **Version:** 6.0.0
- **Version Code:** 10
- **Package:** com.muscleai.app
- **Firebase Analytics:** ✅ Configured

---

## 📋 Pre-Deployment Checklist

### 1. ✅ Code & Features
- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Onboarding flow tested
- [ ] Free trial system tested
- [ ] Spin wheel tested
- [ ] Subscription flow tested
- [ ] Google Play Billing working
- [ ] Image analysis working
- [ ] Profile screen working

### 2. ✅ Firebase Setup
- [x] Firebase project created
- [x] `google-services.json` added
- [x] Firebase plugin in app.json
- [ ] Firebase packages installed (`@react-native-firebase/app` & `@react-native-firebase/analytics`)
- [ ] App rebuilt with Firebase

### 3. ✅ Google Play Console
- [ ] App listing complete (title, description, screenshots)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Target audience set
- [ ] Store listing graphics uploaded
- [ ] Subscription products created and active

### 4. ✅ Subscriptions
- [ ] Subscription products created in Play Console
- [ ] Product IDs match your code
- [ ] Prices set correctly
- [ ] Base plans configured
- [ ] Tested with sandbox account

### 5. ✅ Real-Time Developer Notifications (RTDN)
- [ ] Google Cloud Pub/Sub topic created
- [ ] Push subscription configured
- [ ] Supabase function deployed
- [ ] Webhook URL added to Play Console
- [ ] Test notification sent successfully

---

## 🔨 Build Production AAB

### Step 1: Ensure Firebase is Installed
```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### Step 2: Build Production AAB
```bash
eas build --platform android --profile production
```

This will:
- Increment version code automatically (10 → 11)
- Create a signed AAB file
- Include Firebase Analytics
- Include all your latest changes

**Build time:** ~15-20 minutes

### Step 3: Download the AAB
Once build completes:
1. Go to: https://expo.dev/accounts/aryancoding77/projects/muscle-ai/builds
2. Download the `.aab` file

---

## 📤 Upload to Google Play Console

### Step 1: Go to Production Track
1. Open: https://play.google.com/console
2. Select your app
3. Left sidebar → **Production**
4. Click **Create new release**

### Step 2: Upload AAB
1. Click **Upload** button
2. Select the downloaded `.aab` file
3. Wait for upload to complete
4. Google Play will process the file (~5 minutes)

### Step 3: Release Notes
Add release notes for version 6.0.0:

```
What's New in v6.0.0:

✨ New Features:
- Complete onboarding experience for new users
- Free trial system with spin wheel (1-3 free analyses)
- Firebase Analytics integration for better insights
- Improved subscription management

🔧 Improvements:
- Enhanced UI/UX across all screens
- Better error handling
- Performance optimizations

🐛 Bug Fixes:
- Fixed subscription renewal issues
- Improved billing flow
- Various stability improvements
```

### Step 4: Review and Rollout
1. Review the release summary
2. Click **Review release**
3. Choose rollout percentage:
   - **Staged rollout (recommended):** Start with 20% → 50% → 100%
   - **Full rollout:** 100% immediately
4. Click **Start rollout to Production**

---

## ⏱️ Timeline

### After Submission
- **Processing:** 1-2 hours
- **Review:** 1-7 days (usually 1-2 days)
- **Live:** After approval

### During Review
Google will check:
- App functionality
- Subscription implementation
- Privacy policy compliance
- Content rating accuracy
- Store listing quality

---

## 🧪 Testing Before Production

### Recommended: Internal Testing First
```bash
# Build for internal testing
eas build --platform android --profile production

# Then upload to Internal Testing track instead of Production
```

**Benefits:**
- Test with real users before public release
- Catch any last-minute issues
- Verify subscriptions work correctly
- Test Firebase Analytics

---

## 🚨 Common Issues & Solutions

### Issue 1: Build Fails
**Solution:**
```bash
# Clear cache and rebuild
npm install
eas build --platform android --profile production --clear-cache
```

### Issue 2: Firebase Not Working
**Solution:**
- Verify `google-services.json` is in project root
- Check Firebase packages are installed
- Rebuild the app

### Issue 3: Subscription Products Not Found
**Solution:**
- Ensure products are **Active** in Play Console
- Product IDs must match exactly
- App must be published (at least to internal testing)

### Issue 4: Version Code Conflict
**Solution:**
- EAS auto-increments, but if it fails:
```json
// In app.json, manually increment:
"versionCode": 11  // or higher
```

---

## 📊 Post-Deployment Monitoring

### Day 1-3: Critical Monitoring
- [ ] Check crash reports in Play Console
- [ ] Monitor Firebase Analytics events
- [ ] Check subscription purchases
- [ ] Monitor RTDN logs for renewals
- [ ] Review user feedback

### Week 1: Performance Check
- [ ] Analyze user retention
- [ ] Check conversion rates (free trial → subscription)
- [ ] Review analytics data
- [ ] Monitor server costs
- [ ] Check quota usage

---

## 🎯 Quick Commands Reference

```bash
# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/analytics

# Build production AAB
eas build --platform android --profile production

# Check build status
eas build:list

# View logs if build fails
eas build:view [BUILD_ID]

# Deploy RTDN function (if not done)
supabase functions deploy google-play-rtdn
```

---

## ✅ Final Checklist Before Clicking "Start Rollout"

- [ ] AAB uploaded successfully
- [ ] Release notes added
- [ ] All required fields filled
- [ ] Privacy policy accessible
- [ ] Subscription products active
- [ ] RTDN configured and tested
- [ ] Firebase Analytics working
- [ ] Internal testing completed (recommended)
- [ ] Backup of current production version
- [ ] Team notified about deployment

---

## 🆘 Emergency Rollback

If critical issues found after release:

1. **Halt rollout:**
   - Go to Production track
   - Click "Halt rollout"

2. **Fix the issue:**
   - Make code changes
   - Build new version
   - Test thoroughly

3. **Release hotfix:**
   - Increment version (6.0.1)
   - Upload new AAB
   - Release with higher priority

---

## 📞 Support Resources

- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Play Console:** https://support.google.com/googleplay/android-developer
- **Firebase:** https://firebase.google.com/support
- **Supabase:** https://supabase.com/docs

---

## 🎉 Ready to Deploy?

**Recommended Path:**
1. ✅ Install Firebase packages
2. ✅ Build production AAB
3. ✅ Upload to **Internal Testing** first
4. ✅ Test with 5-10 users for 1-2 days
5. ✅ If all good, promote to **Production**

**Fast Path (if confident):**
1. ✅ Install Firebase packages
2. ✅ Build production AAB
3. ✅ Upload directly to **Production**
4. ✅ Start with 20% staged rollout

---

**Which path do you want to take?**
