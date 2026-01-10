# 🔧 TROUBLESHOOTING EDGE FUNCTIONS

## ❌ ERROR: Edge Function Code Displayed as Error

If you're seeing the Edge Function code displayed as an error message (all on one line), this means:

### **Problem:** Edge Functions Not Deployed or Not Working

---

## ✅ SOLUTION STEPS

### Step 1: Check if Functions are Deployed

1. Open **Supabase Dashboard**
2. Go to **Edge Functions**
3. You should see these 4 functions:
   - `create-subscription`
   - `verify-google-play-purchase`
   - `change-subscription-plan`
   - `cancel-subscription`

**If they're NOT there:** Deploy them first!

---

### Step 2: Deploy Edge Functions

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy create-subscription
supabase functions deploy verify-google-play-purchase
supabase functions deploy change-subscription-plan
supabase functions deploy cancel-subscription
```

**Or use the batch script:**
```bash
deploy-edge-functions.bat
```

---

### Step 3: Set Environment Variables

**CRITICAL:** Edge Functions need these environment variables to work!

1. Go to **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Settings**
3. Add these variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to find these:**
- **SUPABASE_URL**: Dashboard → Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Dashboard → Settings → API → service_role key (secret)

---

### Step 4: Test Edge Functions

After deployment, test each function:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on a function (e.g., `create-subscription`)
3. Click **"Test"** button
4. Use this test payload:

```json
{
  "plan_id": "get-from-subscription_plans-table",
  "user_id": "get-from-auth-users-table"
}
```

**Expected Response:**
```json
{
  "success": true,
  "subscription_id": "uuid",
  "status": "pending"
}
```

---

## 🔍 COMMON ISSUES & FIXES

### Issue 1: "Function not found" Error

**Cause:** Function not deployed

**Fix:**
```bash
supabase functions deploy create-subscription
```

---

### Issue 2: "Missing required fields" Error

**Cause:** Request body doesn't have required parameters

**Fix:** Ensure your app is sending:
- `plan_id`
- `user_id`
- Optional: `google_play_purchase_token`, `google_play_product_id`

---

### Issue 3: "Invalid plan ID" Error

**Cause:** The `plan_id` doesn't exist in `subscription_plans` table

**Fix:** 
1. Check your database
2. Run this query in Supabase SQL Editor:
```sql
SELECT id, plan_name FROM subscription_plans WHERE is_active = true;
```
3. Use one of the returned IDs

---

### Issue 4: Environment Variables Not Set

**Symptoms:**
- Functions return 500 errors
- Logs show "undefined" for SUPABASE_URL

**Fix:**
1. Dashboard → Edge Functions → Settings
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy functions after setting variables

---

### Issue 5: CORS Errors

**Symptoms:**
- Browser shows CORS error
- Request blocked by CORS policy

**Fix:** All functions already include CORS headers. If still seeing errors:
1. Check function logs
2. Verify OPTIONS method is handled
3. Ensure `Access-Control-Allow-Origin: *` is in response

---

## 📱 INFO ICON NOT SHOWING

### Problem: Info icon (ⓘ) not appearing in header

**Cause:** Icon component not loading properly

**Fix Applied:** Changed from `Icon` alias to direct `MaterialCommunityIcons` import

**Verify:**
1. Restart your app
2. Navigate to Subscription Plans screen
3. Look for info icon in top-right corner
4. Tap it to see billing diagnostics

---

## 🧪 TESTING EDGE FUNCTIONS

### Test create-subscription

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/create-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "plan_id": "uuid-of-plan",
    "user_id": "uuid-of-user"
  }'
```

### Test verify-google-play-purchase

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/verify-google-play-purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "purchase_token": "test-token",
    "product_id": "musicleai.basic.monthly",
    "user_id": "uuid-of-user",
    "subscription_id": "uuid-of-subscription"
  }'
```

---

## 📊 CHECK FUNCTION LOGS

### View Logs in Dashboard:
1. Supabase Dashboard → Edge Functions
2. Click on function name
3. Click "Logs" tab
4. Look for errors or console.log messages

### View Logs via CLI:
```bash
supabase functions logs create-subscription --tail
```

---

## ✅ VERIFICATION CHECKLIST

After following these steps, verify:

- [ ] All 4 functions appear in Supabase Dashboard
- [ ] Environment variables are set
- [ ] Test function returns success response
- [ ] Function logs show no errors
- [ ] Info icon appears in app header
- [ ] Tapping info icon shows diagnostics
- [ ] App can call functions without errors

---

## 🚨 STILL HAVING ISSUES?

### Check These:

1. **Supabase CLI Version:**
   ```bash
   supabase --version
   ```
   Update if needed: `npm install -g supabase`

2. **Project Link:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Function Deployment Status:**
   ```bash
   supabase functions list
   ```

4. **Database Schema:**
   - Ensure `user_subscriptions` table has `google_play_product_id` column
   - Run `add-google-play-columns.sql` if not

5. **App Permissions:**
   - Check if app has internet permission
   - Verify Supabase client is initialized

---

## 📞 DEBUGGING COMMANDS

```bash
# List all functions
supabase functions list

# View function details
supabase functions inspect create-subscription

# View real-time logs
supabase functions logs create-subscription --tail

# Delete and redeploy
supabase functions delete create-subscription
supabase functions deploy create-subscription
```

---

## 🎯 QUICK FIX SUMMARY

1. **Deploy functions:** `supabase functions deploy`
2. **Set env vars:** Dashboard → Edge Functions → Settings
3. **Test functions:** Use Dashboard testing tool
4. **Check logs:** Look for errors
5. **Restart app:** To see info icon

**Most common issue:** Environment variables not set! ⚠️
