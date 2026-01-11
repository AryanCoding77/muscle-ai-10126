# Google Cloud Pub/Sub Setup for RTDN

## Overview

Google Play Console now requires using **Google Cloud Pub/Sub** for Real-Time Developer Notifications instead of direct HTTP webhooks. This guide shows you how to set it up.

---

## Prerequisites

- [ ] Google Play Console account with your app
- [ ] Google Cloud Console access (same Google account)
- [ ] Supabase project with RTDN function deployed

---

## Step-by-Step Setup

### Step 1: Get Your Supabase Function URL

Your webhook URL format:
```
https://[your-project-ref].supabase.co/functions/v1/google-play-rtdn
```

**Find your project ref:**
1. Go to Supabase Dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/[project-ref]`
3. Copy the project-ref part

**Your Function URL:**
```
https://_________________________.supabase.co/functions/v1/google-play-rtdn
```

---

### Step 2: Set Up Google Cloud Project

#### 2.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with the same Google account as Play Console

#### 2.2 Select or Create Project
- If you have a project linked to your Play Console app, select it
- If not, create a new project:
  - Click project dropdown at top
  - Click "New Project"
  - Name: `Muscle AI` (or your app name)
  - Click "Create"

#### 2.3 Enable Google Play Developer API
1. Go to: https://console.cloud.google.com/apis/library
2. Search for: "Google Play Developer API"
3. Click on it
4. Click "Enable"
5. Wait for it to enable (~30 seconds)

---

### Step 3: Create Pub/Sub Topic

#### 3.1 Go to Pub/Sub
- Visit: https://console.cloud.google.com/cloudpubsub/topic/list
- Or search "Pub/Sub" in the search bar

#### 3.2 Create Topic
1. Click "**Create Topic**" button
2. **Topic ID:** `google-play-rtdn` (you can use any name)
3. Leave other settings as default
4. Click "**Create**"

**Your Topic Name:**
```
projects/[YOUR-PROJECT-ID]/topics/google-play-rtdn
```

Copy this - you'll need it for Play Console!

---

### Step 4: Create Push Subscription

#### 4.1 Open Your Topic
- Click on the topic you just created (`google-play-rtdn`)

#### 4.2 Create Subscription
1. Click "**Subscriptions**" tab at the top
2. Click "**Create Subscription**" button
3. Fill in:
   - **Subscription ID:** `google-play-rtdn-push`
   - **Delivery type:** Select "**Push**"
   - **Endpoint URL:** Paste your Supabase function URL
     ```
     https://[your-project-ref].supabase.co/functions/v1/google-play-rtdn
     ```
   - **Acknowledgement deadline:** 10 seconds (default)
   - Leave other settings as default
4. Click "**Create**"

---

### Step 5: Grant Google Play Permissions

#### 5.1 Go to Topic Permissions
1. Go back to your topic: https://console.cloud.google.com/cloudpubsub/topic/list
2. Click on `google-play-rtdn` topic
3. Click "**Permissions**" tab (or "Show Info Panel" → "Permissions")

#### 5.2 Add Google Play Service Account
1. Click "**Add Principal**" or "**Grant Access**"
2. **New principals:** 
   ```
   google-play-developer-notifications@system.gserviceaccount.com
   ```
3. **Role:** Select "**Pub/Sub Publisher**"
4. Click "**Save**"

---

### Step 6: Configure Play Console

#### 6.1 Go to Play Console
- Visit: https://play.google.com/console
- Select your app (com.muscleai.app)

#### 6.2 Navigate to Monetization Setup
- Left sidebar → **Monetization setup**
- Scroll down to "**Google Play Billing**" section
- You should see "Real-time developer notifications"

#### 6.3 Enter Topic Name
1. Check "**Enable real-time notifications**"
2. **Topic name:** Enter your full topic name:
   ```
   projects/[YOUR-PROJECT-ID]/topics/google-play-rtdn
   ```
   Example: `projects/muscle-ai-123456/topics/google-play-rtdn`

3. **Notification content:** Select "**Subscriptions and voided purchases only**"
4. Click "**Save**"

#### 6.4 Send Test Notification
1. Click "**Send test notification**" button
2. Wait for confirmation
3. Check if it worked (see Step 7)

---

### Step 7: Verify Setup

#### 7.1 Check Supabase Logs
```bash
supabase functions logs google-play-rtdn --limit 10
```

**Expected output:**
```
📨 [RTDN] Received notification from Google Play
📦 [RTDN] Pub/Sub payload received
✅ [RTDN] Test notification received successfully
```

#### 7.2 Check Pub/Sub Metrics
1. Go to: https://console.cloud.google.com/cloudpubsub/subscription/list
2. Click on `google-play-rtdn-push` subscription
3. Check "**Metrics**" tab
4. You should see:
   - Messages published: 1+
   - Messages delivered: 1+
   - Delivery success rate: 100%

---

## Troubleshooting

### Issue: "Topic name is invalid"
**Solution:**
- Make sure format is: `projects/[PROJECT-ID]/topics/[TOPIC-NAME]`
- Check project ID matches your Google Cloud project
- Topic name must exist in Pub/Sub

### Issue: "Permission denied"
**Solution:**
- Verify you added `google-play-developer-notifications@system.gserviceaccount.com`
- Check role is "Pub/Sub Publisher"
- Wait 1-2 minutes for permissions to propagate

### Issue: Test notification fails
**Solution:**
1. Check Supabase function is deployed: `supabase functions list`
2. Verify endpoint URL in subscription is correct
3. Check Supabase logs for errors
4. Test endpoint directly:
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/google-play-rtdn \
     -H "Content-Type: application/json" \
     -d '{"message":{"data":"eyJ0ZXN0Tm90aWZpY2F0aW9uIjp7InZlcnNpb24iOiIxLjAifX0="}}'
   ```

### Issue: No logs in Supabase
**Solution:**
- Check Pub/Sub subscription status
- Verify endpoint URL is correct
- Check for errors in Pub/Sub subscription metrics
- Ensure Supabase project is not paused

---

## Quick Reference

### Your Configuration

**Google Cloud Project ID:**
```
_________________________________
```

**Pub/Sub Topic Name:**
```
projects/[PROJECT-ID]/topics/google-play-rtdn
```

**Supabase Function URL:**
```
https://[PROJECT-REF].supabase.co/functions/v1/google-play-rtdn
```

**Google Play Service Account:**
```
google-play-developer-notifications@system.gserviceaccount.com
```

---

## Testing Checklist

- [ ] Google Cloud project created/selected
- [ ] Google Play Developer API enabled
- [ ] Pub/Sub topic created
- [ ] Push subscription created with Supabase URL
- [ ] Google Play service account has Publisher role
- [ ] Topic name entered in Play Console
- [ ] Real-time notifications enabled
- [ ] Test notification sent successfully
- [ ] Supabase logs show test notification
- [ ] Pub/Sub metrics show delivery success

---

## Next Steps

After setup is complete:

1. **Test with real subscription:**
   - Purchase test subscription
   - Wait 5 minutes for renewal (sandbox)
   - Check logs for SUBSCRIPTION_RENEWED

2. **Monitor for first week:**
   ```bash
   supabase functions logs google-play-rtdn --follow
   ```

3. **Verify quota resets:**
   ```sql
   SELECT user_id, plan_name, analyses_used_this_month, updated_at
   FROM user_subscriptions
   WHERE updated_at > NOW() - INTERVAL '1 day'
   ORDER BY updated_at DESC;
   ```

---

## Cost Information

### Google Cloud Pub/Sub Pricing
- **First 10 GB/month:** Free
- **After 10 GB:** $0.40 per GB
- **Typical usage:** ~1 KB per notification
- **1,000 subscriptions:** ~1 MB/month
- **Cost:** Essentially free for most apps

### Supabase Function Invocations
- **Free tier:** 500,000 invocations/month
- **Per subscription:** ~1-2 calls/month
- **Cost:** Free within limits

---

## Support Resources

- **Google Cloud Pub/Sub:** https://cloud.google.com/pubsub/docs
- **Play RTDN Guide:** https://developer.android.com/google/play/billing/rtdn-reference
- **Supabase Functions:** https://supabase.com/docs/guides/functions

---

## Summary

You've now set up:
✅ Google Cloud Pub/Sub topic  
✅ Push subscription to Supabase  
✅ Google Play permissions  
✅ Play Console configuration  
✅ Real-time notifications enabled  

Your renewal system is now fully automated! 🎉
