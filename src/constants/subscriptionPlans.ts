/**
 * Subscription Plans Constants
 * 
 * Centralized source of truth for plan limits and configuration
 */

export type PlanName = 'Basic' | 'Pro' | 'VIP';

/**
 * Monthly analysis limits for each plan
 * 
 * IMPORTANT: This is the single source of truth for plan limits.
 * Do NOT hard-code these values anywhere else.
 */
export const PLAN_LIMITS: Record<PlanName, number> = {
  Basic: 5,
  Pro: 20,
  VIP: 50,
};

/**
 * Get billing period in milliseconds
 * 
 * - Sandbox/Development: 5 minutes (for testing)
 * - Production: 30 days
 */
export const getBillingPeriodMs = (): number => {
  const isSandbox = __DEV__; // or detect test account
  return isSandbox ? 5 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
};

/**
 * Get plan limit for a given plan name
 */
export const getPlanLimit = (planName: PlanName): number => {
  return PLAN_LIMITS[planName];
};

/**
 * Validate if a plan name is valid
 */
export const isValidPlanName = (planName: string): planName is PlanName => {
  return planName === 'Basic' || planName === 'Pro' || planName === 'VIP';
};
