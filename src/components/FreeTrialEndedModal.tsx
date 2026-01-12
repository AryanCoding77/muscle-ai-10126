import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../config/constants';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface FreeTrialEndedModalProps {
  visible: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  analysesUsed?: number;
}

export const FreeTrialEndedModal: React.FC<FreeTrialEndedModalProps> = ({
  visible,
  onClose,
  onViewPlans,
  analysesUsed = 2,
}) => {
  const handleViewPlans = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onViewPlans();
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🎉</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Free Trial Complete!</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              You've used all {analysesUsed} free analyses
            </Text>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>
                Great job exploring our AI-powered muscle analysis! To continue tracking your progress and unlocking detailed insights, upgrade to a premium plan.
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Premium Benefits:</Text>
              
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✨</Text>
                <Text style={styles.benefitText}>Unlimited AI muscle analyses</Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={styles.benefitText}>Detailed progress tracking</Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💪</Text>
                <Text style={styles.benefitText}>Personalized workout plans</Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🎯</Text>
                <Text style={styles.benefitText}>Advanced muscle insights</Text>
              </View>

              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🏆</Text>
                <Text style={styles.benefitText}>Achievement tracking</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleViewPlans}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>🚀 View Premium Plans</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  message: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  benefitText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
