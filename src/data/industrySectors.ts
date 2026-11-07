export interface IndustrySectorInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  typicalAccreditation: string;
  keyBuyers: string[];
}

export const SOUTH_AFRICAN_SECTORS: IndustrySectorInfo[] = [
  {
    id: 'civil-engineering',
    name: 'Civil Engineering & Roads',
    code: 'CE',
    description: 'Road surfacing, bridges, earthworks, stormwater reticulation, and municipal civil infrastructure.',
    typicalAccreditation: 'CIDB CE (Civil Engineering)',
    keyBuyers: ['SANRAL', 'Gauteng DID', 'City of Johannesburg', 'eThekwini Municipality']
  },
  {
    id: 'general-building',
    name: 'General Building & Construction',
    code: 'GB',
    description: 'Commercial buildings, schools, community halls, housing developments, and civic facilities.',
    typicalAccreditation: 'CIDB GB (General Building)',
    keyBuyers: ['Dept of Public Works', 'Provincial Infrastructure', 'Housing Development Agency']
  },
  {
    id: 'ict-software',
    name: 'ICT, Software & Telecommunications',
    code: 'ICT',
    description: 'Cloud infrastructure, enterprise software development, cybersecurity, networking, and IT hardware.',
    typicalAccreditation: 'SITA GovTech Accreditation, ISO 27001',
    keyBuyers: ['SITA', 'SARS', 'Department of Home Affairs', 'Eskom IT']
  },
  {
    id: 'security-guarding',
    name: 'Security, Armed Guarding & Access Control',
    code: 'SEC',
    description: 'Physical guarding, armed tactical reaction, CCTV surveillance, electric fencing, and NKP clearance.',
    typicalAccreditation: 'PSIRA Business Registration & Firearms Control Act',
    keyBuyers: ['Eskom', 'PRASA', 'Transnet', 'Municipal Metro Police Departments']
  },
  {
    id: 'facilities-management',
    name: 'Facilities Management & Maintenance',
    code: 'FAC',
    description: 'Commercial HVAC, commercial cleaning, pest control, lift maintenance, and groundskeeping.',
    typicalAccreditation: 'SAFMA Accredited / DoL Compliance',
    keyBuyers: ['City of Ekurhuleni', 'Airports Company SA (ACSA)', 'Parliament of SA']
  },
  {
    id: 'electrical-energy',
    name: 'Electrical & Energy Generation',
    code: 'EP/EB',
    description: 'Substations, high-voltage reticulation, solar PV microgrids, and diesel backup generation.',
    typicalAccreditation: 'CIDB EP / EB & Department of Labour Wireman\'s License',
    keyBuyers: ['Eskom Distribution', 'City Power Johannesburg', 'Nelson Mandela Bay']
  },
  {
    id: 'water-sanitation',
    name: 'Water, Sanitation & Reticulation',
    code: 'ME/CE',
    description: 'Bulk water pipelines, wastewater treatment works (WWTW), pump stations, and reservoir construction.',
    typicalAccreditation: 'CIDB ME / CE & DWS Blue/Green Drop Compliance',
    keyBuyers: ['Rand Water', 'Umgeni Water', 'Dept of Water & Sanitation', 'Magalies Water']
  },
  {
    id: 'health-medical',
    name: 'Health, Medical Supplies & PPE',
    code: 'MED',
    description: 'Hospital equipment, medical consumables, pharmaceuticals, PPE, and emergency clinical apparatus.',
    typicalAccreditation: 'SAHPRA Licensed Medical Device Supplier',
    keyBuyers: ['Gauteng Dept of Health', 'National Health Laboratory Service (NHLS)', 'SAMRC']
  },
  {
    id: 'logistics-transport',
    name: 'Logistics, Fleet & Freight Transport',
    code: 'LOG',
    description: 'Long-haul freight, vehicle leasing, municipal waste haulage, passenger buses, and specialized plant hire.',
    typicalAccreditation: 'Cross-Border Road Transport Agency (C-BRTA) / RTMS',
    keyBuyers: ['Transnet Freight Rail', 'PRASA', 'City of Tshwane (A Re Yeng)', 'Golden Arrow']
  },
  {
    id: 'professional-consulting',
    name: 'Professional Consulting, Legal & Auditing',
    code: 'PROF',
    description: 'Quantity surveying, architectural design, legal advisory, forensic auditing, and environmental impact assessments.',
    typicalAccreditation: 'ECSA / SACQSP / SAICA / LPC Registration',
    keyBuyers: ['National Treasury', 'Auditor-General SA', 'Development Bank of Southern Africa']
  },
  {
    id: 'agriculture-agroprocessing',
    name: 'Agriculture, Agro-Processing & Food Supply',
    code: 'AGRI',
    description: 'National school nutrition programs (NSNP), agricultural inputs, irrigation machinery, and bulk food provisions.',
    typicalAccreditation: 'DAFF GAP Certification, HACCP Food Safety',
    keyBuyers: ['DALRRD', 'Provincial Depts of Education (NSNP)', 'Agricultural Research Council']
  },
  {
    id: 'waste-environment',
    name: 'Waste Management & Environmental Services',
    code: 'ENV',
    description: 'Landfill operations, refuse collection, hazardous waste disposal, recycling, and environmental rehabilitation.',
    typicalAccreditation: 'IWMSA & Department of Forestry, Fisheries & the Environment (DFFE)',
    keyBuyers: ['Pikitup Johannesburg', 'City of Cape Town Solid Waste', 'Mangaung Metro']
  }
];

export const SECTOR_NAMES = [
  'All',
  ...SOUTH_AFRICAN_SECTORS.map(s => s.name)
];
