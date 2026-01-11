import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WelcomeScreen } from './onboarding/WelcomeScreen';
import { HeightWeightScreen } from './onboarding/HeightWeightScreen';
import { AgeScreen } from './onboarding/AgeScreen';
import { WhereDidYouHearScreen } from './onboarding/WhereDidYouHearScreen';
import { ComparisonScreen } from './onboarding/ComparisonScreen';
import { PotentialScreen } from './onboarding/PotentialScreen';
import { ThankYouScreen } from './onboarding/ThankYouScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingData {
  height?: number;
  weight?: number;
  unit?: 'metric' | 'imperial';
  birthDate?: Date;
  source?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const totalSteps = 7;

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleHeightWeightContinue = useCallback((data: { height: number; weight: number; unit: 'metric' | 'imperial' }) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handleAgeContinue = useCallback((data: { birthDate: Date }) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handleSourceContinue = useCallback((data: { source: string }) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      // Save onboarding data to AsyncStorage to persist after login
      await AsyncStorage.setItem('pendingOnboardingData', JSON.stringify(onboardingData));
      console.log('Onboarding data saved to AsyncStorage:', onboardingData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
    
    // Ensure we don't go past the last step
    if (currentStep >= totalSteps - 1) {
      onComplete();
    }
  }, [onboardingData, currentStep, totalSteps, onComplete]);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen onContinue={handleNext} />;
      case 1:
        return (
          <HeightWeightScreen
            onContinue={handleHeightWeightContinue}
            onSkip={handleNext}
            onBack={handleBack}
            progress={progress}
          />
        );
      case 2:
        return (
          <AgeScreen
            onContinue={handleAgeContinue}
            onSkip={handleNext}
            onBack={handleBack}
            progress={progress}
          />
        );
      case 3:
        return (
          <WhereDidYouHearScreen
            onContinue={handleSourceContinue}
            onSkip={handleNext}
            onBack={handleBack}
            progress={progress}
          />
        );
      case 4:
        return (
          <ComparisonScreen
            onContinue={handleNext}
            onBack={handleBack}
            progress={progress}
          />
        );
      case 5:
        return (
          <PotentialScreen
            onContinue={handleNext}
            onBack={handleBack}
            progress={progress}
          />
        );
      case 6:
        return (
          <ThankYouScreen
            onContinue={handleComplete}
            onBack={handleBack}
            progress={progress}
          />
        );
      default:
        return <WelcomeScreen onContinue={handleNext} />;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
