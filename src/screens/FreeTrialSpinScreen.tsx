import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../config/constants';
import { supabase } from '../services/supabase';
import { markWheelAsSpun } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.75;
const CENTER = WHEEL_SIZE / 2;

interface FreeTrialSpinScreenProps {
  navigation?: any;
  onComplete?: (analyses: number) => void;
}

export const FreeTrialSpinScreen: React.FC<FreeTrialSpinScreenProps> = ({ 
  navigation,
  onComplete 
}) => {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonAnalyses, setWonAnalyses] = useState<number | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // ONLY 3 segments: 1, 2, 3
  const segments = [
    { value: 1, color: '#3498DB', label: '1' },  // Blue
    { value: 2, color: '#2ECC71', label: '2' },  // Green
    { value: 3, color: '#F39C12', label: '3' },  // Orange
  ];

  const segmentAngle = 360 / segments.length; // 120 degrees per segment

  const handleSpin = async () => {
    if (isSpinning || hasSpun) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSpinning(true);

    // Randomly select 1, 2, or 3
    const actualWin = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    
    console.log('🎯 User will win:', actualWin, 'analyses');
    
    // Find the segment index for this value
    const targetSegmentIndex = segments.findIndex(seg => seg.value === actualWin);
    
    console.log('🎲 Target segment index:', targetSegmentIndex);
    
    // Calculate the angle to rotate the wheel so the target segment is at the top
    // The wheel starts with segment 0 at the top (-90 degrees in SVG coordinates)
    // To bring segment N to the top, we rotate by -N * segmentAngle
    const targetAngle = -(targetSegmentIndex * segmentAngle);
    
    // Add 5-7 full rotations for excitement
    const fullRotations = 5 + Math.random() * 2;
    const totalRotation = fullRotations * 360 + targetAngle;

    console.log('🎲 Target angle:', targetAngle);
    console.log('🎲 Total rotation:', totalRotation);

    // Animate the spin
    Animated.timing(spinValue, {
      toValue: totalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      // Haptic feedback when stopped
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('✅ Spin complete! User won:', actualWin, 'analyses');
      
      setWonAnalyses(actualWin);
      setHasSpun(true);
      
      // Update database with the won amount
      await updateFreeTrialInDatabase(actualWin);
    });
  };

  const updateFreeTrialInDatabase = async (analyses: number) => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_trial_analyses_remaining: analyses,
          has_spun_wheel: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating free trial:', error);
      } else {
        console.log(`✅ User won ${analyses} free analyses!`);
        await markWheelAsSpun();
      }
    } catch (error) {
      console.error('Exception updating free trial:', error);
    }
  };

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onComplete && wonAnalyses) {
      onComplete(wonAnalyses);
    } else if (navigation) {
      navigation.replace('MainTabs');
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎁 Welcome Gift!</Text>
          <Text style={styles.subtitle}>
            Spin the wheel to unlock your free analyses
          </Text>
        </View>

        {/* Wheel Container */}
        <View style={styles.wheelContainer}>
          {/* Pointer/Arrow at top */}
          <View style={styles.pointerContainer}>
            <View style={styles.pointer} />
          </View>

          {/* Spinning Wheel */}
          <Animated.View
            style={[
              styles.wheel,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
              <G x={CENTER} y={CENTER}>
                {segments.map((segment, index) => {
                  // Start angle for this segment (in radians)
                  // -90 degrees offset to start from top
                  const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                  const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                  
                  // Calculate the path points
                  const x1 = CENTER * Math.cos(startAngle);
                  const y1 = CENTER * Math.sin(startAngle);
                  const x2 = CENTER * Math.cos(endAngle);
                  const y2 = CENTER * Math.sin(endAngle);

                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                  // Create the path for this segment
                  const pathData = `
                    M 0 0
                    L ${x1} ${y1}
                    A ${CENTER} ${CENTER} 0 ${largeArcFlag} 1 ${x2} ${y2}
                    Z
                  `;

                  // Calculate text position (middle of segment)
                  const textAngle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                  const textRadius = CENTER * 0.65;
                  const textX = textRadius * Math.cos(textAngle);
                  const textY = textRadius * Math.sin(textAngle);

                  return (
                    <G key={index}>
                      <Path 
                        d={pathData} 
                        fill={segment.color} 
                        stroke="#FFFFFF" 
                        strokeWidth="4" 
                      />
                      <SvgText
                        x={textX}
                        y={textY}
                        fill="#FFFFFF"
                        fontSize="48"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {segment.label}
                      </SvgText>
                    </G>
                  );
                })}
                
                {/* Center circle */}
                <Circle r={35} fill="#FFFFFF" stroke="#333" strokeWidth="4" />
              </G>
            </Svg>
          </Animated.View>
        </View>

        {/* Result Display */}
        {wonAnalyses && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>🎉 Congratulations!</Text>
            <Text style={styles.resultText}>
              You won <Text style={styles.resultNumber}>{wonAnalyses}</Text> free {wonAnalyses === 1 ? 'analysis' : 'analyses'}!
            </Text>
          </View>
        )}

        {/* Spin Button */}
        {!hasSpun ? (
          <TouchableOpacity
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={isSpinning}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isSpinning ? ['#95a5a6', '#7f8c8d'] : ['#F39C12', '#E67E22']}
              style={styles.spinButtonGradient}
            >
              <Text style={styles.spinButtonText}>
                {isSpinning ? '🎰 SPINNING...' : '🎯 SPIN NOW!'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                ✨ Continue to App
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Info Text */}
        <Text style={styles.infoText}>
          {!hasSpun 
            ? 'Tap the button to spin and discover your reward!'
            : 'Start analyzing your muscles with AI-powered insights!'}
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pointerContainer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resultNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  spinButton: {
    width: width * 0.7,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#F39C12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  continueButton: {
    width: width * 0.7,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
});
