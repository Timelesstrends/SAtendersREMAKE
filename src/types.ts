export type TenderStatus =
  | 'DISCOVERED'
  | 'REVIEWING'
  | 'GO_NO_GO'
  | 'IN_PREPARATION'
  | 'DRAFTING'
  | 'INTERNAL_REVIEW'
  | 'COMPLIANCE_CHECK'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'AWAITING_OUTCOME'
  | 'WON'
  | 'LOST'
  | 'CANCELLED';

export interface ProjectExperience {
  id: string;
  client: string;
  projectTitle: string;
  value: number; // in Rands
  durationMonths: number;
  scope: string;
  completionEvidence: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
  accessLevel?: 'ADMIN' | 'BID_MANAGER' | 'ESTIMATOR' | 'COMPLIANCE' | 'VIEWER';
  avatar?: string;
  qualifications: string[];
  yearsExperience: number;
  hasCV: boolean;
}

export interface PopiaConsentRecord {
  accepted: boolean;
  tosVersion: string;
  acceptedAt: string;
  acceptedByEmail: string;
  ipNote?: string;
}

export interface EmailNotificationPreferences {
  morningBriefingEnabled: boolean;
  morningBriefingTimeSast: string; // default "07:30"
  closing48hAlertEnabled: boolean;
  recipientEmails: string[];
  preferredProvider?: 'postmark' | 'sendgrid' | 'smtp';
}

export interface EmailLogEntry {
  id: string;
  companyId: string;
  recipientEmail: string;
  emailType: 'MORNING_BRIEFING' | 'CLOSING_48H_ALERT' | 'BID_SUBMITTED_RECEIPT';
  provider: string;
  status: 'DELIVERED' | 'SIMULATED_PREVIEW' | 'FAILED';
  sentAt: string;
  createdByUid: string;
  subject?: string;
}

export interface UserSession {
  user: {
    id: string;
    uid?: string;
    name: string;
    email: string;
    role: string;
    accessLevel: 'ADMIN' | 'BID_MANAGER' | 'ESTIMATOR' | 'COMPLIANCE' | 'VIEWER';
    avatar?: string;
    authMode?: 'cloud' | 'local';
  };
  companyId?: string;
  inviteCode?: string;
  popiaConsent?: PopiaConsentRecord;
  rememberMe: boolean;
  loginTimestamp: string;
}

export interface Asset {
  id: string;
  name: string;
  category: 'vehicles' | 'equipment' | 'machinery' | 'facilities';
  count: number;
  description: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  category:
    | 'company'
    | 'compliance'
    | 'employee'
    | 'project'
    | 'financial'
    | 'policy'
    | 'tender'
    | 'generated';
  fileSize: string;
  expiresAt?: string;
  status: 'valid' | 'expired' | 'warning' | 'missing';
  verified: boolean;
  uploadedBy?: string;
}

export interface StatutoryAccreditation {
  id: string;
  council: string; // e.g. "CIDB", "PSIRA", "SITA", "SAHPRA", "NCCA", "DoH Reg R638 (CoA)", "RTMS", "ECSA", "SACQSP", "SAICA", "LPC"
  councilFullName: string;
  regNumber: string;
  categoryOrGrading?: string; // e.g. "Grade A / Armed Response", "Level 7GB PE", "Medical Device Wholesaler", "Cert No. JH-1092"
  expiryDate?: string;
  verified: boolean;
}

export interface CompanyProfile {
  legalName: string;
  tradingName: string;
  registrationNumber: string;
  industry: string;
  industries?: string[]; // Multiple operating sectors in South Africa
  logoUrl?: string; // Company custom logo
  brandColor?: string; // Company theme accent color
  slogan?: string;
  companyEmail?: string;
  companyPhone?: string;
  physicalAddress?: string;
  taxNumber?: string;
  services: string[];
  locations: string[];
  csdNumber: string;
  sarsTaxStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
  bbeeLevel: number; // 1 to 8, or 0 for non-compliant
  cidbGrading: string; // e.g. "7GB PE", "6CE", etc.
  statutoryAccreditations?: StatutoryAccreditation[]; // Universal for any South African SME sector
  experience: ProjectExperience[];
  employees: Employee[];
  assets: Asset[];
  documents: CompanyDocument[];
  cloudCompanyId?: string;
  inviteCode?: string;
  emailNotifications?: EmailNotificationPreferences;
}

export interface RequirementItem {
  id: string;
  requirement: string;
  isRequired: 'Mandatory' | 'Required' | 'Scored';
  status: 'Complete' | 'Missing' | 'Partial' | 'Draft';
  evidence: string;
  notes?: string;
}

export interface TenderOpportunity {
  id: string;
  tenderNumber?: string; // e.g. "SANRAL N.012-190-2026/1" or "SITA-2026-ICT-041"
  title: string;
  buyer: string;
  sector: string;
  province?: string;
  closingDate: string; // ISO or date string
  briefingDate?: string;
  siteVisit?: 'Mandatory' | 'Optional' | 'None';
  value: number; // Estimated value in Rands
  cidbLevel?: string; // required CIDB
  companyMatch: number; // overall percentage (0-100)
  matchDetails: {
    businessFit: number;
    experienceFit: number;
    complianceFit: number;
    geographicFit: number;
    financialFit: number;
    capacityFit: number;
  };
  status: TenderStatus;
  contractDurationMonths: number;
  complexity: 'Low' | 'Medium' | 'High';
  readinessScore: number;
  requirements: RequirementItem[];
  riskFactors: string[];
  evaluationCriteria: {
    ratio: '80/20' | '90/10';
    pricePoints: number;
    preferencePoints: number; // BEE points
    functionalityMinimum: number; // out of 100
  };
  sourceBroker?: string;
  sourceUrl?: string;
  submissionEmail?: string;
  brokerVerified?: boolean;
  isLiveVerified?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  agent?: string;
}

export interface EvaluationScorecard {
  complianceScore: number; // out of 100
  functionalityScore: number; // out of 100
  priceScore: number; // 80 or 90
  preferenceScore: number; // 10 or 20
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
}

export interface BillingLineItem {
  id: string;
  description: string;
  unit: string; // e.g. 'Hours', 'Days', 'Sum', 'm²', 'm³', 'Units'
  quantity: number;
  rate: number; // in Rands
  amount: number; // in Rands
}

export interface CommercialDocument {
  id: string;
  type: 'QUOTATION' | 'TAX_INVOICE' | 'PROFORMA';
  docNumber: string; // e.g. "INV-2026-081" or "QT-2026-104"
  tenderId?: string;
  tenderTitle?: string;
  clientName: string;
  clientDepartment?: string;
  clientEmail: string;
  clientAddress: string;
  clientVatNumber?: string;
  orderNumber?: string; // Purchase Order / Official Order No
  issueDate: string;
  dueDate: string; // Payment terms or validity expiry
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: BillingLineItem[];
  subtotal: number;
  vatRate: number; // typically 15% in SA
  vatAmount: number;
  retentionRate?: number; // e.g. 0.10 for 10% construction contract retention
  retentionAmount?: number;
  totalAmount: number;
  notes?: string;
  bankingDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
  };
  paidDate?: string;
  statutoryInterestRate?: number; // Prescribed Rate of Interest Act No. 55 of 1975 (e.g. 11.25% p.a.)
  statutoryInterestClaimed?: number;
}

export interface SubcontractorPackage {
  id: string;
  scopeName: string;
  subcontractorName: string;
  csdNumber: string;
  bbeeLevel: number;
  designatedGroup: 'Black Women' | 'Black Youth' | 'Military Veterans' | 'People with Disabilities' | 'Local EME / QSE';
  packageValue: number;
  percentageOfContract: number;
  status: 'IDENTIFIED' | 'MOU_SIGNED' | 'VERIFIED';
}

