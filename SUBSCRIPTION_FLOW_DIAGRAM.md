# Subscription System - Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GOOGLE PLAY                               │
│                   (Source of Truth)                              │
│                                                                   │
│  • Handles all billing                                           │
│  • Manages auto-renewals                                         │
│  • Stores purchase tokens                                        │
│  • Validates subscriptions                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ getAvailablePurchases()
                         │ (react-native-iap v14)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              subscriptionHelper.ts                               │
│                                                                   │
│  fetchActiveSubscriptions()                                      │
│    ↓                                                             │
│  Normalize purchases                                             │
│    ↓                                                             │
│  getActiveSubscriptionForUser()                                  │
│    ↓                                                             │
│  Filter subscription SKUs                                        │
│    ↓                                                             │
│  Pick latest if multiple                                         │
│    ↓                                                             │
│  Map to plan name (Basic/Pro/VIP)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ ActiveSubscription | null
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                useSubscription Hook                              │
│                                                                   │
│  State:                                                          │
│    • loading: boolean                                            │
│    • isSubscribed: boolean                                       │
│    • activePlan: 'Basic' | 'Pro' | 'VIP' | null                │
│    • productId: string | null                                    │
│    • purchaseToken: string | null                                │
│    • lastCheckedAt: number | null                                │
│                                                                   │
│  Auto-refresh triggers:                                          │
│    • On mount                                                    │
│    • On app foreground                                           │
│    • After purchase complete                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ { state, refreshSubscription }
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    ALL SCREENS                                   │
│                                                                   │
│  ProfileScreen          SubscriptionPlansScreen                  │
│  AnalyzeScreen          PaymentScreen                            │
│  SettingsScreen         Any other screen                         │
│                                                                   │
│  All use: const { state } = useSubscription();                  │
└─────────────────────────────────────────────────────────────────┘
```

## Purchase Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                                  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 1. User taps "Choose Plan"
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GooglePlayPaymentScreen                             │
│                                                                   │
│  • Sets pending purchase context                                 │
│  • Calls BillingService.purchase(productId)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 2. Launch Google Play billing dialog
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GOOGLE PLAY DIALOG                             │
│                                                                   │
│  User completes purchase with test card                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 3. Purchase completed
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BillingService                                  │
│                                                                   │
│  purchaseUpdatedListener fires                                   │
│    ↓                                                             │
│  Acknowledge purchase (Android)                                  │
│    ↓                                                             │
│  Finish transaction                                              │
│    ↓                                                             │
│  Call onPurchaseSuccess callback                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 4. Purchase success
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useBilling Hook                               │
│                                                                   │
│  • Sync purchase with backend (optional)                         │
│  • Create subscription record                                    │
│  • Verify purchase                                               │
│  • Call onPurchaseComplete callback                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 5. Trigger refresh
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              useSubscription Hook                                │
│                                                                   │
│  refreshSubscription() called                                    │
│    ↓                                                             │
│  Call getAvailablePurchases()                                    │
│    ↓                                                             │
│  Detect new subscription                                         │
│    ↓                                                             │
│  Update state: isSubscribed = true, activePlan = "Pro"          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 6. State updated
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI UPDATES                                  │
│                                                                   │
│  • Profile shows "PRO" badge                                     │
│  • Plans screen shows "CURRENT PLAN" badge                       │
│  • "Upgrade to Premium" banner hidden                            │
│  • Premium features unlocked                                     │
└─────────────────────────────────────────────────────────────────┘
```

## App Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP START                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ useSubscription hook mounts
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Initial Subscription Check                          │
│                                                                   │
│  refreshSubscription() called                                    │
│    ↓                                                             │
│  setState({ loading: true })                                     │
│    ↓                                                             │
│  fetchActiveSubscriptions()                                      │
│    ↓                                                             │
│  getActiveSubscriptionForUser()                                  │
│    ↓                                                             │
│  setState({                                                      │
│    loading: false,                                               │
│    isSubscribed: true/false,                                     │
│    activePlan: 'Pro' | null,                                    │
│    ...                                                           │
│  })                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ State ready
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI RENDERS                                    │
│                                                                   │
│  All screens show correct subscription state                     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ User uses app...
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  APP GOES TO BACKGROUND                          │
│                                                                   │
│  User presses Home button                                        │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ User might cancel subscription
                         │ in Google Play Store app
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                APP COMES TO FOREGROUND                           │
│                                                                   │
│  AppState listener detects "active"                              │
│    ↓                                                             │
│  refreshSubscription() called automatically                      │
│    ↓                                                             │
│  Fetch latest state from Google Play                             │
│    ↓                                                             │
│  Update state if changed                                         │
│    ↓                                                             │
│  UI updates automatically                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Subscription State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                      INITIAL STATE                               │
│                                                                   │
│  loading: true                                                   │
│  isSubscribed: false                                             │
│  activePlan: null                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Check subscription
                         │
                    ┌────▼────┐
                    │         │
              ┌─────┤ Result? ├─────┐
              │     │         │     │
              │     └─────────┘     │
              │                     │
    No subscription          Has subscription
              │                     │
              ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│   NOT SUBSCRIBED    │   │     SUBSCRIBED      │
│                     │   │                     │
│ loading: false      │   │ loading: false      │
│ isSubscribed: false │   │ isSubscribed: true  │
│ activePlan: null    │   │ activePlan: "Pro"   │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           │ User purchases          │ User cancels
           │                         │
           └────────┬────────────────┘
                    │
                    │ Refresh triggered
                    │
                    ▼
           ┌─────────────────┐
           │  CHECKING...    │
           │                 │
           │ loading: true   │
           └────────┬────────┘
                    │
                    │ Check complete
                    │
                    ▼
              (Back to result)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE PLAY STORE                             │
│                                                                   │
│  Purchase Records:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ productId: "muscleai.pro.monthly"                        │  │
│  │ purchaseToken: "abc123..."                               │  │
│  │ transactionDate: 1701781234000                           │  │
│  │ acknowledged: true                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ getAvailablePurchases()
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              fetchActiveSubscriptions()                          │
│                                                                   │
│  Returns:                                                        │
│  [                                                               │
│    {                                                             │
│      productId: "muscleai.pro.monthly",                         │
│      purchaseToken: "abc123...",                                │
│      transactionDate: 1701781234000,                            │
│      platform: "android"                                         │
│    }                                                             │
│  ]                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ NormalizedPurchase[]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          getActiveSubscriptionForUser()                          │
│                                                                   │
│  1. Filter subscription SKUs                                     │
│  2. Pick latest by transaction date                              │
│  3. Map product ID to plan name                                  │
│                                                                   │
│  Returns:                                                        │
│  {                                                               │
│    productId: "muscleai.pro.monthly",                           │
│    planName: "Pro",                                             │
│    purchaseToken: "abc123...",                                  │
│    transactionDate: 1701781234000                               │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ ActiveSubscription
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                useSubscription Hook                              │
│                                                                   │
│  State:                                                          │
│  {                                                               │
│    loading: false,                                               │
│    isSubscribed: true,                                           │
│    activePlan: "Pro",                                           │
│    productId: "muscleai.pro.monthly",                           │
│    purchaseToken: "abc123...",                                  │
│    lastCheckedAt: 1701781234567                                 │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Consumed by all screens
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI LAYER                                    │
│                                                                   │
│  ProfileScreen:                                                  │
│    • Shows "PRO" badge                                           │
│    • Shows "Pro Plan Active" banner                              │
│                                                                   │
│  SubscriptionPlansScreen:                                        │
│    • Marks Pro card as "CURRENT PLAN"                            │
│    • Shows status banner                                         │
│                                                                   │
│  AnalyzeScreen:                                                  │
│    • Unlocks unlimited analyses                                  │
│    • Hides upgrade prompts                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              refreshSubscription() called                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                    Try block
                         │
                    ┌────▼────┐
                    │         │
              ┌─────┤ Success?├─────┐
              │     │         │     │
              │     └─────────┘     │
              │                     │
            Error                Success
              │                     │
              ▼                     ▼
┌─────────────────────┐   ┌─────────────────────┐
│   ERROR HANDLING    │   │   UPDATE STATE      │
│                     │   │                     │
│ • Log error         │   │ • Set isSubscribed  │
│ • Set loading=false │   │ • Set activePlan    │
│ • Set isSubscribed  │   │ • Set loading=false │
│   = false (fail-safe)│   │ • Update UI         │
│ • Show last known   │   │                     │
│   state or default  │   │                     │
└─────────────────────┘   └─────────────────────┘
           │                         │
           └────────┬────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  UI CONTINUES   │
           │                 │
           │ App remains     │
           │ functional      │
           └─────────────────┘
```

## Multi-Subscription Handling

```
┌─────────────────────────────────────────────────────────────────┐
│              getAvailablePurchases() returns                     │
│                                                                   │
│  [                                                               │
│    { productId: "muscleai.basic.monthly", date: 1701700000000 },│
│    { productId: "muscleai.pro.monthly", date: 1701800000000 },  │
│    { productId: "muscleai.vip.monthly", date: 1701750000000 }   │
│  ]                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Multiple subscriptions detected
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          getActiveSubscriptionForUser()                          │
│                                                                   │
│  1. Filter only subscription SKUs ✓                              │
│  2. Sort by transaction date                                     │
│  3. Pick LATEST one                                              │
│                                                                   │
│  Result: Pro (date: 1701800000000) ← Latest                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Single subscription selected
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    State Updated                                 │
│                                                                   │
│  isSubscribed: true                                              │
│  activePlan: "Pro"                                              │
│                                                                   │
│  (Other subscriptions ignored)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

These diagrams show:
1. **Architecture** - How components interact
2. **Purchase Flow** - Step-by-step purchase process
3. **App Lifecycle** - When subscription is checked
4. **State Machine** - Subscription state transitions
5. **Data Flow** - How data moves through the system
6. **Error Handling** - How errors are handled gracefully
7. **Multi-Subscription** - How multiple subscriptions are handled

The key principle: **Google Play is the source of truth**, and the app simply queries it to determine subscription status.
