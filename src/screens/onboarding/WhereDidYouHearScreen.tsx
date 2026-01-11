import React, { useState } from 'react';
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

interface WhereDidYouHearScreenProps {
  onContinue: (data: { source: string }) => void;
  onSkip: () => void;
  onBack: () => void;
  progress: number;
}

const sources = [
  { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
  { id: 'tiktok', name: 'TikTok', icon: 'music-note', color: '#000000' },
  { id: 'youtube', name: 'Youtube', icon: 'youtube', color: '#FF0000' },
  { id: 'google', name: 'Google', icon: 'google', color: '#4285F4' },
  { id: 'tv', name: 'TV', icon: 'television', color: '#666666' },
  { id: 'friend', name: 'Friend', icon: 'account-group', color: '#50C878' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal', color: '#8E8E93' },
];

export const WhereDidYouHearScreen: React.FC<WhereDidYouHearScreenProps> = ({
  onContinue,
  onSkip,
  onBack,
  progress,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  // Responsive sizing
  const titleFontSize = Math.min(screenWidth * 0.08, 32);
  const buttonPadding = Math.min(screenHeight * 0.02, 16);

  const handleContinue = async () => {
    if (!selectedSource) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onContinue({ source: selectedSource });
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

  const handleSelectSource = async (sourceId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedSource(sourceId);
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
            <Text style={[styles.title, { fontSize: titleFontSize }]}>Where did you hear{'\n'}about us?</Text>
          </View>

          {/* Source Options */}
          <ScrollView 
            style={styles.sourcesContainer}
            contentContainerStyle={styles.sourcesContent}
            showsVerticalScrollIndicator={false}
          >
            {sources.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.sourceItem,
                  selectedSource === source.id && styles.sourceItemSelected,
                  source.id === 'tiktok' && selectedSource === source.id && styles.sourceItemTikTok,
                ]}
                onPress={() => handleSelectSource(source.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.sourceIcon, { backgroundColor: source.color }]}>
                  <Icon name={source.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.sourceName}>{source.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { paddingVertical: buttonPadding },
              !selectedSource && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={!selectedSource}
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
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  sourcesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sourcesContent: {
    paddingBottom: 10,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  sourceItemSelected: {
    backgroundColor: 'rgba(212, 165, 116, 0.3)',
    borderColor: '#D4A574',
    borderWidth: 2,
  },
  sourceItemTikTok: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sourceName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
