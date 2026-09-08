export type TenantStatus = 'active' | 'suspended' | 'trial' | 'expired' | 'maintenance' | 'killed';
export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annually';
export type TenantPaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed' | 'grace_period';

export interface TenantFeatures {
  aiCopilot: boolean;
  multiBranchSync: boolean;
  kioskMode: boolean;
  onlineStore: boolean;
  intercomAudio: boolean;
  customBranding: boolean;
  zatcaPhase2: boolean;
  offlinePriority: boolean;
  advancedReports: boolean;
  customDomain: boolean;
}

export interface TenantRestaurant {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  logo: string;
  coverImage?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  country: string;
  currency: string;
  plan: SubscriptionTier;
  billingCycle: BillingCycle;
  monthlyFee: number;
  paymentStatus: TenantPaymentStatus;
  status: TenantStatus;
  killReason?: string;
  killedAt?: string;
  branchesCount: number;
  maxBranches: number;
  posTerminalsCount: number;
  maxPosTerminals: number;
  kdsScreensCount: number;
  maxKdsScreens: number;
  joinedDate: string;
  renewalDate: string;
  totalGrossSales: number;
  totalOrdersCount: number;
  avgTicket: number;
  licenseKey: string;
  hardwareFingerprint: string;
  dbCluster: string;
  cloudflareTunnelId: string;
  features: TenantFeatures;
  notes?: string;
}

export interface LicenseToken {
  id: string;
  tenantId: string;
  tenantName: string;
  licenseKey: string;
  signatureRSA2048: string;
  hardwareUUID: string;
  tier: SubscriptionTier;
  issuedAt: string;
  expiresAt: string;
  maxTerminals: number;
  maxBranches: number;
  isRevoked: boolean;
  revocationReason?: string;
  featuresBitmap: string;
  status: 'valid' | 'expired' | 'revoked' | 'tampered';
  publicKeyFingerprint: string;
}

export interface KillSwitchEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  triggeredAt: string;
  triggeredBy: string;
  reason: string;
  action: 'kill' | 'revive' | 'emergency_purge';
  status: 'executed' | 'pending';
  impactedTerminals: number;
}

export interface PlatformMetricHistory {
  date: string;
  grossSales: number;
  ordersCount: number;
  mrr: number;
  activeTenants: number;
}

export interface GlobalPlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalMRR: number;
  totalARR: number;
  platformGrossSalesToday: number;
  platformOrdersToday: number;
  totalTerminalsActive: number;
  totalBranchesActive: number;
  licenseRevocations: number;
  globalEmergencyLockActive: boolean;
  emergencyLockReason?: string;
  systemHealth: {
    apiLatencyMs: number;
    dbHealth: 'optimal' | 'warning' | 'degraded';
    tunnelStatus: 'active' | 'reconnecting' | 'failed';
    activeSyncNodes: number;
    serverUptime: string;
  };
}

export interface SubscriptionPlanDef {
  id: SubscriptionTier;
  nameAr: string;
  nameEn: string;
  badgeAr: string;
  badgeEn: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  currency: string;
  descriptionAr: string;
  descriptionEn: string;
  popular?: boolean;
  maxBranches: number | 'unlimited';
  maxPosTerminals: number | 'unlimited';
  maxKdsScreens: number | 'unlimited';
  features: {
    nameAr: string;
    nameEn: string;
    included: boolean;
  }[];
}
