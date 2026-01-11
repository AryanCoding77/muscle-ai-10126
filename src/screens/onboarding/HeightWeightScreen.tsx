import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/constants';

interface HeightWeightScreenProps {
  onContinue: (data: { height: number; weight: number; unit: 'metric' | 'imperial' }) => void;
  onSkip: () => void;
  onBack: () => void;
  progress: number;
}

export const HeightWeightScreen: React.FC<HeightWeightScreenProps> = ({
  onContinue,
  onSkip,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [selectedHeight, setSelectedHeight] = useState(170);
  const [selectedWeight, setSelectedWeight] = useState(70);

  // Generate height options
  const heightOptions = unit === 'metric'
    ? Array.from({ length: 100 }, (_, i) => 140 + i) // 140-240 cm
    : Array.from({ length: 48 }, (_, i) => 48 + i); // 4'0" - 7'11" (in inches)

  // Generate weight options
  const weightOptions = unit === 'metric'
    ? Array.from({ length: 150 }, (_, i) => 40 + i) // 40-190 kg
    : Array.from({ length: 250 }, (_, i) => 80 + i); // 80-330 lbs

  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onContinue({ height: selectedHeight, weight: selectedWeight, unit });
  };

  const handleSkip = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSkip();
  };

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onBack();
  };

  const toggleUnit = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setUnit(unit === 'metric' ? 'imperial' : 'metric');
    // Convert values when switching
    if (unit === 'metric') {
      setSelectedHeight(Math.round(selectedHeight / 2.54)); // cm to inches
      setSelectedWeight(Math.round(selectedWeight * 2.205)); // kg to lbs
    } else {
      setSelectedHeight(Math.round(selectedHeight * 2.54)); // inches to cm
      setSelectedWeight(Math.round(selectedWeight / 2.205)); // lbs to kg
    }
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
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: Math.min(screenWidth * 0.08, 32) }]}>
              Height & weight
            </Text>
            <Text style={[styles.subtitle, { fontSize: Math.min(screenWidth * 0.04, 16) }]}>
              Help us personalize your{'\n'}muscle analysis and recommendations.
            </Text>
          </View>

          {/* Unit Toggle */}
          <View style={styles.unitToggleContainer}>
            <Text style={[styles.unitLabel, unit === 'imperial' && styles.unitLabelActive]}>
              Imperial
            </Text>
            <TouchableOpacity onPress={toggleUnit} style={styles.toggleSwitch}>
              <View style={[styles.toggleTrack, unit === 'metric' && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, unit === 'metric' && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.unitLabel, unit === 'metric' && styles.unitLabelActive]}>
              Metric
            </Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickersContainer}>
            {/* Height Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Height</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {heightOptions.map((height) => (
                    <TouchableOpacity
                      key={height}
                      style={[
                        styles.pickerItem,
                        selectedHeight === height && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedHeight(height)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedHeight === height && styles.pickerItemTextSelected,
                        ]}
                      >
                        {height} {unit === 'metric' ? 'cm' : 'in'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Weight Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Weight</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {weightOptions.map((weight) => (
                    <TouchableOpacity
                      key={weight}
                      style={[
                        styles.pickerItem,
                        selectedWeight === weight && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedWeight(weight)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedWeight === weight && styles.pickerItemTextSelected,
                        ]}
                      >
                        {weight} {unit === 'metric' ? 'kg' : 'lbs'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, { paddingVertical: Math.min(screenHeight * 0.02, 16) }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Next</Text>
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
  skipButton: {
    padding: 8,
    marginLeft: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unitLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  unitLabelActive: {
    color: '#FFFFFF',
  },
  toggleSwitch: {
    marginHorizontal: 16,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 165, 116, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleTrackActive: {
    backgroundColor: '#D4A574',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  pickersContainer: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 20,
    gap: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(212, 165, 116, 0.3)',
  },
  pickerItemText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#D4A574',
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
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
