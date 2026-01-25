import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Image,
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
    phoneHeight: Math.min(screenHeight * 0.55, 500),
    phoneWidth: Math.min(screenHeight * 0.55, 500) * 0.5, // Aspect ratio for phone
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
          {/* Phone frame with image */}
          <View style={styles.phoneContainer}>
            <View style={[
              styles.phoneFrame,
              {
                height: responsiveSizes.phoneHeight,
                width: responsiveSizes.phoneWidth,
              }
            ]}>
              {/* Phone frame border */}
              <View style={styles.phoneBezel}>
                {/* Image inside phone - replace with your demo image */}
                <Image
                  source={require('../../../assets/icon.png')} // Change this to your demo image
                  style={styles.image}
                  resizeMode="cover"
                />
                
                {/* Overlay text on image */}
                <View style={styles.imageOverlay}>
                  <Text style={styles.overlayText}>🎥 Demo</Text>
                  <Text style={styles.overlaySubtext}>AI Muscle Analysis</Text>
                </View>
              </View>
              
              {/* Phone notch (optional) */}
              <View style={styles.phoneNotch} />
            </View>
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
  phoneFrame: {
    backgroundColor: '#1A1A1A',
    borderRadius: 35,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  phoneBezel: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  overlaySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  phoneNotch: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 25,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
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
