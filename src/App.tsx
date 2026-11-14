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
  Receipt,
  Users,
  Shield,
  ArrowRightLeft,
  UserPlus,
  FileCheck,
  Cloud,
  Scale,
  CloudOff
} from 'lucide-react';

import { initialCompanyProfile, initialTenders, initialCommercialDocuments } from './data/mockData';
import {
  CompanyProfile,
  TenderOpportunity,
  CompanyDocument,
  CommercialDocument,
  UserSession,
  Employee,
  EmailLogEntry
} from './types';
import {
  listenToAuthChanges,
  bootstrapOrJoinWorkspace,
  subscribeToCompanyWorkspace,
  saveCompanyProfileToCloud,
  upsertTenderToCloud,
  upsertCommercialDocToCloud,
  updateMemberRoleInCloud,
  recordEmailLogInCloud,
  signOutFirebaseCloud,
  CURRENT_TOS_VERSION
} from './lib/firebase';

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
import Settings, { SettingsSubTab } from './components/Settings';
import AuthScreen, { CloudAuthIntent } from './components/AuthScreen';
import LegalComplianceModal from './components/LegalComplianceModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeTenderId, setActiveTenderId] = useState<string | null>(null);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('parameters');

  // Cloud & POPIA compliance states
  const [cloudCompanyId, setCloudCompanyId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isAuthenticatingCloud, setIsAuthenticatingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'tos' | 'popia'>('popia');
  const pendingCloudIntentRef = React.useRef<CloudAuthIntent | null>(null);
  const cloudUnsubRef = React.useRef<(() => void) | null>(null);
  const activeCloudUidRef = React.useRef<string | null>(null);
  
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
      let loaded: TenderOpportunity[] = saved ? JSON.parse(saved) : initialTenders;

      // Date awareness & cache freshness migration
      const now = Date.now();
      let needsRefresh = false;
      const updated = loaded.map(t => {
        const matchingInitial = initialTenders.find(it => it.id === t.id);
        if (matchingInitial && (!t.closingDate || new Date(t.closingDate).getTime() < now)) {
          if (new Date(matchingInitial.closingDate).getTime() > now) {
            needsRefresh = true;
            return {
              ...t,
              closingDate: matchingInitial.closingDate,
              briefingDate: matchingInitial.briefingDate
            };
          }
        }
        return t;
      });

      // Ensure new baseline records (such as verified benchmark tenders) exist
      initialTenders.forEach(it => {
        if (!updated.some(u => u.id === it.id)) {
          updated.push(it);
          needsRefresh = true;
        }
      });

      if (needsRefresh) {
        localStorage.setItem('satenderai_tenders', JSON.stringify(updated));
        return updated;
      }
      return loaded;
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

  // User session state with "Remember Me" persistent logic
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const local = localStorage.getItem('satenderai_session');
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem('satenderai_session');
      if (session) return JSON.parse(session);

      // Default remembered initial session for seamless enterprise demo
      const defaultEmployee = initialCompanyProfile.employees[0] || {
        id: 'emp-1',
        name: 'Austin Mpapane',
        role: 'Managing Director & Lead Bid Specialist',
        email: 'austinmpapane97@gmail.com',
        accessLevel: 'ADMIN'
      };

      const initSession: UserSession = {
        user: {
          id: defaultEmployee.id,
          name: defaultEmployee.name,
          email: defaultEmployee.email || 'austinmpapane97@gmail.com',
          role: defaultEmployee.role,
          accessLevel: (defaultEmployee.accessLevel as any) || 'ADMIN'
        },
        rememberMe: true,
        loginTimestamp: new Date().toISOString()
      };
      localStorage.setItem('satenderai_session', JSON.stringify(initSession));
      return initSession;
    } catch {
      return null;
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

  const latestWorkspaceDefaultsRef = React.useRef({
    companyProfile,
    tenders,
    commercialDocs
  });
  latestWorkspaceDefaultsRef.current = { companyProfile, tenders, commercialDocs };

  // Time state for top utility bar
  const [timeStr, setTimeStr] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' SAST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync email notification preferences & active tenders with backend 07:30 SAST scheduler
  useEffect(() => {
    const prefs = companyProfile.emailNotifications || {
      morningBriefingEnabled: true,
      morningBriefingTimeSast: '07:30',
      closing48hAlertEnabled: true,
      recipientEmails: [
        userSession?.user?.email || companyProfile.companyEmail || 'austinmpapane97@gmail.com'
      ].filter(Boolean),
      preferredProvider: 'postmark' as const
    };
    const activeSubset = tenders.filter((t) => t.status !== 'DISCOVERED').slice(0, 25);
    const timer = setTimeout(() => {
      fetch('/api/email/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: cloudCompanyId || 'local-workspace',
          companyProfile,
          tenders: activeSubset.length > 0 ? activeSubset : tenders.slice(0, 15),
          emailNotifications: prefs
        })
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [cloudCompanyId, companyProfile, tenders, userSession?.user?.email]);

  // Listen to Firebase Google Auth state & hydrate real-time Cloud Firestore Company Binder
  useEffect(() => {
    const unsubAuth = listenToAuthChanges(async (fbUser) => {
      if (!fbUser) {
        if (cloudUnsubRef.current) {
          cloudUnsubRef.current();
          cloudUnsubRef.current = null;
        }
        activeCloudUidRef.current = null;
        setIsCloudConnected(false);
        setCloudCompanyId(null);
        setInviteCode(null);
        return;
      }

      const intent = pendingCloudIntentRef.current;
      // Avoid duplicate bootstrap for same signed-in user unless joining a new invite code
      if (activeCloudUidRef.current === fbUser.uid && !intent?.inviteCode) {
        return;
      }

      setIsAuthenticatingCloud(true);
      setCloudError(null);

      try {
        const defaults = latestWorkspaceDefaultsRef.current;
        const ws = await bootstrapOrJoinWorkspace({
          user: fbUser,
          joinInviteCode: intent?.inviteCode,
          customCompanyName: intent?.companyName,
          requestedRole: intent?.role,
          requestedAccessLevel: intent?.accessLevel,
          popiaAccepted: intent?.popiaAccepted ?? true,
          defaultProfile: defaults.companyProfile,
          defaultTenders: defaults.tenders,
          defaultDocs: defaults.commercialDocs
        });

        pendingCloudIntentRef.current = null;
        activeCloudUidRef.current = fbUser.uid;
        setCloudCompanyId(ws.companyId);
        setInviteCode(ws.inviteCode);
        setIsCloudConnected(true);

        if (ws.companyProfile) {
          setCompanyProfile((prev) => ({
            ...prev,
            ...ws.companyProfile,
            cloudCompanyId: ws.companyId,
            inviteCode: ws.inviteCode
          }));
        } else {
          setCompanyProfile((prev) => ({
            ...prev,
            cloudCompanyId: ws.companyId,
            inviteCode: ws.inviteCode
          }));
        }

        const cloudSession: UserSession = {
          user: {
            id: fbUser.uid,
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Team Specialist',
            email: fbUser.email || 'user@company.co.za',
            role: ws.role,
            accessLevel: ws.accessLevel,
            avatar: fbUser.photoURL || undefined,
            authMode: 'cloud'
          },
          companyId: ws.companyId,
          inviteCode: ws.inviteCode,
          popiaConsent: ws.popiaConsent,
          rememberMe: intent?.rememberMe ?? true,
          loginTimestamp: new Date().toISOString()
        };
        handleLogin(cloudSession);

        if (cloudUnsubRef.current) {
          cloudUnsubRef.current();
        }
        cloudUnsubRef.current = subscribeToCompanyWorkspace(ws.companyId, {
          onCompanyProfile: (cloudProf, code) => {
            setInviteCode(code);
            setCompanyProfile((prev) => ({
              ...prev,
              ...cloudProf,
              cloudCompanyId: ws.companyId,
              inviteCode: code,
              employees: prev.employees
            }));
          },
          onMembers: (members) => {
            if (members.length > 0) {
              setCompanyProfile((prev) => ({
                ...prev,
                employees: members
              }));
            }
          },
          onTenders: (cloudTenders) => {
            if (cloudTenders.length === 0) return;
            setTenders((prev) => {
              const cloudMap = new Map(cloudTenders.map((ct) => [ct.id, ct]));
              const remainingLocal = prev.filter((lt) => !cloudMap.has(lt.id));
              return [...cloudTenders, ...remainingLocal];
            });
          },
          onCommercialDocs: (docs) => {
            if (docs.length > 0) {
              setCommercialDocs(docs);
            }
          },
          onEmailLogs: (logs) => {
            setEmailLogs(logs);
          }
        });
      } catch (err: any) {
        console.error('Cloud workspace bootstrap failed:', err);
        setCloudError(err?.message || 'Unable to connect to Cloud Company Binder.');
        pendingCloudIntentRef.current = null;
        await signOutFirebaseCloud();
        handleLogout(true);
      } finally {
        setIsAuthenticatingCloud(false);
      }
    });

    return () => {
      unsubAuth();
      if (cloudUnsubRef.current) {
        cloudUnsubRef.current();
      }
    };
  }, []);

  // Authentication Mutators
  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    if (session.rememberMe) {
      try {
        localStorage.setItem('satenderai_session', JSON.stringify(session));
        sessionStorage.removeItem('satenderai_session');
      } catch (e) {
        console.warn(e);
      }
    } else {
      try {
        sessionStorage.setItem('satenderai_session', JSON.stringify(session));
        localStorage.removeItem('satenderai_session');
      } catch (e) {
        console.warn(e);
      }
    }
    setShowSwitchUserModal(false);
  };

  const handleLogout = (skipFirebaseSignOut = false) => {
    if (!skipFirebaseSignOut && isCloudConnected) {
      signOutFirebaseCloud().catch(() => {});
    }
    if (cloudUnsubRef.current) {
      cloudUnsubRef.current();
      cloudUnsubRef.current = null;
    }
    activeCloudUidRef.current = null;
    setIsCloudConnected(false);
    setCloudCompanyId(null);
    setInviteCode(null);
    setUserSession(null);
    try {
      localStorage.removeItem('satenderai_session');
      sessionStorage.removeItem('satenderai_session');
    } catch (e) {
      console.warn(e);
    }
    setShowSwitchUserModal(false);
  };

  const handleSwitchUser = (emp: Employee) => {
    const session: UserSession = {
      user: {
        id: emp.id,
        name: emp.name,
        email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.co.za`,
        role: emp.role,
        accessLevel: emp.accessLevel || 'BID_MANAGER',
        authMode: 'local'
      },
      popiaConsent: userSession?.popiaConsent || {
        accepted: true,
        tosVersion: CURRENT_TOS_VERSION,
        acceptedAt: new Date().toISOString(),
        acceptedByEmail: emp.email || 'user@company.co.za'
      },
      rememberMe: userSession?.rememberMe ?? true,
      loginTimestamp: new Date().toISOString()
    };
    handleLogin(session);
  };

  // Mutators (sync immediately to Cloud Firestore when connected)
  const handleUpdateProfile = (updated: CompanyProfile) => {
    setCompanyProfile(updated);
    if (isCloudConnected && cloudCompanyId && userSession?.user?.uid) {
      saveCompanyProfileToCloud(
        cloudCompanyId,
        userSession.user.uid,
        inviteCode || '',
        updated,
        userSession.user.accessLevel === 'ADMIN'
      ).catch((err) => console.error('Cloud profile save error:', err));
    }
  };

  const handleAddTender = (id: string) => {
    let pursuedTender: TenderOpportunity | null = null;
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          pursuedTender = {
            ...t,
            status: 'IN_PREPARATION' as const,
            readinessScore: Math.max(t.readinessScore || 0, 84)
          };
          return pursuedTender;
        }
        return t;
      })
    );
    if (pursuedTender && isCloudConnected && cloudCompanyId) {
      upsertTenderToCloud(cloudCompanyId, pursuedTender).catch((err) =>
        console.error('Cloud tender pursue error:', err)
      );
    }
    setActiveTenderId(id);
    setActiveTab('tenders');
  };

  const handleUpdateTender = (updated: TenderOpportunity) => {
    setTenders((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (isCloudConnected && cloudCompanyId) {
      upsertTenderToCloud(cloudCompanyId, updated).catch((err) =>
        console.error('Cloud tender update error:', err)
      );
    }
  };

  const handleUploadDocument = (doc: CompanyDocument) => {
    setCompanyProfile((prev) => {
      const next = {
        ...prev,
        documents: [doc, ...prev.documents]
      };
      if (isCloudConnected && cloudCompanyId && userSession?.user?.uid) {
        saveCompanyProfileToCloud(
          cloudCompanyId,
          userSession.user.uid,
          inviteCode || '',
          next,
          userSession.user.accessLevel === 'ADMIN'
        ).catch((err) => console.error('Cloud doc upload sync error:', err));
      }
      return next;
    });
  };

  const handleDeleteDocument = (id: string) => {
    setCompanyProfile((prev) => {
      const next = {
        ...prev,
        documents: prev.documents.filter((d) => d.id !== id)
      };
      if (isCloudConnected && cloudCompanyId && userSession?.user?.uid) {
        saveCompanyProfileToCloud(
          cloudCompanyId,
          userSession.user.uid,
          inviteCode || '',
          next,
          userSession.user.accessLevel === 'ADMIN'
        ).catch((err) => console.error('Cloud doc delete sync error:', err));
      }
      return next;
    });
  };

  const handleAddCommercialDoc = (doc: CommercialDocument) => {
    setCommercialDocs((prev) => [doc, ...prev]);
    if (isCloudConnected && cloudCompanyId) {
      upsertCommercialDocToCloud(cloudCompanyId, doc).catch((err) =>
        console.error('Cloud commercial doc create error:', err)
      );
    }
  };

  const handleUpdateCommercialDoc = (doc: CommercialDocument) => {
    setCommercialDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    if (isCloudConnected && cloudCompanyId) {
      upsertCommercialDocToCloud(cloudCompanyId, doc).catch((err) =>
        console.error('Cloud commercial doc update error:', err)
      );
    }
  };

  const handleDeleteCommercialDoc = (id: string) => {
    setCommercialDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateMemberRole = async (member: Employee) => {
    setCompanyProfile((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === member.id ? member : e))
    }));
    if (isCloudConnected && cloudCompanyId) {
      await updateMemberRoleInCloud(cloudCompanyId, member);
    }
  };

  const handleRecordEmailLogs = async (
    logs: Array<Omit<EmailLogEntry, 'companyId' | 'createdByUid'>>
  ) => {
    const uid = userSession?.user?.uid || userSession?.user?.id || 'local-user';
    const cid = cloudCompanyId || 'local-workspace';
    const fullLogs: EmailLogEntry[] = logs.map((l) => ({
      ...l,
      companyId: cid,
      createdByUid: uid
    }));
    setEmailLogs((prev) => [...fullLogs, ...prev].slice(0, 40));

    if (isCloudConnected && cloudCompanyId) {
      for (const l of logs) {
        await recordEmailLogInCloud(cloudCompanyId, l).catch((err) =>
          console.error('Cloud email log write error:', err)
        );
      }
    }
  };

  const handleSyncLiveTenders = (liveTenders: TenderOpportunity[], replaceDiscovered = false) => {
    setTenders(prev => {
      if (replaceDiscovered) {
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

      const incomingMap = new Map(liveTenders.map(t => [t.id, t]));
      const updatedPrev = prev.map(t => {
        if (incomingMap.has(t.id)) {
          const freshItem = incomingMap.get(t.id)!;
          incomingMap.delete(t.id);
          return {
            ...freshItem,
            status: t.status,
            readinessScore: t.status !== 'DISCOVERED' ? t.readinessScore : freshItem.readinessScore
          };
        }
        return t;
      });

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

  // If user is not logged in, render AuthScreen with Google Cloud Auth + Invite Code + POPIA Consent
  if (!userSession) {
    return (
      <AuthScreen
        companyProfile={companyProfile}
        currentSession={userSession}
        cloudError={cloudError}
        isAuthenticatingCloud={isAuthenticatingCloud}
        onLogin={handleLogin}
        onCloudSignInStart={(intent) => {
          pendingCloudIntentRef.current = intent;
        }}
      />
    );
  }

  const companyDisplayName = companyProfile.tradingName || companyProfile.legalName || 'SAtenderAI Group';
  const companyLogo = companyProfile.logoUrl;
  const companyMonogram = companyDisplayName.slice(0, 2).toUpperCase();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'opportunities', label: 'Tender Discovery', icon: Compass },
    { id: 'tenders', label: 'My Tenders', icon: CheckCircle },
    { id: 'billing', label: 'Invoicing & Quotes', icon: Receipt },
    { id: 'pdf-tools', label: 'Document & PDF Studio', icon: FileCheck },
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
        <div className="flex flex-col py-6 space-y-7 flex-1 overflow-y-auto">
          {/* Customized Company Logo & Branding */}
          <div 
            className="flex items-center gap-3 px-6 cursor-pointer group" 
            onClick={() => handleNavigate('company')} 
            id="logo-container"
            title="Click to edit Company Intelligence Profile & Branding"
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyDisplayName} 
                className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shadow-md bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center font-black text-sm flex-shrink-0">
                {companyMonogram}
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-extrabold text-white text-sm tracking-tight truncate block group-hover:text-amber-400 transition-colors">
                {companyDisplayName}
              </span>
              <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider truncate mt-0.5">
                {companyProfile.slogan ? companyProfile.slogan.slice(0, 24) + '...' : 'Bid Operating Sys'}
              </p>
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

        {/* User Card with Switch User & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 space-y-2" id="user-card-desktop">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group flex-1 mr-2"
              onClick={() => setShowSwitchUserModal(true)}
              title="Click to switch employee profile or add team members"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400 border border-slate-700 flex-shrink-0 group-hover:border-amber-400">
                {userSession.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <p className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                  {userSession.user.name}
                </p>
                <p className="text-[9px] text-slate-500 font-semibold truncate">
                  {userSession.user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowSwitchUserModal(true)}
                className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                title="Switch Employee User"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleLogout(false)}
                className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
            <button
              onClick={() => {
                setLegalModalTab('popia');
                setShowLegalModal(true);
              }}
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Scale className="w-3 h-3" />
              <span>POPIA &amp; Terms</span>
            </button>
            <span className={isCloudConnected ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
              {isCloudConnected ? 'Cloud Synced' : 'Local Mode'}
            </span>
          </div>
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
            
            {/* Customized Company Brand Title */}
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                {companyDisplayName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5" id="time-display">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeStr || 'Loading...'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Cloud Binder / Invite Code Pill */}
            {isCloudConnected ? (
              <button
                onClick={() => {
                  setSettingsSubTab('members');
                  handleNavigate('settings');
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 transition-colors cursor-pointer"
                title="Shared Cloud Company Binder Active — Click to copy team Invite Code"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Binder{inviteCode ? ` • ${inviteCode}` : ''}</span>
              </button>
            ) : (
              <button
                onClick={() => handleLogout(false)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-[11px] font-bold text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                title="Sign in with Google to synchronize your Company Binder across laptops"
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Local Mode • Connect Cloud</span>
              </button>
            )}

            {/* Active User Session Pill */}
            <button
              onClick={() => setShowSwitchUserModal(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{userSession.user.name} ({userSession.user.accessLevel || 'BID_MGR'})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* B-BBEE Notice */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-800" id="top-expiry-warning">
              <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span className="hidden sm:inline">B-BBEE Level {companyProfile.bbeeLevel} Verified</span>
              <span className="sm:hidden">Level {companyProfile.bbeeLevel}</span>
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
                <div className="space-y-6 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        {companyMonogram}
                      </div>
                      <span className="font-extrabold text-white text-sm truncate">{companyDisplayName}</span>
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

                <div className="p-4 border-t border-slate-900">
                  <button 
                    onClick={() => handleLogout(false)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
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
                  currentSession={userSession}
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
                  companyName={companyDisplayName}
                  onUploadDocument={handleUploadDocument}
                />
              )}

              {activeTab === 'tenders' && (
                <>
                  {activeTenderId ? (
                    <TenderWorkspace 
                      tenderId={activeTenderId}
                      companyProfile={companyProfile}
                      userSession={userSession}
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

              {activeTab === 'analytics' && (
                <Analytics 
                  tenders={tenders}
                  companyProfile={companyProfile}
                />
              )}

              {activeTab === 'calendar' && (
                <Calendar 
                  tenders={tenders}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'settings' && (
                <Settings 
                  companyProfile={companyProfile}
                  userSession={userSession}
                  tenders={tenders}
                  inviteCode={inviteCode || companyProfile.inviteCode}
                  isCloudConnected={isCloudConnected}
                  emailLogs={emailLogs}
                  documents={companyProfile.documents}
                  initialSubTab={settingsSubTab}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateMemberRole={handleUpdateMemberRole}
                  onRecordEmailLogs={handleRecordEmailLogs}
                  onUploadDocument={handleUploadDocument}
                  onConnectCloud={() => handleLogout(false)}
                  onOpenLegalModal={(tab) => {
                    setLegalModalTab(tab);
                    setShowLegalModal(true);
                  }}
                  onLogout={() => handleLogout(false)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Switch Employee User Modal */}
      {showSwitchUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Switch Employee Account</h3>
                  <p className="text-[11px] text-slate-500">Work as another team specialist for {companyDisplayName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSwitchUserModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {companyProfile.employees.map((emp) => {
                const isCurrent = emp.id === userSession.user.id || emp.name === userSession.user.name;

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSwitchUser(emp)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent 
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-150'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                          {isCurrent && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{emp.role}</p>
                        {emp.email && <p className="text-[9px] text-slate-400 font-mono">{emp.email}</p>}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {emp.accessLevel || 'BID_MGR'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setShowSwitchUserModal(false);
                  handleNavigate('company');
                }}
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New Team Member</span>
              </button>

              <button
                onClick={() => handleLogout(false)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out &amp; Switch Cloud Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showLegalModal && (
        <LegalComplianceModal
          isOpen={showLegalModal}
          initialTab={legalModalTab}
          companyName={companyDisplayName}
          acceptedAt={userSession?.popiaConsent?.acceptedAt}
          acceptedByEmail={userSession?.popiaConsent?.acceptedByEmail || userSession?.user?.email}
          onClose={() => setShowLegalModal(false)}
        />
      )}

    </div>
  );
}
