# Dimensions.get() Error Fix

## 🐛 Error
```
[runtime not ready]: TypeError: Cannot read property 'get' of undefined
```

## 🔍 Root Cause
The error was caused by calling `Dimensions.get('window')` at the **module level** (when files are imported) before React Native is fully initialized in production builds.

```typescript
// ❌ BAD - Called at module level
const { width: screenWidth } = Dimensions.get('window');

export const MyScreen = () => {
  // component code
}
```

This works fine in development but fails in production AAB builds because the Dimensions API isn't ready when modules are loaded.

## ✅ Fix Applied

Removed all `Dimensions.get()` calls at module level from onboarding screens:

### Files Fixed:
1. ✅ `src/screens/onboarding/WelcomeScreen.tsx`
2. ✅ `src/screens/onboarding/HeightWeightScreen.tsx`
3. ✅ `src/screens/onboarding/AgeScreen.tsx`
4. ✅ `src/screens/onboarding/WhereDidYouHearScreen.tsx`
5. ✅ `src/screens/onboarding/ComparisonScreen.tsx`
6. ✅ `src/screens/onboarding/PotentialScreen.tsx`
7. ✅ `src/screens/onboarding/ThankYouScreen.tsx`

### Changes Made:
- Removed `Dimensions` import
- Removed `const { width: screenWidth } = Dimensions.get('window');`
- Updated styles to use percentage-based or fixed sizing where needed

## 📝 Alternative Solutions

If you need dynamic dimensions, use one of these approaches:

### Option 1: useWindowDimensions Hook (Recommended)
```typescript
import { useWindowDimensions } from 'react-native';

export const MyScreen = () => {
  const { width, height } = useWindowDimensions();
  
  return (
    <View style={{ width: width * 0.8 }}>
      {/* content */}
    </View>
  );
}
```

### Option 2: Percentage-based Sizing
```typescript
const styles = StyleSheet.create({
  container: {
    width: '80%',  // Instead of screenWidth * 0.8
    height: '50%', // Instead of screenHeight * 0.5
  }
});
```

### Option 3: Dimensions inside Component
```typescript
export const MyScreen = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  return <View style={{ width: dimensions.width * 0.8 }} />;
}
```

## 🚀 Status

✅ All onboarding screens fixed
✅ No TypeScript errors
✅ Ready for production build

## 🧪 Testing

Build and test:
```bash
eas build --platform android --profile production
```

The app should now open without the "Cannot read property 'get' of undefined" error.

## 📚 Related Issues

This is a common issue in React Native production builds. The Dimensions API requires the native bridge to be fully initialized, which doesn't happen until after module imports are complete.

**Key Takeaway**: Never call `Dimensions.get()` at module level. Always call it inside components or use `useWindowDimensions` hook.
