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

interface AgeScreenProps {
  onContinue: (data: { birthDate: Date }) => void;
  onSkip: () => void;
  onBack: () => void;
  progress: number;
}

export const AgeScreen: React.FC<AgeScreenProps> = React.memo(({
  onContinue,
  onSkip,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2000);

  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => currentYear - i), [currentYear]);

  const handleContinue = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    onContinue({ birthDate });
  }, [selectedYear, selectedMonth, selectedDay, onContinue]);

  const handleSkip = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSkip();
  }, [onSkip]);

  const handleBack = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onBack();
  }, [onBack]);

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
            <Text style={styles.title}>When were you{'\n'}born?</Text>
            <Text style={styles.subtitle}>
              Age helps us provide better{'\n'}fitness recommendations for you.
            </Text>
          </View>

          {/* Date Pickers */}
          <View style={styles.pickersContainer}>
            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <View style={styles.pickerWrapper}>
                <ScrollView
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === index && styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Day Picker */}
            <View style={[styles.pickerColumn, styles.pickerColumnSmall]}>
              <View style={styles.pickerWrapper}>
                <ScrollView
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Year Picker */}
            <View style={[styles.pickerColumn, styles.pickerColumnSmall]}>
              <View style={styles.pickerWrapper}>
                <ScrollView
                  style={styles.picker}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

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
});

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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },
  pickersContainer: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 20,
    gap: 12,
  },
  pickerColumn: {
    flex: 2,
  },
  pickerColumnSmall: {
    flex: 1,
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
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(212, 165, 116, 0.3)',
  },
  pickerItemText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 18,
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
