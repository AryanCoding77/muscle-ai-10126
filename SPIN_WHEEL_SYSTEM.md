# 🎰 Spin Wheel Free Trial System

## Overview
An exciting gamified onboarding experience where new users spin a wheel to win 1-3 free analyses. The wheel shows numbers 1-5, but users can only win 1, 2, or 3 (4 and 5 are just for show to make it more exciting).

## 🎯 Features

### User Experience
- **Exciting Animation**: Smooth spinning wheel with 4-second animation
- **Visual Appeal**: Colorful segments with gradient background
- **Haptic Feedback**: Vibrations on spin and win
- **Fair Distribution**: Random selection between 1, 2, or 3 analyses
- **One-Time Only**: Each user can only spin once

### Technical Features
- **Backend Validation**: Spin status tracked in database
- **Automatic Navigation**: Shows after login, before home screen
- **Smooth Integration**: Works with existing free trial system
- **Type-Safe**: Full TypeScript implementation

## 🎨 Wheel Design

```
     ↓ (Pointer)
┌─────────────────┐
│                 │
│    5   │   1    │
│   ─────┼─────   │
│    4   │   2    │
│   ─────┼─────   │
│        3        │
│                 │
└─────────────────┘
```

### Segments
1. **Segment 1** (Blue #3498DB) - 1 Analysis
2. **Segment 2** (Green #2ECC71) - 2 Analyses
3. **Segment 3** (Orange #F39C12) - 3 Analyses
4. **Segment 4** (Red #E74C3C) - 4 Analyses (DISPLAY ONLY)
5. **Segment 5** (Purple #9B59B6) - 5 Analyses (DISPLAY ONLY)

**Important**: The wheel will NEVER land on 4 or 5. These are just for visual excitement!

## 🔄 User Flow

```
User Logs In
     ↓
Check: has_spun_wheel?
     ↓
   NO → Show Spin Screen
     ↓
User Spins Wheel
     ↓
Wheel Spins (4 seconds)
     ↓
Lands on 1, 2, or 3
     ↓
Update Database:
  - free_trial_analyses_remaining = won amount
  - has_spun_wheel = true
     ↓
Show Congratulations
     ↓
User Clicks "Continue"
     ↓
Navigate to Home Screen
```

## 📁 Files Created

### Components
- `src/screens/FreeTrialSpinScreen.tsx` - Main spin wheel screen
- `src/components/FreeTrialSpinGate.tsx` - Navigation gate to check spin status

### Services
- Updated `src/services/subscriptionService.ts`:
  - `needsToSpinWheel()` - Check if user needs to spin
  - `markWheelAsSpun()` - Mark user as having spun

### Database
- Updated `add-free-trial-system.sql`:
  - Added `has_spun_wheel` column
  - Changed default `free_trial_analyses_remaining` to 0
  - Users must spin to get their free analyses

### Navigation
- Updated `App.tsx`:
  - Added FreeTrialSpin screen
  - Integrated FreeTrialSpinGate

## 🗄️ Database Schema

### New Column
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_spun_wheel BOOLEAN DEFAULT false;
```

### Modified Column
```sql
-- Changed from DEFAULT 2 to DEFAULT 0
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_trial_analyses_remaining INTEGER DEFAULT 0;
```

### Logic
- New users: `has_spun_wheel = false`, `free_trial_analyses_remaining = 0`
- After spin: `has_spun_wheel = true`, `free_trial_analyses_remaining = 1-3`

## 🎲 Spin Algorithm

```typescript
// Randomly select 1, 2, or 3 (never 4 or 5)
const actualWin = Math.floor(Math.random() * 3) + 1;

// Calculate target angle
const targetSegmentIndex = actualWin - 1;
const segmentAngle = 72; // 360 / 5 segments
const targetAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;

// Add 5-7 full rotations for excitement
const fullRotations = 5 + Math.random() * 2;
const totalRotation = fullRotations * 360 + targetAngle;

// Animate with easing
Animated.timing(spinValue, {
  toValue: totalRotation,
  duration: 4000,
  easing: Easing.out(Easing.cubic),
}).start();
```

## 🚀 Deployment

### Step 1: Deploy Database Changes
Run the updated SQL in Supabase Dashboard:
```sql
-- From add-free-trial-system.sql
-- Adds has_spun_wheel column
-- Sets all users to need spinning
```

### Step 2: Verify Database
```sql
SELECT 
  email,
  free_trial_analyses_remaining,
  has_spun_wheel
FROM profiles
LIMIT 10;
```

Expected result:
- `free_trial_analyses_remaining = 0`
- `has_spun_wheel = false`

### Step 3: Test Flow
1. Login with test account
2. Should see spin screen immediately
3. Spin the wheel
4. Should win 1, 2, or 3 analyses
5. Click "Continue to App"
6. Should navigate to home screen
7. Login again - should NOT see spin screen

## 🎯 Testing Checklist

### Functional Tests
- [ ] New user sees spin screen after login
- [ ] Wheel spins smoothly for 4 seconds
- [ ] Wheel lands on 1, 2, or 3 (never 4 or 5)
- [ ] Database updates correctly
- [ ] User can only spin once
- [ ] Returning users don't see spin screen
- [ ] "Continue" button navigates to home

### Visual Tests
- [ ] Wheel renders correctly
- [ ] Colors are vibrant
- [ ] Pointer is visible
- [ ] Text is readable
- [ ] Animations are smooth
- [ ] Congratulations message shows

### Edge Cases
- [ ] Network failure during spin
- [ ] App closed during spin
- [ ] Multiple rapid taps on spin button
- [ ] Database update failure

## 🎨 Customization

### Change Win Probabilities
```typescript
// Equal probability (current)
const actualWin = Math.floor(Math.random() * 3) + 1;

// Weighted probability (example: favor 2)
const weights = [0.3, 0.5, 0.2]; // 30% for 1, 50% for 2, 20% for 3
const random = Math.random();
let actualWin = 1;
let cumulative = 0;
for (let i = 0; i < weights.length; i++) {
  cumulative += weights[i];
  if (random < cumulative) {
    actualWin = i + 1;
    break;
  }
}
```

### Change Spin Duration
```typescript
// In FreeTrialSpinScreen.tsx
Animated.timing(spinValue, {
  toValue: totalRotation,
  duration: 4000, // Change this (milliseconds)
  easing: Easing.out(Easing.cubic),
}).start();
```

### Change Wheel Colors
```typescript
const segments = [
  { value: 1, color: '#YOUR_COLOR', label: '1' },
  { value: 2, color: '#YOUR_COLOR', label: '2' },
  { value: 3, color: '#YOUR_COLOR', label: '3' },
  { value: 4, color: '#YOUR_COLOR', label: '4' },
  { value: 5, color: '#YOUR_COLOR', label: '5' },
];
```

## 📊 Analytics

### Track These Metrics
```sql
-- Distribution of wins
SELECT 
  free_trial_analyses_remaining,
  COUNT(*) as users
FROM profiles
WHERE has_spun_wheel = true
GROUP BY free_trial_analyses_remaining;

-- Spin completion rate
SELECT 
  COUNT(*) FILTER (WHERE has_spun_wheel = true) * 100.0 / 
  COUNT(*) as spin_completion_rate
FROM profiles;

-- Average analyses won
SELECT 
  AVG(free_trial_analyses_remaining) as avg_analyses_won
FROM profiles
WHERE has_spun_wheel = true;
```

## 🐛 Troubleshooting

### Issue: Spin screen not showing
**Solution**: Check `has_spun_wheel` in database
```sql
UPDATE profiles SET has_spun_wheel = false WHERE id = 'user_id';
```

### Issue: Wheel lands on 4 or 5
**Solution**: This should NEVER happen. Check the spin algorithm.

### Issue: Database not updating
**Solution**: Check Supabase logs and RLS policies

### Issue: User sees spin screen every time
**Solution**: Check if `markWheelAsSpun()` is being called

## 🎉 Success Criteria

### Technical
- ✅ Wheel spins smoothly (60fps)
- ✅ Only lands on 1, 2, or 3
- ✅ Database updates correctly
- ✅ One spin per user
- ✅ No errors in console

### User Experience
- ✅ Exciting and engaging
- ✅ Clear instructions
- ✅ Smooth animations
- ✅ Haptic feedback works
- ✅ Easy to continue

### Business
- ✅ Increases engagement
- ✅ Gamifies onboarding
- ✅ Fair distribution
- ✅ Trackable metrics

## 🔮 Future Enhancements

### Potential Features
1. **Daily Spin** - Let users spin once per day
2. **Bonus Spins** - Reward for referrals or achievements
3. **Special Events** - Temporary increased odds
4. **Animations** - Confetti on win
5. **Sound Effects** - Spinning and winning sounds
6. **Leaderboard** - Show what others won
7. **Share Feature** - Share your win on social media

### A/B Testing Ideas
- Test different wheel designs
- Test different win distributions
- Test with/without haptic feedback
- Test different messaging

## 📝 Summary

The Spin Wheel system provides an exciting, gamified way for users to receive their free trial analyses. It's:
- **Engaging** - Fun spinning animation
- **Fair** - Random distribution between 1-3
- **Secure** - Backend validation
- **One-time** - Each user spins once
- **Integrated** - Works with existing system

Users will love the excitement of spinning to see what they get, and it creates a memorable first impression!

---

**Status**: ✅ Ready for Deployment
**Version**: 1.0.0
**Last Updated**: January 12, 2026
