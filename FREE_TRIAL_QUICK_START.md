# Free Trial System - Quick Start Guide

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Deploy Database (2 minutes)
```bash
# Run the deployment script
deploy-free-trial.bat
```

**What this does:**
- Adds `free_trial_analyses_remaining` column to profiles
- Creates `can_user_analyze_with_trial()` function
- Creates `use_free_trial_analysis()` function
- Updates `increment_usage_counter()` function
- Gives all existing users 2 free analyses

### Step 2: Verify Deployment (1 minute)

Open Supabase Dashboard → SQL Editor and run:
```sql
-- Check if column exists
SELECT free_trial_analyses_remaining 
FROM profiles 
LIMIT 5;

-- Should return 2 for all users
```

### Step 3: Test in App (2 minutes)

1. **Create new test account** or use existing account
2. **Go to Profile screen** - Should see "Free Trial Active" banner
3. **Go to Analyze screen** - Upload a photo
4. **Complete analysis** - Should work without subscription
5. **Check Profile again** - Should show "1 free analysis remaining"
6. **Do another analysis** - Should work
7. **Try third analysis** - Should show "Free Trial Complete!" modal

## ✅ That's It!

Your free trial system is now live. Every user gets 2 free analyses before needing to subscribe.

## 📊 Quick Check

### Verify Everything Works

```sql
-- Check free trial status for all users
SELECT 
  email,
  free_trial_analyses_remaining,
  has_had_subscription
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check free trial usage
SELECT 
  COUNT(*) as free_trial_analyses
FROM usage_tracking
WHERE metadata->>'is_free_trial' = 'true';
```

## 🎯 Key Features

- ✅ **2 Free Analyses** per user
- ✅ **Beautiful Upgrade Modal** when trial ends
- ✅ **Profile Display** shows remaining analyses
- ✅ **Automatic Tracking** in database
- ✅ **Works with Subscriptions** seamlessly

## 🔧 Configuration

Want to change the number of free analyses?

### Option 1: Update Default in Database
```sql
-- Change default for new users
ALTER TABLE profiles 
ALTER COLUMN free_trial_analyses_remaining 
SET DEFAULT 5;

-- Update existing users
UPDATE profiles 
SET free_trial_analyses_remaining = 5
WHERE has_had_subscription = false;
```

### Option 2: Update in Code
Edit `add-free-trial-system.sql`:
```sql
-- Change this line
ADD COLUMN IF NOT EXISTS free_trial_analyses_remaining INTEGER DEFAULT 5
```

## 📱 User Experience

### New User Journey
1. Signs up → Gets 2 free analyses
2. Uses first analysis → Sees "1 remaining" in profile
3. Uses second analysis → Sees "0 remaining" in profile
4. Tries third analysis → Sees upgrade modal
5. Purchases subscription → Unlimited analyses

### Existing User Journey
1. Already has account → Gets 2 free analyses
2. Same flow as new user

## 🐛 Troubleshooting

### Problem: "Function does not exist"
**Solution**: Run `deploy-free-trial.bat` again

### Problem: Users not getting free trial
**Solution**: 
```sql
UPDATE profiles 
SET free_trial_analyses_remaining = 2
WHERE free_trial_analyses_remaining IS NULL;
```

### Problem: Modal not showing
**Solution**: Check browser console for errors, verify `FreeTrialEndedModal` is imported

## 📈 Monitor Usage

### Dashboard Query
```sql
-- Free trial statistics
SELECT 
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 2) as unused_trials,
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 1) as used_one,
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 0) as exhausted_trials,
  COUNT(*) FILTER (WHERE has_had_subscription = true) as converted_users
FROM profiles;
```

## 🎉 Success!

Your free trial system is now active. Users can try your AI-powered muscle analysis before subscribing!

---

**Need Help?** Check `FREE_TRIAL_SYSTEM.md` for detailed documentation.
