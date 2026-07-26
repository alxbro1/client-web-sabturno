export type LoyaltyProgramStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type LoyaltyRewardType =
  | "FREE_SERVICE"
  | "PERCENTAGE_DISCOUNT"
  | "FIXED_DISCOUNT";
export type LoyaltyRewardStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "REDEEMED"
  | "EXPIRED"
  | "CANCELLED";

export interface LoyaltyProgramRevision {
  id: string;
  version: number;
  stampsRequired: number;
  stampsPerAppointment: number;
  rewardType: LoyaltyRewardType;
  rewardValue?: string | number | null;
  rewardServiceId?: number | null;
  cardExpiresAfterDays?: number | null;
  rewardExpiresAfterDays?: number | null;
}

export interface LoyaltyProgram {
  id: string;
  localId: string;
  name: string;
  description?: string | null;
  status: LoyaltyProgramStatus;
  revisions: LoyaltyProgramRevision[];
  services: Array<{ serviceId: number; service?: { id: number; name: string } }>;
}

export interface LoyaltyMovement {
  id: string;
  type: "STAMP" | "REVERSAL" | "ADJUSTMENT" | "EXPIRATION";
  stamps: number;
  balanceAfter: number;
  reason?: string | null;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  code: string;
  type: LoyaltyRewardType;
  value?: string | number | null;
  serviceId?: number | null;
  status: LoyaltyRewardStatus;
  expiresAt?: string | null;
  service?: { id: number; name: string; cost?: number } | null;
}

export type LoyaltyCouponValidation =
  | {
      valid: true;
      benefit: string;
      type: LoyaltyRewardType;
      discountAmount: number;
      finalAmount: number;
      expiresAt?: string | null;
      serviceName?: string | null;
    }
  | {
      valid: false;
      reason: "NOT_FOUND" | "UNAVAILABLE" | "EXPIRED" | "INCOMPATIBLE_SERVICE";
    };

export interface LoyaltyCard {
  id: string;
  localId: string;
  stampsBalance: number;
  totalStampsEarned: number;
  status: "ACTIVE" | "EXPIRED" | "ARCHIVED";
  expiresAt?: string | null;
  local?: { id: string; name: string };
  program: LoyaltyProgram;
  revision: LoyaltyProgramRevision;
  rewards: LoyaltyReward[];
  movements?: LoyaltyMovement[];
  user?: { id: string; name: string; email: string } | null;
  guestIdentity?: { id: string; email: string; verifiedAt?: string | null } | null;
}

export interface LoyaltyOwnerSummary {
  program?: LoyaltyProgram | null;
  metrics: {
    cardsCount: number;
    availableRewards: number;
  };
}

export interface LoyaltyDevelopmentCompletion {
  appointment: {
    id: number;
    state: "COMPLETED";
  };
  loyalty: {
    cardCreated: boolean;
    stampsApplied: number;
    rewardsGenerated: number;
    notificationAttempted: boolean;
  };
}

export interface LoyaltyProgramPayload {
  name: string;
  description?: string;
  stampsRequired: number;
  stampsPerAppointment?: number;
  rewardType: LoyaltyRewardType;
  rewardValue?: number;
  rewardServiceId?: number;
  serviceIds?: number[];
  cardExpiresAfterDays?: number;
  rewardExpiresAfterDays?: number;
  status?: LoyaltyProgramStatus;
}
