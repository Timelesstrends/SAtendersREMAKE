import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Cloud,
  KeyRound,
  Scale,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Building2,
  CalendarClock
} from 'lucide-react';
import { Employee, CompanyProfile, UserSession } from '../types';
import { signInWithGoogleCloud, CURRENT_TOS_VERSION } from '../lib/firebase';
import LegalComplianceModal from './LegalComplianceModal';

export interface CloudAuthIntent {
  mode: 'create_or_login' | 'join_invite';
  companyName?: string;
  inviteCode?: string;
  role?: string;
  accessLevel?: Employee['accessLevel'];
  rememberMe: boolean;
  popiaAccepted: boolean;
}

interface AuthScreenProps {
  companyProfile: CompanyProfile;
  currentSession: UserSession | null;
  cloudError?: string | null;
  isAuthenticatingCloud?: boolean;
  onLogin: (session: UserSession) => void;
  onCloudSignInStart: (intent: CloudAuthIntent) => void;
  onCloudSignInComplete?: (uid: string, intent: CloudAuthIntent) => Promise<void>;
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export default function AuthScreen({
  companyProfile,
  cloudError,
  isAuthenticatingCloud = false,
  onLogin,
  onCloudSignInStart,
  onCloudSignInComplete
}: AuthScreenProps) {
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');
  const [registerPath, setRegisterPath] = useState<'NEW_COMPANY' | 'JOIN_INVITE'>('NEW_COMPANY');
  const [showDemoPicker, setShowDemoPicker] = useState(false);

  const initialName =
    companyProfile.tradingName &&
    !companyProfile.tradingName.toLowerCase().includes('satenderai')
      ? companyProfile.tradingName
      : '';
  const [companyNameInput, setCompanyNameInput] = useState(initialName);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinRole, setJoinRole] = useState('Bid Manager & Coordinator');
  const [joinAccessLevel, setJoinAccessLevel] = useState<Employee['accessLevel']>('BID_MANAGER');
  const [rememberMe, setRememberMe] = useState(true);
  const [popiaAccepted, setPopiaAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'tos' | 'popia'>('popia');

  const handleOpenLegal = (tab: 'tos' | 'popia') => {
    setLegalInitialTab(tab);
    setLegalModalOpen(true);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);

    if (!popiaAccepted) {
      setErrorMsg('Please accept the POPIA Privacy Notice and Terms of Service before continuing.');
      return;
    }

    const isJoiningTeam = authTab === 'REGISTER' && registerPath === 'JOIN_INVITE';
    const isCreatingCompany = authTab === 'REGISTER' && registerPath === 'NEW_COMPANY';
    const trimmedCode = inviteCodeInput.trim().toUpperCase();

    if (isCreatingCompany && companyNameInput.trim().length < 2) {
      setErrorMsg('Please enter your company legal or trading name to register a workspace.');
      return;
    }

    if (isJoiningTeam && trimmedCode.length < 4) {
      setErrorMsg('Enter the Company Invite Code shared by your Workspace Admin.');
      return;
    }

    const intent: CloudAuthIntent = {
      mode: isJoiningTeam ? 'join_invite' : 'create_or_login',
      companyName: isCreatingCompany ? companyNameInput.trim() : undefined,
      inviteCode: isJoiningTeam ? trimmedCode : undefined,
      role: isJoiningTeam ? joinRole.trim() || 'Bid Specialist' : undefined,
      accessLevel: isJoiningTeam ? joinAccessLevel : 'ADMIN',
      rememberMe,
      popiaAccepted: true
    };

    try {
      setSubmitting(true);
      onCloudSignInStart(intent);
      const user = await signInWithGoogleCloud(rememberMe);
      if (onCloudSignInComplete) {
        await onCloudSignInComplete(user.uid, intent);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Google sign-in was closed before completion. Please try again.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Your browser blocked the sign-in pop-up. Allow pop-ups for this page and try again.');
      } else {
        setErrorMsg(msg || 'Sign-in failed. Please verify your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocalDemoLogin = (emp: Employee) => {
    setErrorMsg(null);
    if (!popiaAccepted) {
      setErrorMsg('Please accept the POPIA Privacy Notice and Terms of Service first.');
      return;
    }

    const nowIso = new Date().toISOString();
    const email =
      emp.email ||
      `${emp.name.toLowerCase().replace(/\s+/g, '.')}@satenderai.co.za`;

    const session: UserSession = {
      user: {
        id: emp.id,
        name: emp.name,
        email,
        role: emp.role,
        accessLevel: emp.accessLevel || 'BID_MANAGER',
        avatar: emp.avatar,
        authMode: 'local'
      },
      popiaConsent: {
        accepted: true,
        tosVersion: CURRENT_TOS_VERSION,
        acceptedAt: nowIso,
        acceptedByEmail: email
      },
      rememberMe,
      loginTimestamp: nowIso
    };
    onLogin(session);
  };

  const busy = submitting || isAuthenticatingCloud;
  const activeError = errorMsg || cloudError;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid grid-cols-1 lg:grid-cols-12 font-sans">
      {/* Desktop Left Brand Column (hidden on small screens so auth form sits immediately above the fold) */}
      <aside className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-12 flex-col justify-between border-r border-slate-900">
        <div className="space-y-10">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-sm tracking-tight">
              SA
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SAtenderAI</span>
          </div>

          {/* Editorial Headline */}
          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Tender intelligence and compliance for South African teams.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Manage National Treasury eTenders, SBD returnables, pricing schedules, and team approvals from one synchronized company workspace.
            </p>
          </div>

          {/* Clean Hairline Capability List */}
          <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80 max-w-md">
            <div className="py-4 flex items-start gap-3.5">
              <Cloud className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-100">Shared Company Workspace</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Work uploaded by your Estimator updates immediately for Compliance Officers and Directors.
                </p>
              </div>
            </div>

            <div className="py-4 flex items-start gap-3.5">
              <CalendarClock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-100">07:30 SAST Briefings &amp; 48h Alerts</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated morning tender digests and closing countdown notifications to your team inbox.
                </p>
              </div>
            </div>

            <div className="py-4 flex items-start gap-3.5">
              <Users className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-100">Role-Based Access via Invite Code</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Add team members across laptops with Admin, Bid Manager, Estimator, or Compliance permissions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiet Legal Footer */}
        <div className="pt-8 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>POPIA Act 4 of 2013</span>
          <span aria-hidden="true">·</span>
          <span>ECTA Act 25 of 2002</span>
        </div>
      </aside>

      {/* Right Authentication Workspace (Full first-fold priority on Mobile & balanced center on Desktop) */}
      <main className="lg:col-span-7 flex flex-col justify-between min-h-screen px-4 py-6 sm:px-8 sm:py-10">
        {/* Compact Mobile Brand Header */}
        <div className="flex lg:hidden items-center justify-between max-w-md w-full mx-auto mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-extrabold text-xs">
              SA
            </div>
            <span className="text-base font-bold tracking-tight text-slate-950">SAtenderAI</span>
          </div>
          <span className="text-xs font-medium text-slate-500">SA Tender Platform</span>
        </div>

        {/* Main Auth Form Container */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            {showDemoPicker ? (
              /* Lightweight Local Demo Selector View */
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoPicker(false);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Google Sign In</span>
                </button>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    Offline Browser Sandbox
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Preview the platform locally on this device. Data will not sync across laptops until you sign in with Google.
                  </p>
                </div>

                {activeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <span>{activeError}</span>
                  </div>
                )}

                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={popiaAccepted}
                    onChange={(e) => {
                      setPopiaAccepted(e.target.checked);
                      if (e.target.checked) setErrorMsg(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
                  />
                  <span>
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenLegal('popia')}
                      className="text-slate-950 underline font-semibold cursor-pointer"
                    >
                      POPIA Notice
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenLegal('tos')}
                      className="text-slate-950 underline font-semibold cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    .
                  </span>
                </label>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {companyProfile.employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleLocalDemoLogin(emp)}
                      className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer min-h-[52px]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {emp.role} · {emp.accessLevel || 'MEMBER'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Primary Sign In / Create Account Experience */
              <div className="space-y-6">
                {/* Clean 2-Tab Navigation */}
                <div
                  role="tablist"
                  aria-label="Authentication mode"
                  className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authTab === 'SIGN_IN'}
                    onClick={() => {
                      setAuthTab('SIGN_IN');
                      setErrorMsg(null);
                    }}
                    className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      authTab === 'SIGN_IN'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authTab === 'REGISTER'}
                    onClick={() => {
                      setAuthTab('REGISTER');
                      setErrorMsg(null);
                    }}
                    className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      authTab === 'REGISTER'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Error Alert */}
                {activeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <span>{activeError}</span>
                  </div>
                )}

                {authTab === 'SIGN_IN' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold tracking-tight text-slate-950">
                        Welcome back
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sign in with your Google account to open your synchronized company tender workspace.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold tracking-tight text-slate-950">
                        {registerPath === 'NEW_COMPANY'
                          ? 'Register company workspace'
                          : 'Join your team'}
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {registerPath === 'NEW_COMPANY'
                          ? 'Create a shared workspace for your business and invite employees.'
                          : 'Enter the Invite Code from your Company Admin to sync with your team.'}
                      </p>
                    </div>

                    {/* Registration Path Switcher */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterPath('NEW_COMPANY');
                          setErrorMsg(null);
                        }}
                        className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                          registerPath === 'NEW_COMPANY'
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>New Company</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRegisterPath('JOIN_INVITE');
                          setErrorMsg(null);
                        }}
                        className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                          registerPath === 'JOIN_INVITE'
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5 shrink-0" />
                        <span>Invite Code</span>
                      </button>
                    </div>

                    {registerPath === 'NEW_COMPANY' ? (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="reg-company-name"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Company Legal or Trading Name
                        </label>
                        <input
                          id="reg-company-name"
                          type="text"
                          value={companyNameInput}
                          onChange={(e) => setCompanyNameInput(e.target.value)}
                          placeholder="e.g. Mzansi Civil & Logistics (Pty) Ltd"
                          className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="reg-invite-code"
                            className="block text-xs font-semibold text-slate-700"
                          >
                            Company Invite Code
                          </label>
                          <input
                            id="reg-invite-code"
                            type="text"
                            value={inviteCodeInput}
                            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                            placeholder="SA-A1B2C3"
                            className="w-full min-h-[42px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-semibold tracking-wider uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-access-level"
                              className="block text-xs font-semibold text-slate-700"
                            >
                              Team Role
                            </label>
                            <select
                              id="reg-access-level"
                              value={joinAccessLevel}
                              onChange={(e) => {
                                const lvl = e.target.value as Employee['accessLevel'];
                                setJoinAccessLevel(lvl);
                                if (lvl === 'ESTIMATOR') setJoinRole('Chief Estimator & QS');
                                else if (lvl === 'COMPLIANCE') setJoinRole('SHEQ & Compliance Officer');
                                else if (lvl === 'VIEWER') setJoinRole('Executive Observer');
                                else setJoinRole('Bid Manager & Coordinator');
                              }}
                              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-950"
                            >
                              <option value="BID_MANAGER">Bid Manager</option>
                              <option value="ESTIMATOR">Estimator / QS</option>
                              <option value="COMPLIANCE">Compliance Officer</option>
                              <option value="VIEWER">Viewer (Read-Only)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-job-title"
                              className="block text-xs font-semibold text-slate-700"
                            >
                              Job Title
                            </label>
                            <input
                              id="reg-job-title"
                              type="text"
                              value={joinRole}
                              onChange={(e) => setJoinRole(e.target.value)}
                              placeholder="Quantity Surveyor"
                              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* POPIA & Terms Consent + Persistence */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 text-xs text-slate-600 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={popiaAccepted}
                      onChange={(e) => {
                        setPopiaAccepted(e.target.checked);
                        if (e.target.checked) setErrorMsg(null);
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
                    />
                    <span>
                      I authorize SAtenderAI to process company tender documents under the{' '}
                      <button
                        type="button"
                        onClick={() => handleOpenLegal('popia')}
                        className="text-slate-950 hover:text-amber-700 underline font-semibold cursor-pointer"
                      >
                        POPIA Notice
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => handleOpenLegal('tos')}
                        className="text-slate-950 hover:text-amber-700 underline font-semibold cursor-pointer"
                      >
                        Terms of Service
                      </button>
                      .
                    </span>
                  </label>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-slate-950 focus:ring-slate-900"
                      />
                      <span>Keep me signed in</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleOpenLegal('popia')}
                      className="text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Read DPA</span>
                    </button>
                  </div>
                </div>

                {/* Primary Google CTA */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogleAuth}
                  className="w-full min-h-[46px] px-4 py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-slate-900 disabled:opacity-60 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Connecting Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        <GoogleMark />
                      </span>
                      <span className="whitespace-nowrap">
                        {authTab === 'SIGN_IN'
                          ? 'Continue with Google'
                          : registerPath === 'JOIN_INVITE'
                            ? 'Join Team with Google'
                            : 'Create Workspace with Google'}
                      </span>
                    </>
                  )}
                </button>

                {/* Cross-link helper */}
                {authTab === 'SIGN_IN' && (
                  <p className="text-center text-xs text-slate-500">
                    Have a team Invite Code?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('REGISTER');
                        setRegisterPath('JOIN_INVITE');
                        setErrorMsg(null);
                      }}
                      className="font-semibold text-slate-950 hover:text-amber-700 underline cursor-pointer"
                    >
                      Join an existing company
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quiet Footer Actions */}
        <footer className="max-w-[440px] w-full mx-auto pt-5 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setShowDemoPicker((prev) => !prev);
              setErrorMsg(null);
            }}
            className="font-medium text-slate-600 hover:text-slate-950 underline-offset-2 hover:underline cursor-pointer"
          >
            {showDemoPicker ? 'Return to Cloud Sign In' : 'Preview Local Demo'}
          </button>
          <span>South Africa · POPIA Compliant</span>
        </footer>
      </main>

      {legalModalOpen && (
        <LegalComplianceModal
          isOpen={legalModalOpen}
          initialTab={legalInitialTab}
          companyName={companyNameInput || companyProfile.tradingName || companyProfile.legalName}
          onClose={() => setLegalModalOpen(false)}
          onAcceptConsent={() => {
            setPopiaAccepted(true);
            setErrorMsg(null);
            setLegalModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
