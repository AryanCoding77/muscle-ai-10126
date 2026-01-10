# 📊 EDGE FUNCTIONS VISUAL GUIDE

## 🎯 YOUR SUPABASE EDGE FUNCTIONS

```
supabase/functions/
│
├── ✅ create-subscription/
│   └── index.ts
│   Purpose: Create new subscription
│   Status: READY
│
├── ✅ verify-google-play-purchase/
│   └── index.ts
│   Purpose: Verify & activate purchase
│   Status: READY
│
├── ✅ change-subscription-plan/
│   └── index.ts
│   Purpose: Handle plan upgrades/downgrades
│   Status: READY (NEWLY CREATED)
│
├── ✅ cancel-subscription/
│   └── index.ts
│   Purpose: Cancel subscription
│   Status: READY (UPDATED FOR GOOGLE PLAY)
│
├── ❌ payment-callback/
│   └── (empty)
│   Status: NOT NEEDED (was for Razorpay)
│
└── ❌ verify-payment/
    └── (empty)
    Status: NOT NEEDED (replaced by verify-google-play-purchase)
```

---

## 🔄 SUBSCRIPTION FLOW DIAGRAM

### 📱 NEW SUBSCRIPTION

```
┌─────────────┐
│    USER     │
│ Selects Plan│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  create-subscription        │
│  • Creates pending record   │
│  • Returns subscription_id  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   GOOGLE PLAY BILLING       │
│   • User completes payment  │
│   • Returns purchase token  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ verify-google-play-purchase │
│ • Activates subscription    │
│ • Records payment           │
│ • Sets billing cycle        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │
│ SUBSCRIPTION│
└─────────────┘
```

---

### 🔄 CHANGE PLAN (UPGRADE/DOWNGRADE)

```
┌─────────────┐
│    USER     │
│ Changes Plan│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ change-subscription-plan    │
│ • Cancels old subscription  │
│ • Creates new pending       │
│ • Returns new_subscription  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   GOOGLE PLAY BILLING       │
│   • User pays for new plan  │
│   • Returns purchase token  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ verify-google-play-purchase │
│ • Activates new subscription│
│ • Records payment           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│   NEW PLAN  │
│   ACTIVE    │
└─────────────┘
```

---

### ❌ CANCEL SUBSCRIPTION

```
┌─────────────┐
│    USER     │
│   Cancels   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   cancel-subscription       │
│   • Updates status          │
│   • Sets cancelled_at       │
│   • Disables auto-renewal   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   USER ACTION REQUIRED      │
│   Must also cancel in       │
│   Google Play Store         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│  CANCELLED  │
│ (No billing)│
└─────────────┘
```

---

## 📋 FUNCTION COMPARISON

| Feature | create-subscription | verify-google-play-purchase | change-subscription-plan | cancel-subscription |
|---------|-------------------|---------------------------|------------------------|-------------------|
| **Creates subscription** | ✅ Yes | ❌ No | ✅ Yes (new) | ❌ No |
| **Activates subscription** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Records payment** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Cancels subscription** | ❌ No | ❌ No | ✅ Yes (old) | ✅ Yes |
| **Requires Google Play** | ❌ No | ✅ Yes | ✅ Yes | ⚠️ Partial |
| **Called by app** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🔑 REQUEST/RESPONSE EXAMPLES

### 1️⃣ create-subscription

**Request:**
```json
{
  "plan_id": "uuid-of-plan",
  "user_id": "uuid-of-user",
  "google_play_purchase_token": "optional-token",
  "google_play_product_id": "optional-product-id"
}
```

**Response:**
```json
{
  "success": true,
  "subscription_id": "uuid-of-new-subscription",
  "status": "pending"
}
```

---

### 2️⃣ verify-google-play-purchase

**Request:**
```json
{
  "purchase_token": "google-play-token",
  "product_id": "musicleai.basic.monthly",
  "user_id": "uuid-of-user",
  "subscription_id": "uuid-of-subscription"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "subscription": {
    "id": "uuid",
    "plan_name": "Basic",
    "status": "active"
  }
}
```

---

### 3️⃣ change-subscription-plan

**Request:**
```json
{
  "subscription_id": "uuid-of-current-subscription",
  "new_plan_id": "uuid-of-new-plan",
  "user_id": "uuid-of-user"
}
```

**Response:**
```json
{
  "success": true,
  "new_subscription_id": "uuid-of-new-subscription",
  "change_type": "upgrade",
  "message": "Plan upgrade initiated. Complete purchase in Google Play to activate."
}
```

---

### 4️⃣ cancel-subscription

**Request:**
```json
{
  "subscription_id": "uuid-of-subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

---

## 🚀 DEPLOYMENT COMMAND

```bash
# Deploy all functions
supabase functions deploy

# Or use the batch script
deploy-edge-functions.bat
```

---

## ✅ VERIFICATION

After deployment, check in Supabase Dashboard:

1. **Edge Functions** → Should see all 4 functions listed
2. **Logs** → Check for deployment success messages
3. **Test** → Use built-in testing tool for each function

---

## 📞 TROUBLESHOOTING

### Function not appearing?
- Check deployment logs
- Verify `index.ts` exists in function folder
- Ensure no syntax errors

### Function failing?
- Check environment variables are set
- Review function logs
- Test with sample data

### CORS errors?
- All functions include CORS headers
- Check OPTIONS method handling

---

**All functions are ready to deploy!** 🎉
