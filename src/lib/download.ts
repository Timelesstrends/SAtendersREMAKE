/**
 * Utility to generate realistic South African procurement mock document files
 * and trigger client-side browser downloads.
 */

interface DownloadParams {
  name: string;
  category?: string;
  size?: string;
  additionalData?: any;
}

export function triggerDocumentDownload({ name, category = 'compliance', size = '350 KB', additionalData = {} }: DownloadParams) {
  const cleanName = name.trim();
  const lowerName = cleanName.toLowerCase();
  
  let fileContent = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  // Determine file content based on name
  if (lowerName.includes('sars') || lowerName.includes('tax pin')) {
    fileContent = generateSarsPinTemplate(additionalData);
  } else if (lowerName.includes('csd') || lowerName.includes('central supplier')) {
    fileContent = generateCsdTemplate(additionalData);
  } else if (lowerName.includes('b-bbee') || lowerName.includes('bbee') || lowerName.includes('affidavit')) {
    fileContent = generateBbeeAffidavitTemplate(additionalData);
  } else if (lowerName.includes('coida') || lowerName.includes('good standing')) {
    fileContent = generateCoidaTemplate(additionalData);
  } else if (lowerName.includes('sbd 4') || lowerName.includes('sbd4') || lowerName.includes('disclosure')) {
    fileContent = generateSbd4Template(additionalData);
  } else if (lowerName.includes('methodology') || lowerName.includes('technical proposal')) {
    fileContent = generateMethodologyTemplate(additionalData);
    extension = 'doc'; // Save as .doc which opens nicely in Word
    mimeType = 'application/msword';
  } else if (lowerName.includes('spec') || lowerName.includes('guideline')) {
    fileContent = generateSpecTemplate(additionalData);
  } else if (lowerName.includes('cipc') || lowerName.includes('cor14.3') || lowerName.includes('registration')) {
    fileContent = generateCipcTemplate(additionalData);
  } else {
    // General fallback template
    fileContent = generateGenericTemplate(cleanName, category, size);
  }

  // Create blob and trigger download
  const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Format download filename
  let downloadFilename = cleanName;
  if (!downloadFilename.match(/\.[0-9a-z]+$/i)) {
    downloadFilename = `${downloadFilename}.${extension}`;
  }
  
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getCompanyDetails(data: any) {
  const profile = data?.companyProfile || {};
  const companyName = data?.companyName || profile.legalName || 'SATENDERAI SERVICES (PTY) LTD';
  const tradingName = data?.tradingName || profile.tradingName || companyName;
  const regNo = data?.registrationNumber || profile.registrationNumber || '2021/482931/07';
  const csdNo = data?.csdNumber || profile.csdNumber || 'MAAA0821439';
  const address = data?.physicalAddress || profile.physicalAddress || 'Level 4, Katherine & West Building, 114 West Street, Sandton, 2196';
  const bbeeLevel = data?.bbeeLevel ?? profile.bbeeLevel ?? 1;
  const taxNumber = data?.taxNumber || profile.taxNumber || '9324082144';
  const director = data?.director || profile.employees?.[0]?.name || 'Austin Mpapane';
  return { companyName, tradingName, regNo, csdNo, address, bbeeLevel, taxNumber, director };
}

function generateSarsPinTemplate(data: any) {
  const comp = getCompanyDetails(data);
  const pin = data.pin || '48A9BF42C0';
  const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  return `================================================================================
                    SOUTH AFRICAN REVENUE SERVICE (SARS)
                    TAX COMPLIANCE STATUS PIN STATUS REPORT
================================================================================
Generated Date : ${dateStr}
Reference No   : REF-931082-ZA
Taxpayer Name  : ${comp.companyName.toUpperCase()}
Trading Name   : ${comp.tradingName.toUpperCase()}
CIPC Reg No    : ${comp.regNo}
Income Tax No  : ${comp.taxNumber}

--------------------------------------------------------------------------------
TAX COMPLIANCE STATUS DETAILS
--------------------------------------------------------------------------------
Tax Compliance Status PIN : ${pin}
TCS Status                : APPROVED / COMPLIANT
Status Description        : The taxpayer is registered for tax and is currently compliant
                            with their filing and payment obligations.
Expiry Date               : 2027-06-30

--------------------------------------------------------------------------------
VERIFICATION AUDIT TRAIL
--------------------------------------------------------------------------------
System Check ID           : TCS-PIN-VERIFY-88124
CSD Verification Result   : MATCHED - SARS Live Database Sync Active
Audit Status              : SUCCESSFUL

--------------------------------------------------------------------------------
Important Notice:
Adjudicating organs of state can verify this status live on the SARS eFiling system
or via the Central Supplier Database (CSD) using the TCS PIN listed above.
================================================================================
                 SARS SECURE DIGITAL AUTHENTICATION SEAL: Compliant
================================================================================`;
}

function generateCsdTemplate(data: any) {
  const comp = getCompanyDetails(data);
  const csdNum = data.csdNumber || comp.csdNo;
  const dateStr = new Date().toLocaleDateString('en-ZA');
  
  return `================================================================================
                    REPUBLIC OF SOUTH AFRICA NATIONAL TREASURY
                    CENTRAL SUPPLIER DATABASE (CSD) REPORT
================================================================================
Report Date    : ${dateStr}
CSD Number     : ${csdNum}
Registration   : COMPLETED & ACTIVE
Supplier Name  : ${comp.companyName.toUpperCase()}
Trading Name   : ${comp.tradingName.toUpperCase()}
CIPC Reg No    : ${comp.regNo}

--------------------------------------------------------------------------------
VERIFIED MODULE STATUS SUMMARIES
--------------------------------------------------------------------------------
* Industry Classification   : 8110 (Professional Services & Infrastructure)
* Bank Account Status       : VERIFIED (Standard Bank South Africa)
* SARS Tax Status           : COMPLIANT (PIN Status verified live)
* CIPC Status               : IN BUSINESS / ACTIVE DIRECTORS
* B-BBEE Status             : LEVEL ${comp.bbeeLevel} CONTRIBUTOR
* Address Details           : VERIFIED (${comp.address})
* Director Identities       : VERIFIED (${comp.director} - National ID Match)

--------------------------------------------------------------------------------
ASSOCIATED DIRECTORS & SHAREHOLDERS
--------------------------------------------------------------------------------
1. Director Name            : ${comp.director}
   Shareholding             : 100% Black Owned
   State Employee Status    : NO

================================================================================
               NATIONAL TREASURY CSD VERIFICATION BARCODE: ACTIVE
================================================================================`;
}

function generateBbeeAffidavitTemplate(data: any) {
  const comp = getCompanyDetails(data);
  const yearStr = new Date().getFullYear();
  
  return `================================================================================
                      SWORN AFFIDAVIT - B-BBEE EXEMPTED MICRO ENTERPRISE
                       (ISSUED IN TERMS OF THE AMENDED CODES)
================================================================================

I, the undersigned,
Full Name & Surname : ${comp.director.toUpperCase()}
Capacity            : Authorized Managing Director / Shareholder

Hereby declare under oath as follows:
1. The contents of this statement are to the best of my knowledge a true reflection of the facts.
2. I am a Director / Owner of the following enterprise and am duly authorized to act on its behalf:

Enterprise Name     : ${comp.companyName.toUpperCase()}
Trading Name        : ${comp.tradingName.toUpperCase()}
Registration Number : ${comp.regNo}
Enterprise Physical : ${comp.address}

3. I hereby declare under oath that the Enterprise is:
   - 100% Black Owned
   - 50% Black Woman Owned (N/A - 0%)
   - 135% B-BBEE Procurement Recognition Level (Level ${comp.bbeeLevel} Contributor)
   - Exempted Micro Enterprise (Annual Turnover under R10 Million)

4. Based on the Audited Financial Statements / Management Accounts and other information
   available on the latest financial year-end, the annual Income/Turnover was less than
   R10,000,000.00 (Ten Million Rand).

5. I know and understand the contents of this affidavit and I have no objection to take
   the prescribed oath and consider the oath binding on my conscience and on the owners
   of the enterprise which I represent in this matter.

--------------------------------------------------------------------------------
COMMISSIONER OF OATHS CERTIFICATION
--------------------------------------------------------------------------------
Signed and sworn before me at JOHANNESBURG on this day.
Commissioner Name   : Advocate S. Nkosi
Capacity            : Commissioner of Oaths / Practising Attorney RSA
Signature Status    : CERTIFIED AND STAMPED (SANAS COMPLIANT)

================================================================================
           ${comp.tradingName.toUpperCase()} COMPLIANCE PLATFORM SECURE STORAGE INTEGRITY
================================================================================`;
}

function generateCoidaTemplate(data: any) {
  const comp = getCompanyDetails(data);
  const dateStr = new Date().toLocaleDateString('en-ZA');
  const expDateStr = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA');
  
  return `================================================================================
                     COMPENSATION COMMISSIONER - COID ACT, 1993
                     LETTER OF GOOD STANDING (INJURY ON DUTY)
================================================================================
Date of Issue : ${dateStr}
Expiry Date   : ${expDateStr}
Reference No  : 990001083421
Employer No   : 0184-293-1084

Employer Details:
${comp.companyName.toUpperCase()}
${comp.address}

This is to certify that the employer above-mentioned is registered under the
Compensation for Occupational Injuries and Diseases Act, 1993 (Act No 130 of 1993)
and has satisfied the requirements of the Act.

The employer is hereby declared to be in GOOD STANDING with the Compensation Fund
for the period specified above, provided that all assessment dues are fully paid
and annual earnings returns are correctly rendered.

--------------------------------------------------------------------------------
OPERATIONAL COVERAGE CAPABILITY
--------------------------------------------------------------------------------
Scope Covered : Construction, Physical Security Operations & Civil Engineering Works
Limitations   : None

================================================================================
             COMPENSATION FUND DIGITAL AUTHENTICATION SECURITY STAMP
================================================================================`;
}

function generateSbd4Template(data: any) {
  const comp = getCompanyDetails(data);
  const name = data.sigName || comp.director;
  const title = data.sigTitle || 'Managing Director & Lead Bid Specialist';
  const dateStr = new Date().toLocaleDateString('en-ZA');
  
  return `================================================================================
                   REPUBLIC OF SOUTH AFRICA NATIONAL TREASURY
                        BIDDER'S DISCLOSURE (SBD 4 FORM)
================================================================================
1. PURPOSE OF THE FORM
Any person (natural or juristic) may make an offer or offers in terms of this
invitation to bid. In line with the principles of transparency, accountability,
impartiality, and ethics as enshrined in the Constitution of the Republic of
South Africa, it is required for the bidder to make this declaration in respect
of the details required hereunder.

2. BIDDER'S DECLARATION
2.1. Is the bidder, or any of its directors / trustees / shareholders / members /
     partners or any person having a controlling interest in the enterprise,
     employed by the state?
     [ ANSWER: NO ]

2.2. Do you, or any person connected with the bidder, have a relationship with
     any person who is employed by the procuring institution?
     [ ANSWER: NO ]

2.3. Does the bidder or any of its directors / trustees / shareholders / members /
     partners have any relationship with any other bidder involved in this procurement?
     [ ANSWER: NO ]

3. DECLARATION OF INTEGRITY & COMPETITIVE BIDDING
The bidder certifies that they have arrived at the accompanying bid independently from,
and without consultation, communication, agreement or arrangement with any competitor.
The bidder has not engaged in collusive bidding or anti-competitive practices.

4. CERTIFICATION OF TRUTH
I, the undersigned, in submitting the accompanying bid, do hereby make the following
statements that I certify to be true and complete in every respect.

Authorized Representative Name : ${name}
Title / Capacity               : ${title}
Company Represented            : ${comp.companyName.toUpperCase()}
Signed Date                    : ${dateStr}

--------------------------------------------------------------------------------
E-SIGNATURE SEALS AND COMPILING LOGS
--------------------------------------------------------------------------------
Sealed By   : SAtenderAI Secure E-Signature Engine (National Treasury compliant)
Status      : SIGNED & SECURED
Digital Key : AES-256-SHA-SECURE-${Math.random().toString(36).substring(2, 10).toUpperCase()}

================================================================================`;
}

function generateMethodologyTemplate(data: any) {
  const comp = getCompanyDetails(data);
  const buyer = data.buyer || 'State Procuring Entity';
  const title = data.title || 'Technical Infrastructure Project';
  const dateStr = new Date().toLocaleDateString('en-ZA');
  
  return `================================================================================
                 TECHNICAL METHODOLOGY STATEMENT & OPERATIONAL PROJECT PLAN
================================================================================
PREPARED FOR : ${buyer}
BID TITLE    : ${title}
SUBMITTED BY : ${comp.companyName.toUpperCase()}
DATE OF DRAFT: ${dateStr}

--------------------------------------------------------------------------------
1. EXECUTIVE SUMMARY & SERVICE PHILOSOPHY
--------------------------------------------------------------------------------
${comp.tradingName} presents a comprehensive, risk-mitigated technical
methodology designed specifically to meet and exceed the operational standards 
stipulated in the Terms of Reference. Our approach prioritizes local resource
empowerment, SABS quality standards, and rigorous occupational health and safety.

--------------------------------------------------------------------------------
2. PROJECT ESTABLISHMENT & SITE MOBILISATION
--------------------------------------------------------------------------------
* Week 1-3: Site establishment, securing boundaries with SABS hoarding, and
  erection of OHS informational signages.
* Week 4-12: Material excavation and foundation logistics under supervision.
* Week 13-30: Structural layout phases using certified bricklayers and local
  artisans to enhance community participation.

--------------------------------------------------------------------------------
3. QUALITY ASSURANCE PLAN (QAP) & SAFETY STANDARDS
--------------------------------------------------------------------------------
Our operations will strictly align with ISO 9051 Standards of Compliance. A full-time
SHEQ (Safety, Health, Environment, and Quality) Officer will conduct weekly safety audits 
and tool-box talks to enforce zero-injury milestones on-site.

--------------------------------------------------------------------------------
4. OPERATIONAL GANTT TIMELINE SCHEDULE
--------------------------------------------------------------------------------
Operational phases will span across a 48-week lifecycle, broken down into key
milestones:

- Phase 1: Site Establishment & SABS Security Hoarding (Weeks 1-3)
  Asset allocated: Mercedes Benz Actros Tippers
- Phase 2: Substructure Excavations & Foundation Pouring (Weeks 4-12)
  Asset allocated: JCB 3CX Backhoe Loader
- Phase 3: Superstructure Brickwork & Framing (Weeks 13-30)
  Staff allocated: 12 Local Artisans & Bricklayers
- Phase 4: Finishes, Electrical Reticulation & Plumbing (Weeks 31-40)
  Staff allocated: 8 Specialized Subcontractors
- Phase 5: Handover Inspections, SHEQ Audits (Weeks 41-48)
  Lead: SHEQ Officer Johannes v.d. Merwe

================================================================================
             SAtenderAI - COMPILED PROPOSAL & METHODOLOGY STATEMENT
================================================================================`;
}

function generateSpecTemplate(data: any) {
  return `================================================================================
               DEPARTMENT OF PUBLIC WORKS & INFRASTRUCTURE REPUBLIC OF S.A.
               OFFICIAL TENDER ADVERTISEMENT SPECIFICATIONS
================================================================================
Tender Number  : DPW-ZA-2026-98
Title          : Construction and Security Infrastructure Upgrades
Adjudication   : 80/20 Preference Point System (B-BBEE Level Contributor)
Functionality  : Minimum threshold of 70% required to pass to stage 2.

--------------------------------------------------------------------------------
MANDATORY RETURNABLE DOCUMENTS CHECKLIST:
--------------------------------------------------------------------------------
[1] Central Supplier Database (CSD) Registration Summary Report
[2] Valid SARS Tax Compliance Status PIN code
[3] Certified copy of B-BBEE Rating Affidavit or SANAS Certificate
[4] COIDA Letter of Good Standing from the Compensation Commissioner
[5] Fully completed and signed SBD 4 Bidder's Disclosure Form
[6] Comprehensive Technical Methodology and Project Execution Plan

================================================================================`;
}

function generateCipcTemplate(data: any) {
  return `================================================================================
               COMPANIES AND INTELLECTUAL PROPERTY COMMISSION (CIPC)
                   REPUBLIC OF SOUTH AFRICA - CoR 14.3 REGISTRATION
================================================================================
Registration No : 2021/482931/07
Registration Dt : 14/09/2021
Enterprise Name : SATENDERAI SERVICES (PTY) LTD
Enterprise Type : Private Company

--------------------------------------------------------------------------------
ACTIVE DIRECTORS DETAILS
--------------------------------------------------------------------------------
* Director Name : Austin Mpapane
  ID Number     : 970514XXXX085
  Status        : Active
  Appointment   : 14/09/2021

================================================================================`;
}

function generateGenericTemplate(name: string, category: string, size: string) {
  const dateStr = new Date().toLocaleDateString('en-ZA');
  return `================================================================================
                           SATENDERAI COMPLIANCE PLATFORM
                                 DOCUMENT ARCHIVE
================================================================================
Document Name : ${name}
Category      : ${category.toUpperCase()}
Est. File Size: ${size}
Archive Date  : ${dateStr}

--------------------------------------------------------------------------------
DOCUMENT RECOVERY DETAIL
--------------------------------------------------------------------------------
This text file simulates the binary stream download of "${name}". 
In your live environment, this action serves the verified original PDF or Word DOCX
source securely retrieved from our encrypted SAtenderAI cloud vaults.

Verification Status: Active & Secured
Digitally Sealed   : Yes

================================================================================`;
}
