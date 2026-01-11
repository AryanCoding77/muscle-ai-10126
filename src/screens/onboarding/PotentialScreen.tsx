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
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config/constants';

interface PotentialScreenProps {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export const PotentialScreen: React.FC<PotentialScreenProps> = ({
  onContinue,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Responsive sizing
  const titleFontSize = Math.min(screenWidth * 0.08, 32);
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
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: titleFontSize }]}>
              Track your muscle{'\n'}growth with AI{'\n'}precision
            </Text>
          </View>

          {/* Graph Card */}
          <View style={styles.graphCard}>
            <Text style={styles.graphTitle}>Your muscle development</Text>
            
            {/* Simple Graph */}
            <View style={styles.graphContainer}>
              <Svg width="100%" height="150" viewBox="0 0 300 150">
                {/* Graph line */}
                <Path
                  d="M 20 120 Q 80 110, 100 100 Q 140 80, 180 60 Q 220 30, 280 20"
                  stroke="#D4A574"
                  strokeWidth="3"
                  fill="none"
                />
                
                {/* Fill area under curve */}
                <Path
                  d="M 20 120 Q 80 110, 100 100 Q 140 80, 180 60 Q 220 30, 280 20 L 280 150 L 20 150 Z"
                  fill="rgba(212, 165, 116, 0.2)"
                />
                
                {/* Data points */}
                <Circle cx="20" cy="120" r="4" fill="#FFFFFF" />
                <Circle cx="100" cy="100" r="4" fill="#FFFFFF" />
                <Circle cx="180" cy="60" r="4" fill="#FFFFFF" />
                <Circle cx="280" cy="20" r="8" fill="#FF8C42" />
              </Svg>
              
              {/* Timeline labels */}
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabel}>Week 1</Text>
                <Text style={styles.timelineLabel}>Week 4</Text>
                <Text style={styles.timelineLabel}>Week 12</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.graphDescription}>
              AI tracks your muscle development over time,{'\n'}
              showing you exactly which muscles are growing{'\n'}
              and which need more attention
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
    paddingTop: '3%',
    justifyContent: 'space-between',
    paddingBottom: '6%',
  },
  titleContainer: {
    marginBottom: '3%',
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  graphCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: '6%',
    marginBottom: '5%',
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  graphContainer: {
    marginBottom: 20,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  timelineLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  graphDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
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
