import React, { useEffect, useState } from 'react';
import { needsToSpinWheel } from '../services/subscriptionService';
import { FreeTrialSpinScreen } from '../screens/FreeTrialSpinScreen';

interface FreeTrialSpinGateProps {
  children: React.ReactNode;
}

export const FreeTrialSpinGate: React.FC<FreeTrialSpinGateProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [needsSpin, setNeedsSpin] = useState(false);

  useEffect(() => {
    checkSpinStatus();
  }, []);

  const checkSpinStatus = async () => {
    try {
      const shouldSpin = await needsToSpinWheel();
      setNeedsSpin(shouldSpin);
    } catch (error) {
      console.error('Error checking spin status:', error);
      setNeedsSpin(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSpinComplete = () => {
    setNeedsSpin(false);
  };

  // Show spin screen if needed
  if (needsSpin && !checking) {
    return <FreeTrialSpinScreen onComplete={handleSpinComplete} navigation={null} />;
  }

  // Show children (main app)
  return <>{children}</>;
};
