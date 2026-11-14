import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Bell,
  Lock,
  Database,
  Sparkles,
  Cloud,
  Copy,
  Check,
  Mail,
  Send,
  Clock,
  Scale,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  FileText
} from 'lucide-react';
import StirlingPdfWorkspace from './StirlingPdfWorkspace';
import {
  CompanyDocument,
  CompanyProfile,
  Employee,
  UserSession,
  EmailLogEntry,
  TenderOpportunity,
  EmailNotificationPreferences
} from '../types';
import { CURRENT_TOS_VERSION } from '../lib/firebase';

export type SettingsSubTab =
  | 'parameters'
  | 'stirling-pdf'
  | 'members'
  | 'notifications'
  | 'legal'
  | 'databases';

interface SettingsProps {
  companyProfile?: CompanyProfile;
  userSession?: UserSession | null;
  tenders?: TenderOpportunity[];
  inviteCode?: string;
  isCloudConnected?: boolean;
  emailLogs?: EmailLogEntry[];
  onUpdateProfile?: (updated: CompanyProfile) => void;
  onUpdateMemberRole?: (member: Employee) => Promise<void>;
  onRecordEmailLogs?: (logs: Array<Omit<EmailLogEntry, 'companyId' | 'createdByUid'>>) => Promise<void>;
  onConnectCloud?: () => void;
  onOpenLegalModal?: (tab: 'tos' | 'popia') => void;
  onLogout?: () => void;
  documents?: CompanyDocument[];
  onUploadDocument?: (doc: CompanyDocument) => void;
  initialSubTab?: SettingsSubTab;
}

interface EmailStatusResponse {
  activeProvider: string;
  postmarkConfigured: boolean;
  sendgridConfigured: boolean;
  smtpConfigured: boolean;
  fromAddress: string;
  fromName: string;
  schedulerActive: boolean;
  sastTimeNow: string;
  registeredWorkspaces: number;
  lastScheduledRun?: { ranAt: string; summary: string } | null;
}

export default function Settings({
  companyProfile,
  userSession,
  tenders = [],
  inviteCode,
  isCloudConnected = false,
  emailLogs = [],
  onUpdateProfile,
  onUpdateMemberRole,
  onRecordEmailLogs,
  onConnectCloud,
  onOpenLegalModal,
  onLogout,
  documents = [],
  onUploadDocument,
  initialSubTab = 'parameters'
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);
  const [copiedCode, setCopiedCode] = useState(false);

  // Email Engine & Notification Rules state
  const [emailStatus, setEmailStatus] = useState<EmailStatusResponse | null>(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [dispatchingType, setDispatchingType] = useState<'briefing' | '48h' | 'test' | null>(null);
  const [dispatchBanner, setDispatchBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  const defaultRecipients =
    companyProfile?.emailNotifications?.recipientEmails ||
    Array.from(
      new Set(
        [
          userSession?.user?.email,
          companyProfile?.companyEmail,
          ...(companyProfile?.employees || []).map((e) => e.email)
        ].filter((e): e is string => Boolean(e && e.includes('@')))
      )
    );

  const notifPrefs: EmailNotificationPreferences = companyProfile?.emailNotifications || {
    morningBriefingEnabled: true,
    morningBriefingTimeSast: '07:30',
    closing48hAlertEnabled: true,
    recipientEmails: defaultRecipients,
    preferredProvider: 'postmark'
  };

  useEffect(() => {
    if (activeSubTab === 'notifications') {
      fetch('/api/email/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setEmailStatus(data);
        })
        .catch(() => {});
    }
  }, [activeSubTab]);

  const updateEmailPrefs = (patch: Partial<EmailNotificationPreferences>) => {
    if (!companyProfile || !onUpdateProfile) return;
    const nextPrefs: EmailNotificationPreferences = {
      ...notifPrefs,
      ...patch
    };
    onUpdateProfile({
      ...companyProfile,
      emailNotifications: nextPrefs
    });
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRecipient.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    if (!notifPrefs.recipientEmails.includes(trimmed)) {
      updateEmailPrefs({ recipientEmails: [...notifPrefs.recipientEmails, trimmed] });
    }
    setNewRecipient('');
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    updateEmailPrefs({
      recipientEmails: notifPrefs.recipientEmails.filter((e) => e !== emailToRemove)
    });
  };

  const handleDispatchEmail = async (kind: 'briefing' | '48h' | 'test') => {
    if (notifPrefs.recipientEmails.length === 0) {
      setDispatchBanner({
        type: 'error',
        message: 'Add at least one team recipient email address before dispatching.'
      });
      return;
    }
    setDispatchingType(kind);
    setDispatchBanner(null);

    try {
      const endpoint =
        kind === 'briefing'
          ? '/api/email/send-briefing'
          : kind === '48h'
            ? '/api/email/send-deadline-alerts'
            : '/api/email/send-test';

      const body =
        kind === 'test'
          ? {
              recipient: notifPrefs.recipientEmails[0],
              companyName: companyProfile?.tradingName || companyProfile?.legalName,
              preferredProvider: notifPrefs.preferredProvider
            }
          : {
              companyProfile,
              tenders,
              recipients: notifPrefs.recipientEmails,
              preferredProvider: notifPrefs.preferredProvider,
              includeUpcomingFallback: true
            };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || 'Dispatch failed');
      }

      if (json.previewHtml) {
        setPreviewHtml(json.previewHtml);
        setPreviewSubject(json.subject || 'Email Preview');
      }

      const results: Array<{
        recipientEmail: string;
        status: 'DELIVERED' | 'SIMULATED_PREVIEW' | 'FAILED';
        provider: string;
        sentAt: string;
      }> = json.results || [];

      if (results.length > 0 && onRecordEmailLogs) {
        const mappedType: EmailLogEntry['emailType'] =
          kind === '48h' ? 'CLOSING_48H_ALERT' : 'MORNING_BRIEFING';
        await onRecordEmailLogs(
          results.map((r, idx) => ({
            id: `log-${Date.now()}-${idx}`,
            recipientEmail: r.recipientEmail,
            emailType: mappedType,
            provider: r.provider,
            status: r.status,
            sentAt: r.sentAt,
            subject: json.subject || 'SAtenderAI Procurement Alert'
          }))
        );
      }

      const deliveredCount = results.filter((r) => r.status === 'DELIVERED').length;
      const previewCount = results.filter((r) => r.status === 'SIMULATED_PREVIEW').length;

      if (deliveredCount > 0) {
        setDispatchBanner({
          type: 'success',
          message: `Dispatched to ${deliveredCount} team recipient(s) via ${results[0]?.provider}.`
        });
      } else if (previewCount > 0) {
        setDispatchBanner({
          type: 'info',
          message: `Rendered HTML preview for ${previewCount} recipient(s). Configure POSTMARK_SERVER_TOKEN or SENDGRID_API_KEY in server environment variables to send live inbox emails.`
        });
      } else {
        setDispatchBanner({
          type: 'error',
          message: json.message || 'No emails were dispatched.'
        });
      }
    } catch (err: any) {
      setDispatchBanner({
        type: 'error',
        message: err.message || 'Failed to send transactional email.'
      });
    } finally {
      setDispatchingType(null);
    }
  };

  const handleCopyInviteCode = async () => {
    const code = inviteCode || companyProfile?.inviteCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback noop
    }
  };

  const handleRoleChange = async (emp: Employee, nextAccess: Employee['accessLevel']) => {
    if (!onUpdateMemberRole) return;
    setUpdatingRoleUid(emp.id);
    try {
      await onUpdateMemberRole({ ...emp, accessLevel: nextAccess });
    } finally {
      setUpdatingRoleUid(null);
    }
  };

  const displayInviteCode = inviteCode || companyProfile?.inviteCode || '';

  return (
    <div className="space-y-6" id="settings-container">
      {/* Header */}
      <div
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        id="settings-header"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Workspace Settings</h1>
          <p className="text-xs text-slate-500">
            Configure cloud team access, automated 07:30 SAST email briefings, POPIA compliance, and PDF tools
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'members'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Team &amp; Cloud Sync
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'notifications'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            07:30 Briefing &amp; Alerts
          </button>
          <button
            onClick={() => setActiveSubTab('legal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'legal'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            POPIA &amp; ToS
          </button>
          <button
            onClick={() => setActiveSubTab('stirling-pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'stirling-pdf'
                ? 'bg-slate-950 text-amber-400 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> PDF Studio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1.5 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm h-fit">
          <button
            onClick={() => setActiveSubTab('parameters')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === 'parameters'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeSubTab === 'parameters' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>General SCM Rules</span>
          </button>

          <button
            onClick={() => setActiveSubTab('members')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'members'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className={`w-4 h-4 ${activeSubTab === 'members' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Team &amp; Cloud Binder</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {companyProfile?.employees?.length || 1}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'notifications'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className={`w-4 h-4 ${activeSubTab === 'notifications' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Email Briefings &amp; 48h</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                notifPrefs.morningBriefingEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {notifPrefs.morningBriefingEnabled ? '07:30' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('legal')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'legal'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Scale className={`w-4 h-4 ${activeSubTab === 'legal' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>POPIA &amp; SA Terms</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Act 4
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('stirling-pdf')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSubTab === 'stirling-pdf'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeSubTab === 'stirling-pdf' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Document &amp; PDF Studio</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                activeSubTab === 'stirling-pdf' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Native
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('databases')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === 'databases'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database className={`w-4 h-4 ${activeSubTab === 'databases' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Database &amp; Feeds</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-9 space-y-6">
          {activeSubTab === 'stirling-pdf' && (
            <StirlingPdfWorkspace
              documents={documents}
              companyName={companyProfile?.tradingName || companyProfile?.legalName}
              onUploadDocument={onUploadDocument}
            />
          )}

          {activeSubTab === 'parameters' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs text-slate-700">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  General Procurement Rules
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800">Auto-Pull Tender Databases</p>
                      <p className="text-[10px] text-slate-400">
                        Pulls National eTender Portal &amp; Municipalities with active closing date validation
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800">Email Expiry Reminders</p>
                      <p className="text-[10px] text-slate-400">
                        Include expiring CSD / SARS / B-BBEE warnings in the 07:30 AM Morning Briefing
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.morningBriefingEnabled}
                      onChange={(e) => updateEmailPrefs({ morningBriefingEnabled: e.target.checked })}
                      className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800">Strict Compliance Gatekeeper</p>
                      <p className="text-[10px] text-slate-400">
                        Flags incomplete mandatory SBD 1 / SBD 4 / SBD 6.1 forms before submission
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 leading-relaxed">
                <h4 className="font-bold text-slate-950 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-slate-500" /> Tenant-Isolated Workspace Environment
                </h4>
                <p className="text-[11px] text-slate-500">
                  SAtenderAI enforces tenant isolation through Firebase Authentication and Firestore Security Rules so your company profile, CSD reports, SARS PIN, and BOQ schedules remain restricted to invited company members.
                </p>
              </div>
            </div>
          )}

          {/* TEAM MEMBERS, CLOUD SYNC & INVITE CODE TAB */}
          {activeSubTab === 'members' && (
            <div className="space-y-5 text-xs">
              {/* Cloud Status & Invite Code Card */}
              <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isCloudConnected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {isCloudConnected
                          ? 'Cloud Company Binder Synchronized'
                          : 'Offline Browser Sandbox Mode'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isCloudConnected
                          ? 'Changes made on this laptop sync in real time with all invited company employees.'
                          : 'Sign in with Google to persist your company binder in Cloud Firestore across laptops.'}
                      </p>
                    </div>
                  </div>

                  {!isCloudConnected && onConnectCloud && (
                    <button
                      onClick={onConnectCloud}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Connect Google Cloud Sync
                    </button>
                  )}
                </div>

                {isCloudConnected && displayInviteCode && (
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Employee Team Invite Code
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Share this code with Estimators or Bid Managers. They enter it under &ldquo;Join via Invite Code&rdquo; on sign-in.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3.5 py-2 bg-slate-950 border border-amber-400/40 rounded-xl font-mono font-extrabold text-sm tracking-widest text-amber-300">
                        {displayInviteCode}
                      </span>
                      <button
                        onClick={handleCopyInviteCode}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Members RBAC Roster */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-500" />
                    Authorized Company Members ({companyProfile?.employees?.length || 1})
                  </h3>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {(companyProfile?.employees || []).map((emp) => {
                    const isSelf = emp.id === userSession?.user?.uid || emp.id === userSession?.user?.id;
                    const canAdminEdit =
                      isCloudConnected &&
                      userSession?.user?.accessLevel === 'ADMIN' &&
                      !isSelf &&
                      Boolean(onUpdateMemberRole);

                    return (
                      <div
                        key={emp.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{emp.name}</span>
                            {isSelf && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {emp.role} {emp.email ? `• ${emp.email}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {canAdminEdit ? (
                            <select
                              value={emp.accessLevel || 'BID_MANAGER'}
                              disabled={updatingRoleUid === emp.id}
                              onChange={(e) =>
                                handleRoleChange(emp, e.target.value as Employee['accessLevel'])
                              }
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="BID_MANAGER">BID_MANAGER</option>
                              <option value="ESTIMATOR">ESTIMATOR</option>
                              <option value="COMPLIANCE">COMPLIANCE</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">
                              {emp.accessLevel || 'BID_MANAGER'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONAL EMAIL & 07:30 AM BRIEFING TAB */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-5 text-xs">
              {/* Provider Status Header Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-600" />
                      Transactional Email Engine (Postmark / SendGrid / SMTP)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Automated 07:30 AM SAST Morning Briefings and Closing in 48 Hours deadline alerts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        emailStatus?.postmarkConfigured ||
                        emailStatus?.sendgridConfigured ||
                        emailStatus?.smtpConfigured
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {emailStatus?.activeProvider || 'Checking Engine...'}
                    </span>
                  </div>
                </div>

                {!emailStatus?.postmarkConfigured &&
                  !emailStatus?.sendgridConfigured &&
                  !emailStatus?.smtpConfigured && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Sandbox Preview Mode Active</p>
                        <p className="text-amber-800 mt-0.5">
                          Set <code className="font-mono bg-amber-100 px-1 rounded">POSTMARK_SERVER_TOKEN</code> or{' '}
                          <code className="font-mono bg-amber-100 px-1 rounded">SENDGRID_API_KEY</code> in your server environment variables to deliver live emails. Testing below renders full HTML email previews and logs events without faking external delivery.
                        </p>
                      </div>
                    </div>
                  )}

                {/* Schedule Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        07:30 AM SAST Morning Briefing
                      </span>
                      <input
                        type="checkbox"
                        checked={notifPrefs.morningBriefingEnabled}
                        onChange={(e) =>
                          updateEmailPrefs({ morningBriefingEnabled: e.target.checked })
                        }
                        className="w-4 h-4 text-slate-900 rounded"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Daily summary of pursued bids, matched eTenders, and expiring SARS/CSD/B-BBEE docs at 07:30 South African Standard Time.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-rose-600" />
                        Closing in 48 Hours Alert
                      </span>
                      <input
                        type="checkbox"
                        checked={notifPrefs.closing48hAlertEnabled}
                        onChange={(e) =>
                          updateEmailPrefs({ closing48hAlertEnabled: e.target.checked })
                        }
                        className="w-4 h-4 text-slate-900 rounded"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Urgent escalation email with missing SBD checklist items &amp; buyer submission desk whenever a bid enters the 48-hour cutoff window.
                    </p>
                  </div>
                </div>

                {/* Preferred Provider & Team Recipients */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-bold text-slate-800">
                      Team Notification Recipients ({notifPrefs.recipientEmails.length})
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Preferred Gateway:</span>
                      <select
                        value={notifPrefs.preferredProvider || 'postmark'}
                        onChange={(e) =>
                          updateEmailPrefs({
                            preferredProvider: e.target.value as 'postmark' | 'sendgrid' | 'smtp'
                          })
                        }
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800"
                      >
                        <option value="postmark">Postmark</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="smtp">Custom SMTP</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {notifPrefs.recipientEmails.map((em) => (
                      <span
                        key={em}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium text-[11px]"
                      >
                        <span>{em}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(em)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddRecipient} className="flex gap-2">
                    <input
                      type="email"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Add team email (e.g. estimator@company.co.za)"
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                </div>

                {dispatchBanner && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-medium ${
                      dispatchBanner.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : dispatchBanner.type === 'info'
                          ? 'bg-sky-50 border-sky-200 text-sky-900'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {dispatchBanner.message}
                  </div>
                )}

                {/* Action Triggers */}
                <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={dispatchingType !== null}
                    onClick={() => handleDispatchEmail('briefing')}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {dispatchingType === 'briefing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send 07:30 AM Briefing Now</span>
                  </button>

                  <button
                    type="button"
                    disabled={dispatchingType !== null}
                    onClick={() => handleDispatchEmail('48h')}
                    className="px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {dispatchingType === '48h' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bell className="w-3.5 h-3.5" />
                    )}
                    <span>Scan &amp; Send 48h Alerts Now</span>
                  </button>

                  <button
                    type="button"
                    disabled={dispatchingType !== null}
                    onClick={() => handleDispatchEmail('test')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {dispatchingType === 'test' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>

              {/* Rendered Email Preview */}
              {previewHtml && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Transactional Email Preview
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{previewSubject}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewHtml(null)}
                      className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                  <div
                    className="rounded-2xl overflow-hidden border border-slate-100 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}

              {/* Dispatch Audit History */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Notification Dispatch Log ({emailLogs.length})
                  </h4>
                  {emailStatus?.sastTimeNow && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Clock: {emailStatus.sastTimeNow}
                    </span>
                  )}
                </div>

                {emailLogs.length === 0 ? (
                  <p className="text-slate-400 text-[11px] py-3">
                    No email dispatches recorded yet. Use the buttons above to test or send a morning briefing.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                          <th className="py-2 pr-3">Recipient</th>
                          <th className="py-2 pr-3">Type</th>
                          <th className="py-2 pr-3">Gateway</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {emailLogs.slice(0, 15).map((log) => (
                          <tr key={log.id}>
                            <td className="py-2 pr-3 font-medium text-slate-800">{log.recipientEmail}</td>
                            <td className="py-2 pr-3 text-slate-600">{log.emailType}</td>
                            <td className="py-2 pr-3 text-slate-500">{log.provider}</td>
                            <td className="py-2 pr-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  log.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'SIMULATED_PREVIEW'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2 text-slate-400">
                              {new Date(log.sentAt).toLocaleString('en-ZA')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* POPIA & SA TERMS OF SERVICE TAB */}
          {activeSubTab === 'legal' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    POPIA (Act 4 of 2013) &amp; SA SaaS Terms of Service
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Data processing governance and Electronic Communications and Transactions Act (ECTA) compliance
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">
                  Version {userSession?.popiaConsent?.tosVersion || CURRENT_TOS_VERSION}
                </span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950">
                    Consent Recorded &amp; Verified
                  </p>
                  <p className="text-[11px] text-emerald-900">
                    Accepted by{' '}
                    <strong>
                      {userSession?.popiaConsent?.acceptedByEmail || userSession?.user?.email || 'Authorized User'}
                    </strong>
                    {userSession?.popiaConsent?.acceptedAt
                      ? ` on ${new Date(userSession.popiaConsent.acceptedAt).toLocaleString('en-ZA')}`
                      : ''}
                    .
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900">POPIA Operator Safeguards (Sec 19-21)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    SAtenderAI isolates CIPC registration docs, SARS Tax Compliance PINs, B-BBEE affidavits, and employee CVs inside tenant-restricted Firestore collections accessible solely to authenticated company members.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900">ECTA Electronic Signatures (Act 25 of 2002)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Digital bid seals and SBD 1 / SBD 4 / SBD 6.1 declarations generated in the workspace require final authorization by an appointed company signatory prior to submission.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenLegalModal?.('popia')}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>View POPIA Notice &amp; Download DPA PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal?.('tos')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Read SA SaaS Terms of Service</span>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'databases' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-500" />
                Cloud Storage &amp; Procurement Feeds
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>Cloud Firestore Company Binder</span>
                  <span className={isCloudConnected ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {isCloudConnected ? 'Synced' : 'Local Sandbox'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>National Treasury eTenders (OCDS API)</span>
                  <span className="text-emerald-700 font-bold">Active (Date-Aware)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>Eskom Commercial Tender Bulletin</span>
                  <span className="text-emerald-700 font-bold">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
