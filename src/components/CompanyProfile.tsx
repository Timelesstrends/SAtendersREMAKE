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
  Check
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { SOUTH_AFRICAN_SECTORS } from '../data/industrySectors';

interface CompanyProfileProps {
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => void;
}

export default function CompanyProfileView({ profile, onUpdateProfile }: CompanyProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [legalName, setLegalName] = useState(profile.legalName);
  const [tradingName, setTradingName] = useState(profile.tradingName);
  const [regNumber, setRegNumber] = useState(profile.registrationNumber);
  const [bbeeLevel, setBbeeLevel] = useState(profile.bbeeLevel);
  const [cidbGrading, setCidbGrading] = useState(profile.cidbGrading);
  const [csdNumber, setCsdNumber] = useState(profile.csdNumber);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(() => {
    if (profile.industries && profile.industries.length > 0) return profile.industries;
    // Derive from legacy string or default
    return [
      'Civil Engineering & Roads',
      'General Building & Construction',
      'Security, Armed Guarding & Access Control',
      'Facilities Management & Maintenance'
    ];
  });
  const [verifyingSARS, setVerifyingSARS] = useState(false);

  const toggleIndustry = (industryName: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industryName)
        ? prev.filter(i => i !== industryName)
        : [...prev, industryName]
    );
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
      registrationNumber: regNumber,
      bbeeLevel: Number(bbeeLevel),
      cidbGrading,
      csdNumber,
      industries: selectedIndustries,
      industry: selectedIndustries.join(', ')
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
            <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Verified Key Personnel
            </h3>

            <div className="space-y-3">
              {profile.employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.role}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{emp.yearsExperience} yrs</span>
                </div>
              ))}
            </div>
          </div>

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
