-- Add onboarding fields to profiles table

-- Add height field (in cm or inches depending on unit_preference)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Add weight field (in kg or lbs depending on unit_preference)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Add unit preference (metric or imperial)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS unit_preference TEXT DEFAULT 'metric';

-- Add birth date
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date TIMESTAMP WITH TIME ZONE;

-- Add referral source (where did you hear about us)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add onboarding completed flag
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.height IS 'User height in cm (metric) or inches (imperial)';
COMMENT ON COLUMN profiles.weight IS 'User weight in kg (metric) or lbs (imperial)';
COMMENT ON COLUMN profiles.unit_preference IS 'User preferred unit system: metric or imperial';
COMMENT ON COLUMN profiles.birth_date IS 'User date of birth for age calculation';
COMMENT ON COLUMN profiles.referral_source IS 'Where the user heard about the app (instagram, facebook, tiktok, etc.)';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
