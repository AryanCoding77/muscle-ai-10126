# MuscleAI Onboarding System

## Overview

The onboarding system provides a smooth, engaging introduction to MuscleAI for new users. It collects essential user information and showcases the app's value proposition before the login screen.

## Flow Structure

The onboarding consists of 7 screens in the following order:

1. **Welcome Screen** - Introduction with app preview
2. **Height & Weight Screen** - Collect physical measurements (with skip option)
3. **Age Screen** - Collect birth date (with skip option)
4. **Where Did You Hear Screen** - Marketing attribution (with skip option)
5. **Comparison Screen** - Show MuscleAI vs manual tracking benefits
6. **Potential Screen** - Display weight transition graph
7. **Thank You Screen** - Privacy message and final step

After completing onboarding, users proceed to the Google login screen.

## Features

### Progress Tracking
- Visual progress bar at the top of each screen
- Shows current position in the onboarding flow
- Back button to navigate to previous screens

### Data Collection
Users can provide (all optional via skip button):
- **Height & Weight**: With metric/imperial toggle
- **Age**: Date picker for birth date
- **Referral Source**: Where they heard about the app
  - Instagram
  - Facebook
  - TikTok
  - YouTube
  - Google
  - TV
  - Friend
  - Other

### Motivational Screens
- **Comparison**: Shows 2X better results with MuscleAI
- **Potential**: Weight transition graph visualization
- **Thank You**: Privacy and security message

## Database Schema

The following fields are added to the `profiles` table:

```sql
- height (INTEGER) - User height in cm or inches
- weight (INTEGER) - User weight in kg or lbs
- unit_preference (TEXT) - 'metric' or 'imperial'
- birth_date (TIMESTAMP) - User's date of birth
- referral_source (TEXT) - Marketing attribution
- onboarding_completed (BOOLEAN) - Completion flag
```

## Installation

### 1. Deploy Database Schema

Run the deployment script to add onboarding fields to your database:

```bash
deploy-onboarding-schema.bat
```

Or manually execute the SQL:

```bash
npx supabase db execute --file add-onboarding-fields.sql
```

### 2. App Integration

The onboarding flow is automatically integrated into the app's authentication flow. When a user is not logged in, they will see:

1. Onboarding screens (7 screens)
2. Google login screen

## File Structure

```
src/screens/
├── onboarding/
│   ├── WelcomeScreen.tsx
│   ├── HeightWeightScreen.tsx
│   ├── AgeScreen.tsx
│   ├── WhereDidYouHearScreen.tsx
│   ├── ComparisonScreen.tsx
│   ├── PotentialScreen.tsx
│   ├── ThankYouScreen.tsx
│   └── index.ts
├── OnboardingFlow.tsx (Main container)
└── ProfileScreen.tsx (Updated to display data)
```

## Usage

### Viewing Onboarding Data

User onboarding data is displayed in the Profile screen under "Personal Stats":
- Height (with unit)
- Weight (with unit)
- Age (calculated from birth date)

### Accessing Data in Code

```typescript
import { supabase } from '../lib/supabase';

// Get user profile with onboarding data
const { data: profile } = await supabase
  .from('profiles')
  .select('height, weight, unit_preference, birth_date, referral_source')
  .eq('id', userId)
  .single();

// Calculate age from birth date
const age = Math.floor(
  (new Date().getTime() - new Date(profile.birth_date).getTime()) / 
  (365.25 * 24 * 60 * 60 * 1000)
);
```

## Customization

### Adding New Screens

1. Create a new screen component in `src/screens/onboarding/`
2. Add it to the flow in `OnboardingFlow.tsx`
3. Update the `totalSteps` count
4. Export it from `src/screens/onboarding/index.ts`

### Modifying Questions

Edit the respective screen files:
- `HeightWeightScreen.tsx` - Physical measurements
- `AgeScreen.tsx` - Birth date picker
- `WhereDidYouHearScreen.tsx` - Referral sources

### Styling

All screens use the app's existing color scheme from `src/config/constants.ts`:
- Background: Linear gradient (dark to brown tones)
- Primary button: `#1C1C1E`
- Text: White with various opacities
- Progress bar: White

## Skip Functionality

Users can skip data collection screens (screens 2-4) by tapping the "Skip" button. Motivational screens (5-7) cannot be skipped to ensure users understand the app's value.

## Data Privacy

The onboarding system includes a privacy message on the Thank You screen, reassuring users that their personal information is kept private and secure.

## Testing

### Test the Flow

1. Log out of the app
2. Close and reopen the app
3. You should see the onboarding screens
4. Test all interactions:
   - Progress bar updates
   - Back button navigation
   - Skip buttons on data collection screens
   - Data input (height, weight, age, source)
   - Continue buttons

### Verify Data Storage

After completing onboarding:
1. Go to Profile screen
2. Check that Personal Stats section displays your data
3. Verify in Supabase dashboard that profile was updated

## Troubleshooting

### Onboarding Not Showing

- Check that user is logged out
- Verify `showOnboarding` state in `AuthStackNavigator`
- Check console for errors

### Data Not Saving

- Verify database schema was deployed
- Check Supabase RLS policies allow profile updates
- Review console logs for error messages

### Styling Issues

- Ensure all required dependencies are installed:
  - `expo-linear-gradient`
  - `react-native-svg`
  - `@expo/vector-icons`

## Future Enhancements

Potential improvements:
- Add fitness goal selection
- Include activity level assessment
- Add dietary preferences
- Implement A/B testing for different flows
- Add animations between screens
- Include video tutorials
- Add gamification elements

## Support

For issues or questions:
1. Check console logs for errors
2. Verify database schema is deployed
3. Review this documentation
4. Check that all dependencies are installed
