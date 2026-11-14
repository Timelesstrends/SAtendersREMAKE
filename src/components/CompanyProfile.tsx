import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  MapPin, 
  FileCheck, 
  Award, 
  Users, 
  Truck, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Check,
  X,
  ShieldCheck,
  BadgeCheck,
  FileText
} from 'lucide-react';
import { CompanyProfile, Employee, StatutoryAccreditation } from '../types';
import { SOUTH_AFRICAN_SECTORS } from '../data/industrySectors';

interface CompanyProfileProps {
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => void;
}

export default function CompanyProfileView({ profile, onUpdateProfile }: CompanyProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [legalName, setLegalName] = useState(profile.legalName);
  const [tradingName, setTradingName] = useState(profile.tradingName);
  const [slogan, setSlogan] = useState(profile.slogan || 'Precision Bidding, Civil Construction & Infrastructure Compliance');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [companyEmail, setCompanyEmail] = useState(profile.companyEmail || 'bids@satenderai.co.za');
  const [companyPhone, setCompanyPhone] = useState(profile.companyPhone || '+27 (0)11 802 4490');
  const [physicalAddress, setPhysicalAddress] = useState(profile.physicalAddress || 'Level 4, Katherine & West Building, 114 West Street, Sandton, 2196');
  const [regNumber, setRegNumber] = useState(profile.registrationNumber);
  const [bbeeLevel, setBbeeLevel] = useState(profile.bbeeLevel);
  const [cidbGrading, setCidbGrading] = useState(profile.cidbGrading);
  const [csdNumber, setCsdNumber] = useState(profile.csdNumber);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(() => {
    if (profile.industries && profile.industries.length > 0) return profile.industries;
    return [
      'Civil Engineering & Roads',
      'General Building & Construction',
      'Security, Armed Guarding & Access Control',
      'Facilities Management & Maintenance'
    ];
  });
  const [verifyingSARS, setVerifyingSARS] = useState(false);

  // Statutory Accreditations for any South African SME sector
  const [accreditations, setAccreditations] = useState<StatutoryAccreditation[]>(() => {
    if (profile.statutoryAccreditations && profile.statutoryAccreditations.length > 0) {
      return profile.statutoryAccreditations;
    }
    return [
      {
        id: 'acc-1',
        council: 'CIDB',
        councilFullName: 'Construction Industry Development Board',
        regNumber: '1019284',
        categoryOrGrading: profile.cidbGrading || 'Level 7GB PE / 6CE',
        expiryDate: '2027-04-30',
        verified: true
      },
      {
        id: 'acc-2',
        council: 'PSIRA',
        councilFullName: 'Private Security Industry Regulatory Authority',
        regNumber: '2910842',
        categoryOrGrading: 'Grade A Corporate Armed Security',
        expiryDate: '2027-01-15',
        verified: true
      },
      {
        id: 'acc-3',
        council: 'SITA',
        councilFullName: 'State Information Technology Agency (GovTech)',
        regNumber: 'SITA-ACC-2024-81',
        categoryOrGrading: 'Transversal ICT & Software Supplier',
        expiryDate: '2026-12-31',
        verified: true
      },
      {
        id: 'acc-4',
        council: 'NCCA',
        councilFullName: 'National Contract Cleaners Association',
        regNumber: 'NCCA-GP-4819',
        categoryOrGrading: 'Commercial & Healthcare Facility Hygiene',
        expiryDate: '2026-11-30',
        verified: true
      },
      {
        id: 'acc-5',
        council: 'DoH Reg R638 (CoA)',
        councilFullName: 'Municipal Certificate of Acceptability for Food Premises (Reg R638)',
        regNumber: 'COA-JHB-7821',
        categoryOrGrading: 'Bulk Commercial Catering & NSNP Food Supply',
        expiryDate: '2027-03-31',
        verified: true
      },
      {
        id: 'acc-6',
        council: 'SAHPRA',
        councilFullName: 'South African Health Products Regulatory Authority',
        regNumber: 'MD-2023-918',
        categoryOrGrading: 'Medical Device & PPE Establishment License',
        expiryDate: '2027-06-30',
        verified: true
      },
      {
        id: 'acc-7',
        council: 'RTMS',
        councilFullName: 'Road Transport Management System',
        regNumber: 'RTMS-ZA-3819',
        categoryOrGrading: 'Heavy Freight Haulage & Fleet Compliance',
        expiryDate: '2027-05-15',
        verified: true
      },
      {
        id: 'acc-8',
        council: 'ECSA / SACQSP',
        councilFullName: 'Engineering Council & Council for Quantity Surveyors',
        regNumber: 'Pr.Eng 20170491 / Pr.QS 5892',
        categoryOrGrading: 'Professional Consulting Practice',
        expiryDate: '2027-08-31',
        verified: true
      }
    ];
  });

  // Add Accreditation Modal state
  const [showAddAccredModal, setShowAddAccredModal] = useState(false);
  const [selectedCouncilPreset, setSelectedCouncilPreset] = useState('PSIRA');
  const [customCouncilName, setCustomCouncilName] = useState('');
  const [customCouncilFullName, setCustomCouncilFullName] = useState('');
  const [newAccredRegNum, setNewAccredRegNum] = useState('');
  const [newAccredCategory, setNewAccredCategory] = useState('Grade A Corporate Armed Security');
  const [newAccredExpiry, setNewAccredExpiry] = useState('2027-12-31');

  // New Employee Modal state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpAccess, setNewEmpAccess] = useState<'ADMIN' | 'BID_MANAGER' | 'ESTIMATOR' | 'COMPLIANCE' | 'VIEWER'>('BID_MANAGER');
  const [newEmpExp, setNewEmpExp] = useState('5');
  const [newEmpQual, setNewEmpQual] = useState('B.Tech / Pr.Cert');

  const SOUTH_AFRICAN_REGULATORY_COUNCILS = [
    { council: 'PSIRA', fullName: 'Private Security Industry Regulatory Authority', defaultCategory: 'Grade A Corporate Armed Security' },
    { council: 'SITA', fullName: 'State Information Technology Agency (GovTech)', defaultCategory: 'Transversal ICT & Software Supplier' },
    { council: 'NCCA', fullName: 'National Contract Cleaners Association', defaultCategory: 'Commercial & Healthcare Facility Hygiene' },
    { council: 'DoH Reg R638 (CoA)', fullName: 'Municipal Certificate of Acceptability for Food Premises (Reg R638)', defaultCategory: 'Bulk Commercial Catering & NSNP Food Supply' },
    { council: 'SAHPRA', fullName: 'South African Health Products Regulatory Authority', defaultCategory: 'Medical Device & PPE Establishment License' },
    { council: 'RTMS', fullName: 'Road Transport Management System', defaultCategory: 'Heavy Freight Haulage & Fleet Compliance' },
    { council: 'CIDB', fullName: 'Construction Industry Development Board', defaultCategory: 'Level 7GB PE / 6CE' },
    { council: 'NHBRC', fullName: 'National Home Builders Registration Council', defaultCategory: 'Registered Home Builder' },
    { council: 'ECSA / SACQSP', fullName: 'Engineering Council & Council for Quantity Surveyors', defaultCategory: 'Professional Built Environment Practice' },
    { council: 'SAICA / IRBA', fullName: 'SA Institute of Chartered Accountants & IRBA', defaultCategory: 'Chartered Auditing & Financial Practice' },
    { council: 'LPC', fullName: 'Legal Practice Council', defaultCategory: 'Admitted Legal Practice & Litigation' },
    { council: 'Other / Custom', fullName: 'Custom South African Industry Regulator', defaultCategory: 'Statutory Industry License' }
  ];

  const handleCouncilPresetChange = (council: string) => {
    setSelectedCouncilPreset(council);
    const found = SOUTH_AFRICAN_REGULATORY_COUNCILS.find(c => c.council === council);
    if (found && council !== 'Other / Custom') {
      setNewAccredCategory(found.defaultCategory);
    }
  };

  const handleAddAccreditation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccredRegNum.trim()) return;

    const councilName = selectedCouncilPreset === 'Other / Custom' 
      ? (customCouncilName.trim() || 'REGULATOR') 
      : selectedCouncilPreset;
    
    const councilFull = selectedCouncilPreset === 'Other / Custom'
      ? (customCouncilFullName.trim() || 'South African Statutory Regulator')
      : (SOUTH_AFRICAN_REGULATORY_COUNCILS.find(c => c.council === selectedCouncilPreset)?.fullName || councilName);

    const newAccred: StatutoryAccreditation = {
      id: `acc-${Date.now()}`,
      council: councilName,
      councilFullName: councilFull,
      regNumber: newAccredRegNum.trim(),
      categoryOrGrading: newAccredCategory.trim() || 'Compliant Registered Provider',
      expiryDate: newAccredExpiry || '2027-12-31',
      verified: true
    };

    const updated = [newAccred, ...accreditations];
    setAccreditations(updated);
    onUpdateProfile({
      ...profile,
      statutoryAccreditations: updated
    });

    setShowAddAccredModal(false);
    setNewAccredRegNum('');
    setCustomCouncilName('');
    setCustomCouncilFullName('');
  };

  const handleRemoveAccreditation = (id: string) => {
    const updated = accreditations.filter(a => a.id !== id);
    setAccreditations(updated);
    onUpdateProfile({
      ...profile,
      statutoryAccreditations: updated
    });
  };

  const handleToggleAccredVerification = (id: string) => {
    const updated = accreditations.map(a => a.id === id ? { ...a, verified: !a.verified } : a);
    setAccreditations(updated);
    onUpdateProfile({
      ...profile,
      statutoryAccreditations: updated
    });
  };

  const toggleIndustry = (industryName: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industryName)
        ? prev.filter(i => i !== industryName)
        : [...prev, industryName]
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      role: newEmpRole.trim() || 'Bid Coordinator & Specialist',
      email: newEmpEmail.trim() || `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@${(tradingName || legalName).toLowerCase().replace(/[^a-z]/g, '')}.co.za`,
      accessLevel: newEmpAccess,
      yearsExperience: Number(newEmpExp) || 3,
      qualifications: [newEmpQual.trim() || 'Procurement Specialist'],
      hasCV: true
    };

    onUpdateProfile({
      ...profile,
      employees: [newEmp, ...profile.employees]
    });

    setShowAddEmployeeModal(false);
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpEmail('');
  };

  const handleVerifySARS = () => {
    setVerifyingSARS(true);
    setTimeout(() => {
      onUpdateProfile({
        ...profile,
        sarsTaxStatus: 'Compliant'
      });
      setVerifyingSARS(false);
    }, 2000);
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      legalName,
      tradingName,
      slogan,
      logoUrl,
      companyEmail,
      companyPhone,
      physicalAddress,
      registrationNumber: regNumber,
      bbeeLevel: Number(bbeeLevel),
      cidbGrading,
      csdNumber,
      industries: selectedIndustries,
      industry: selectedIndustries.join(', '),
      statutoryAccreditations: accreditations
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6" id="company-profile-container">
      {/* Profile Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="profile-header-card">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Company Intelligence Profile</h1>
          <p className="text-xs text-slate-500">The authoritative database SAtenderAI uses to customize compliance bids and technical proposals</p>
        </div>

        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm ${
            isEditing 
              ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-600' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isEditing ? 'Save Profile' : 'Edit Fields'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Columns & Compliance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Corporate Branding & Visual Identity Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5" id="corporate-branding-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Corporate Branding & Document Letterhead</h3>
                  <p className="text-[11px] text-slate-500">Customizes titles, logo marks, watermarks, quotes, and bid proposals across the app</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-xl shadow-md">
                    {(tradingName || legalName).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-bold text-slate-900">Custom Company Emblem / Logo</p>
                <p className="text-[11px] text-slate-500">
                  Used on sidebar header, generated SBD bid documentation, JBCC joint-venture covers, and officially stamped PDF submission packages.
                </p>
                {isEditing && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors">
                      Upload Logo (PNG/JPG)
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-semibold"
                      >
                        Reset to Emblem
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-slate-500">Company Slogan / Credo</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={slogan} 
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="e.g. Precision Civil Construction & Infrastructure Delivery"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800 font-medium"
                  />
                ) : (
                  <p className="font-medium text-slate-800 p-2.5 bg-slate-50 rounded-lg italic">"{slogan}"</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Official Tender Email</label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={companyEmail} 
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{companyEmail}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Contact Telephone</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={companyPhone} 
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{companyPhone}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-slate-500">Physical Registered Headquarters (Letterhead)</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={physicalAddress} 
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{physicalAddress}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              Corporate Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Legal Registered Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={legalName} 
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{profile.legalName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Trading Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={tradingName} 
                    onChange={(e) => setTradingName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{profile.tradingName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">CIPC Registration Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={regNumber} 
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{profile.registrationNumber}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">National CSD Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={csdNumber} 
                    onChange={(e) => setCsdNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                ) : (
                  <p className="font-semibold text-slate-900 p-2.5 bg-slate-50 rounded-lg">{profile.csdNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* South African Operating Industries & Sector Capabilities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="company-industries-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  South African Procurement Operating Industries ({selectedIndustries.length} Selected)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select all registered sectors your company tenders for across National Treasury, CIDB, and SOEs
                </p>
              </div>
              {isEditing && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  Click sectors to toggle
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOUTH_AFRICAN_SECTORS.map((sec) => {
                const isSelected = selectedIndustries.includes(sec.name);

                return (
                  <div
                    key={sec.id}
                    onClick={() => isEditing && toggleIndustry(sec.name)}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-300/80 shadow-xs'
                        : 'bg-slate-50/60 border-slate-100 opacity-60'
                    } ${isEditing ? 'cursor-pointer hover:border-amber-400 hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 font-mono">
                            {sec.code}
                          </span>
                          <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                            {sec.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">{sec.description}</p>
                        <p className="text-[9px] text-slate-400 font-mono">Accreditation: {sec.typicalAccreditation}</p>
                      </div>

                      <div className="flex-shrink-0 pt-0.5">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Industry Statutory Accreditations & Professional Regulators (Universal for Any SA Industry) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="statutory-accreditations-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Industry Statutory Accreditations & Regulators ({accreditations.length})
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    Universal SA Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Authoritative council registrations recognized by South African organs of state (PSIRA, SITA, NCCA, SAHPRA, CoA R638, RTMS, ECSA, CIDB)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAccredModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Accreditation
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accreditations.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[11px] px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono tracking-wide">
                        {acc.council}
                      </span>
                      {acc.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleAccredVerification(acc.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
                        title="Toggle verification status"
                      >
                        {acc.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccreditation(acc.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Delete accreditation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">{acc.councilFullName}</p>
                    <p className="text-[11px] font-mono text-slate-700 font-semibold mt-0.5">
                      Reg / License No: <span className="text-slate-900">{acc.regNumber}</span>
                    </p>
                    {acc.categoryOrGrading && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Category / Grading: <span className="font-medium text-slate-700">{acc.categoryOrGrading}</span>
                      </p>
                    )}
                  </div>

                  {acc.expiryDate && (
                    <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Valid until:</span>
                      <span className="font-mono text-slate-600 font-semibold">{acc.expiryDate}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Past Project Experience List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-500" />
                Comparable Project Experience
              </h3>
            </div>

            <div className="space-y-4" id="experience-list">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-semibold text-slate-950 text-xs">{exp.projectTitle}</h4>
                    <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">R{(exp.value/1000000).toFixed(1)}M</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Client: <strong className="font-semibold text-slate-700">{exp.client}</strong> • Duration: {exp.durationMonths} months</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{exp.scope}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-teal-600 font-semibold bg-white p-2 rounded-lg border border-slate-100">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Evidence verified: {exp.completionEvidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Information: Compliance Gates, Employees & Machinery */}
        <div className="space-y-6">
          {/* Statutory Verification Status Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-500" />
              Statutory Compliance Gates
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500">SARS Tax Compliance</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                    profile.sarsTaxStatus === 'Compliant' 
                      ? 'bg-teal-50 text-teal-700' 
                      : profile.sarsTaxStatus === 'Pending' 
                      ? 'bg-amber-50 text-amber-700 animate-pulse' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {profile.sarsTaxStatus}
                  </span>
                  {profile.sarsTaxStatus === 'Pending' && (
                    <button 
                      onClick={handleVerifySARS}
                      disabled={verifyingSARS}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {verifyingSARS ? (
                        <>
                          <span className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></span>
                          Checking...
                        </>
                      ) : (
                        'Verify PIN'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500">B-BBEE Status</span>
                {isEditing ? (
                  <select 
                    value={bbeeLevel} 
                    onChange={(e) => setBbeeLevel(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md font-bold text-[10px]">Level {profile.bbeeLevel}</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500">CIDB Grading</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={cidbGrading} 
                    onChange={(e) => setCidbGrading(e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none text-right"
                  />
                ) : (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px]">{profile.cidbGrading}</span>
                )}
              </div>
            </div>
          </div>

          {/* Key personnel counts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Team & Key Personnel ({profile.employees.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3 text-amber-600" />
                Add Employee
              </button>
            </div>

            <div className="space-y-3">
              {profile.employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {emp.name}
                      {emp.accessLevel && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                          {emp.accessLevel}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">{emp.role}</p>
                    {emp.email && <p className="text-[9px] text-slate-500 font-mono">{emp.email}</p>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{emp.yearsExperience} yrs</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Employee Modal */}
          {showAddEmployeeModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Add Team Employee to Platform</h3>
                      <p className="text-[11px] text-slate-500">Provide platform access for bid preparation and sign-offs</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="e.g. Sipho Khumalo"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Work Email</label>
                    <input 
                      type="email" 
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      placeholder="sipho.khumalo@company.co.za"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Platform Role</label>
                      <select 
                        value={newEmpAccess}
                        onChange={(e) => setNewEmpAccess(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-semibold"
                      >
                        <option value="BID_MANAGER">Bid Manager</option>
                        <option value="ESTIMATOR">Estimator / QS</option>
                        <option value="COMPLIANCE">Compliance Auditor</option>
                        <option value="ADMIN">Director / Admin</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Experience (Yrs)</label>
                      <input 
                        type="number" 
                        value={newEmpExp}
                        onChange={(e) => setNewEmpExp(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Job Title / Designation</label>
                    <input 
                      type="text" 
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      placeholder="e.g. Chief Quantity Surveyor (Pr.QS)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEmployeeModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Save Employee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Statutory Accreditation Modal */}
          {showAddAccredModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Add Statutory Industry Council / License</h3>
                      <p className="text-[11px] text-slate-500">Universal for any South African SME sector (Security, ICT, Cleaning, Catering, etc.)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddAccredModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddAccreditation} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Regulatory Council / Body</label>
                    <select
                      value={selectedCouncilPreset}
                      onChange={(e) => handleCouncilPresetChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-semibold text-slate-900"
                    >
                      {SOUTH_AFRICAN_REGULATORY_COUNCILS.map((c) => (
                        <option key={c.council} value={c.council}>
                          {c.council} - {c.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCouncilPreset === 'Other / Custom' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Council Acronym</label>
                        <input
                          type="text"
                          value={customCouncilName}
                          onChange={(e) => setCustomCouncilName(e.target.value)}
                          placeholder="e.g. SABS or C-BRTA"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Full Council Name</label>
                        <input
                          type="text"
                          value={customCouncilFullName}
                          onChange={(e) => setCustomCouncilFullName(e.target.value)}
                          placeholder="e.g. Cross-Border Road Transport Agency"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Registration / License / Certificate Number</label>
                    <input
                      type="text"
                      value={newAccredRegNum}
                      onChange={(e) => setNewAccredRegNum(e.target.value)}
                      placeholder="e.g. PSIRA-2910842 or MD-2023-918"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono text-slate-900"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Grading, Class or Operating Category</label>
                    <input
                      type="text"
                      value={newAccredCategory}
                      onChange={(e) => setNewAccredCategory(e.target.value)}
                      placeholder="e.g. Grade A Armed Response or Level 7GB PE"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Certificate Expiry Date</label>
                    <input
                      type="date"
                      value={newAccredExpiry}
                      onChange={(e) => setNewAccredExpiry(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAccredModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" /> Save Accreditation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Physical Assets & Machinery */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              Machinery & Physical Assets
            </h3>

            <div className="space-y-3">
              {profile.assets.map((ast) => (
                <div key={ast.id} className="space-y-1 text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">{ast.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold">Qty: {ast.count}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{ast.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
