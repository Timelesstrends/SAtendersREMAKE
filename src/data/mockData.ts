import { CompanyProfile, TenderOpportunity } from '../types';

export const initialCompanyProfile: CompanyProfile = {
  legalName: 'SAtenderAI Services (Pty) Ltd',
  tradingName: 'SAtenderAI Group',
  registrationNumber: '2021/482931/07',
  industry: 'Civil Engineering, General Construction, Security and Facilities Management',
  industries: [
    'Civil Engineering & Roads',
    'General Building & Construction',
    'Security, Armed Guarding & Access Control',
    'Facilities Management & Maintenance'
  ],
  services: [
    'General Building Construction',
    'Road Maintenance & Paving',
    'Industrial Security & Guarding',
    'Facility Care and General Maintenance'
  ],
  locations: ['Gauteng', 'Mpumalanga', 'North West'],
  csdNumber: 'MAAA0821439',
  sarsTaxStatus: 'Pending',
  bbeeLevel: 1,
  cidbGrading: '7GB PE / 6CE',
  experience: [
    {
      id: 'exp-1',
      client: 'Gauteng Department of Infrastructure Development',
      projectTitle: 'Refurbishment of Community Health Clinic',
      value: 12400000,
      durationMonths: 14,
      scope: 'Structural concrete repair, brickwork, civil reticulation, internal finishes, and compliance handover certificates.',
      completionEvidence: 'Signed Practical Handover Certificate (Form GDID-2024)'
    },
    {
      id: 'exp-2',
      client: 'Mogale City Local Municipality',
      projectTitle: 'Road Rehabilitation and Paving Project',
      value: 6800000,
      durationMonths: 8,
      scope: 'Asphalt resurfacing, storm-water drainage improvements, and local community labor recruitment and training.',
      completionEvidence: 'Final Completion Report & Municipal Engineer Approval Pin'
    },
    {
      id: 'exp-3',
      client: 'City of Johannesburg Parks',
      projectTitle: 'Fencing and Armed Guard Security Deployment',
      value: 3200000,
      durationMonths: 12,
      scope: 'Erection of high-security clear-vu fencing and armed guarding deployment over a 12-month period.',
      completionEvidence: 'Client Reference Letter signed by Regional Parks Director'
    }
  ],
  employees: [
    {
      id: 'emp-1',
      name: 'Austin Mpapane',
      role: 'Managing Director & Lead Bid Specialist',
      qualifications: ['B.Sc in Construction Management (Wits)', 'Project Management Professional (PMP)'],
      yearsExperience: 11,
      hasCV: true
    },
    {
      id: 'emp-2',
      name: 'Lerato Dlamini',
      role: 'Senior Civil Engineer',
      qualifications: ['B.Eng Civil Engineering (UP)', 'Pr.Eng registered with ECSA'],
      yearsExperience: 9,
      hasCV: true
    },
    {
      id: 'emp-3',
      name: 'Johannes van der Merwe',
      role: 'SHEQ Officer',
      qualifications: ['SAMTRAC Certificate', 'NEBOSH Diploma in Occupational Health & Safety'],
      yearsExperience: 14,
      hasCV: true
    }
  ],
  assets: [
    {
      id: 'ast-1',
      name: 'Mercedes Benz Actros Tipper Trucks',
      category: 'vehicles',
      count: 3,
      description: '10m³ heavy tippers for site earthworks and material haulage.'
    },
    {
      id: 'ast-2',
      name: 'JCB 3CX Backhoe Loader',
      category: 'machinery',
      count: 1,
      description: 'Fully owned, serviced and operational excavator/loader.'
    },
    {
      id: 'ast-3',
      name: 'Armed patrol response vehicle (Polo Vivo)',
      category: 'vehicles',
      count: 2,
      description: 'Branded patrol response vehicles fitted with radios.'
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'CSD Registration Summary Report.pdf',
      category: 'compliance',
      fileSize: '412 KB',
      status: 'valid',
      verified: true,
      uploadedBy: 'Austin M.'
    },
    {
      id: 'doc-2',
      name: 'SARS Tax Compliance Status Pin letter.pdf',
      category: 'compliance',
      fileSize: '215 KB',
      status: 'valid',
      verified: true,
      uploadedBy: 'Austin M.'
    },
    {
      id: 'doc-3',
      name: 'SANAS B-BBEE Level 1 Sworn Affidavit.pdf',
      category: 'compliance',
      fileSize: '890 KB',
      expiresAt: '2026-08-07', // valid but expiring in some weeks
      status: 'warning',
      verified: true,
      uploadedBy: 'Austin M.'
    },
    {
      id: 'doc-4',
      name: 'CIDB Grading Certificate - 7GB.pdf',
      category: 'compliance',
      fileSize: '344 KB',
      status: 'valid',
      verified: true,
      uploadedBy: 'Austin M.'
    },
    {
      id: 'doc-5',
      name: 'COIDA Letter of Good Standing (2026).pdf',
      category: 'compliance',
      fileSize: '480 KB',
      status: 'valid',
      verified: true,
      uploadedBy: 'Austin M.'
    }
  ]
};

export const initialTenders: TenderOpportunity[] = [
  {
    id: 'tender-1',
    title: 'Construction of Community Hall and Recreation Centre',
    buyer: 'City of Johannesburg Local Municipality',
    sector: 'Civil Engineering / Building',
    closingDate: '2026-08-14',
    briefingDate: '2026-07-28',
    siteVisit: 'Mandatory',
    value: 15500000,
    cidbLevel: '7GB',
    companyMatch: 94,
    matchDetails: {
      businessFit: 100,
      experienceFit: 92,
      complianceFit: 96,
      geographicFit: 100,
      financialFit: 85,
      capacityFit: 90
    },
    status: 'IN_PREPARATION',
    contractDurationMonths: 12,
    complexity: 'High',
    readinessScore: 82,
    requirements: [
      {
        id: 'req-1',
        requirement: 'Central Supplier Database (CSD) active registration',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'CSD report loaded and verified'
      },
      {
        id: 'req-2',
        requirement: 'SARS Active Tax Pin code compliance',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'SARS pin check reports green'
      },
      {
        id: 'req-3',
        requirement: 'B-BBEE Sworn Affidavit / SANAS Certificate',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'Level 1 SANAS certificate uploaded'
      },
      {
        id: 'req-4',
        requirement: 'Comparable Previous Projects (minimum 3 references)',
        isRequired: 'Required',
        status: 'Partial',
        evidence: '2 of 3 reference letters attached',
        notes: 'Need to upload client reference letter from City of Joburg Parks'
      },
      {
        id: 'req-5',
        requirement: 'Technical Work Execution Methodology',
        isRequired: 'Scored',
        status: 'Draft',
        evidence: 'Draft method statement written',
        notes: 'Needs additional milestones and mobilization schedule details'
      }
    ],
    riskFactors: [
      'Strict penalty clause: R5,000 per day delay on project handover',
      'Requires 30% local community labor sourcing and subcontracting target'
    ],
    evaluationCriteria: {
      ratio: '80/20',
      pricePoints: 80,
      preferencePoints: 20,
      functionalityMinimum: 70
    },
    sourceBroker: 'National Treasury eTenders Portal (Notice ZA-JHB-2026-084)',
    tenderNumber: 'ZA-JHB-2026-084',
    province: 'Gauteng',
    sourceUrl: 'https://data.etenders.gov.za/tenders/ZA-JHB-2026-084',
    submissionEmail: 'tenders@joburg.gov.za',
    brokerVerified: true,
    isLiveVerified: true
  },
  {
    id: 'tender-2',
    tenderNumber: 'MWP-2940-SEC',
    title: 'Provision of Security Services Panel & Armed Patrol Guarding',
    buyer: 'Eskom Holdings SOC Limited',
    sector: 'Security, Armed Guarding & Access Control',
    province: 'Mpumalanga',
    closingDate: '2026-08-28',
    briefingDate: '2026-08-14',
    siteVisit: 'Mandatory',
    value: 42000000,
    companyMatch: 87,
    matchDetails: {
      businessFit: 90,
      experienceFit: 85,
      complianceFit: 96,
      geographicFit: 90,
      financialFit: 78,
      capacityFit: 85
    },
    status: 'COMPLIANCE_CHECK',
    contractDurationMonths: 36,
    complexity: 'High',
    readinessScore: 78,
    requirements: [
      {
        id: 'req-2-1',
        requirement: 'PSIRA Corporate Registration Certificate',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'PSIRA certified copy uploaded'
      },
      {
        id: 'req-2-2',
        requirement: 'COIDA Letter of Good Standing from Compensation Commissioner',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'COIDA 2026 Letter uploaded'
      },
      {
        id: 'req-2-3',
        requirement: 'SARS Active Tax PIN Verification',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'SARS compliant pin verified'
      },
      {
        id: 'req-2-4',
        requirement: 'Detailed Armed Patrol Guarding Methodology',
        isRequired: 'Scored',
        status: 'Draft',
        evidence: 'Standard framework drafted'
      }
    ],
    riskFactors: [
      'Armed response SLA requires immediate 15 minute reaction time in remote substations',
      'High security hazard: Area prone to wire and transformer cable theft'
    ],
    evaluationCriteria: {
      ratio: '90/10',
      pricePoints: 90,
      preferencePoints: 10,
      functionalityMinimum: 75
    },
    sourceBroker: 'Eskom Tender Bulletin (MWP-2940-SEC)',
    sourceUrl: 'https://tenderbulletin.eskom.co.za/open/MWP-2940-SEC',
    submissionEmail: 'tender.submissions@eskom.co.za',
    brokerVerified: true,
    isLiveVerified: true
  },
  {
    id: 'tender-3',
    tenderNumber: 'SANRAL N.012-190-2026/1',
    title: 'Periodic Road Maintenance, Resurfacing and Stormwater Drainage on N12 (Section 19)',
    buyer: 'South African National Roads Agency (SANRAL)',
    sector: 'Civil Engineering & Roads',
    province: 'Gauteng',
    closingDate: '2026-09-30',
    briefingDate: '2026-09-04',
    siteVisit: 'Mandatory',
    value: 46200000,
    cidbLevel: '7CE or 8CE',
    companyMatch: 93,
    matchDetails: {
      businessFit: 94,
      experienceFit: 92,
      complianceFit: 96,
      geographicFit: 90,
      financialFit: 88,
      capacityFit: 92
    },
    status: 'DISCOVERED',
    contractDurationMonths: 18,
    complexity: 'High',
    readinessScore: 84,
    requirements: [
      {
        id: 'req-3-1',
        requirement: 'CIDB Grade 7CE or Higher registration on CSD',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'Active 7GB PE / 6CE Upgradeable'
      },
      {
        id: 'req-3-2',
        requirement: 'Heavy Tipper Truck fleet (min 3 units owned/leased)',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: '3x Mercedes Actros Tippers registered'
      }
    ],
    riskFactors: [
      'Asphalt batching plant must be within 45km radius',
      'Mandatory 30% local SMME subcontractor participation'
    ],
    evaluationCriteria: {
      ratio: '90/10',
      pricePoints: 90,
      preferencePoints: 10,
      functionalityMinimum: 80
    },
    sourceBroker: 'SANRAL e-Procurement Portal (SANRAL N.012-190-2026/1)',
    sourceUrl: 'https://www.nra.co.za/service-providers/tenders/N12-190-2026',
    submissionEmail: 'procurement@sanral.co.za',
    brokerVerified: true,
    isLiveVerified: true
  },
  {
    id: 'tender-4',
    tenderNumber: 'SITA-RFB-2026-319',
    title: 'Supply, Deployment and Managed Support for Hybrid Cloud Infrastructure and Cybersecurity Operations',
    buyer: 'State Information Technology Agency (SITA / GovTech)',
    sector: 'ICT, Software & Telecommunications',
    province: 'National / Pretoria',
    closingDate: '2026-10-15',
    briefingDate: '2026-09-12',
    siteVisit: 'None',
    value: 38400000,
    cidbLevel: 'N/A',
    companyMatch: 86,
    matchDetails: {
      businessFit: 88,
      experienceFit: 84,
      complianceFit: 95,
      geographicFit: 90,
      financialFit: 85,
      capacityFit: 82
    },
    status: 'DISCOVERED',
    contractDurationMonths: 36,
    complexity: 'High',
    readinessScore: 81,
    requirements: [
      {
        id: 'req-4-1',
        requirement: 'SITA SCM Supplier Accreditation',
        isRequired: 'Mandatory',
        status: 'Complete',
        evidence: 'CSD Verified ICT Category'
      },
      {
        id: 'req-4-2',
        requirement: 'ISO 27001 Information Security Management System certification',
        isRequired: 'Required',
        status: 'Complete',
        evidence: 'Audit compliance certificate'
      }
    ],
    riskFactors: [
      'SSA security vetting required for all systems engineers',
      '24/7/365 Tier 3 Security Operations Centre SLA'
    ],
    evaluationCriteria: {
      ratio: '90/10',
      pricePoints: 90,
      preferencePoints: 10,
      functionalityMinimum: 80
    },
    sourceBroker: 'SITA GovTech Tender Bulletin (SITA-RFB-2026-319)',
    sourceUrl: 'https://www.sita.co.za/tenders/rfb-2026-319',
    submissionEmail: 'tenders@sita.co.za',
    brokerVerified: true,
    isLiveVerified: true
  }
];

export const mockAnalytics = {
  totalBids: 28,
  wins: 11,
  losses: 15,
  withdrawn: 2,
  winRate: 42, // (11 / 26) * 100 approx
  avgTenderValue: 14200000, // R14.2M
  bidsHistory: [
    { quarter: '2025 Q3', submitted: 6, won: 2, value: 18000000 },
    { quarter: '2025 Q4', submitted: 8, won: 3, value: 24000000 },
    { quarter: '2026 Q1', submitted: 9, won: 4, value: 38000000 },
    { quarter: '2026 Q2', submitted: 5, won: 2, value: 15500000 }
  ],
  winRateBySector: [
    { sector: 'Civil Engineering', winRate: 65, total: 12 },
    { sector: 'Security Services', winRate: 42, total: 8 },
    { sector: 'Facilities Care', winRate: 12, total: 6 }
  ],
  winRateByProvince: [
    { province: 'Gauteng', winRate: 58, count: 15 },
    { province: 'Mpumalanga', winRate: 40, count: 5 },
    { province: 'Western Cape', winRate: 14, count: 7 },
    { province: 'KwaZulu-Natal', winRate: 0, count: 1 }
  ],
  winRateByBuyer: [
    { buyer: 'Dept of Infrastructure', winRate: 70 },
    { buyer: 'Eskom SOC', winRate: 44 },
    { buyer: 'Municipalities', winRate: 35 }
  ],
  lostPointsCauses: [
    { cause: 'Technical methodology detail missing implementation milestones', percentage: 40 },
    { cause: 'Pricing schedule omissions / SBD form signature errors', percentage: 30 },
    { cause: 'Missing highly certified physical assets or certified CVs', percentage: 20 },
    { cause: 'SARS compliance delay or late submission time', percentage: 10 }
  ]
};

export const initialCommercialDocuments: import('../types').CommercialDocument[] = [
  {
    id: 'comm-inv-01',
    type: 'TAX_INVOICE',
    docNumber: 'INV-2026-0042',
    tenderId: 'tnd-live-01',
    tenderTitle: 'Construction of Multi-Purpose Sports & Community Facility at Diepsloot Ext 2',
    clientName: 'City of Johannesburg Metropolitan Municipality',
    clientDepartment: 'Department of Community Development & Infrastructure',
    clientEmail: 'invoices@joburg.org.za',
    clientAddress: '158 Civic Boulevard, Metropolitan Centre, Braamfontein, Johannesburg, 2001',
    clientVatNumber: '4700119283',
    orderNumber: 'PO-COJ-849102-2026',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    status: 'PAID',
    items: [
      {
        id: 'item-1',
        description: 'Milestone 1: Site Establishment, Hoarding, Security & Health & Safety Sign-off',
        unit: 'Sum',
        quantity: 1,
        rate: 850000,
        amount: 850000
      },
      {
        id: 'item-2',
        description: 'Milestone 2: Substructure Earthworks & Mass Concrete Foundations',
        unit: 'm³',
        quantity: 120,
        rate: 4500,
        amount: 540000
      },
      {
        id: 'item-3',
        description: 'Local Ward 12 Artisan Subcontracting Allocation (30% Target)',
        unit: 'Sum',
        quantity: 1,
        rate: 360000,
        amount: 360000
      }
    ],
    subtotal: 1750000,
    vatRate: 0.15,
    vatAmount: 262500,
    totalAmount: 2012500,
    notes: 'Thank you for your business. Payment received via municipal EFT into verified Standard Bank corporate account.',
    bankingDetails: {
      bankName: 'Standard Bank South Africa',
      accountName: 'SAtenderAI Services (Pty) Ltd',
      accountNumber: '0821439201',
      branchCode: '051001',
      accountType: 'Commercial Cheque Account'
    }
  },
  {
    id: 'comm-inv-02',
    type: 'TAX_INVOICE',
    docNumber: 'INV-2026-0043',
    tenderId: 'tnd-live-02',
    tenderTitle: 'Provision of 24/7 Armed Response Security & Infrastructure Safeguarding at Lethabo Power Station',
    clientName: 'Eskom SOC Holdings Ltd',
    clientDepartment: 'Commercial & Security Operations',
    clientEmail: 'accounts-payable@eskom.co.za',
    clientAddress: 'Megawatt Park, 1 Maxwell Drive, Sunninghill, Sandton, 2157',
    clientVatNumber: '4740101508',
    orderNumber: 'ESK-PO-991204',
    issueDate: '2026-08-05',
    dueDate: '2026-09-04',
    status: 'SENT',
    items: [
      {
        id: 'item-1',
        description: 'Monthly Armed Security Guard Deployment (12 PSIRA-certified Grade A Officers)',
        unit: 'Month',
        quantity: 1,
        rate: 420000,
        amount: 420000
      },
      {
        id: 'item-2',
        description: 'Tactical Patrol Response Vehicles (2x Polo Vivos with 24/7 fuel & telemetry)',
        unit: 'Vehicles',
        quantity: 2,
        rate: 35000,
        amount: 70000
      },
      {
        id: 'item-3',
        description: 'Continuous OHS Act SHEQ Audit & Safety Compliance Supervision',
        unit: 'Sum',
        quantity: 1,
        rate: 25000,
        amount: 25000
      }
    ],
    subtotal: 515000,
    vatRate: 0.15,
    vatAmount: 77250,
    totalAmount: 592250,
    notes: 'Payment terms: 30 days from tax invoice date as per National Treasury instruction note.',
    bankingDetails: {
      bankName: 'Standard Bank South Africa',
      accountName: 'SAtenderAI Services (Pty) Ltd',
      accountNumber: '0821439201',
      branchCode: '051001',
      accountType: 'Commercial Cheque Account'
    }
  },
  {
    id: 'comm-qt-01',
    type: 'QUOTATION',
    docNumber: 'QT-2026-0108',
    tenderId: 'tnd-live-03',
    tenderTitle: 'Periodic Road Maintenance, Resurfacing and Stormwater Rehabilitation on National Route N12 (Section 19)',
    clientName: 'South African National Roads Agency (SANRAL)',
    clientDepartment: 'Northern Region Engineering Procurement',
    clientEmail: 'tenders@sanral.co.za',
    clientAddress: '38 Ida Street, Menlo Park, Pretoria, 0081',
    clientVatNumber: '4120119932',
    orderNumber: 'TENDER-BOQ-ESTIMATE',
    issueDate: '2026-08-06',
    dueDate: '2026-09-30', // quotation validity
    status: 'SENT',
    items: [
      {
        id: 'item-1',
        description: 'Preliminary & General: Site security, survey, testing labs & temporary diversions',
        unit: 'Sum',
        quantity: 1,
        rate: 1850000,
        amount: 1850000
      },
      {
        id: 'item-2',
        description: 'Cold Milling of Asphalt Surfacing (Depth 40mm) & Disposal',
        unit: 'm²',
        quantity: 15000,
        rate: 180,
        amount: 2700000
      },
      {
        id: 'item-3',
        description: 'Medium Continuously Graded Asphalt Surfacing with Bitumen (SABS 307)',
        unit: 'Tons',
        quantity: 1800,
        rate: 2400,
        amount: 4320000
      },
      {
        id: 'item-4',
        description: 'Prefabricated Concrete Stormwater Culverts & Clearing',
        unit: 'm',
        quantity: 450,
        rate: 1650,
        amount: 742500
      }
    ],
    subtotal: 9612500,
    vatRate: 0.15,
    vatAmount: 1441875,
    totalAmount: 11054375,
    notes: 'Quotation valid for 90 days from issue date. Aligns with standard COLTO/SANS specifications.',
    bankingDetails: {
      bankName: 'Standard Bank South Africa',
      accountName: 'SAtenderAI Services (Pty) Ltd',
      accountNumber: '0821439201',
      branchCode: '051001',
      accountType: 'Commercial Cheque Account'
    }
  }
];

