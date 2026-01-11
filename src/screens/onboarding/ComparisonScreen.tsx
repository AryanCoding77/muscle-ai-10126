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
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/constants';

interface ComparisonScreenProps {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export const ComparisonScreen: React.FC<ComparisonScreenProps> = ({
  onContinue,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
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
          {/* Title */}
          <Text style={styles.title}>
            Build twice as much{'\n'}muscle with MuscleAI{'\n'}vs{'\n'}on your own
          </Text>

          {/* Comparison Cards */}
          <View style={styles.comparisonContainer}>
            {/* Without MuscleAI - Smaller */}
            <View style={styles.comparisonCardSmall}>
              <Text style={styles.cardLabel}>Without MuscleAI</Text>
              <View style={styles.resultBoxSmall}>
                <Text style={styles.resultTextSmall}>20%</Text>
              </View>
            </View>

            {/* With MuscleAI - Bigger */}
            <View style={styles.comparisonCardLarge}>
              <Text style={styles.cardLabel}>With MuscleAI</Text>
              <View style={styles.resultBoxLarge}>
                <Text style={styles.resultTextLarge}>2X</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            MuscleAI makes it easy and holds you{'\n'}accountable
          </Text>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 42,
    marginBottom: 40,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    alignItems: 'flex-end',
  },
  comparisonCardSmall: {
    flex: 0.45,
    backgroundColor: 'rgba(139, 69, 19, 0.15)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  comparisonCardLarge: {
    flex: 0.55,
    backgroundColor: 'rgba(139, 69, 19, 0.25)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 260,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  resultBoxSmall: {
    backgroundColor: 'rgba(139, 69, 19, 0.4)',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  resultBoxLarge: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 40,
    paddingHorizontal: 55,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    minHeight: 120,
  },
  resultTextSmall: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  resultTextLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 20,
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
