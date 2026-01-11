import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/constants';

interface ThankYouScreenProps {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({
  onContinue,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Responsive sizing
  const titleFontSize = Math.min(screenWidth * 0.08, 32);
  const illustrationSize = Math.min(screenWidth * 0.5, 200);
  const buttonPadding = Math.min(screenHeight * 0.02, 16);
  
  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onContinue();
  };

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onBack();
  };

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A', '#2F1B14', '#8B4513', '#A67C52']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Svg width={illustrationSize} height={illustrationSize} viewBox="0 0 200 200">
              {/* Background circles */}
              <Circle cx="100" cy="100" r="95" fill="rgba(212, 165, 116, 0.15)" />
              <Circle cx="100" cy="100" r="75" fill="rgba(212, 165, 116, 0.25)" />
              
              {/* Checkmark circle */}
              <Circle cx="100" cy="100" r="50" fill="#D4A574" />
              
              {/* Checkmark */}
              <Path
                d="M 75 100 L 90 115 L 125 80"
                stroke="#1A1A1A"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              
              {/* Sparkles */}
              <Path
                d="M 160 60 L 165 65 L 170 60 L 165 55 Z"
                fill="#D4A574"
              />
              <Path
                d="M 40 140 L 45 145 L 50 140 L 45 135 Z"
                fill="#D4A574"
              />
              <Path
                d="M 150 140 L 153 143 L 156 140 L 153 137 Z"
                fill="#D4A574"
              />
            </Svg>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: titleFontSize }]}>
              Thank you for{'\n'}trusting us!
            </Text>
            <Text style={styles.subtitle}>
              Now let's personalize MuscleAI for you...
            </Text>
          </View>

          {/* Privacy Card */}
          <View style={styles.privacyCard}>
            <View style={styles.lockIcon}>
              <Icon name="lock" size={24} color="#50C878" />
            </View>
            <Text style={styles.privacyTitle}>
              Your privacy and security matter to us.
            </Text>
            <Text style={styles.privacyDescription}>
              We promise to always keep your{'\n'}
              personal information private and secure.
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, { paddingVertical: buttonPadding }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A574',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: '6%',
    paddingTop: '6%',
    justifyContent: 'space-between',
    paddingBottom: '6%',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: '5%',
  },
  titleContainer: {
    marginBottom: '5%',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: '2%',
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
    textAlign: 'center',
  },
  privacyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: '6%',
    alignItems: 'center',
    marginBottom: '5%',
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  privacyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#D4A574',
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
