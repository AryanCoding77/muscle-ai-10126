# 🧪 TEST EDGE FUNCTION

## The Error You're Seeing

The minified Edge Function code appearing as an error suggests the Edge Function is **returning its own source code** instead of executing properly. This usually happens when:

1. The function isn't properly deployed
2. The function has a runtime error
3. The function URL is wrong

---

## ✅ SOLUTION: Test the Edge Function Directly

### Step 1: Test in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **`create-subscription`**
3. Click **"Invoke function"** or **"Test"**
4. Use this test payload:

```json
{
  "plan_id": "PASTE_A_REAL_PLAN_ID_FROM_YOUR_DATABASE",
  "user_id": "PASTE_A_REAL_USER_ID_FROM_YOUR_DATABASE"
}
```

**To get these IDs:**

Run in SQL Editor:
```sql
-- Get a plan ID
SELECT id, plan_name FROM subscription_plans LIMIT 1;

-- Get a user ID
SELECT id, email FROM auth.users LIMIT 1;
```

### Step 2: Check Function Logs

After testing, check the logs:
1. Click on the function
2. Go to **"Logs"** tab
3. Look for errors

---

## 🔍 COMMON ISSUES

### Issue 1: Missing Columns in Database

**Error:** `column "google_play_product_id" does not exist`

**Fix:** Run the migration:
```sql
-- In Supabase SQL Editor
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;
```

### Issue 2: RLS (Row Level Security) Blocking

**Error:** `new row violates row-level security policy`

**Fix:** The Edge Function uses `service_role` key which bypasses RLS. Make sure you set `SUPABASE_SERVICE_ROLE_KEY` in Edge Function settings.

### Issue 3: Invalid Plan ID

**Error:** `Invalid plan ID`

**Fix:** Make sure the `plan_id` you're passing exists in `subscription_plans` table and `is_active = true`.

---

## 🎯 QUICK TEST FROM YOUR APP

Add this test function to your app to see the exact error:

```typescript
// Add to src/services/subscriptionService.ts

export const testEdgeFunction = async () => {
  try {
    console.log('🧪 Testing Edge Function...');
    
    // Get a real plan ID
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id')
      .limit(1)
      .single();
    
    if (!plans) {
      console.error('❌ No plans found in database');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }
    
    console.log('📝 Test data:', {
      plan_id: plans.id,
      user_id: user.id,
    });
    
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: {
        plan_id: plans.id,
        user_id: user.id,
      },
    });
    
    console.log('✅ Response:', { data, error });
    
    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    }
    
    return { data, error };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error };
  }
};
```

Then call it from your app:
```typescript
import { testEdgeFunction } from './services/subscriptionService';

// In a button or useEffect
testEdgeFunction();
```

---

## 🔧 CHECK EDGE FUNCTION ENVIRONMENT VARIABLES

Make sure these are set in **Supabase Dashboard → Edge Functions → Settings**:

```
SUPABASE_URL=https://imevywptvoyfyjevyknu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZXZ5d3B0dm95ZnlqZXZ5a251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMDMxOCwiZXhwIjoyMDcyMTA2MzE4fQ.a8cOWflBb9NGBuD-KXMQTFs57Kb-oCgjjVpVeIlDjoA
```

---

## 📊 VERIFY DATABASE SCHEMA

Run this in SQL Editor to check if columns exist:

```sql
-- Check user_subscriptions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions';
```

**Expected columns:**
- `google_play_purchase_token` (text)
- `google_play_product_id` (text)

If missing, run:
```sql
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;
```

---

## 🎯 MOST LIKELY CAUSE

Based on your error (Edge Function code displayed), the most likely causes are:

1. **Database columns missing** → Run `add-google-play-columns.sql`
2. **Edge Function environment variables not set** → Set in Dashboard
3. **Edge Function has runtime error** → Check logs

---

## ✅ VERIFICATION STEPS

1. [ ] Run `add-google-play-columns.sql` in SQL Editor
2. [ ] Verify columns exist (run query above)
3. [ ] Set environment variables in Edge Functions settings
4. [ ] Test Edge Function in Dashboard with real IDs
5. [ ] Check function logs for errors
6. [ ] Try calling from app again

---

**After completing these steps, the error should be resolved!**
