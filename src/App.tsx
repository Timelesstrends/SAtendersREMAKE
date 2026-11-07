import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Compass, 
  FileText, 
  CheckCircle, 
  Building, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon,
  Sparkles,
  Clock,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X,
  Receipt
} from 'lucide-react';

import { initialCompanyProfile, initialTenders, initialCommercialDocuments } from './data/mockData';
import { CompanyProfile, TenderOpportunity, CompanyDocument, CommercialDocument } from './types';

// Page components
import Dashboard from './components/Dashboard';
import Opportunities from './components/Opportunities';
import TenderWorkspace from './components/TenderWorkspace';
import CompanyProfileView from './components/CompanyProfile';
import Documents from './components/Documents';
import StirlingPdfWorkspace from './components/StirlingPdfWorkspace';
import BillingWorkspace from './components/BillingWorkspace';
import Analytics from './components/Analytics';
import Calendar from './components/Calendar';
import Settings from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeTenderId, setActiveTenderId] = useState<string | null>(null);
  
  // App state with local persistence hydration
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('satenderai_company_profile');
      return saved ? JSON.parse(saved) : initialCompanyProfile;
    } catch {
      return initialCompanyProfile;
    }
  });

  const [tenders, setTenders] = useState<TenderOpportunity[]>(() => {
    try {
      const saved = localStorage.getItem('satenderai_tenders');
      return saved ? JSON.parse(saved) : initialTenders;
    } catch {
      return initialTenders;
    }
  });

  const [commercialDocs, setCommercialDocs] = useState<CommercialDocument[]>(() => {
    try {
      const saved = localStorage.getItem('satenderai_commercial_docs');
      return saved ? JSON.parse(saved) : initialCommercialDocuments;
    } catch {
      return initialCommercialDocuments;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('satenderai_company_profile', JSON.stringify(companyProfile));
    } catch (e) {
      console.warn('Failed to persist company profile', e);
    }
  }, [companyProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('satenderai_tenders', JSON.stringify(tenders));
    } catch (e) {
      console.warn('Failed to persist tenders', e);
    }
  }, [tenders]);

  useEffect(() => {
    try {
      localStorage.setItem('satenderai_commercial_docs', JSON.stringify(commercialDocs));
    } catch (e) {
      console.warn('Failed to persist commercial docs', e);
    }
  }, [commercialDocs]);

  // Time state for top utility bar
  const [timeStr, setTimeStr] = useState<string>('');

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mutators
  const handleUpdateProfile = (updated: CompanyProfile) => {
    setCompanyProfile(updated);
  };

  const handleAddTender = (id: string) => {
    setTenders(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'IN_PREPARATION' as const,
          readinessScore: 82
        };
      }
      return t;
    }));
    setActiveTenderId(id);
    setActiveTab('tenders');
  };

  const handleUpdateTender = (updated: TenderOpportunity) => {
    setTenders(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleUploadDocument = (doc: CompanyDocument) => {
    setCompanyProfile(prev => ({
      ...prev,
      documents: [doc, ...prev.documents]
    }));
  };

  const handleDeleteDocument = (id: string) => {
    setCompanyProfile(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id)
    }));
  };

  const handleAddCommercialDoc = (doc: CommercialDocument) => {
    setCommercialDocs(prev => [doc, ...prev]);
  };

  const handleUpdateCommercialDoc = (doc: CommercialDocument) => {
    setCommercialDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
  };

  const handleDeleteCommercialDoc = (id: string) => {
    setCommercialDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleSyncLiveTenders = (liveTenders: TenderOpportunity[], replaceDiscovered = false) => {
    setTenders(prev => {
      if (replaceDiscovered) {
        // Keep active pursued tenders (anything not DISCOVERED) and populate with verified live tenders
        const activePursued = prev.filter(t => t.status !== 'DISCOVERED');
        const activeIds = new Set(activePursued.map(t => t.id));
        const filteredLive = liveTenders.filter(t => !activeIds.has(t.id));
        const nextList = [...activePursued, ...filteredLive];
        try {
          localStorage.setItem('satenderai_tenders', JSON.stringify(nextList));
        } catch (e) {
          console.warn('Storage failed', e);
        }
        return nextList;
      }

      // Upsert: update matching existing tenders with fresh dates/data, and append new ones
      const incomingMap = new Map(liveTenders.map(t => [t.id, t]));
      const updatedPrev = prev.map(t => {
        if (incomingMap.has(t.id)) {
          const freshItem = incomingMap.get(t.id)!;
          incomingMap.delete(t.id);
          return {
            ...freshItem,
            status: t.status, // preserve user workflow status
            readinessScore: t.status !== 'DISCOVERED' ? t.readinessScore : freshItem.readinessScore
          };
        }
        return t;
      });

      // Filter out stale mock discovered items (tender-3, tender-4) when real live ones exist
      const cleaned = updatedPrev.filter(t => {
        if ((t.id === 'tender-3' || t.id === 'tender-4') && t.status === 'DISCOVERED') {
          return false;
        }
        return true;
      });

      const freshNew = Array.from(incomingMap.values());
      const nextList = [...freshNew, ...cleaned];
      try {
        localStorage.setItem('satenderai_tenders', JSON.stringify(nextList));
      } catch (e) {
        console.warn('Storage failed', e);
      }
      return nextList;
    });
  };

  const handleNavigate = (tab: string, tenderId?: string) => {
    setActiveTab(tab);
    if (tenderId) {
      setActiveTenderId(tenderId);
    } else if (tab !== 'tenders') {
      setActiveTenderId(null);
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'opportunities', label: 'Tender Discovery', icon: Compass },
    { id: 'tenders', label: 'My Tenders', icon: CheckCircle },
    { id: 'billing', label: 'Invoicing & Quotes', icon: Receipt },
    { id: 'pdf-tools', label: 'Stirling PDF Tools', icon: Sparkles, badge: 'New' },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'compliance', label: 'Compliance Checks', icon: CheckCircle },
    { id: 'company', label: 'Company Profile', icon: Building },
    { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'calendar', label: 'Tender Calendar', icon: CalendarIcon },
    { id: 'settings', label: 'Workspace Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased font-sans overflow-hidden" id="app-root">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-950 text-slate-200 border-r border-slate-900" id="sidebar-desktop">
        <div className="flex flex-col py-6 space-y-8 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6" id="logo-container">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight tracking-wider">SAtenderAI</span>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-0.5">Bid Operating Sys</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-3" id="nav-links-desktop">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleNavigate(link.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-amber-400 font-bold shadow-md shadow-amber-500/5' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.id === 'tenders' && (
                    <span className="bg-slate-900 text-amber-400 font-bold text-[10px] px-2 py-0.5 rounded-md">
                      {tenders.filter(t => t.status !== 'DISCOVERED').length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-900 flex items-center justify-between bg-slate-950" id="user-card-desktop">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400 border border-slate-700">
              AM
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-100">Austin Mpapane</p>
              <p className="text-[9px] text-slate-500 font-semibold truncate max-w-[120px]">austinmpapane97@gmail.com</p>
            </div>
          </div>
          <button className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main View Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="main-wrapper">
        
        {/* Top Utility Bar */}
        <header className="bg-white border-b border-slate-150 h-16 flex items-center justify-between px-6 z-30" id="top-utility-bar">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-2" id="time-display">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{timeStr || 'Loading...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Top Stats Warning Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-800" id="top-expiry-warning">
              <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span>B-BBEE Affidavits expire in 21 days</span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-50 lg:hidden"
              />
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-slate-950 z-50 flex flex-col justify-between py-6"
              >
                <div className="space-y-8 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="font-extrabold text-white text-base">SAtenderAI</span>
                    </div>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1 px-3">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = activeTab === link.id;

                      return (
                        <button
                          key={link.id}
                          onClick={() => handleNavigate(link.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                            isActive 
                              ? 'bg-slate-900 text-amber-400 font-bold' 
                              : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span>{link.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Dynamic View Display Container */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8" id="view-display-container">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  companyProfile={companyProfile}
                  tenders={tenders}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'opportunities' && (
                <Opportunities 
                  tenders={tenders}
                  companyProfile={companyProfile}
                  onAddTender={handleAddTender}
                  onNavigate={handleNavigate}
                  onSyncLiveTenders={handleSyncLiveTenders}
                />
              )}

              {activeTab === 'billing' && (
                <BillingWorkspace 
                  companyProfile={companyProfile}
                  tenders={tenders}
                  documents={commercialDocs}
                  onAddDocument={handleAddCommercialDoc}
                  onUpdateDocument={handleUpdateCommercialDoc}
                  onDeleteDocument={handleDeleteCommercialDoc}
                />
              )}

              {activeTab === 'pdf-tools' && (
                <StirlingPdfWorkspace 
                  documents={companyProfile.documents}
                  onUploadDocument={handleUploadDocument}
                />
              )}

              {activeTab === 'tenders' && (
                <>
                  {activeTenderId ? (
                    <TenderWorkspace 
                      tenderId={activeTenderId}
                      companyProfile={companyProfile}
                      tenders={tenders}
                      onBack={() => setActiveTenderId(null)}
                      onUpdateTender={handleUpdateTender}
                      onNavigate={handleNavigate}
                      onUploadDocument={handleUploadDocument}
                      onUpdateProfile={handleUpdateProfile}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">My Active Tender Workspaces</h1>
                        <p className="text-xs text-slate-500">Pursued public and private sector tenders currently in draft, review or audit phases</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tenders.filter(t => t.status !== 'DISCOVERED').map(t => (
                          <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all">
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                                {t.status.replace(/_/g, ' ')}
                              </span>
                              <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{t.title}</h3>
                              <p className="text-xs text-slate-500">{t.buyer}</p>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 text-xs font-semibold">
                              <span className="text-slate-500 font-medium">Readiness: <strong className="text-slate-900 font-bold">{t.readinessScore}%</strong></span>
                              <button onClick={() => setActiveTenderId(t.id)} className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold">Open Workspace</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'documents' && (
                <Documents 
                  documents={companyProfile.documents}
                  onUploadDocument={handleUploadDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === 'compliance' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Compliance Audits</h1>
                    <p className="text-xs text-slate-500">Choose one of your active tender workspaces to perform a thorough statutory pre-submission compliance audit</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tenders.filter(t => t.status !== 'DISCOVERED').map(t => (
                      <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-slate-900 text-sm leading-snug">{t.title}</h3>
                          <p className="text-xs text-slate-500">{t.buyer}</p>
                        </div>
                        <button 
                          onClick={() => handleNavigate('tenders', t.id)}
                          className="w-full mt-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all"
                        >
                          Run Compliance Checker
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <CompanyProfileView 
                  profile={companyProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'analytics' && <Analytics />}

              {activeTab === 'calendar' && <Calendar />}

              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
