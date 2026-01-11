import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/constants';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = React.memo(({ onContinue }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const handleContinue = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onContinue();
  }, [onContinue]);

  // Memoize responsive sizing
  const responsiveSizes = useMemo(() => ({
    imageHeight: Math.min(screenHeight * 0.55, 500),
    titleFontSize: Math.min(screenWidth * 0.095, 38),
    buttonPadding: Math.min(screenHeight * 0.022, 18),
  }), [screenWidth, screenHeight]);

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A', '#2F1B14', '#8B4513', '#A67C52']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Phone preview image */}
          <View style={styles.phoneContainer}>
            <Image
              source={require('../../../assets/mobile-preview.png')}
              style={[styles.phoneImage, { height: responsiveSizes.imageHeight }]}
              resizeMode="contain"
            />
          </View>

          {/* Title and Button Section */}
          <View style={styles.bottomSection}>
            {/* Title */}
            <Text style={[styles.title, { fontSize: responsiveSizes.titleFontSize }]}>
              AI-Powered Muscle{'\n'}Analysis
            </Text>

            {/* Get Started Button */}
            <TouchableOpacity
              style={[styles.getStartedButton, { paddingVertical: responsiveSizes.buttonPadding }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: '5%',
    paddingTop: '2%',
    paddingBottom: '5%',
  },
  phoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '3%',
  },
  phoneImage: {
    width: '90%',
    maxWidth: 400,
  },
  bottomSection: {
    paddingBottom: '8%',
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: '5%',
    lineHeight: 46,
  },
  getStartedButton: {
    backgroundColor: '#D4A574',
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: '8%',
    marginBottom: '3%',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
