# Free Trial System - Testing Checklist

## 🧪 Pre-Deployment Testing

### Database Verification
- [ ] Run `deploy-free-trial.bat` successfully
- [ ] Verify `free_trial_analyses_remaining` column exists
- [ ] Verify `has_had_subscription` column exists
- [ ] Check default value is 2 for new users
- [ ] Verify all existing users have 2 free analyses
- [ ] Test `can_user_analyze_with_trial()` function
- [ ] Test `use_free_trial_analysis()` function
- [ ] Test `increment_usage_counter()` function

### SQL Tests
```sql
-- Test 1: Check column exists
SELECT free_trial_analyses_remaining FROM profiles LIMIT 1;
-- Expected: Returns 2

-- Test 2: Check function exists
SELECT can_user_analyze_with_trial();
-- Expected: Returns result with columns

-- Test 3: Verify all users have trial
SELECT COUNT(*) FROM profiles WHERE free_trial_analyses_remaining = 2;
-- Expected: All users count

-- Test 4: Test usage tracking
SELECT * FROM usage_tracking WHERE metadata->>'is_free_trial' = 'true';
-- Expected: Empty initially
```

---

## 🧪 Functional Testing

### Test Case 1: New User Registration
- [ ] Create new account
- [ ] Check profile in database: `free_trial_analyses_remaining = 2`
- [ ] Navigate to Profile screen
- [ ] Verify "Free Trial Active" banner shows
- [ ] Verify "2 free analyses remaining" text
- [ ] Verify badge shows [2]

### Test Case 2: First Analysis
- [ ] Navigate to Analyze screen
- [ ] Upload/take photo
- [ ] Click "Analyze Muscles"
- [ ] Verify analysis proceeds without subscription
- [ ] Verify results screen appears
- [ ] Check database: `free_trial_analyses_remaining = 1`
- [ ] Navigate to Profile screen
- [ ] Verify banner shows "1 free analysis remaining"
- [ ] Verify badge shows [1]

### Test Case 3: Second Analysis
- [ ] Navigate to Analyze screen
- [ ] Upload/take photo
- [ ] Click "Analyze Muscles"
- [ ] Verify analysis proceeds
- [ ] Verify results screen appears
- [ ] Check database: `free_trial_analyses_remaining = 0`
- [ ] Navigate to Profile screen
- [ ] Verify "Upgrade to Premium" banner shows
- [ ] Verify no free trial banner

### Test Case 4: Third Analysis (Trial Exhausted)
- [ ] Navigate to Analyze screen
- [ ] Upload/take photo
- [ ] Click "Analyze Muscles"
- [ ] Verify "Free Trial Complete!" modal appears
- [ ] Verify modal shows correct message
- [ ] Verify modal shows benefits list
- [ ] Verify "View Premium Plans" button exists
- [ ] Verify "Maybe Later" button exists

### Test Case 5: Modal Interactions
- [ ] Click "View Premium Plans"
- [ ] Verify navigation to SubscriptionPlans screen
- [ ] Go back to Analyze screen
- [ ] Try analysis again
- [ ] Verify modal appears again
- [ ] Click "Maybe Later"
- [ ] Verify modal dismisses
- [ ] Verify user stays on Analyze screen

### Test Case 6: Subscription Purchase
- [ ] Purchase a subscription
- [ ] Verify subscription is active
- [ ] Navigate to Profile screen
- [ ] Verify subscription banner shows (not free trial)
- [ ] Navigate to Analyze screen
- [ ] Perform analysis
- [ ] Verify analysis uses subscription (not free trial)
- [ ] Check database: `free_trial_analyses_remaining` unchanged
- [ ] Check database: subscription `analyses_used_this_month` incremented

### Test Case 7: Subscription Expiry
- [ ] Manually expire subscription in database
- [ ] Navigate to Profile screen
- [ ] Verify "Upgrade to Premium" banner shows
- [ ] Navigate to Analyze screen
- [ ] Try analysis
- [ ] Verify blocked (no free trial available)
- [ ] Verify appropriate error message

---

## 🧪 Edge Cases Testing

### Edge Case 1: User with Partial Free Trial
- [ ] Manually set `free_trial_analyses_remaining = 1`
- [ ] Perform one analysis
- [ ] Verify counter goes to 0
- [ ] Try another analysis
- [ ] Verify modal appears

### Edge Case 2: User with 0 Free Trial
- [ ] Manually set `free_trial_analyses_remaining = 0`
- [ ] Try analysis
- [ ] Verify modal appears immediately

### Edge Case 3: Concurrent Analyses
- [ ] Start analysis
- [ ] While processing, start another analysis
- [ ] Verify proper handling (queue or error)

### Edge Case 4: Network Failure
- [ ] Disconnect network
- [ ] Try analysis
- [ ] Verify appropriate error message
- [ ] Reconnect network
- [ ] Verify counter not decremented

### Edge Case 5: Database Error
- [ ] Simulate database error
- [ ] Try analysis
- [ ] Verify graceful error handling
- [ ] Verify user-friendly message

---

## 🧪 UI/UX Testing

### Profile Screen
- [ ] Free trial banner displays correctly
- [ ] Colors match design (green gradient)
- [ ] Icon displays correctly (🎁)
- [ ] Text is readable
- [ ] Badge shows correct number
- [ ] Banner is tappable (if applicable)
- [ ] Responsive on different screen sizes

### Analyze Screen
- [ ] No subscription gate for free trial users
- [ ] Upload/camera functionality works
- [ ] Analysis proceeds smoothly
- [ ] Progress indicator shows
- [ ] Results display correctly

### Free Trial Modal
- [ ] Modal appears with correct animation
- [ ] All text is readable
- [ ] Icons display correctly
- [ ] Benefits list is complete
- [ ] Buttons are tappable
- [ ] Modal is dismissible
- [ ] Blur effect works
- [ ] Responsive on different screen sizes

---

## 🧪 Performance Testing

### Database Performance
- [ ] Query execution time < 100ms
- [ ] Index usage verified
- [ ] No N+1 queries
- [ ] Connection pooling works

### API Performance
- [ ] Analysis API response time acceptable
- [ ] No timeout issues
- [ ] Proper error handling
- [ ] Retry logic works

### UI Performance
- [ ] Modal animation smooth (60fps)
- [ ] No UI freezing
- [ ] Image upload responsive
- [ ] Navigation smooth

---

## 🧪 Security Testing

### Authentication
- [ ] Only authenticated users can analyze
- [ ] User can only access own data
- [ ] RLS policies enforced
- [ ] Session handling correct

### Authorization
- [ ] Users can't manipulate free trial count
- [ ] Backend validation prevents cheating
- [ ] API endpoints secured
- [ ] SQL injection prevented

### Data Privacy
- [ ] User data isolated
- [ ] No data leakage between users
- [ ] Proper error messages (no sensitive info)

---

## 🧪 Cross-Platform Testing

### iOS
- [ ] Profile screen displays correctly
- [ ] Analyze screen works
- [ ] Modal appears correctly
- [ ] Camera/photo picker works
- [ ] Haptic feedback works

### Android
- [ ] Profile screen displays correctly
- [ ] Analyze screen works
- [ ] Modal appears correctly
- [ ] Camera/photo picker works
- [ ] Haptic feedback works

### Web (if applicable)
- [ ] All features work
- [ ] Responsive design
- [ ] Modal displays correctly

---

## 🧪 Analytics Testing

### Event Tracking
- [ ] Free trial start tracked
- [ ] Analysis completion tracked
- [ ] Free trial exhaustion tracked
- [ ] Modal view tracked
- [ ] CTA click tracked
- [ ] Conversion tracked

### Database Queries
```sql
-- Test analytics queries
SELECT 
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 2) as unused,
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 1) as used_one,
  COUNT(*) FILTER (WHERE free_trial_analyses_remaining = 0) as exhausted
FROM profiles;

-- Test conversion tracking
SELECT COUNT(*) FROM usage_tracking 
WHERE metadata->>'is_free_trial' = 'true';
```

---

## 🧪 Regression Testing

### Existing Features
- [ ] Subscription system still works
- [ ] Payment processing works
- [ ] User authentication works
- [ ] Profile editing works
- [ ] Analysis history works
- [ ] Progress tracking works
- [ ] Achievements work

### No Breaking Changes
- [ ] Existing users not affected negatively
- [ ] Subscription users not impacted
- [ ] All screens load correctly
- [ ] Navigation works
- [ ] No console errors

---

## 🧪 User Acceptance Testing

### User Scenarios
- [ ] New user can complete onboarding
- [ ] User can perform first analysis easily
- [ ] User understands free trial concept
- [ ] Upgrade path is clear
- [ ] User can purchase subscription
- [ ] User can manage subscription

### User Feedback
- [ ] Modal message is clear
- [ ] Benefits are compelling
- [ ] CTA is obvious
- [ ] No confusion about limits
- [ ] Positive user experience

---

## ✅ Final Checklist

### Before Production
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained
- [ ] Rollback plan ready

### Production Deployment
- [ ] Database migration successful
- [ ] No errors in logs
- [ ] Monitoring active
- [ ] Analytics tracking
- [ ] Support team notified

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check conversion metrics
- [ ] Gather user feedback
- [ ] Review analytics
- [ ] Plan iterations

---

## 📊 Success Criteria

### Technical
- ✅ 0 critical bugs
- ✅ < 1% error rate
- ✅ < 100ms query time
- ✅ 100% test coverage

### Business
- ✅ > 70% users use 1st free analysis
- ✅ > 50% users use 2nd free analysis
- ✅ > 10% conversion rate
- ✅ Positive user feedback

---

## 🐛 Bug Reporting Template

```
Title: [Brief description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Result:


Actual Result:


Environment:
- Device: 
- OS: 
- App Version: 

Screenshots:
[Attach if applicable]

Database State:
[Query results if applicable]

Priority: [Critical/High/Medium/Low]
```

---

## 📝 Test Results Log

| Test Case | Status | Date | Tester | Notes |
|-----------|--------|------|--------|-------|
| New User Registration | ⬜ | | | |
| First Analysis | ⬜ | | | |
| Second Analysis | ⬜ | | | |
| Third Analysis | ⬜ | | | |
| Modal Interactions | ⬜ | | | |
| Subscription Purchase | ⬜ | | | |
| Edge Cases | ⬜ | | | |
| UI/UX | ⬜ | | | |
| Performance | ⬜ | | | |
| Security | ⬜ | | | |

Legend: ✅ Pass | ❌ Fail | ⬜ Not Tested | ⚠️ Needs Review

---

## 🎉 Testing Complete!

Once all tests pass, you're ready to deploy the free trial system to production!

**Remember:**
- Test thoroughly
- Document issues
- Fix critical bugs
- Monitor after deployment
- Iterate based on data
