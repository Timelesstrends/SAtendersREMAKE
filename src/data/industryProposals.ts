import { TenderOpportunity, CompanyProfile, BillingLineItem } from '../types';

export type SectorCategory = 
  | 'CATERING'
  | 'ICT'
  | 'SECURITY'
  | 'CLEANING'
  | 'MEDICAL'
  | 'LOGISTICS'
  | 'CONSULTING'
  | 'WATER'
  | 'CIVIL';

export function getSectorCategory(sectorStr: string = ''): SectorCategory {
  const s = sectorStr.toLowerCase();
  if (s.includes('agri') || s.includes('food') || s.includes('cater') || s.includes('nutrition') || s.includes('nsnp')) return 'CATERING';
  if (s.includes('ict') || s.includes('software') || s.includes('telecom') || s.includes('cloud') || s.includes('cyber')) return 'ICT';
  if (s.includes('security') || s.includes('guard') || s.includes('armed')) return 'SECURITY';
  if (s.includes('clean') || s.includes('hygiene') || s.includes('pest') || (s.includes('facilities') && !s.includes('civil'))) return 'CLEANING';
  if (s.includes('health') || s.includes('medical') || s.includes('ppe') || s.includes('pharmaceutical')) return 'MEDICAL';
  if (s.includes('logistics') || s.includes('freight') || s.includes('transport') || s.includes('haulage') || s.includes('fleet')) return 'LOGISTICS';
  if (s.includes('prof') || s.includes('consult') || s.includes('legal') || s.includes('audit') || s.includes('quantity')) return 'CONSULTING';
  if (s.includes('water') || s.includes('sanitation') || s.includes('reticulation')) return 'WATER';
  return 'CIVIL';
}

export function getSectorComplianceBadge(sectorStr: string = ''): string {
  const cat = getSectorCategory(sectorStr);
  switch (cat) {
    case 'CATERING': return 'DoH Reg R638 & HACCP Certified';
    case 'ICT': return 'SITA GovTech & ISO 27001 Accredited';
    case 'SECURITY': return 'PSIRA Grade A & Firearms Control Act';
    case 'CLEANING': return 'NCCA Registered & SABS 1828 Eco-Hazchem';
    case 'MEDICAL': return 'SAHPRA Medical Device & ISO 13485';
    case 'LOGISTICS': return 'RTMS Certified & GIT R5M Insured';
    case 'CONSULTING': return 'ECSA / SACQSP / SAICA Practice & R10M PI';
    case 'WATER': return 'CIDB 7CE/ME & DWS Blue Drop Compliant';
    case 'CIVIL': default: return 'CIDB 7GB PE / 6CE & SABS Aligned';
  }
}

export function getSectorProposalDrafts(tender: TenderOpportunity, companyProfile: CompanyProfile) {
  const cat = getSectorCategory(tender.sector);
  const company = companyProfile.legalName || 'SAtenderAI Services (Pty) Ltd';
  const valFmt = (tender.value || 10000000).toLocaleString('en-ZA');

  switch (cat) {
    case 'CATERING':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} is pleased to submit this comprehensive nutritional supply and catering proposal in response to the Invitation for Tender: "${tender.title}".\n\nAs a verified Level 1 B-BBEE supplier with an active municipal Certificate of Acceptability (CoA) under Regulation R638 (Health Act 61 of 2003) and HACCP food-safety compliance, we guarantee unbroken cold-chain logistics, fresh farm-to-plate nutrition, and strict adherence to National School Nutrition Programme (NSNP) dietary guidelines.`,
        methodology: `NUTRITIONAL CATERING & FOOD DISTRIBUTION METHODOLOGY:\n1. PROCUREMENT & FOOD QUALITY AUDITING: All fresh vegetables, legumes, dairy, and grains are sourced directly from verified local smallholder farming co-operatives. Batch inspection logs ensure zero bruised or expired stock.\n2. TEMPERATURE CONTROL & STORAGE (HACCP): Chilled foodstuffs maintain strict core temperatures below 4°C, utilizing insulated thermo-boxes with real-time digital temperature loggers.\n3. PREPARATION & KITCHEN HYGIENE: Staff strictly adhere to Reg R638 hygiene protocols (protective headwear, sanitized stainless-steel preparation stations, allergen isolation, and color-coded chopping boards).\n4. TIMELY SITE DELIVERY: Dedicated delivery routes ensure all meals are delivered hot (> 65°C) and sealed by 07:30 AM daily ahead of beneficiary serving schedules. Food retention samples (72-hour archive) are maintained for independent laboratory swab audits.`,
        timeline: `OPERATIONAL ROLLOUT MILESTONE SCHEDULE:\n• Week 1: Municipal health inspection review, school principal liaison meetings, kitchen equipment audit.\n• Week 2: Local smallholder farmer onboarding and emergency food reserve buffer staging.\n• Month 1 - 36: Daily 07:30 AM nutritional meal deliveries, weekly menu variation cycles, and monthly municipal environmental health compliance certificates.`,
        costing: `NUTRITIONAL CATERING BILL OF QUANTITIES (BOQ):\n1. Fresh Food Produce & Fortified Commodity Sourcing: R${Math.round(tender.value * 0.45).toLocaleString('en-ZA')}\n2. Cold-Chain Transport, Insulated Logistics & Delivery Fleet: R${Math.round(tender.value * 0.22).toLocaleString('en-ZA')}\n3. Kitchen Hygiene, HACCP Quality Assurance & Laboratory Swabs: R${Math.round(tender.value * 0.08).toLocaleString('en-ZA')}\n4. 30% Local Community Procurement (Smallholder Farmers & Bakers): R${Math.round(tender.value * 0.25).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'ICT':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} is proud to submit this enterprise technology and digital infrastructure proposal for: "${tender.title}".\n\nAs a Level 1 B-BBEE ICT solutions group with SITA SCM GovTech accreditation, certified ISO 27001 Information Security, and proven cloud engineering capabilities, we deliver high-availability, POPIA-compliant software architectures engineered for 99.9% uptime and zero-day threat resistance.`,
        methodology: `ENTERPRISE ICT ARCHITECTURE & DEPLOYMENT METHODOLOGY:\n1. ARCHITECTURE & DISCOVERY SPRINT: Week 1-2 discovery to map enterprise business workflows, define microservice schemas, and align with Government Cloud Security Framework (GCSF).\n2. AGILE ITERATIVE DEVELOPMENT: 2-week sprint cadences with automated CI/CD deployment pipelines. Code is subject to automated SonarQube quality gates and OWASP Top 10 security scanning.\n3. INFRASTRUCTURE & DISASTER RECOVERY: Containerized deployments across hybrid sovereign cloud tenants in South Africa (Gauteng / Cape Town) with real-time replication and automated failover.\n4. MANAGED SUPPORT & SLA: 24/7/365 Tier-3 Security Operations Centre (SOC) monitoring with guaranteed 15-minute response time for Priority 1 incidents and comprehensive POPIA compliance data masking.`,
        timeline: `SYSTEM DELIVERY & SPRINT MILESTONES:\n• Month 1: Architectural blueprints, security threat modeling, sovereign cloud tenant provisioning.\n• Month 2 - 6: Agile sprint delivery of core modules, API gateways, and biometric authentication.\n• Month 7: User Acceptance Testing (UAT), penetration testing by CREST-certified auditors.\n• Month 8 - 36: Production go-live, 24/7 managed support, and quarterly feature enhancements.`,
        costing: `ICT COMMERCIAL COSTING SCHEDULE:\n1. Enterprise Cloud Tenant Provisioning & Core Software Architecture: R${Math.round(tender.value * 0.35).toLocaleString('en-ZA')}\n2. Lead Software Engineers, DevOps & Agile Sprint Delivery: R${Math.round(tender.value * 0.32).toLocaleString('en-ZA')}\n3. Cybersecurity Hardening, Penetration Testing & ISO 27001 Compliance: R${Math.round(tender.value * 0.13).toLocaleString('en-ZA')}\n4. 30% Youth Software Developer Subcontracting & Tech Incubation: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'SECURITY':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} submits this tactical security and asset protection proposal for: "${tender.title}".\n\nWith Level 1 B-BBEE, full corporate PSIRA Grade A registration, and extensive experience safeguarding state-owned infrastructure, we provide armed reaction units, advanced radio telemetry, and vetted security personnel ensuring 100% perimeter integrity and asset security.`,
        methodology: `TACTICAL GUARDING & INCIDENT RESPONSE METHODOLOGY:\n1. VULNERABILITY AUDIT & MOBILISATION: Rapid physical risk survey mapping blindspots, perimeter breaches, and strategic guard box coordinates.\n2. PSIRA VETTING & TRAINING: All personnel are active-PSIRA registered, undergo quarterly background vetting, and hold valid South African Police Service (SAPS) firearm competency certificates.\n3. ARMED REACTION & PATROL LOGISTICS: Dedicated branded patrol response vehicles execute random 24/7 route cycles, linked via VHF repeater radio networks to our central command room.\n4. REAL-TIME TELEMETRY: Electronic guard patrol batons log every checkpoint in real-time, feeding automated shift reports to the client's representative.`,
        timeline: `SECURITY ROLLOUT MILESTONES:\n• Week 1: Risk profiling, strategic guard post placement, high-frequency radio repeater commissioning.\n• Week 2: Security personnel onboarding, site-specific post orders induction, access gate controls.\n• Week 3: Armed patrol vehicle integration and emergency panic alarm link testing.\n• Month 1 - 36: Monthly tactical review meetings, local ward liaison hiring, and daily Occurrence Book audits.`,
        costing: `SECURITY PRICING SCHEDULE:\n1. 24/7 Armed Guard Force Deployment & Shift Relievers: R${Math.round(tender.value * 0.55).toLocaleString('en-ZA')}\n2. Branded Patrol Response Fleet, Fuel & VHF Telemetry: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n3. Control Room Command Link, Electronic Guard Batons & SHEQ: R${Math.round(tender.value * 0.10).toLocaleString('en-ZA')}\n4. 30% Host Community Guard Recruitment & Security Skills Transfer: R${Math.round(tender.value * 0.15).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'CLEANING':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} is pleased to submit this commercial facilities cleaning, deep sanitization, and environmental hygiene proposal for: "${tender.title}".\n\nAs an active member of the National Contract Cleaners Association (NCCA) with SABS 1828 eco-chemical certification and ISO 9001 quality management, we deliver hospital-grade cleanliness, biohazard waste compliance, and rapid 24/7 facility response.`,
        methodology: `COMMERCIAL CLEANING & ENVIRONMENTAL HYGIENE METHODOLOGY:\n1. DILUTION STATIONS & ECO-CHEMICALS: We install automated closed-loop chemical dilution dispensers utilizing SABS 1828 certified, biodegradable, non-toxic cleaning agents with full Safety Data Sheets (SDS).\n2. COLOR-CODED CROSS-CONTAMINATION BARRIERS: Microfiber cloths and mops follow strict color coding (Red for sanitary fixtures, Blue for general surfaces, Yellow for food/beverage prep, Green for clinical wards).\n3. INDUSTRIAL FLOOR CARE & DEEP EXTRACTION: High-traffic walkways are maintained with industrial ride-on battery scrubbers and HEPA-filtered vacuum extraction units.\n4. BIOLUMINESCENCE ATP SWAB AUDITING: Quality is objectively measured using daily ATP bioluminescence swabs (< 30 RLU threshold) ensuring biological sanitization.`,
        timeline: `CLEANING CONTRACT MILESTONES:\n• Week 1: Initial deep chemical stripping, automated dispenser installations, baseline ATP hygiene audit.\n• Week 2: Cleaning team safety induction (Hazchem OHS Act 85), personal PPE distribution.\n• Month 1 - 24: Continuous 24/7 rotational cleaning shifts, daily washroom inspections, and monthly eco-audits.`,
        costing: `COMMERCIAL CLEANING BOQ COSTING:\n1. SABS 1828 Eco-Friendly Chemicals, Paper Consumables & Soap Dispensing: R${Math.round(tender.value * 0.35).toLocaleString('en-ZA')}\n2. Industrial Ride-On Scrubbers, HEPA Vacuums & Asset Depreciation: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n3. Trained Hygiene Operatives & Full-Time Site Supervisor Salaries: R${Math.round(tender.value * 0.30).toLocaleString('en-ZA')}\n4. 30% Local Ward Hygiene Cleaner Sourcing & Waste Diversion: R${Math.round(tender.value * 0.15).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'MEDICAL':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} submits this healthcare commodities and medical equipment supply proposal for: "${tender.title}".\n\nLicensed by the South African Health Products Regulatory Authority (SAHPRA) under Section 22C of the Medicines Act and operating under ISO 13485 Medical Devices Quality Systems, we ensure validated cold-chain pharmaceutical freight, batch traceability, and clinical precision.`,
        methodology: `HEALTHCARE LOGISTICS & MEDICAL COMMODITY METHODOLOGY:\n1. SAHPRA-LICENSED SOURCING: All diagnostic apparatus and medical consumables are sourced exclusively from ISO 13485 compliant manufacturers with valid SAHPRA registration certificates.\n2. VALIDATED COLD-CHAIN FREIGHT: Temperature-sensitive diagnostics are transported in specialized refrigerated vehicles maintaining 2°C to 8°C with real-time electronic transit data loggers.\n3. BATCH TRACEABILITY & STERILITY: Every individual delivery consignment is accompanied by lot-specific Certificates of Analysis (COA) and sterility release documents.\n4. CLINICAL RECEPTION & COMMISSIONING: Biomedical technicians handle delivery handover, calibration, and on-site clinical user training with signed handover sign-offs.`,
        timeline: `MEDICAL DELIVERY MILESTONES:\n• Week 1: SAHPRA license validation, lot batch verification, and hospital receiving liaison.\n• Week 2 - 4: Warehouse staging, cold-chain telemetry calibration, and pilot hospital delivery run.\n• Month 1 - 36: Scheduled weekly deliveries, emergency 4-hour hot-line stock reserve dispatches.`,
        costing: `MEDICAL COMMODITIES PRICING SCHEDULE:\n1. Certified Diagnostic Monitoring Equipment & Sterile Consumables: R${Math.round(tender.value * 0.52).toLocaleString('en-ZA')}\n2. Temperature-Controlled Cold-Chain Logistics & Digital Loggers: R${Math.round(tender.value * 0.18).toLocaleString('en-ZA')}\n3. Clinical Training, Biomedical Calibration & Quality Assurance: R${Math.round(tender.value * 0.10).toLocaleString('en-ZA')}\n4. 30% Local Healthcare Distribution Courier Subcontracting: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'LOGISTICS':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} submits this dedicated freight transport, bulk haulage, and fleet logistics proposal for: "${tender.title}".\n\nCertified under the Road Transport Management System (RTMS) and backed by R5,000,000 Goods-In-Transit (GIT) insurance per load, our dedicated heavy fleet guarantees safe, on-schedule corridor transport with live telematics and zero overload violations.`,
        methodology: `ROAD FREIGHT & FLEET HAULAGE METHODOLOGY:\n1. RTMS FLEET COMPLIANCE: Every truck tractor and interlink trailer undergoes daily pre-trip roadworthiness checks, with automated weighbridge axle-load verification preventing road damage.\n2. SATELLITE TELEMATICS & FATIGUE MITIGATION: 24/7 control center monitoring tracks route deviations, harsh braking, and enforces statutory 2-hour driver resting intervals.\n3. CARGO SECURITY & ARMED ESCORT: High-value transit corridors (e.g. N3 Durban-Johannesburg) utilize panic beacons, tamper-evident e-seals, and on-demand tactical response escorts.\n4. PROMPT DEPOT DISPATCH & EPOD: Drivers utilize Electronic Proof of Delivery (e-POD) with automated time-stamped client delivery receipts uploaded instantaneously.`,
        timeline: `FLEET ROLLOUT MILESTONES:\n• Week 1: Fleet allocation, route risk assessments, and GPS satellite beacon testing.\n• Week 2: Driver induction on PrDP medical fitness, hazchem cargo, and client depot protocols.\n• Month 1 - 36: Daily long-haul freight schedules, monthly RTMS audit logs, and quarterly fuel efficiency reviews.`,
        costing: `LOGISTICS & FREIGHT BOQ:\n1. Dedicated Heavy Truck Tractors & Interlink Trailer Availability: R${Math.round(tender.value * 0.40).toLocaleString('en-ZA')}\n2. Fuel Contingency, Toll Road Fees & Corridor Routing: R${Math.round(tender.value * 0.25).toLocaleString('en-ZA')}\n3. R5M Goods-In-Transit Insurance, Satellite Telematics & Security Escort: R${Math.round(tender.value * 0.10).toLocaleString('en-ZA')}\n4. 30% Local Owner-Driver SMME Subcontracting & Driver Mentorship: R${Math.round(tender.value * 0.25).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'CONSULTING':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} submits this multi-disciplinary professional advisory, engineering, and quantity surveying proposal for: "${tender.title}".\n\nLed by registered Pr.Eng (ECSA), Pr.QS (SACQSP), and Pr.CPM professionals and backed by R10,000,000 Professional Indemnity (PI) insurance, we provide statutory project management, cost modeling, and governance aligned with National Treasury FIDPM standards.`,
        methodology: `PROFESSIONAL ADVISORY & FIDPM METHODOLOGY:\n1. STAKEHOLDER INCEPTION & BASELINE AUDIT: Establish technical steering committee, clarify project charter, and formulate the Procurement & Value Strategy.\n2. DETAILED OPTIONS ANALYSIS & FEASIBILITY: Multi-criteria feasibility studies covering geotechnical data, structural viability, socio-economic impact, and 30-year lifecycle costing.\n3. STATUTORY COMPLIANCE & TENDER PACKAGING: Preparation of standard JBCC / GCC contract documentation, precise Bills of Quantities (BOQ), and CIDB / PPPFA compliance scoring registers.\n4. FIDPM STAGE GATING & CONSTRUCTION MONITORING: Monthly site progress inspections, payment certificate validations, and practical completion handover audits.`,
        timeline: `ADVISORY MILESTONES (FIDPM STAGES):\n• Stage 1 & 2 (Inception & Concept): Month 1 - 4 (Baseline risk audit, preliminary drawings, cost model).\n• Stage 3 & 4 (Design Development & Procurement): Month 5 - 10 (Detailed BOQ, municipal submissions).\n• Stage 5 & 6 (Construction Monitoring & Close-out): Month 11 - 36 (Monthly payment valuations, as-built dossiers).`,
        costing: `PROFESSIONAL ADVISORY FEE BREAKDOWN:\n1. Lead Principal Consultant Advisory & Strategic Formulation: R${Math.round(tender.value * 0.38).toLocaleString('en-ZA')}\n2. Registered Professional Engineers & Quantity Surveyors Time-Charges: R${Math.round(tender.value * 0.32).toLocaleString('en-ZA')}\n3. Site Auditing, Laboratory Testing & Professional Indemnity Insurance: R${Math.round(tender.value * 0.10).toLocaleString('en-ZA')}\n4. 30% Candidate Professional Graduate Mentorship & Black QS Subcontracting: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'WATER':
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} submits this turnkey water pipeline, pump station, and reservoir construction proposal for: "${tender.title}".\n\nHolding active CIDB 7CE / 7ME gradings and comprehensive experience in bulk water reticulation, we combine trenching plant, welded steel pipeline specialists, and Blue Drop certified disinfection procedures to ensure reliable potable water delivery.`,
        methodology: `WATER RETICULATION & RESERVOIR EXECUTION METHODOLOGY:\n1. BULK TRENCHING & PIPE BEDDING: Excavations are executed with precision laser grading. SABS-approved pipe bedding (selected granular material) prevents ovality and differential settlement.\n2. STEEL & HDPE WELDED PIPELINES: Certified coded welders perform continuous internal/external welds with 100% radiographic weld testing at all pipe joints.\n3. HYDROSTATIC PRESSURE TESTING: Pipeline sections undergo hydrostatic pressure testing at 1.5x working pressure for 24 hours with zero allowable pressure drop.\n4. DISINFECTION & COMMISSIONING: The entire reticulation network is chlorinated according to Department of Water & Sanitation potable water guidelines prior to municipal commissioning.`,
        timeline: `WATER INFRASTRUCTURE MILESTONES:\n• Month 1 - 3: Site clearance, bulk pipeline trenching, and pipe stringing along servitude.\n• Month 4 - 12: Pipeline laying, joint welding, valve chamber construction, and thrust blocks.\n• Month 13 - 20: Reinforced concrete reservoir construction, slip-form walls, and roof casting.\n• Month 21 - 24: Hydrostatic pressure tests, sterilization, and municipal handover.`,
        costing: `WATER RETICULATION BILL OF QUANTITIES:\n1. Bulk Earthworks, Pipe Trenching & Bedding Sand: R${Math.round(tender.value * 0.28).toLocaleString('en-ZA')}\n2. High-Pressure Welded Steel / HDPE Pipes & Valve Assemblies: R${Math.round(tender.value * 0.35).toLocaleString('en-ZA')}\n3. Reinforced Concrete Reservoir Superstructure & Pump Station: R${Math.round(tender.value * 0.17).toLocaleString('en-ZA')}\n4. 30% Local Host Community Trenching Labor & SMME Subcontracting: R${Math.round(tender.value * 0.20).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };

    case 'CIVIL':
    default:
      return {
        summary: `EXECUTIVE BID SUMMARY:\n${company} is pleased to submit this comprehensive civil construction proposal in response to the Invitation for Tender for: "${tender.title}".\n\nAs a registered Level 1 B-BBEE civil engineering group with deep community roots, a certified 7GB PE / 6CE CIDB grading, and a track record of successfully handing over public facilities in Gauteng, we guarantee 100% compliance alignment, complete financial capacity, and an outstanding occupational health & safety record.`,
        methodology: `TECHNICAL EXECUTION METHODOLOGY:\n1. SITE ESTABLISHMENT: In week 1, we will construct high-security SABS-approved clear-vu steel hoarding, deploy armed response safeguarding stations, establish temporary offices, and erect SHEQ induction stations.\n2. EARTHWORKS & EXCAVATION: Foundation trenches will be systematically cut using our fully owned JCB 3CX Backhoe Loader. Soil stability tests will be conducted prior to high-performance concrete pouring.\n3. SUPERSTRUCTURE & MASONRY: Concrete slabs will be reinforced with steel mesh. Superstructure brickwork and roofing timber framing will be installed by skilled local artisans recruited from host wards to satisfy the 30% local labor target.\n4. ELECTRICAL, RETICULATION & FINISHES: Certified plumbers and electricians will complete internally recessed conduits, followed by plastering, painting, glazing, and practical hand-over certificate sealing.`,
        timeline: `DETAILED WORK SCHEDULE MILESTONES:\n• Week 1 - 3: Mobilisation, site security fencing installation, civil engineering safety sign-offs.\n• Week 4 - 12: Excavations, foundation compaction, steel reinforcement layout, and structural concrete pouring.\n• Week 13 - 30: Brickwork masonry, steel roof framing, roof sheeting, and external wall structures.\n• Week 31 - 40: Internal electrical wiring, plumbing piping, dry-wall partitioning, painting, and glazing finishes.\n• Week 41 - 48: Practical site cleanup, independent SHEQ audits, and municipal compliance handover inspections.`,
        costing: `CIVIL ENGINEERING BILL OF QUANTITIES (BOQ):\n1. Preliminary & General (Site Fencing, Security, Offices): R${Math.round(tender.value * 0.12).toLocaleString('en-ZA')}\n2. Earthworks, Foundations & Ground Slabs: R${Math.round(tender.value * 0.25).toLocaleString('en-ZA')}\n3. Superstructure Masonry, Framing & Roofing: R${Math.round(tender.value * 0.35).toLocaleString('en-ZA')}\n4. Internal Finishes, Plumbing & Electrical Reticulation: R${Math.round(tender.value * 0.18).toLocaleString('en-ZA')}\n5. 30% Local Host Community Labor & SMME Subcontracting: R${Math.round(tender.value * 0.10).toLocaleString('en-ZA')}\n---------------------------------------------------------------\nESTIMATED BID SUM: R${valFmt} (Including 15% VAT)`
      };
  }
}

export function getSectorBillingItems(sectorStr: string, tenderValue: number): BillingLineItem[] {
  const cat = getSectorCategory(sectorStr);
  const v = tenderValue > 0 ? tenderValue : 1200000;

  switch (cat) {
    case 'CATERING':
      return [
        {
          id: 'item-1',
          description: 'Daily Cooked Nutritional Meals & Fresh Produce Provision (NSNP Specifications)',
          unit: 'Meals',
          quantity: 24000,
          rate: 32,
          amount: 768000
        },
        {
          id: 'item-2',
          description: 'Refrigerated Cold-Chain Transport, Packaging & On-Time School Delivery',
          unit: 'Month',
          quantity: 6,
          rate: 38000,
          amount: 228000
        },
        {
          id: 'item-3',
          description: 'HACCP Quality Assurance, Laboratory Bacterial Swabs & Reg R638 Hygiene Audit',
          unit: 'Sum',
          quantity: 1,
          rate: 54000,
          amount: 54000
        }
      ];

    case 'ICT':
      return [
        {
          id: 'item-1',
          description: 'Enterprise Cloud Architecture Provisioning, Core Licences & Microservices Setup',
          unit: 'Sum',
          quantity: 1,
          rate: Math.round(v * 0.35),
          amount: Math.round(v * 0.35)
        },
        {
          id: 'item-2',
          description: 'Senior Software Engineering, API Gateways & DevOps Sprint Execution',
          unit: 'Hours',
          quantity: 360,
          rate: 1450,
          amount: 522000
        },
        {
          id: 'item-3',
          description: '24/7 Managed Cybersecurity Operations Centre (SOC), SLA Retainer & Support',
          unit: 'Month',
          quantity: 6,
          rate: 45000,
          amount: 270000
        }
      ];

    case 'SECURITY':
      return [
        {
          id: 'item-1',
          description: '24/7 Armed Security Guard Deployment (Grade A/B Rotational Shifts)',
          unit: 'Month',
          quantity: 6,
          rate: 145000,
          amount: 870000
        },
        {
          id: 'item-2',
          description: 'Tactical Armed Patrol Vehicle Routing, Fuel & Central Control Telemetry Link',
          unit: 'Month',
          quantity: 6,
          rate: 42000,
          amount: 252000
        },
        {
          id: 'item-3',
          description: 'Access Control Systems, Biometrics & Electronic Patrol Baton Checkpoints',
          unit: 'Sum',
          quantity: 1,
          rate: 85000,
          amount: 85000
        }
      ];

    case 'CLEANING':
      return [
        {
          id: 'item-1',
          description: 'Comprehensive Commercial Deep Cleaning & Facility Hygiene Maintenance',
          unit: 'm²',
          quantity: 18500,
          rate: 24,
          amount: 444000
        },
        {
          id: 'item-2',
          description: 'SABS 1828 Eco-friendly Chemicals, Hand Sanitizers & Biohazard Consumables',
          unit: 'Month',
          quantity: 6,
          rate: 36000,
          amount: 216000
        },
        {
          id: 'item-3',
          description: 'Industrial Ride-On Scrubber Operations, High-Level Window & Carpet Extraction',
          unit: 'Sum',
          quantity: 2,
          rate: 48000,
          amount: 96000
        }
      ];

    case 'MEDICAL':
      return [
        {
          id: 'item-1',
          description: 'SAHPRA-Licensed Diagnostic Monitoring Equipment & Sterile Surgical Consumables',
          unit: 'Units',
          quantity: 3500,
          rate: 280,
          amount: 980000
        },
        {
          id: 'item-2',
          description: 'Validated Cold-Chain Freight Transport with Live Temperature Data Loggers',
          unit: 'km',
          quantity: 6500,
          rate: 34,
          amount: 221000
        },
        {
          id: 'item-3',
          description: 'Clinical Quality Acceptance Testing, Lot Calibration & Medical Staff Training',
          unit: 'Sum',
          quantity: 1,
          rate: 85000,
          amount: 85000
        }
      ];

    case 'LOGISTICS':
      return [
        {
          id: 'item-1',
          description: 'Dedicated Long-Haul Heavy Freight Transit & Inter-Depot Cargo Haulage',
          unit: 'km',
          quantity: 18000,
          rate: 52,
          amount: 936000
        },
        {
          id: 'item-2',
          description: 'Heavy Truck Fleet Availability, RTMS Roadworthiness & Driver Retainer',
          unit: 'Month',
          quantity: 6,
          rate: 45000,
          amount: 270000
        },
        {
          id: 'item-3',
          description: 'R5M Goods-In-Transit Insurance Cover, Weighbridge Audits & Telematics Link',
          unit: 'Sum',
          quantity: 1,
          rate: 65000,
          amount: 65000
        }
      ];

    case 'CONSULTING':
      return [
        {
          id: 'item-1',
          description: 'Principal Professional Specialist Advisory, Stakeholder Sessions & Technical Strategy',
          unit: 'Hours',
          quantity: 280,
          rate: 2200,
          amount: 616000
        },
        {
          id: 'item-2',
          description: 'Technical Due Diligence, Options Analysis & Statutory BOQ Formulation (FIDPM)',
          unit: 'Days',
          quantity: 35,
          rate: 11500,
          amount: 402500
        },
        {
          id: 'item-3',
          description: 'Independent Quality Sign-off, R10M PI Cover & Final Close-out Technical Dossier',
          unit: 'Sum',
          quantity: 1,
          rate: 95000,
          amount: 95000
        }
      ];

    case 'WATER':
      return [
        {
          id: 'item-1',
          description: 'Trench Excavation, Bedding Material Staging & Backfilling along Servitude',
          unit: 'm³',
          quantity: 2800,
          rate: 340,
          amount: 952000
        },
        {
          id: 'item-2',
          description: 'High-Pressure Pipeline Laying, Joint Welding & Valve Chamber Assemblies',
          unit: 'm',
          quantity: 1400,
          rate: 980,
          amount: 1372000
        },
        {
          id: 'item-3',
          description: 'Hydrostatic Pressure Testing (1.5x working pressure), Disinfection & Chlorination',
          unit: 'Sum',
          quantity: 1,
          rate: 180000,
          amount: 180000
        }
      ];

    case 'CIVIL':
    default:
      return [
        {
          id: 'item-1',
          description: 'Preliminary & General, Site Security Hoarding & Environmental Setup',
          unit: 'Sum',
          quantity: 1,
          rate: Math.round(v * 0.15),
          amount: Math.round(v * 0.15)
        },
        {
          id: 'item-2',
          description: 'Site Excavation, Sub-base Soil Compaction & Concrete Foundation Works',
          unit: 'm³',
          quantity: 450,
          rate: 850,
          amount: 382500
        },
        {
          id: 'item-3',
          description: 'Superstructure Brickwork Masonry, Structural Steel & Weatherproof Finishes',
          unit: 'm²',
          quantity: 650,
          rate: 1250,
          amount: 812500
        }
      ];
  }
}

export function getSectorPlanTabs(sectorStr: string = '') {
  const cat = getSectorCategory(sectorStr);
  switch (cat) {
    case 'CATERING':
      return [
        { id: 'OHS', label: '1. Food Safety & Hygiene (Reg R638)', badge: 'DoH / Reg R638' },
        { id: 'QCP', label: '2. Quality & Cold-Chain (HACCP)', badge: 'HACCP / ISO 22000' },
        { id: 'EPWP', label: '3. Local Smallholder Sourcing (30%)', badge: 'PPPFA / Farmers' },
        { id: 'MOBILIZATION', label: '4. Kitchen Mobilization & Cold Fleet', badge: 'Cold-Chain Delivery' }
      ];
    case 'ICT':
      return [
        { id: 'OHS', label: '1. Information Safety & Ergonomics', badge: 'POPIA / OHS' },
        { id: 'QCP', label: '2. Security & QA Plan (ISO 27001)', badge: 'ISO 27001 / CI-CD' },
        { id: 'EPWP', label: '3. Youth Tech Developer Plan (30%)', badge: 'PPPFA / Youth Coders' },
        { id: 'MOBILIZATION', label: '4. Cloud Staging & Sprint Rollout', badge: 'GovTech Cloud' }
      ];
    case 'SECURITY':
      return [
        { id: 'OHS', label: '1. Firearms Safety & OHS Regs', badge: 'Firearms Control Act' },
        { id: 'QCP', label: '2. Guard Telemetry & Control (QCP)', badge: 'PSIRA / OB Audit' },
        { id: 'EPWP', label: '3. Host Ward Guard Recruitment (30%)', badge: 'PPPFA / Ward Marshals' },
        { id: 'MOBILIZATION', label: '4. Armed Patrol Fleet Mobilization', badge: 'VHF Telemetry / Fleet' }
      ];
    case 'CLEANING':
      return [
        { id: 'OHS', label: '1. Hazchem & OHS Act 85 Plan', badge: 'SABS 1828 Hazchem' },
        { id: 'QCP', label: '2. Hygiene & ATP Swab Quality (QCP)', badge: 'NCCA / ISO 9001' },
        { id: 'EPWP', label: '3. Ward Hygiene Cleaners (30%)', badge: 'PPPFA / Local Cleaners' },
        { id: 'MOBILIZATION', label: '4. Industrial Machine Mobilization', badge: 'Ride-On Scrubbers' }
      ];
    case 'MEDICAL':
      return [
        { id: 'OHS', label: '1. Biohazard & Cold-Chain Safety', badge: 'DoH / OHS Act' },
        { id: 'QCP', label: '2. Medical Device QA (ISO 13485)', badge: 'SAHPRA / ISO 13485' },
        { id: 'EPWP', label: '3. Local Medical Logistics (30%)', badge: 'PPPFA / Local Couriers' },
        { id: 'MOBILIZATION', label: '4. SAHPRA Warehouse Dispatch Plan', badge: 'Cold Storage Delivery' }
      ];
    case 'LOGISTICS':
      return [
        { id: 'OHS', label: '1. Driver Fatigue & Road Safety', badge: 'RTMS / OHS Act' },
        { id: 'QCP', label: '2. Freight Quality & Telematics (QCP)', badge: 'RTMS / GIT R5M' },
        { id: 'EPWP', label: '3. Local Owner-Driver Partners (30%)', badge: 'PPPFA / Owner-Drivers' },
        { id: 'MOBILIZATION', label: '4. Heavy Freight Fleet Mobilization', badge: 'GPS Beacons / Routes' }
      ];
    case 'CONSULTING':
      return [
        { id: 'OHS', label: '1. Professional Risk & PI Mitigation', badge: 'OHS / PI Cover' },
        { id: 'QCP', label: '2. Quality Control & Peer Review', badge: 'ISQC 1 / ECSA' },
        { id: 'EPWP', label: '3. Candidate Professional Mentorship (30%)', badge: 'PPPFA / Mentorship' },
        { id: 'MOBILIZATION', label: '4. Governance & Deliverable Milestones', badge: 'Inception / FIDPM' }
      ];
    case 'WATER':
      return [
        { id: 'OHS', label: '1. Trench Safety & Water OHS Plan', badge: 'DWS / OHS Act' },
        { id: 'QCP', label: '2. Pressure Test & Blue Drop Plan', badge: 'DWS Blue Drop / ITP' },
        { id: 'EPWP', label: '3. Local Community Pipe-Laying (30%)', badge: 'PPPFA / Local Labor' },
        { id: 'MOBILIZATION', label: '4. Pipeline Plant & Welding Staging', badge: 'Excavators & Welders' }
      ];
    case 'CIVIL':
    default:
      return [
        { id: 'OHS', label: '1. OHS Act 85 Safety Plan', badge: 'Construction Regs' },
        { id: 'QCP', label: '2. Quality Plan (QCP & ISO)', badge: 'ISO 9001 / ITP' },
        { id: 'EPWP', label: '3. Local Labor (EPWP)', badge: '30% Community' },
        { id: 'MOBILIZATION', label: '4. Site Mobilization Plan', badge: 'Gantt & Logistics' }
      ];
  }
}

export function getSectorOHSPlan(tender: TenderOpportunity, companyProfile: CompanyProfile) {
  const cat = getSectorCategory(tender.sector);
  const company = companyProfile.legalName || 'SAtenderAI Services (Pty) Ltd';

  switch (cat) {
    case 'CATERING':
      return {
        title: 'Food Premises Hygiene & Safety Specification Plan (Regulation R638 / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Food Premises Regulations R638 under Health Act 61 of 2003',
        directorate: `${company} • Food Hygiene & Environmental Safety Directorate`,
        regPill: 'REG R638 / HACCP CERTIFIED',
        appointee: 'Food Safety Appointee (Reg #COA-JHB-7821)',
        hiraTitle: '1. Food Hygiene Hazard Analysis & Critical Control Points (HACCP HIRA)',
        hiraBody: 'Prior to culinary preparation and distribution, a rigorous Baseline Food Safety Hazard Assessment is executed covering microbiological contamination, allergen segregation, chemical sanitization residue, and cold-chain temperature thresholds. Daily Kitchen Hygiene Logs (DKHLs) are signed before morning shifts.',
        appointments: [
          { role: 'Section 16(2) Food Safety Executive Appointee', name: 'Managing Director' },
          { role: 'Reg R638 Certified Food Hygiene Controller', name: 'Senior Quality Technologist' },
          { role: 'Cold-Chain & Storage Safety Supervisor', name: 'Fleet Logistics Officer' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Food Handler PPE Matrix & Sanitation Checkpoints',
        ppeBody: 'All kitchen staff and delivery personnel are equipped with certified non-shedding hairnets, beard guards, stain-resistant chef coats, heat-resistant oven mitts, cut-resistant steel mesh gloves, and oil/water slip-resistant clogs. Mandatory 20-second hand scrubbing protocols are monitored at automatic sensor faucets.',
        incidentTitle: '4. Food Safety Incident Quarantine & Municipal Notification',
        incidentBody: 'Zero-tolerance for food-borne pathogens. Any batch exceeding 4°C during chilled transit is immediately quarantined, logged in the Non-Conformance Register, safely disposed of, and reported to the municipal Environmental Health Practitioner (EHP).'
      };

    case 'ICT':
      return {
        title: 'Information Security & Digital Workplace Health Plan (POPIA / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Ergonomics Regulations 2019 and POPIA Data Protection Standards',
        directorate: `${company} • Cybersecurity & Digital Workplace Directorate`,
        regPill: 'ISO 27001 / POPIA COMPLIANT',
        appointee: 'Information Security Officer (CISM Certified)',
        hiraTitle: '1. Information Security & Workplace Ergonomics Risk Assessment (HIRA)',
        hiraBody: 'Comprehensive assessments covering visual display unit (VDU) eyestrain, repetitive strain injury (RSI), server room gas fire suppression (FM200), high-voltage rack grounding, and cyber social engineering threats. Daily automated server telemetry audits infrastructure stability.',
        appointments: [
          { role: 'Section 16(2) Digital Operations Appointee', name: 'Chief Technology Officer' },
          { role: 'POPIA Statutory Information Officer', name: 'Lead Compliance Officer' },
          { role: 'Data Center Infrastructure Safety Supervisor', name: 'Senior DevOps Architect' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Data Center Electrostatic Discharge (ESD) & Safety Protocols',
        ppeBody: 'Engineers working in server environments utilize anti-static wristbands, ESD dissipative safety footwear, acoustic ear protection for high-decibel airflow rooms, and certified laser safety goggles during optical fiber splicing.',
        incidentTitle: '4. Security Incident Response & Information Regulator Notification',
        incidentBody: 'Strict Zero-Breach mandate. Any unauthorized access attempt or P1 infrastructure outage triggers immediate failover to redundant disaster recovery nodes in South Africa, with formal reporting to the Information Regulator within 72 hours under Section 22 of POPIA.'
      };

    case 'SECURITY':
      return {
        title: 'Tactical Armed Response & Guarding Safety Plan (Firearms Control Act / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Private Security Industry Regulation Act 56 of 2001 and Firearms Control Act 60 of 2000',
        directorate: `${company} • Tactical Security & Guarding Directorate`,
        regPill: 'PSIRA GRADE A / FIREARMS CERTIFIED',
        appointee: 'Tactical Security Appointee (PSIRA Reg #2910842)',
        hiraTitle: '1. Threat Assessment & Armed Guarding Risk Matrix (HIRA)',
        hiraBody: 'Comprehensive baseline security threat profiling assessing intrusion vulnerabilities, blindspot geometry, armed robbery hazards, and crowd dynamics. Daily pre-shift briefing logs are executed prior to armory weapon checkouts.',
        appointments: [
          { role: 'Section 16(2) Armed Security Executive Appointee', name: 'Managing Director' },
          { role: 'PSIRA Statutory Guarding Commander', name: 'Operations Area Manager' },
          { role: 'Firearms Control Act Section 21 Armourer', name: 'Certified Range Master' },
          { role: 'General Safety Reg 3 Trauma First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Tactical Guard PPE & Ballistic Armor Matrix',
        ppeBody: 'Every deployed security officer is issued certified SABS-tested Level IIIA concealable ballistic armor vests, polycarbonate riot shields, high-lumens tactical torches, handheld two-way radios with panic distress channels, and steel-toe tactical patrol boots.',
        incidentTitle: '4. Incident Reporting & SAPS Firearms Compliance',
        incidentBody: 'Zero-Harm philosophy. Any discharge of a firearm or armed robbery altercation triggers immediate backup dispatch, medical casualty response, lockdown of physical evidence, and parallel notification to the South African Police Service (SAPS) and PSIRA within 12 hours.'
      };

    case 'CLEANING':
      return {
        title: 'Commercial Hygiene & Hazardous Chemicals Safety Plan (Hazchem / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Hazardous Chemical Substances Regulations (GN R1179) and NCCA Standards',
        directorate: `${company} • Environmental Hygiene & Hazchem Directorate`,
        regPill: 'SABS 1828 / NCCA COMPLIANT',
        appointee: 'Hazchem Appointee (Reg #NCCA-GP-4819)',
        hiraTitle: '1. Hazardous Chemical Substances & Slip/Fall Hazard Assessment (HIRA)',
        hiraBody: 'Detailed baseline evaluations covering chemical inhalation, caustic skin exposure, high-level glass cleaning fall hazards, and wet floor pedestrian slip risks. Safety Data Sheets (SDS) for all SABS 1828 products are mounted in prominent dispensing stations.',
        appointments: [
          { role: 'Section 16(2) Facilities Hygiene Appointee', name: 'Operations Director' },
          { role: 'Hazchem Statutory Safety Controller', name: 'Senior Facility Hygiene Officer' },
          { role: 'Biohazard & Medical Waste Officer', name: 'SHEQ Officer' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Chemical Handler PPE Matrix & Spill Containment',
        ppeBody: 'Hygiene operatives are supplied with heavy-duty nitrile chemical gloves, splash-proof safety goggles, non-slip rubber safety clogs, color-coded waterproof aprons, and organic vapor half-masks during concentrated chemical dilution. Yellow "Caution: Wet Floor" barrier cones are placed prior to any wash cycle.',
        incidentTitle: '4. Chemical Spill & COIDA Reporting Protocol',
        incidentBody: 'All cleaning crews are trained in neutralizing acid/alkali spills with absorbent neutralizing kits. Any chemical exposure or eye-splash triggers emergency eyewash deployment and formal incident filing with the Compensation Commissioner within 24 hours.'
      };

    case 'MEDICAL':
      return {
        title: 'Medical Devices & Biohazard Healthcare Safety Plan (SAHPRA / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Medicines and Related Substances Act 101 of 1965 and Biohazard Regulations',
        directorate: `${company} • Medical Compliance & Clinical Logistics Directorate`,
        regPill: 'SAHPRA SECTION 22C LICENSED',
        appointee: 'Responsible Pharmacist / QC Manager',
        hiraTitle: '1. Healthcare Commodity & Biohazard Storage Risk Assessment (HIRA)',
        hiraBody: 'Comprehensive risk assessments covering sterile packaging rupture, cold-chain temperature excursions (2°C-8°C), needle-stick injuries, and hazardous biological specimen handling. Automated environmental loggers track warehouse temperature and humidity continuously.',
        appointments: [
          { role: 'Section 16(2) Healthcare Operations Appointee', name: 'Managing Director' },
          { role: 'SAHPRA Authorized Responsible Person', name: 'Quality Assurance Pharmacist' },
          { role: 'Cold-Chain Transport Safety Supervisor', name: 'Logistics Distribution Manager' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Sterile Handling PPE Matrix & Cleanroom Attire',
        ppeBody: 'Warehouse and distribution personnel utilize sterile lint-free lab coats, medical grade nitrile powder-free gloves, particulate N95 respirators, and electrostatic dissipative footwear inside climate-controlled cleanroom staging bays.',
        incidentTitle: '4. Batch Recall & SAHPRA Adverse Event Notification',
        incidentBody: 'Immediate quarantine protocol. Any detected packaging defect or temperature excursion during transport triggers automated stock hold in the ERP system, with simultaneous reporting to the client health department and SAHPRA within 24 hours.'
      };

    case 'LOGISTICS':
      return {
        title: 'Heavy Freight Transport & Road Safety Plan (RTMS / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with National Road Traffic Act 93 of 1996 and Road Transport Management System (RTMS)',
        directorate: `${company} • Road Fleet & Freight Safety Directorate`,
        regPill: 'RTMS SANS 1395 CERTIFIED',
        appointee: 'RTMS Fleet Appointee (Reg #RTMS-ZA-3819)',
        hiraTitle: '1. Fleet Route Risk Profiling & Driver Fatigue Assessment (HIRA)',
        hiraBody: 'Corridor risk profiling mapping high-accident zones, freight hijacking hotspots, steep mountain passes, and weighbridge coordinates. Electronic onboard computers mandate maximum 4 hours of continuous driving followed by mandatory 30-minute rest breaks.',
        appointments: [
          { role: 'Section 16(2) Road Fleet Executive Appointee', name: 'Fleet Director' },
          { role: 'RTMS Transport Safety Manager', name: 'Operations Logistics Controller' },
          { role: 'Vehicle Maintenance & Workshop Inspector', name: 'Certified Master Diesel Mechanic' },
          { role: 'General Safety Reg 3 Roadside First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Freight Driver PPE & Roadside Breakdown Matrix',
        ppeBody: 'All heavy vehicle drivers are equipped with reflective Class 3 high-visibility safety jackets, steel-toe ankle-support boots, heavy leather work gloves for cargo strapping, and roadside hazard warning triangles with high-intensity amber strobe beacons.',
        incidentTitle: '4. Road Accident Escalation & Goods-In-Transit Protocol',
        incidentBody: '24/7 crash response protocol. Any road incident triggers emergency roadside recovery, deployment of armed tactical cargo safeguarding teams, medical rescue dispatch, and underwriter GIT claim notification within 4 hours.'
      };

    case 'CONSULTING':
      return {
        title: 'Professional Advisory & Risk Mitigation Plan (ECSA / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Professional Councils Codes of Conduct and Occupational Ergonomics Guidelines',
        directorate: `${company} • Professional Advisory & Quality Directorate`,
        regPill: 'ECSA / SACQSP / PI INSURED',
        appointee: 'Lead Professional Engineer (Pr.Eng #20170491)',
        hiraTitle: '1. Professional Advisory Risk Assessment & Site Inspection Protocol',
        hiraBody: 'Comprehensive risk evaluations covering professional design errors, statutory non-compliance, financial modeling deviations, and field engineering site hazards. Professional staff undergo mandatory project-specific safety inductions prior to all site audits.',
        appointments: [
          { role: 'Section 16(2) Advisory Executive Appointee', name: 'Managing Director' },
          { role: 'Lead Professional Built Environment Supervisor', name: 'Pr.Eng / Pr.QS Appointee' },
          { role: 'Statutory Project Risk Controller', name: 'Senior Project Manager' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Field Inspection PPE Matrix for Advisory Personnel',
        ppeBody: 'Engineers and quantity surveyors conducting site verifications are provided with branded ventilated safety hard hats, impact-resistant safety spectacles, high-visibility reflective surveyor vests, and composite-toe inspection safety boots.',
        incidentTitle: '4. Professional Indemnity (PI) & Non-Conformance Mitigation',
        incidentBody: 'Comprehensive peer-review architecture. Every milestone calculation, cost estimate, and technical report undergoes secondary professional peer sign-off before client submission, backed by R10,000,000 Professional Indemnity cover.'
      };

    case 'WATER':
      return {
        title: 'Water Reticulation, Trenching & Public Safety Plan (DWS / OHS Act 85)',
        subtitle: 'Drafted in strict accordance with South African Construction Regulations 2014 and Department of Water & Sanitation Standards',
        directorate: `${company} • Bulk Water & Reticulation SHEQ Directorate`,
        regPill: 'CIDB 7CE/ME / DWS COMPLIANT',
        appointee: 'Water Reticulation Safety Officer',
        hiraTitle: '1. Deep Trench Excavation & Pressurized Pipeline Risk Matrix (HIRA)',
        hiraBody: 'Detailed baseline evaluations covering trench wall collapse in unstable soil, groundwater inundation, heavy pipe handling, high-pressure hydrostatic testing, and chlorine gas handling during pipeline sterilization. Daily trench shoring inspections are mandatory.',
        appointments: [
          { role: 'Section 16(2) Water Works Appointee', name: 'Managing Director' },
          { role: 'Construction Reg 8(1) Water Engineering Manager', name: 'Registered Professional Engineer' },
          { role: 'Excavation & Shoring Safety Inspector', name: 'Certified Excavation Supervisor' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Certified Level 3 First Aider' }
        ],
        ppeTitle: '3. Pipe-Laying PPE Matrix & Confined Space Safety',
        ppeBody: 'Pipe crews utilize safety harnesses with retrieval tripods for valve chamber entry, chemical-resistant rubber boots, 4-gas atmosphere detectors (O₂, H₂S, CO, LEL), hard hats with chin straps, and cut-resistant pipe-handling gloves.',
        incidentTitle: '4. Pipe Burst & Groundwater Contamination Prevention',
        incidentBody: 'Immediate isolating valve shutdown protocols. Any pipeline rupture or trench collapse triggers emergency shoring stabilization, de-watering pump deployment, and incident filing with {tender.buyer} within 12 hours.'
      };

    case 'CIVIL':
    default:
      return {
        title: 'Health & Safety Specification Compliance Plan (OHS Act No. 85 of 1993)',
        subtitle: 'Drafted in strict accordance with South African Construction Regulations 2014 Section 7(1)(a)',
        directorate: `${company} • SHEQ Directorate`,
        regPill: 'SAMTRAC CERTIFIED',
        appointee: 'Johannes v.d. Merwe (Reg #SACPCMP/CHSO/084)',
        hiraTitle: '1. Baseline Hazard Identification & Risk Assessment (HIRA)',
        hiraBody: 'Prior to site handover, a comprehensive Baseline Risk Assessment is conducted covering physical risks, heavy machinery maneuvering, falling objects, electrical hazard mitigation, and excavation stability. Daily Task Risk Assessments (DTRAs) are completed by appointed supervisors before commencing any shift.',
        appointments: [
          { role: 'Section 16(2) Assistant to Chief Executive Officer', name: 'Austin Mpapane (Managing Director)' },
          { role: 'Construction Regulation 8(1) Construction Manager', name: 'Full-time registered professional on site' },
          { role: 'Construction Regulation 8(7) Safety Officer', name: 'Full-time SAMTRAC-accredited officer' },
          { role: 'General Safety Reg 3 First Aid Officer', name: 'Level 3 First Aider equipped with trauma kit' }
        ],
        ppeTitle: '3. Daily Toolbox Talks & PPE Matrix',
        ppeBody: 'Every team member undergoes accredited site induction prior to receiving SABS-compliant PPE (high-visibility reflective vests, steel-toe boots with midsole protection, impact-rated hard hats, eye protection, and heavy-duty grip gloves). Mandatory 15-minute toolbox talks are logged every morning at 07:00 AM with signed attendance registers.',
        incidentTitle: '4. Incident Reporting & Compensation Fund (COIDA) Compliance',
        incidentBody: `Strict Zero-Harm target. Any near-miss or Section 24 reportable incident will be reported to the Department of Employment and Labour within 24 hours using official W.Cl. 1 / W.Cl. 2 forms, with parallel notification to ${tender.buyer}'s Representative.`
      };
  }
}

export function getSectorQCPPlan(tender: TenderOpportunity, companyProfile: CompanyProfile) {
  const cat = getSectorCategory(tender.sector);

  switch (cat) {
    case 'CATERING':
      return {
        title: 'Quality Management & Food Safety Plan (HACCP / ISO 22000)',
        subtitle: 'Hazard Analysis Critical Control Point (HACCP), cold-chain logging, retention testing, and microbiological audits',
        cards: [
          { code: 'SANS 885', name: 'Fortified Commodity Standard', desc: 'Enriched maize meal, beans and pulses meeting Department of Health nutritional quotas.' },
          { code: 'Reg R638', name: 'Food Premises Acceptability', desc: 'Active municipal environmental health certificate of hygiene acceptability.' },
          { code: 'SANS 10049', name: 'HACCP Pre-Requisites', desc: 'Pest barriers, sanitization validation, and unbroken cold-chain transport.' }
        ],
        itp: [
          { milestone: 'Fresh Produce Inward Delivery', pointType: 'HOLD POINT', criteria: 'Temperature < 4°C, zero bruising, fresh expiry date', authority: 'Receiving Food QC Officer' },
          { milestone: 'Kitchen Culinary Preparation', pointType: 'WITNESS POINT', criteria: 'Cooking core temperature ≥ 75°C, sanitization register', authority: 'Head Chef & Safety Officer' },
          { milestone: 'Final School Site Delivery', pointType: 'HOLD POINT', criteria: 'Delivered by 07:30 AM, thermo-boxes sealed, 72h sample taken', authority: 'Principal / NSNP Coordinator' }
        ]
      };

    case 'ICT':
      return {
        title: 'Quality Management & Cybersecurity Assurance Plan (ISO 27001 / ISO 9001)',
        subtitle: 'Systematic software quality assurance, automated CI/CD regression gates, penetration testing, and SLA metrics',
        cards: [
          { code: 'ISO/IEC 27001', name: 'Information Security Management', desc: 'Encryption at rest (AES-256) and in transit (TLS 1.3), POPIA data privacy controls.' },
          { code: 'ISO 9001:2015', name: 'Quality Management System', desc: 'Automated SonarQube code quality gates with > 85% unit test coverage.' },
          { code: 'OWASP Top 10', name: 'Application Security Standard', desc: 'Zero high or critical vulnerabilities verified by independent CREST ethical hackers.' }
        ],
        itp: [
          { milestone: 'Sprint Release Staging', pointType: 'HOLD POINT', criteria: 'Automated test suite pass rate 100%, zero critical vulnerabilities', authority: 'Lead DevOps Architect' },
          { milestone: 'Cloud Infrastructure Deployment', pointType: 'WITNESS POINT', criteria: 'Geo-redundancy verification, simulated failover < 60s', authority: 'Cloud Infrastructure Lead' },
          { milestone: 'User Acceptance Testing (UAT)', pointType: 'HOLD POINT', criteria: 'Sign-off on all functional test cases with client project sponsor', authority: 'Client Business Lead' }
        ]
      };

    case 'SECURITY':
      return {
        title: 'Security Quality Control & Guard Telemetry Plan (PSIRA / ISO 9001)',
        subtitle: 'Electronic patrol baton telemetry, armed tactical response SLAs, firearm audits, and Occurrence Book registers',
        cards: [
          { code: 'PSIRA Act 56', name: 'Corporate Guarding Standard', desc: 'All deployed officers Grade A/B registered with certified biometric clearance.' },
          { code: 'SANS 10200', name: 'Physical Security Systems', desc: 'Electric fencing energized at 9.9kV with instant alarm tamper telemetry.' },
          { code: 'ISO 9001:2015', name: 'Security Operational Quality', desc: 'Guaranteed 15-minute armed tactical response SLA with GPS vehicle logs.' }
        ],
        itp: [
          { milestone: 'Shift Changeover & Armory Checkout', pointType: 'HOLD POINT', criteria: 'PSIRA card check, sobriety breathalyzer test 0.00%, ammunition count', authority: 'Duty Shift Commander' },
          { milestone: 'Hourly Guard Patrol Sequence', pointType: 'WITNESS POINT', criteria: 'Electronic wand logs uploaded live to control room every 60 min', authority: 'Control Room Dispatcher' },
          { milestone: 'Monthly Tactical SLA Audit', pointType: 'HOLD POINT', criteria: 'Occurrence Book audit, client sign-off, zero security breaches', authority: 'Client Security Directorate' }
        ]
      };

    case 'CLEANING':
      return {
        title: 'Hygiene Quality Assurance & ATP Swab Verification Plan (NCCA / ISO 9001)',
        subtitle: 'Bioluminescence ATP swab thresholds, SABS 1828 eco-chemical verification, and daily room sign-off registers',
        cards: [
          { code: 'SABS 1828', name: 'Eco-Chemical Efficacy Standard', desc: 'Biodegradable cleaning agents certified safe for food contact and clinical areas.' },
          { code: 'NCCA Standards', name: 'Contract Cleaning Code', desc: 'National Contract Cleaners Association operational best practices and wage compliance.' },
          { code: 'ISO 9001:2015', name: 'Hygiene Quality Management', desc: 'Daily room cleanliness checklists with supervisor sign-offs and ATP validation.' }
        ],
        itp: [
          { milestone: 'Chemical Dilution Staging', pointType: 'HOLD POINT', criteria: 'Automated closed-loop dilution calibrated to exact manufacturer ratio', authority: 'Hygiene Supervisor' },
          { milestone: 'Deep Scrubbing & Floor Polishing', pointType: 'WITNESS POINT', criteria: 'Slip resistance coefficient ≥ 0.5, streak-free high-gloss finish', authority: 'Floor Care Specialist' },
          { milestone: 'ATP Bioluminescence Swab Test', pointType: 'HOLD POINT', criteria: 'Relative Light Units (RLU) < 30 on high-touch clinical surfaces', authority: 'Client Environmental Officer' }
        ]
      };

    case 'MEDICAL':
      return {
        title: 'Medical Devices & Diagnostics Quality Assurance Plan (ISO 13485 / SAHPRA)',
        subtitle: 'Lot sterility release certificates, cold-chain continuous data logging, and biomedical calibration sign-offs',
        cards: [
          { code: 'ISO 13485:2016', name: 'Medical Devices Quality System', desc: 'Traceability and risk management throughout the medical supply chain.' },
          { code: 'SAHPRA Sec 22C', name: 'Medical Establishment License', desc: 'Authorized distribution of medical devices, diagnostic test kits and PPE.' },
          { code: 'SANS 1866', name: 'Medical PPE Specification', desc: 'Bacterial filtration efficiency (BFE) ≥ 98% and splash resistance.' }
        ],
        itp: [
          { milestone: 'Consignment Warehouse Ingress', pointType: 'HOLD POINT', criteria: 'Lot certificate of analysis (COA) match, sterile packaging intact', authority: 'QA Pharmacist' },
          { milestone: 'Cold-Chain Transit Verification', pointType: 'WITNESS POINT', criteria: 'Digital logger audit confirming 2°C to 8°C throughout journey', authority: 'Logistics QC Lead' },
          { milestone: 'Hospital Pharmacy Receiving', pointType: 'HOLD POINT', criteria: 'Clinical inspection, batch sign-off, biomedical calibration certificate', authority: 'Chief Hospital Pharmacist' }
        ]
      };

    case 'LOGISTICS':
      return {
        title: 'Road Freight Quality & Fleet Compliance Plan (RTMS / ISO 9001)',
        subtitle: 'Weighbridge axle-load verification, real-time satellite telematics, driver fatigue compliance, and e-POD tracking',
        cards: [
          { code: 'SANS 1395 (RTMS)', name: 'Road Transport Management', desc: 'Heavy vehicle roadworthiness, zero overloading, and driver health screening.' },
          { code: 'GIT R5,000,000', name: 'Goods In Transit Policy', desc: 'Comprehensive commercial underwriter cover for every dispatched payload.' },
          { code: 'ISO 9001:2015', name: 'Logistics Operational Quality', desc: 'On-time delivery (OTIF) rate ≥ 98.5% with electronic proof of delivery.' }
        ],
        itp: [
          { milestone: 'Pre-Trip Vehicle Roadworthy Check', pointType: 'HOLD POINT', criteria: 'Tyre tread depth ≥ 3mm, brake test passed, steering inspection signed', authority: 'Workshop Master Mechanic' },
          { milestone: 'Weighbridge Outbound Audit', pointType: 'HOLD POINT', criteria: 'Gross vehicle mass within legal statutory axle limits (zero overloading)', authority: 'Certified Weighbridge Officer' },
          { milestone: 'Electronic Proof of Delivery (e-POD)', pointType: 'WITNESS POINT', criteria: 'Time-stamped GPS coordinate delivery receipt signed by consignee', authority: 'Client Depot Receiving Manager' }
        ]
      };

    case 'CONSULTING':
      return {
        title: 'Professional Advisory & Quality Control Plan (ISQC 1 / ISO 9001)',
        subtitle: 'FIDPM stage-gating deliverables, two-tier technical peer review, and ECSA / SACQSP professional practice standards',
        cards: [
          { code: 'ISQC 1 / IRBA', name: 'Quality Control for Audit/Advisory', desc: 'Independent technical review and conflict-of-interest declaration verification.' },
          { code: 'ECSA / SACQSP', name: 'Professional Code of Conduct', desc: 'Statutory responsibility of registered Pr.Eng and Pr.QS professionals.' },
          { code: 'FIDPM Standards', name: 'Framework for Infrastructure Delivery', desc: 'Stage 1 through Stage 6 gating reviews aligned with National Treasury.' }
        ],
        itp: [
          { milestone: 'Inception Baseline Architecture', pointType: 'HOLD POINT', criteria: 'Project charter signed, stakeholder terms of reference approved', authority: 'Project Steering Committee' },
          { milestone: 'Technical Peer Review Gating', pointType: 'HOLD POINT', criteria: 'Secondary independent Pr.Eng / Pr.QS verification of calculations & BOQ', authority: 'Lead Technical Reviewer' },
          { milestone: 'Final Tender Adjudication Report', pointType: 'WITNESS POINT', criteria: 'Complete compliance scoring matrix aligned with PPPFA 80/20 or 90/10', authority: 'Bid Adjudication Committee' }
        ]
      };

    case 'WATER':
      return {
        title: 'Water Infrastructure Quality & Blue Drop Compliance Plan (DWS / ITP)',
        subtitle: 'Radiographic pipe weld testing, hydrostatic pressure tests (1.5x working pressure), and potable water chlorination',
        cards: [
          { code: 'SANS 719', name: 'Welded Steel Pipes for Water', desc: 'Hydrostatically tested steel pipeline materials with epoxy protective lining.' },
          { code: 'DWS Blue Drop', name: 'Drinking Water Quality Standard', desc: 'Potable water sterilization and microbial safety compliance.' },
          { code: 'ISO 9001:2015', name: 'Infrastructure Quality Management', desc: 'Inspection test plan covering excavation, jointing, and pressure testing.' }
        ],
        itp: [
          { milestone: 'Pipeline Bedding & Stringing', pointType: 'HOLD POINT', criteria: 'Laser grade verification, bedding compaction ≥ 90% Mod AASHTO', authority: 'Resident Civil Engineer' },
          { milestone: 'Hydrostatic Pressure Testing', pointType: 'HOLD POINT', criteria: 'Held at 1.5x design pressure for 24 hours with zero allowable pressure loss', authority: 'Rand Water / Client Inspector' },
          { milestone: 'Water Disinfection & Chlorination', pointType: 'WITNESS POINT', criteria: 'Free chlorine residual verified, SANS 241 bacteriological clear certificate', authority: 'DWS Water Quality Lab' }
        ]
      };

    case 'CIVIL':
    default:
      return {
        title: 'Quality Management & Inspection Test Plan (QCP / ISO 9001:2015)',
        subtitle: 'Systematic quality assurance, material traceability, hold points, and test registers',
        cards: [
          { code: 'SANS 50197-1', name: 'Structural Cement', desc: 'CEM II 42.5N with batch test certificates.' },
          { code: 'SANS 920', name: 'High-Tensile Steel Rebar', desc: 'Mill test certificates verifying yield strength ≥ 500 MPa.' },
          { code: 'SANS 10400', name: 'National Building Regs', desc: 'Geometric compliance, fire stops and glazing.' }
        ],
        itp: [
          { milestone: 'Foundation Trenching', pointType: 'HOLD POINT', criteria: 'Soil compaction test ≥ 95% Mod AASHTO', authority: 'Client Geotechnical Engineer' },
          { milestone: 'Rebar & Shuttering', pointType: 'HOLD POINT', criteria: 'Cover blocks, bar diameter, clean void', authority: 'Resident Structural Engineer' },
          { milestone: 'Concrete Pour', pointType: 'WITNESS POINT', criteria: 'Slump test (75mm ± 25mm), 6 test cubes sampled', authority: 'Contractor QA Manager' }
        ]
      };
  }
}

