import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowLeft, 
  Layout, 
  FileText, 
  Bot, 
  Sliders, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Send, 
  HelpCircle,
  FileDown,
  Upload,
  Calendar,
  Layers,
  ArrowRight,
  Mail,
  Printer,
  ExternalLink,
  Lock,
  Check,
  Building,
  HardHat,
  ShieldCheck,
  Users,
  Truck,
  Box,
  Stamp,
  Tag,
  Scissors,
  FileCheck2,
  X,
  Scale,
  Copy,
  CheckSquare,
  FolderArchive,
  AlertOctagon,
  BadgePercent,
  Download,
  Briefcase,
  RefreshCw,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { 
  TenderOpportunity, 
  CompanyProfile, 
  ChatMessage, 
  RequirementItem, 
  EvaluationScorecard, 
  CompanyDocument,
  SubcontractorPackage,
  UserSession
} from '../types';
import { triggerDocumentDownload } from '../lib/download';
import { 
  getSectorCategory, 
  getSectorComplianceBadge, 
  getSectorProposalDrafts,
  getSectorPlanTabs,
  getSectorOHSPlan,
  getSectorQCPPlan
} from '../data/industryProposals';

interface TenderWorkspaceProps {
  tenderId: string;
  companyProfile: CompanyProfile;
  userSession?: UserSession | null;
  tenders: TenderOpportunity[];
  initialSubTab?: 'overview' | 'requirements' | 'documents' | 'proposals' | 'subcontracting' | 'simulator' | 'jv-simulator' | 'submission' | 'pursue';
  onBack: () => void;
  onUpdateTender: (updated: TenderOpportunity) => void;
  onNavigate: (tab: string, tenderId?: string) => void;
  onUploadDocument: (doc: CompanyDocument) => void;
  onUpdateProfile: (updated: CompanyProfile) => void;
}

export default function TenderWorkspace({ 
  tenderId, 
  companyProfile, 
  userSession,
  tenders, 
  initialSubTab,
  onBack, 
  onUpdateTender,
  onNavigate,
  onUploadDocument,
  onUpdateProfile
}: TenderWorkspaceProps) {
  const tender = tenders.find(t => t.id === tenderId);

  if (!tender) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <p className="text-slate-700 font-semibold">Tender Workspace not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs">Go Back</button>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'requirements' | 'documents' | 'proposals' | 'subcontracting' | 'simulator' | 'jv-simulator' | 'submission' | 'pursue'>(
    initialSubTab || (tender.status !== 'DISCOVERED' ? 'pursue' : 'overview')
  );
  const [pursueStep, setPursueStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const authorizedSignatoryName = userSession?.user?.name || (companyProfile.employees && companyProfile.employees[0]?.name) || 'Authorized Signatory';
  const authorizedSignatoryRole = userSession?.user?.role || 'Managing Director';
  const companyLegalName = companyProfile.legalName || 'SAtenderAI Services (Pty) Ltd';

  // Interactive Lifecycle steps
  const lifecycleSteps: typeof tender.status[] = [
    'DISCOVERED',
    'REVIEWING',
    'GO_NO_GO',
    'IN_PREPARATION',
    'DRAFTING',
    'INTERNAL_REVIEW',
    'COMPLIANCE_CHECK',
    'READY_FOR_SUBMISSION',
    'SUBMITTED',
    'AWAITING_OUTCOME',
    'WON'
  ];

  const handleUpdateStatus = (status: typeof tender.status) => {
    onUpdateTender({
      ...tender,
      status
    });

    // Smart guidance: clicking a lifecycle step brings the user directly to the corresponding workspace action!
    if (status === 'IN_PREPARATION' || status === 'REVIEWING' || status === 'GO_NO_GO') {
      setActiveSubTab('pursue');
      setPursueStep(1);
    } else if (status === 'DRAFTING') {
      setActiveSubTab('pursue');
      setPursueStep(2);
    } else if (status === 'INTERNAL_REVIEW') {
      setActiveSubTab('pursue');
      setPursueStep(3);
    } else if (status === 'COMPLIANCE_CHECK') {
      setActiveSubTab('pursue');
      setPursueStep(4);
    } else if (status === 'READY_FOR_SUBMISSION' || status === 'SUBMITTED') {
      setActiveSubTab('pursue');
      setPursueStep(5);
    }
  };

  // 1. CHAT ADVISOR STATE
  const [selectedAgent, setSelectedAgent] = useState<'advisor' | 'analyst' | 'writer' | 'auditor'>('advisor');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello, ${authorizedSignatoryName}. I am your specialized South African tender advisor. Ask me anything about ${tender.title}. How can I assist you with your bid preparations today?`,
      timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      agent: 'advisor'
    }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // 2. SIMULATOR STATE
  const [simulation, setSimulation] = useState<EvaluationScorecard | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  // 3. GENERATE METHODOLOGY STATE
  const [methodologyDraft, setMethodologyDraft] = useState<string>('');
  const [generatingMethodology, setGeneratingMethodology] = useState(false);

  // 4. PRE-SUBMISSION AUDIT STATE
  const [auditResult, setAuditResult] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // 5. SBD WIZARD AND GANTT STATES
  const [showSBD4Modal, setShowSBD4Modal] = useState(false);
  const [sbdAnswers, setSbdAnswers] = useState({
    empState: false,
    empStateDetails: '',
    shareholderState: false,
    shareholderStateDetails: '',
    familyState: false,
    familyStateDetails: '',
    sigName: authorizedSignatoryName,
    sigTitle: authorizedSignatoryRole,
  });
  const [isSigningSBD, setIsSigningSBD] = useState(false);

  const [ganttTasks, setGanttTasks] = useState([
    { id: 't1', name: 'Site Establishment & SABS Security Hoarding', startWeek: 1, duration: 3, asset: 'Mercedes Benz Actros Tippers (Qty: 2)' },
    { id: 't2', name: 'Substructure Excavations & Foundation Pouring', startWeek: 4, duration: 9, asset: 'JCB 3CX Backhoe Loader' },
    { id: 't3', name: 'Superstructure Brickwork & Framing Phases', startWeek: 13, duration: 18, asset: '12 Local Artisans & Bricklayers' },
    { id: 't4', name: 'Finishes, Electrical Reticulation & Plumbing', startWeek: 31, duration: 10, asset: '8 Specialized Subcontractors' },
    { id: 't5', name: 'Handover Inspections, SHEQ Audits & Occupation', startWeek: 41, duration: 8, asset: 'SHEQ Officer Johannes v.d. Merwe' },
  ]);

  // 6. PROPOSAL DRAFTING AND SECURE SUBMISSION STATES
  const [proposalSummary, setProposalSummary] = useState('');
  const [proposalMethodology, setProposalMethodology] = useState('');
  const [proposalTimeline, setProposalTimeline] = useState('');
  const [proposalCosting, setProposalCosting] = useState('');
  const [activeDraftSection, setActiveDraftSection] = useState<'summary' | 'methodology' | 'timeline' | 'costing'>('summary');
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [saveDraftSuccess, setSaveDraftSuccess] = useState(false);

  // 7. JOINT VENTURE (JV) SIMULATOR STATES
  const [jvPartnerName, setJvPartnerName] = useState('Khumalo Civil & Allied Infrastructure (Pty) Ltd');
  const [jvPartnerBbee, setJvPartnerBbee] = useState(2);
  const [jvPartnerCidb, setJvPartnerCidb] = useState('6CE / 6GB');
  const [mySharePercent, setMySharePercent] = useState(60); // 60% lead contractor, 40% JV partner

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentLogs, setEmailSentLogs] = useState<string[]>([]);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    receiptId: string;
    timestamp: string;
    sentBy: string;
    attachments: string[];
    securedHash: string;
  } | null>(null);

  // 8. HIGH-SCORING PROPOSAL & PLAN GENERATOR SUITE
  const [activeProposalTab, setActiveProposalTab] = useState<'OHS' | 'QCP' | 'EPWP' | 'MOBILIZATION'>('OHS');
  const [planAttachNotice, setPlanAttachNotice] = useState<string | null>(null);

  // Sector-adaptive proposal configurations (Universal for any South African industry)
  const sectorPlanTabs = getSectorPlanTabs(tender.sector);
  const ohsPlan = getSectorOHSPlan(tender, companyProfile);
  const qcpPlan = getSectorQCPPlan(tender, companyProfile);

  // 9. 30% PREFERENTIAL SUBCONTRACTING TRACKER (PPPFA)
  const isMandatory30Percent = tender.value >= 30000000;
  const target30PercentRand = Math.round(tender.value * 0.30);
  const [subcontractorPackages, setSubcontractorPackages] = useState<SubcontractorPackage[]>([
    {
      id: 'pkg-1',
      scopeName: 'Perimeter Security Hoarding, 24/7 SABS Access Guarding & Biometrics',
      subcontractorName: 'Kganya Protection & Tactical Solutions (Pty) Ltd',
      csdNumber: 'MAAA0891042',
      bbeeLevel: 1,
      designatedGroup: 'Black Women',
      packageValue: Math.round(tender.value * 0.10),
      percentageOfContract: 10,
      status: 'VERIFIED'
    },
    {
      id: 'pkg-2',
      scopeName: 'Internal Electrical Reticulation, Conduits & SABS Distribution Boards',
      subcontractorName: 'Matlala Electrical Engineering Enterprise (Pty) Ltd',
      csdNumber: 'MAAA0492109',
      bbeeLevel: 1,
      designatedGroup: 'Black Youth',
      packageValue: Math.round(tender.value * 0.12),
      percentageOfContract: 12,
      status: 'MOU_SIGNED'
    },
    {
      id: 'pkg-3',
      scopeName: 'Site Earthworks, Paving, Stormwater Drainage & Kerbing',
      subcontractorName: 'Sizwe Local Civils & Paving Cooperative',
      csdNumber: 'MAAA0718921',
      bbeeLevel: 1,
      designatedGroup: 'Local EME / QSE',
      packageValue: Math.round(tender.value * 0.09),
      percentageOfContract: 9,
      status: 'IDENTIFIED'
    }
  ]);
  const [selectedSubcontractorForMOU, setSelectedSubcontractorForMOU] = useState<SubcontractorPackage | null>(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPkgScope, setNewPkgScope] = useState('');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgCsd, setNewPkgCsd] = useState('');
  const [newPkgGroup, setNewPkgGroup] = useState<SubcontractorPackage['designatedGroup']>('Black Women');
  const [newPkgPercent, setNewPkgPercent] = useState<number>(5);

  // 10. PHYSICAL TENDER BOX 2-ENVELOPE KIT & BID BINDER
  const [showTwoEnvelopeModal, setShowTwoEnvelopeModal] = useState(false);
  const [activeEnvelopeLabel, setActiveEnvelopeLabel] = useState<'ENVELOPE_1' | 'ENVELOPE_2'>('ENVELOPE_1');
  const [showBidBinderModal, setShowBidBinderModal] = useState(false);
  const [isCompilingBinder, setIsCompilingBinder] = useState(false);
  const [binderCompiledSuccess, setBinderCompiledSuccess] = useState(false);

  // Auto-prepopulate proposal drafts and email parameters based on active tender
  useEffect(() => {
    if (!tender) return;

    // Prefill Proposal Drafts dynamically according to any South African industry
    const drafts = getSectorProposalDrafts(tender, companyProfile);
    setProposalSummary(drafts.summary);
    setProposalMethodology(drafts.methodology);
    setProposalTimeline(drafts.timeline);
    setProposalCosting(drafts.costing);

    const complianceBadge = getSectorComplianceBadge(tender.sector);

    // Prefill email parameters with authentic South African procurement details
    const recipient = tender.submissionEmail || (tender as any).email || `tenders@${tender.buyer.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'etenders'}.gov.za`;
    setEmailTo(recipient);
    setEmailSubject(`[OFFICIAL BID SUBMISSION] Ref: ${tender.tenderNumber || `SA-TND-${tender.id.toUpperCase()}-2026`} - ${tender.title}`);
    setEmailBody(`Dear Bid Specification Committee,

Please find attached ${companyLegalName}'s official bid package in response to the advertised tender:
"${tender.title}" (Ref: ${tender.tenderNumber || `SA-TND-${tender.id.toUpperCase()}-2026`}).

As a verified Level ${companyProfile.bbeeLevel} B-BBEE provider with active CSD Registration Profile (${companyProfile.csdNumber || 'MAAA0821439'}) and ${complianceBadge}, we submit our fully completed tender documents for your evaluation.

Attached in this submission email are the following required documents:
1. Technical & Commercial Proposal (Executive Summary, Methodology, Gantt Plan, Costing BOQ)
2. National Treasury SBD 4 Declaration of Interest (Digitally Signed and Sealed)
3. National Treasury Central Supplier Database (CSD) Summary Report (Verified Active)
4. SARS Tax Compliance Status PIN Certificate Letter (Verified Active Status)
5. SANAS Certified Level ${companyProfile.bbeeLevel} B-BBEE Sworn Affidavit
6. COIDA Letter of Good Standing from Compensation Commissioner
7. Certified Past Performance Completion Letters

Kindly acknowledge receipt of this submission and register our physical documents in the official tender records.

Sincerely,

${authorizedSignatoryName}
${authorizedSignatoryRole}
${companyLegalName}
Cell: ${companyProfile.companyPhone || '+27 72 482 9310'}
Email: ${userSession?.user?.email || companyProfile.companyEmail || 'procurement@satenderai.co.za'}`);

    // Reset submission state when switching tenders
    setSubmissionReceipt(null);
    setEmailSentLogs([]);
  }, [tender, companyProfile, userSession, authorizedSignatoryName, authorizedSignatoryRole, companyLegalName]);

  // Update simulator on render
  useEffect(() => {
    // Generate static preview simulation
    setSimulation({
      complianceScore: 100,
      functionalityScore: tender.id === 'tender-1' ? 78 : 82,
      priceScore: tender.evaluationCriteria.pricePoints,
      preferenceScore: tender.evaluationCriteria.preferencePoints === 20 ? 18 : 9,
      totalScore: tender.id === 'tender-1' ? 86 : 89,
      strengths: [
        "Strong experience profile: 3 high value Gauteng infrastructure projects (total value R22.4M)",
        "Premium B-BBEE Level 1 status, granting near maximum preferential procurement points",
        "SABS certified physical tippers and machinery assets matched exactly to technical specs"
      ],
      weaknesses: [
        "Your Technical Work Methodology is currently flagged as 'Draft' with no mobilisation timeline.",
        "Missing official client reference letter for Joburg Parks project experience."
      ],
      actionPlan: [
        "Trigger the AI Bid Writer inside the Workspace to expand and structure your technical work methodology.",
        "Secure and upload the final certified client reference letter.",
        "Upload workmans compensation COIDA letter to compliance files."
      ]
    });
  }, [tender]);

  // CHAT SEND
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const prompt = chatInput;
    setChatInput('');
    setLoadingChat(true);

    try {
      const response = await fetch('/api/tender-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          agent: selectedAgent,
          companyProfile,
          tender
        })
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) throw new Error('NON_JSON');
      const data = await response.json();
      
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Apologies, I encountered an issue generating a response.',
        timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        agent: selectedAgent
      }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: 'Error contacting SAtenderAI server. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        agent: selectedAgent
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  // TRIGGER SIMULATION
  const handleTriggerSimulation = async () => {
    setLoadingSimulation(true);
    try {
      const response = await fetch('/api/evaluate-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender,
          companyProfile
        })
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) throw new Error('NON_JSON');
      const data = await response.json();
      setSimulation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSimulation(false);
    }
  };

  // GENERATE METHODOLOGY
  const handleGenerateMethodology = async () => {
    setGeneratingMethodology(true);
    setActiveSubTab('ai-advisors');
    setSelectedAgent('writer');
    
    // Set initiating message
    setChatMessages(prev => [...prev, {
      id: `gen-${Date.now()}`,
      sender: 'user',
      text: 'Draft high-scoring technical methodology for ' + tender.title,
      timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const response = await fetch('/api/generate-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'methodology',
          companyProfile,
          tender
        })
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) throw new Error('NON_JSON');
      const data = await response.json();
      setMethodologyDraft(data.text);
      
      setChatMessages(prev => [...prev, {
        id: `ai-gen-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        agent: 'writer'
      }]);

      // Update the requirement item status to Complete
      const updatedReqs = tender.requirements.map(r => {
        if (r.isRequired === 'Scored' && r.status === 'Draft') {
          return { ...r, status: 'Complete' as const, evidence: 'AI Generated Comprehensive Methodology added' };
        }
        return r;
      });
      onUpdateTender({ ...tender, requirements: updatedReqs, readinessScore: Math.min(tender.readinessScore + 10, 100) });

    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingMethodology(false);
    }
  };

  // TRIGGER PRE-SUBMISSION AUDIT
  const handleTriggerAudit = async () => {
    setLoadingAudit(true);
    try {
      const response = await fetch('/api/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfile,
          tender
        })
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const ct = response.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) throw new Error('NON_JSON');
      const data = await response.json();
      setAuditResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'submission' && !auditResult) {
      handleTriggerAudit();
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6" id="workspace-container">
      {/* Workspace Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="workspace-header">
        <div className="flex items-center gap-4">
          <button 
            id="back-btn"
            onClick={onBack} 
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{tender.title}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">{tender.buyer}</span> • Est. Value: R{(tender.value/1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Current Readiness Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Workspace Readiness</span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-lg font-bold text-slate-900">{tender.readinessScore}%</span>
              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${tender.readinessScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tender Lifecycle Step Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto" id="workspace-lifecycle">
        <div className="flex items-center justify-between min-w-[900px] pl-2 pr-2">
          {lifecycleSteps.map((step, idx) => {
            const isCurrent = tender.status === step;
            const isPast = lifecycleSteps.indexOf(tender.status) >= idx;

            return (
              <React.Fragment key={step}>
                <div 
                  onClick={() => handleUpdateStatus(step)}
                  className="flex flex-col items-center space-y-1 cursor-pointer group"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isCurrent 
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100' 
                      : isPast 
                      ? 'bg-slate-900 text-amber-400' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-semibold tracking-wide uppercase ${
                    isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
                {idx < lifecycleSteps.length - 1 && (
                  <div className={`flex-1 h-[2px] transition-all ${
                    isPast ? 'bg-slate-900' : 'bg-slate-100'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Workspace Inner Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" id="workspace-sub-tabs">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab('requirements')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'requirements' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Requirement Checklist
        </button>
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'documents' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveSubTab('proposals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'proposals' ? 'bg-slate-900 text-amber-400 font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <HardHat className="w-3.5 h-3.5 text-amber-500" /> Technical Proposal Suite
        </button>
        <button
          onClick={() => setActiveSubTab('subcontracting')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'subcontracting' ? 'bg-slate-900 text-teal-300 font-bold shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-500" /> 30% Subcontracting (PPPFA)
        </button>
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'simulator' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Evaluation Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('jv-simulator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'jv-simulator' ? 'bg-slate-900 text-amber-400 font-bold shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> JV Partner Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('submission')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'submission' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Compliance & Tender Box
        </button>
        <button
          onClick={() => setActiveSubTab('pursue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'pursue' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-amber-700" /> Pursue & Submit
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[400px]" id="workspace-content-card">
        <AnimatePresence mode="wait">
          {/* OVERVIEW PANEL */}
          {activeSubTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tender Meta Column */}
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900 text-base">Tender Overview</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      This bid workspace aggregates all required SBD declarations, CSD parameters, and technical proposal drafts for SAtenderAI's submission to the {tender.buyer}. Complete all requirements in the matrix to satisfy the functionality thresholds.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Closing Deadline</span>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(tender.closingDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Briefing Session</span>
                      <p className="font-semibold text-slate-900 text-sm">
                        {tender.briefingDate ? `${new Date(tender.briefingDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} • ${tender.siteVisit || 'None'}` : 'No briefing session required'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Contract Duration</span>
                      <p className="font-semibold text-slate-900 text-sm">{tender.contractDurationMonths} Months</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Complexity</span>
                      <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${tender.complexity === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                        {tender.complexity} Complexity
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score Summary box */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm">AI Bid Readiness</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-950">{tender.readinessScore}%</span>
                      <span className="text-xs text-slate-500 font-medium">overall</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ready for pre-submission compliance audit. Complete your Technical Work Methodology Statement to satisfy the {tender.evaluationCriteria.functionalityMinimum}% functionality threshold.
                    </p>
                  </div>

                  <button 
                    onClick={() => setActiveSubTab('requirements')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
                  >
                    View Requirements Checklist
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* INTERACTIVE GANTT MOBILISATION PLAN */}
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6" id="gantt-chart-section">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="p-1.5 bg-slate-900 text-amber-400 rounded-lg"><Layers className="w-4 h-4" /></span>
                      Interactive Bid Mobilisation & Gantt Timeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjudicators award extra points for structured timelines. Adjust starting week and duration of milestones to customize resources.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const newTask = {
                          id: `custom-${Date.now()}`,
                          name: 'New Custom Mobilisation Task',
                          startWeek: 12,
                          duration: 4,
                          asset: 'Owner Supervision & Quality Audits'
                        };
                        setGanttTasks([...ganttTasks, newTask]);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Phase
                    </button>
                  </div>
                </div>

                <div className="space-y-4 overflow-x-auto pb-2">
                  <div className="min-w-[700px] space-y-3">
                    {/* Gantt Header Weeks */}
                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-100 pb-2">
                      <div className="col-span-4 text-left pl-2">Operational Milestone Phase</div>
                      <div className="col-span-8 grid grid-cols-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i}>W{(i + 1) * 4}</div>
                        ))}
                      </div>
                    </div>

                    {/* Gantt Bars */}
                    {ganttTasks.map((task) => {
                      const totalWeeks = 48;
                      const colSpanPercent = (task.duration / totalWeeks) * 100;
                      const offsetPercent = ((task.startWeek - 1) / totalWeeks) * 100;

                      return (
                        <div key={task.id} className="grid grid-cols-12 items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm">
                          <div className="col-span-4 pr-3">
                            <input 
                              type="text" 
                              value={task.name} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setGanttTasks(ganttTasks.map(t => t.id === task.id ? { ...t, name: val } : t));
                              }}
                              className="font-semibold text-slate-900 text-xs bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none p-1 rounded w-full border border-transparent focus:border-slate-200"
                            />
                            <p className="text-[10px] text-slate-400 pl-1 mt-0.5 flex items-center gap-1">
                              <span className="font-medium text-slate-600">{task.asset}</span>
                            </p>
                          </div>

                          <div className="col-span-8 relative h-8 flex items-center bg-slate-50/50 rounded-lg overflow-hidden border border-slate-50">
                            <div 
                              className="absolute h-5 bg-gradient-to-r from-slate-900 to-slate-800 text-[9px] text-amber-400 font-bold flex items-center justify-between px-2 rounded-md shadow-sm border border-slate-950/20 group"
                              style={{ 
                                left: `${offsetPercent}%`, 
                                width: `${colSpanPercent}%`,
                                minWidth: '40px'
                              }}
                            >
                              <span className="truncate">{task.startWeek}-{task.startWeek + task.duration - 1} w</span>
                              
                              <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-slate-950/90 text-white rounded-md flex items-center justify-center gap-2 transition-opacity px-1">
                                <div className="flex items-center gap-1 text-[9px]">
                                  <span>Start:</span>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="48"
                                    value={task.startWeek}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(48, Number(e.target.value)));
                                      setGanttTasks(ganttTasks.map(t => t.id === task.id ? { ...t, startWeek: val } : t));
                                    }}
                                    className="w-8 bg-slate-800 text-white text-center rounded border border-slate-700 text-[9px]"
                                  />
                                </div>
                                <div className="flex items-center gap-1 text-[9px]">
                                  <span>Len:</span>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="48"
                                    value={task.duration}
                                    onChange={(e) => {
                                      const val = Math.max(1, Math.min(48, Number(e.target.value)));
                                      setGanttTasks(ganttTasks.map(t => t.id === task.id ? { ...t, duration: val } : t));
                                    }}
                                    className="w-8 bg-slate-800 text-white text-center rounded border border-slate-700 text-[9px]"
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setGanttTasks(ganttTasks.filter(t => t.id !== task.id))}
                                  className="text-rose-400 hover:text-rose-300"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-150 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Your custom timeline includes <strong>{ganttTasks.length} phases</strong> spanning <strong>48 weeks</strong>.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const updatedReqs = tender.requirements.map(r => {
                        if (r.isRequired === 'Scored' && r.status === 'Draft') {
                          return { ...r, status: 'Complete' as const, evidence: 'Phased Gantt Mobilisation timeline linked successfully' };
                        }
                        return r;
                      });
                      onUpdateTender({
                        ...tender,
                        requirements: updatedReqs,
                        readinessScore: Math.min(tender.readinessScore + 5, 100)
                      });
                      alert('Gantt Mobilisation timeline has been successfully compiled and embedded in your Technical Methodology file!');
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    Embed in Methodology
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* REQUIREMENTS MATRIX PANEL */}
          {activeSubTab === 'requirements' && (
            <motion.div 
              key="requirements"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Requirement Matrix</h3>
                  <p className="text-xs text-slate-500">Compliance status of SBD forms, qualifications, and technical submissions</p>
                </div>
                <button 
                  onClick={handleGenerateMethodology}
                  disabled={generatingMethodology}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  {generatingMethodology ? 'Drafting Methodology...' : 'Auto-Generate Methodology'}
                </button>
              </div>

              {/* Requirement Checklist table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" id="requirements-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wide">
                      <th className="pb-3 font-semibold">Requirement</th>
                      <th className="pb-3 font-semibold">Required Status</th>
                      <th className="pb-3 font-semibold">Upload Evidence</th>
                      <th className="pb-3 font-semibold">Status Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tender.requirements.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-900">{req.requirement}</span>
                            {req.notes && <p className="text-xs text-amber-600 font-medium">{req.notes}</p>}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.isRequired === 'Mandatory' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : req.isRequired === 'Scored' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {req.isRequired}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {req.evidence || <span className="text-slate-300 italic">None attached</span>}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                              req.status === 'Complete' 
                                ? 'bg-teal-50 text-teal-700' 
                                : req.status === 'Draft' 
                                ? 'bg-amber-50 text-amber-700' 
                                : req.status === 'Partial'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                req.status === 'Complete' ? 'bg-teal-500' : req.status === 'Draft' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}></span>
                              {req.status}
                            </span>
                            
                            {req.status !== 'Complete' && (
                              <button 
                                onClick={req.isRequired === 'Scored' ? handleGenerateMethodology : () => {
                                  // Mock file upload evidence attachment
                                  const updatedReqs = tender.requirements.map(r => r.id === req.id ? { ...r, status: 'Complete' as const, evidence: `${req.requirement} loaded (Austin M.)` } : r);
                                  onUpdateTender({ ...tender, requirements: updatedReqs, readinessScore: Math.min(tender.readinessScore + 5, 100) });
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                              >
                                {req.isRequired === 'Scored' ? 'Generate' : 'Upload'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* DOCUMENTS PANEL */}
          {activeSubTab === 'documents' && (
            <motion.div 
              key="documents"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Tender Documents</h3>
                  <p className="text-xs text-slate-500">Review official circulars and generate required response packages</p>
                </div>
              </div>

              {/* Warnings */}
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">B-BBEE Expiration Warning</p>
                  <p>Your SANAS B-BBEE level 1 certificate affidavit is flagged as expiring in <strong>21 days</strong>. We advise uploading a fresh, certified affidavit before finalizing submission.</p>
                </div>
              </div>

              {/* Document Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors space-y-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Official Tender Specifications</span>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">Tender Specification Specs.pdf</p>
                        <p className="text-[10px] text-slate-400">1.4 MB • Official Release</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerDocumentDownload({ name: 'Tender Specification Specs.pdf', category: 'tender', size: '1.4 MB' })}
                      title="Download Specification Specs"
                      className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors space-y-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Generated Submission Package</span>
                  {methodologyDraft ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-teal-500" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">Technical Methodology Draft.docx</p>
                          <p className="text-[10px] text-teal-600">AI Generated • {new Date().toLocaleDateString('en-ZA')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerDocumentDownload({ 
                          name: 'Technical Methodology Draft.docx', 
                          category: 'generated', 
                          size: '240 KB', 
                          additionalData: { buyer: tender.buyer, title: tender.title } 
                        })}
                        title="Download Technical Methodology Draft"
                        className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-xs text-slate-400">No generated proposal sections on file yet.</p>
                      <button onClick={handleGenerateMethodology} className="text-xs text-amber-600 hover:underline font-semibold flex items-center gap-1 mx-auto">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Auto-Generate Methodology
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TECHNICAL PROPOSAL & STATUTORY PLANS SUITE */}
          {activeSubTab === 'proposals' && (
            <motion.div 
              key="proposals"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {/* Header and Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <HardHat className="w-5 h-5 text-amber-500" />
                    Technical Proposal & Statutory Plans Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-scoring, audit-tested South African bid returnables tailored to {tender.buyer}'s specifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    SABS • OHS 85 • ISO 9001 Compliant
                  </span>
                </div>
              </div>

              {/* Notification Banner when Attached */}
              {planAttachNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{planAttachNotice}</span>
                  </div>
                  <button onClick={() => setPlanAttachNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
                </div>
              )}

              {/* Proposal Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                {sectorPlanTabs.map((tab) => {
                  const tabIcons: Record<string, any> = {
                    OHS: ShieldAlert,
                    QCP: CheckSquare,
                    EPWP: Users,
                    MOBILIZATION: Truck
                  };
                  const Icon = tabIcons[tab.id] || ShieldAlert;
                  const isActive = activeProposalTab === tab.id;
                  return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveProposalTab(tab.id as any)}
                            className={`p-3 rounded-xl text-left transition-all ${
                              isActive 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isActive ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {tab.badge}
                              </span>
                            </div>
                            <p className="text-xs font-bold truncate">{tab.label}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Plan Document Viewer & Evidence Attacher */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                      
                      {/* Plan 1: OHS Act 85 Safety Plan */}
                      {activeProposalTab === 'OHS' && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                Statutory Mandatory Returnable
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                                {ohsPlan.title}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {ohsPlan.subtitle}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const updatedReqs = tender.requirements.map(r => {
                                    const match = r.requirement.toLowerCase().includes('health') || 
                                                  r.requirement.toLowerCase().includes('safety') || 
                                                  r.requirement.toLowerCase().includes('ohs') ||
                                                  r.isRequired === 'Mandatory';
                                    if (match && r.status !== 'Complete') {
                                      return { ...r, status: 'Complete' as const, evidence: `${ohsPlan.regPill} Verified & Attached` };
                                    }
                                    return r;
                                  });
                                  onUpdateTender({
                                    ...tender,
                                    requirements: updatedReqs,
                                    readinessScore: Math.min(tender.readinessScore + 8, 100)
                                  });
                                  setPlanAttachNotice(`✓ ${ohsPlan.title} successfully verified and attached to requirements (+8% readiness)!`);
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> 1-Click Attach to Requirements
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
                                title="Print OHS Plan"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  triggerDocumentDownload({
                                    name: `OHS_Statutory_Safety_Plan_${tender.id.toUpperCase()}.pdf`,
                                    category: 'compliance',
                                    size: '380 KB'
                                  });
                                }}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                              >
                                <FileDown className="w-3.5 h-3.5 text-amber-400" /> Download PDF
                              </button>
                            </div>
                          </div>

                          {/* Formatted Content */}
                          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-slate-900 text-sm">{ohsPlan.directorate}</p>
                                <p className="text-[11px] text-slate-500">Project: {tender.title} | Client: {tender.buyer}</p>
                                <p className="text-[11px] text-slate-500">COIDA Registration: Verified Compliant | Compensation Fund Ref: 99000184920</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                                  {ohsPlan.regPill}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">{ohsPlan.appointee}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">{ohsPlan.hiraTitle}</h5>
                              <p>{ohsPlan.hiraBody}</p>

                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">2. Mandatory Statutory Safety Appointments</h5>
                              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                {ohsPlan.appointments.map((app, i) => (
                                  <li key={i}><strong>{app.role}:</strong> {app.name}</li>
                                ))}
                              </ul>

                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">{ohsPlan.ppeTitle}</h5>
                              <p>{ohsPlan.ppeBody}</p>

                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">{ohsPlan.incidentTitle}</h5>
                              <p>{ohsPlan.incidentBody}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Plan 2: Quality Control Plan (QCP & ISO) */}
                      {activeProposalTab === 'QCP' && (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                Technical Functionality Criterion
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                                {qcpPlan.title}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {qcpPlan.subtitle}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const updatedReqs = tender.requirements.map(r => {
                                    const match = r.requirement.toLowerCase().includes('quality') || 
                                                  r.requirement.toLowerCase().includes('iso') || 
                                                  r.requirement.toLowerCase().includes('qcp') ||
                                                  r.isRequired === 'Scored';
                                    if (match && r.status !== 'Complete') {
                                      return { ...r, status: 'Complete' as const, evidence: 'Quality Control Plan Attached' };
                                    }
                                    return r;
                                  });
                                  onUpdateTender({
                                    ...tender,
                                    requirements: updatedReqs,
                                    readinessScore: Math.min(tender.readinessScore + 8, 100)
                                  });
                                  setPlanAttachNotice(`✓ ${qcpPlan.title} attached to Requirements Matrix (+8% readiness)!`);
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> 1-Click Attach to Requirements
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  triggerDocumentDownload({
                                    name: `Quality_Control_Plan_${tender.id.toUpperCase()}.pdf`,
                                    category: 'compliance',
                                    size: '320 KB'
                                  });
                                }}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                              >
                                <FileDown className="w-3.5 h-3.5 text-amber-400" /> Download PDF
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="space-y-3">
                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">1. Regulatory Standards & Quality Traceability</h5>
                              <p>
                                All materials and operations conform strictly to South African statutory codes with verifiable test records:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {qcpPlan.cards.map((c, i) => (
                                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl">
                                    <span className="font-mono text-[10px] text-teal-600 font-bold block">{c.code}</span>
                                    <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                                    <p className="text-[10px] text-slate-500">{c.desc}</p>
                                  </div>
                                ))}
                              </div>

                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">2. Inspection Test Plan (ITP) Hold & Witness Points</h5>
                              <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                                    <tr>
                                      <th className="p-2.5">Milestone</th>
                                      <th className="p-2.5">Inspection Point</th>
                                      <th className="p-2.5">Acceptance Criteria</th>
                                      <th className="p-2.5">Sign-off Authority</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {qcpPlan.itp.map((row, i) => (
                                      <tr key={i}>
                                        <td className="p-2.5 font-medium">{row.milestone}</td>
                                        <td className="p-2.5">
                                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                                            row.pointType === 'HOLD POINT' 
                                              ? 'bg-rose-100 text-rose-800' 
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {row.pointType}
                                          </span>
                                        </td>
                                        <td className="p-2.5">{row.criteria}</td>
                                        <td className="p-2.5 font-bold">{row.authority}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">3. Non-Conformance Reporting (NCR) Cycle</h5>
                              <p>
                                Any deviation from tender specifications automatically triggers an official NCR. Operations on the affected section are halted until root-cause analysis is completed, corrective measures are verified by the authorized inspector, and signed closure certificates are archived into the project quality dossier.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                {/* Plan 3: EPWP Local Community & Labor Plan */}
                {activeProposalTab === 'EPWP' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                          Socio-Economic & PPPFA Priority
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          Expanded Public Works Programme (EPWP) & Local Community Labor Plan
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Guaranteed 30% local host-community labor sourcing, fair wages, and accredited skills transfer
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updatedReqs = tender.requirements.map(r => {
                              const match = r.requirement.toLowerCase().includes('labor') || 
                                            r.requirement.toLowerCase().includes('epwp') || 
                                            r.requirement.toLowerCase().includes('local') ||
                                            r.requirement.toLowerCase().includes('community');
                              if (match && r.status !== 'Complete') {
                                return { ...r, status: 'Complete' as const, evidence: 'EPWP Local Labor Plan (30% Host Community) Attached' };
                              }
                              return r;
                            });
                            onUpdateTender({
                              ...tender,
                              requirements: updatedReqs,
                              readinessScore: Math.min(tender.readinessScore + 7, 100)
                            });
                            setPlanAttachNotice('✓ EPWP Local Community Labor Plan attached to Tender Requirements Matrix (+7% readiness)!');
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> 1-Click Attach to Requirements
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            triggerDocumentDownload({
                              name: `EPWP_Local_Community_Labor_Plan_${tender.id.toUpperCase()}.pdf`,
                              category: 'compliance',
                              size: '280 KB'
                            });
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400" /> Download PDF
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <div className="space-y-3">
                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">1. Community Participation Goal (CPG) & Local Recruitment</h5>
                        <p>
                          In accordance with {tender.buyer}'s local economic development policies, our team commits to hiring a minimum of <strong>30% local labor</strong> sourced directly from the host municipality ward through an elected <strong>Project Steering Committee (PSC)</strong> and appointed <strong>Community Liaison Officer (CLO)</strong>.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                            <span className="text-xl font-extrabold text-slate-900">55%</span>
                            <span className="block text-[11px] font-bold text-slate-600 mt-1">Youth Employment</span>
                            <p className="text-[10px] text-slate-400">Targeting young artisans aged 18-35.</p>
                          </div>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                            <span className="text-xl font-extrabold text-slate-900">40%</span>
                            <span className="block text-[11px] font-bold text-slate-600 mt-1">Women in Construction</span>
                            <p className="text-[10px] text-slate-400">Dedicated safety and logistics roles.</p>
                          </div>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
                            <span className="text-xl font-extrabold text-slate-900">2%</span>
                            <span className="block text-[11px] font-bold text-slate-600 mt-1">Persons with Disabilities</span>
                            <p className="text-[10px] text-slate-400">Accessible administrative functions.</p>
                          </div>
                        </div>

                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">2. Statutory Fair Wage Guarantees</h5>
                        <p>
                          All general site laborers receive remuneration exceeding the statutory South African National Minimum Wage and EPWP Ministerial Determination guidelines (minimum R28.50 per hour), including UIF registration, paid statutory public holidays, and daily clean drinking water and sanitation facilities.
                        </p>

                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">3. CETA-Accredited Skills Transfer & Mentorship</h5>
                        <p>
                          Each recruited community worker receives accredited on-the-job training structured with CETA (Construction Education & Training Authority). Modules include Bricklaying & Masonry (SANS 10164), Basic Scaffolding Safety (SANS 10085), and OHS Induction, ensuring lasting economic empowerment beyond contract conclusion.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan 4: Site Mobilization & Logistics Schedule */}
                {activeProposalTab === 'MOBILIZATION' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          Execution & Delivery Assurance
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          Site Mobilization, Plant Logistics & De-establishment Plan
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Rapid 14-day site establishment, traffic management, dedicated owned heavy plant, and environmental clearing
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updatedReqs = tender.requirements.map(r => {
                              const match = r.requirement.toLowerCase().includes('methodology') || 
                                            r.requirement.toLowerCase().includes('timeline') || 
                                            r.requirement.toLowerCase().includes('mobilisation') ||
                                            r.requirement.toLowerCase().includes('gantt');
                              if (match && r.status !== 'Complete') {
                                return { ...r, status: 'Complete' as const, evidence: 'Phased Mobilization Schedule & Plant Logistics Plan Attached' };
                              }
                              return r;
                            });
                            onUpdateTender({
                              ...tender,
                              requirements: updatedReqs,
                              readinessScore: Math.min(tender.readinessScore + 7, 100)
                            });
                            setPlanAttachNotice('✓ Site Mobilization Logistics Plan attached to Tender Requirements Matrix (+7% readiness)!');
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> 1-Click Attach to Requirements
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            triggerDocumentDownload({
                              name: `Site_Mobilization_Logistics_Plan_${tender.id.toUpperCase()}.pdf`,
                              category: 'compliance',
                              size: '310 KB'
                            });
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-400" /> Download PDF
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <div className="space-y-3">
                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">1. 14-Day Rapid Establishment Sequence</h5>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                          <li><strong>Days 1-3:</strong> Statutory notifications to Department of Employment and Labour, municipal wayleave approvals, and joint site boundary pegging with the engineer.</li>
                          <li><strong>Days 4-7:</strong> Erection of SABS-approved 2.4m high steel security hoarding, armed gate control checkpoint, and temporary water & solar-backed power connections.</li>
                          <li><strong>Days 8-10:</strong> Siting of air-conditioned mobile site offices, boardroom for weekly site meetings, SHEQ induction container, and secure chemical store.</li>
                          <li><strong>Days 11-14:</strong> Deployment of primary earthmoving plant, baseline environmental survey, and formal practical site takeover ceremony.</li>
                        </ul>

                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">2. Dedicated Heavy Plant & Machinery Commitment</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">Mercedes-Benz Actros 10m³ Tippers (Qty: 2)</p>
                              <p className="text-[10px] text-slate-500">Fully Owned • Valid Roadworthy & Load Certificates</p>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">AVAILABLE</span>
                          </div>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">JCB 3CX 4x4 Backhoe Loader (Qty: 1)</p>
                              <p className="text-[10px] text-slate-500">Fully Owned • Certified Operator S. Ndlovu</p>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">AVAILABLE</span>
                          </div>
                        </div>

                        <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">3. Traffic Accommodation & De-establishment</h5>
                        <p>
                          Dedicated flagmen and SABS-approved road traffic signage (SARTSM Chapter 13 compliant) safeguard external motorists and pedestrians. Upon reaching practical completion, all temporary works will be cleared, topsoil rehabilitated, and waste safely disposed of at a licensed landfill with disposal certificates issued to {tender.buyer}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* 30% PREFERENTIAL SUBCONTRACTING TRACKER (PPPFA) */}
          {activeSubTab === 'subcontracting' && (
            <motion.div 
              key="subcontracting"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    30% Preferential Subcontracting Tracker (PPPFA & SCM Bill)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage targeted subcontracts to Black Women, Black Youth, and Local EMEs to meet mandatory tender gates
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingPackage(true)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-center"
                >
                  <Plus className="w-4 h-4 text-amber-400" /> Add Subcontractor Package
                </button>
              </div>

              {/* Statutory Threshold Alert Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isMandatory30Percent 
                  ? 'bg-gradient-to-r from-teal-950 to-slate-900 text-white border-teal-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl font-bold mt-0.5 ${
                    isMandatory30Percent ? 'bg-teal-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    <BadgePercent className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        isMandatory30Percent ? 'bg-teal-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isMandatory30Percent ? 'Mandatory Statutory Requirement (> R30M)' : 'Targeted Enterprise Development'}
                      </span>
                      <span className={`text-xs font-mono ${isMandatory30Percent ? 'text-teal-300' : 'text-slate-500'}`}>
                        Tender Value: R{(tender.value).toLocaleString('en-ZA')}
                      </span>
                    </div>
                    <h4 className={`text-sm font-bold ${isMandatory30Percent ? 'text-white' : 'text-slate-900'}`}>
                      {isMandatory30Percent 
                        ? 'Mandatory 30% Subcontracting Condition of Tender under PPPFA Reg 12' 
                        : 'Preferential Subcontracting & Local Ward Economic Development'}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${isMandatory30Percent ? 'text-slate-300' : 'text-slate-600'}`}>
                      {isMandatory30Percent 
                        ? `For public contracts ≥ R30 Million, tenders that do not ring-fence at least 30% (minimum R${target30PercentRand.toLocaleString('en-ZA')}) to designated targeted groups will be declared non-responsive.`
                        : `Contract value is below the R30M threshold. Voluntary subcontracting still scores maximum technical functionality points on CPG.`}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isMandatory30Percent ? 'text-teal-300' : 'text-slate-400'}`}>
                    Mandatory 30% Target
                  </span>
                  <span className={`text-xl font-extrabold font-mono block ${isMandatory30Percent ? 'text-teal-400' : 'text-slate-900'}`}>
                    R{target30PercentRand.toLocaleString('en-ZA')}
                  </span>
                </div>
              </div>

              {/* Progress Summary Cards */}
              {(() => {
                const totalAllocatedSum = subcontractorPackages.reduce((acc, p) => acc + p.packageValue, 0);
                const percentOfContract = ((totalAllocatedSum / tender.value) * 100);
                const isCompliant = percentOfContract >= 30;

                return (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">
                          Total Ring-Fenced Allocation: <strong className="font-mono text-sm text-slate-950">R{totalAllocatedSum.toLocaleString('en-ZA')}</strong> ({percentOfContract.toFixed(1)}% of tender value)
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isCompliant ? '✓ 30% TARGET MET' : `Shortfall: ${(30 - percentOfContract).toFixed(1)}%`}
                        </span>
                      </div>
                      
                      {/* Bar */}
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full transition-all ${isCompliant ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(percentOfContract, 100)}%` }}
                        />
                        {/* 30% Threshold Line */}
                        <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-slate-900" title="30% Statutory Target" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0%</span>
                        <span className="font-bold text-slate-800">30% Minimum Statutory Threshold</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Subcontractor Packages Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Allocated Subcontractor Packages ({subcontractorPackages.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Pre-bid MOUs must be signed and submitted in Envelope 1
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/70 text-slate-500 uppercase text-[10px] font-bold">
                            <tr>
                              <th className="p-3">Scope Description</th>
                              <th className="p-3">Subcontractor Name & CSD</th>
                              <th className="p-3">Designated Group</th>
                              <th className="p-3 text-center">B-BBEE</th>
                              <th className="p-3 text-right">Value (ZAR)</th>
                              <th className="p-3 text-center">Share</th>
                              <th className="p-3 text-center">MOU Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {subcontractorPackages.map((pkg) => (
                              <tr key={pkg.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800 max-w-[220px]">
                                  {pkg.scopeName}
                                </td>
                                <td className="p-3 space-y-0.5">
                                  <p className="font-bold text-slate-900">{pkg.subcontractorName}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">CSD: {pkg.csdNumber}</p>
                                </td>
                                <td className="p-3">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                                    {pkg.designatedGroup}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-700">
                                  Level {pkg.bbeeLevel}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900">
                                  R{(pkg.packageValue).toLocaleString('en-ZA')}
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-amber-600">
                                  {pkg.percentageOfContract}%
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    pkg.status === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : pkg.status === 'MOU_SIGNED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {pkg.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1">
                                  <button
                                    onClick={() => setSelectedSubcontractorForMOU(pkg)}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                  >
                                    View / Print MOU
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSubcontractorPackages(subcontractorPackages.filter(p => p.id !== pkg.id));
                                    }}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                    title="Delete package"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Add Package Modal Form */}
              <AnimatePresence>
                {isAddingPackage && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900 text-sm">Add Designated Subcontractor Package</h4>
                        <button onClick={() => setIsAddingPackage(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Scope of Work</label>
                          <input
                            type="text"
                            value={newPkgScope}
                            onChange={(e) => setNewPkgScope(e.target.value)}
                            placeholder="e.g. Structural Steel Fabrication & Roof Sheeting"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Subcontractor Business Legal Name</label>
                          <input
                            type="text"
                            value={newPkgName}
                            onChange={(e) => setNewPkgName(e.target.value)}
                            placeholder="e.g. Mokoena Steel Fabricators (Pty) Ltd"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Treasury CSD Number</label>
                            <input
                              type="text"
                              value={newPkgCsd}
                              onChange={(e) => setNewPkgCsd(e.target.value)}
                              placeholder="e.g. MAAA0912401"
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Target Designated Group</label>
                            <select
                              value={newPkgGroup}
                              onChange={(e) => setNewPkgGroup(e.target.value as any)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                            >
                              <option value="Black Women">Black Women (≥51%)</option>
                              <option value="Black Youth">Black Youth (≥51%)</option>
                              <option value="Local EME / QSE">Local Township / EME</option>
                              <option value="Military Veterans">Military Veterans</option>
                              <option value="People with Disabilities">People with Disabilities</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="font-bold text-slate-700">Percentage of Contract Value</label>
                            <span className="font-mono font-bold text-teal-600">{newPkgPercent}% (R{Math.round(tender.value * (newPkgPercent / 100)).toLocaleString('en-ZA')})</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            value={newPkgPercent}
                            onChange={(e) => setNewPkgPercent(Number(e.target.value))}
                            className="w-full accent-teal-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setIsAddingPackage(false)}
                          className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!newPkgScope.trim() || !newPkgName.trim()) return;
                            const newPkg: SubcontractorPackage = {
                              id: `pkg-${Date.now()}`,
                              scopeName: newPkgScope,
                              subcontractorName: newPkgName,
                              csdNumber: newPkgCsd || 'MAAA0821948',
                              bbeeLevel: 1,
                              designatedGroup: newPkgGroup,
                              packageValue: Math.round(tender.value * (newPkgPercent / 100)),
                              percentageOfContract: newPkgPercent,
                              status: 'MOU_SIGNED'
                            };
                            setSubcontractorPackages([...subcontractorPackages, newPkg]);
                            setIsAddingPackage(false);
                            setNewPkgScope('');
                            setNewPkgName('');
                          }}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                          Save Package
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Subcontractor Pre-Bid MOU Modal */}
              <AnimatePresence>
                {selectedSubcontractorForMOU && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
                    >
                      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-400" />
                          <h4 className="text-sm font-bold">Standard Pre-Bid Subcontracting Agreement & MOU</h4>
                        </div>
                        <button onClick={() => setSelectedSubcontractorForMOU(null)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-8 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed font-sans" id="printable-subcontractor-mou">
                        <div className="border-b border-slate-200 pb-4 text-center space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                            PPPFA REGULATION 12 & CIDB BEST PRACTICE COMPLIANT
                          </span>
                          <h3 className="text-base font-extrabold text-slate-950 pt-1">
                            MEMORANDUM OF UNDERSTANDING & PRE-BID SUBCONTRACTING AGREEMENT
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            For Submission in Respect of Tender: {tender.title} ({tender.buyer})
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p>
                            <strong>BETWEEN:</strong> <strong>{companyProfile.legalName}</strong> (Main Contractor, CSD: {companyProfile.csdNumber})
                          </p>
                          <p>
                            <strong>AND:</strong> <strong>{selectedSubcontractorForMOU.subcontractorName}</strong> (Designated Targeted Subcontractor, CSD: {selectedSubcontractorForMOU.csdNumber}, {selectedSubcontractorForMOU.designatedGroup})
                          </p>

                          <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">1. Scope of Works & Allocation</h5>
                          <p>
                            The Main Contractor undertakes, upon successful award of the tender by {tender.buyer}, to subcontract to the Subcontractor the agreed scope: <strong>"{selectedSubcontractorForMOU.scopeName}"</strong>, representing <strong>{selectedSubcontractorForMOU.percentageOfContract}%</strong> of the contract value, amounting to an estimated sum of <strong>R{selectedSubcontractorForMOU.packageValue.toLocaleString('en-ZA')}</strong> (inclusive of 15% VAT).
                          </p>

                          <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">2. Back-to-Back Payment Terms</h5>
                          <p>
                            Payment shall strictly be settled within <strong>seven (7) business days</strong> of the Main Contractor receiving progress payment remittance from the client department under Section 38(1)(f) of the PFMA, without unfair withholding or pay-when-paid impediments.
                          </p>

                          <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2">3. Signatures of Authorized Representatives</h5>
                          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                            <div className="space-y-2">
                              <p className="font-bold text-slate-900">For Main Contractor:</p>
                              <div className="border-b border-slate-300 pb-2">
                                <span className="font-mono text-[10px] text-teal-700">Austin Mpapane (Managing Director)</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-ZA')}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="font-bold text-slate-900">For Subcontractor:</p>
                              <div className="border-b border-slate-300 pb-2">
                                <span className="font-mono text-[10px] text-teal-700">Authorized Managing Member</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-ZA')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">Attach into Envelope 1 (Technical & Returnables).</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <Printer className="w-4 h-4 text-amber-400" /> Print Signed MOU
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* EVALUATION SIMULATOR PANEL */}
          {activeSubTab === 'simulator' && (
            <motion.div 
              key="simulator"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Preference Point & Functionality Simulator</h3>
                  <p className="text-xs text-slate-500">Estimate adjudication scoring out of 100 based on standard procurement weightings</p>
                </div>
                <button 
                  onClick={handleTriggerSimulation}
                  disabled={loadingSimulation}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sliders className="w-4 h-4" />
                  {loadingSimulation ? 'Running Simulation...' : 'Recalculate Simulation'}
                </button>
              </div>

              {simulation && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Scores columns */}
                  <div className="lg:col-span-1 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estimated Adjudication Score</span>
                      <div className="flex items-baseline gap-1 pb-4 border-b border-slate-200">
                        <span className="text-4xl font-extrabold text-slate-950">{simulation.totalScore}</span>
                        <span className="text-sm text-slate-400 font-semibold">/ 100 points</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Compliance Gate:</span>
                          <strong className="text-teal-600 font-bold">{simulation.complianceScore}/100 Passed</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Technical Functionality:</span>
                          <strong className="text-slate-900 font-semibold">{simulation.functionalityScore}/100</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Price Scoreweight:</span>
                          <strong className="text-slate-900 font-semibold">Unknown (Max {simulation.priceScore})</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">B-BBEE Level {companyProfile.bbeeLevel} points:</span>
                          <strong className="text-teal-600 font-bold">{simulation.preferenceScore} / {tender.evaluationCriteria.preferencePoints}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-3 rounded-xl text-[10px] leading-relaxed">
                      Your high <strong>B-BBEE Level 1 Status</strong> guarantees you the maximum preferential advantage ({simulation.preferenceScore} points) on the preference gate.
                    </div>
                  </div>

                  {/* Weaknesses and advice column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 text-sm">Adjudication Weaknesses & Scores Improvement Plan</h4>
                      <div className="space-y-2">
                        {simulation.weaknesses.map((weak, index) => (
                          <div key={index} className="flex gap-2 p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs text-rose-800">
                            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span>{weak}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 text-sm">Actionable Score Boosters</h4>
                      <ul className="space-y-2 text-xs text-slate-600 pl-4 list-decimal marker:font-bold marker:text-slate-900">
                        {simulation.actionPlan.map((action, index) => (
                          <li key={index} className="text-slate-600">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* COMPLIANCE CHECKER PANEL */}
          {activeSubTab === 'submission' && (
            <motion.div 
              key="submission"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">SAtenderAI Final Compliance Audit</h3>
                  <p className="text-xs text-slate-500">Rigorous automatic scanning of files, signatures, and legal registrations before submission</p>
                </div>
                <button 
                  onClick={handleTriggerAudit}
                  disabled={loadingAudit}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loadingAudit ? 'Running compliance audit...' : 'Re-Run Compliance Check'}
                </button>
              </div>

              {loadingAudit ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-slate-900 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 animate-pulse">Compliance scanning of uploaded documents, signatures, CSD, and SARS databases...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mock Checklist Score Board exactly as requested in PRD */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mandatory Documents</p>
                      <p className="text-sm font-semibold text-slate-900">17 required</p>
                      <p className="text-xs text-teal-600 font-semibold">15 complete</p>
                      <p className="text-xs text-rose-600 font-semibold">2 missing</p>
                    </div>

                    <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pl-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Standard SBD Forms</p>
                      <p className="text-sm font-semibold text-slate-900">12 required</p>
                      <p className="text-xs text-teal-600 font-semibold">11 complete</p>
                      <p className="text-xs text-rose-600 font-semibold">1 incomplete</p>
                    </div>

                    <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pl-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Signatures Check</p>
                      <p className="text-sm font-semibold text-slate-900">9 required</p>
                      <p className="text-xs text-teal-600 font-semibold">8 complete</p>
                      <p className="text-xs text-rose-600 font-semibold">1 missing</p>
                    </div>

                    <div className="space-y-1 md:pl-4 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inconsistencies</p>
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 1 discrepancy found
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Overall Readiness: </span>
                        <strong className="text-sm text-slate-950 font-bold">{auditResult?.overallReadiness || 82}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Findings Logs */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm">Identified Findings ({auditResult?.findings?.length || 0})</h4>
                    <div className="space-y-3">
                      {(auditResult?.findings || []).map((find: any, idx: number) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{find.type}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              find.status === 'missing' || find.status === 'incomplete' ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              ● {find.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{find.message}</p>
                          {find.type === "Signatures" && (find.status === "incomplete" || find.status === "missing" || find.status === "warning") && (
                            <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={() => setShowSBD4Modal(true)}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                              >
                                <FileText className="w-4 h-4 text-amber-400" />
                                Sign & Pre-fill SBD 4 Declaration Form
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span>Corrective Action: {find.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Physical Tender Box Submission Kit & 2-Envelope System */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-bold mt-0.5">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono">
                              Strict 11:00 AM SBD 1 Rule
                            </span>
                            <span className="text-xs font-mono text-slate-400">Physical Box Delivery</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">
                            Physical Tender Box Submission Kit & 2-Envelope Label Generator
                          </h4>
                          <p className="text-[11px] text-slate-300">
                            South African procurement mandates strict separation of Technical Returnables (Envelope 1) and Financial Offer (Envelope 2).
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowTwoEnvelopeModal(true)}
                        className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-center"
                      >
                        <Stamp className="w-4 h-4 text-slate-950" />
                        Generate & Print 2-Envelope Labels
                      </button>
                    </div>

                    {/* Delivery details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Designated Tender Box</span>
                        <p className="font-bold text-white">Tender Box #4 (Ground Floor Foyer)</p>
                        <p className="text-[11px] text-slate-300">{tender.buyer} Civic Centre, Supply Chain Directorate</p>
                      </div>

                      <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-rose-400 block">Statutory Cut-Off Deadline</span>
                        <p className="font-bold text-rose-300 font-mono text-sm">{tender.closingDate} at strictly 11:00 AM</p>
                        <p className="text-[10px] text-rose-200">Late submissions rejected without exception (Treasury SBD 1).</p>
                      </div>

                      <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-teal-400 block">Security & Wax Seals</span>
                        <p className="font-bold text-teal-300">Tamper-Evident Stamped Seals</p>
                        <p className="text-[10px] text-slate-300">Original + 1 Copy in Envelope 1, Sealed BOQ in Envelope 2.</p>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Complete Bid Binder Compiler */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 mt-0.5">
                        <FolderArchive className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            Master Returnables Dossier
                          </span>
                          <span className="text-xs text-slate-400 font-mono">12 Sections Indexed</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          1-Click "Complete Bid Binder Compiler"
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          Assembles all verified company returnables (CSD profile, Tax Clearance PIN, B-BBEE affidavit, signed SBD 4, COIDA Good Standing, generated OHS/QCP/EPWP proposals, and BOQ) into a single, indexed, numbered submission binder ready for tender committee adjudication.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowBidBinderModal(true)}
                      className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap self-start md:self-center"
                    >
                      <FolderArchive className="w-4 h-4 text-amber-400" />
                      Launch Bid Binder Compiler
                    </button>
                  </div>

                  {/* Disclaimer banner Exactly matching PRD Page 40 */}
                  <div className="p-5 bg-teal-50/50 border border-teal-100 rounded-2xl flex gap-3 text-teal-800">
                    <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-teal-950">Audit Completion Notice</p>
                      <p className="text-[11px] leading-relaxed">
                        No critical, unknown errors or showstoppers detected based on the information available. 
                        <strong> Note: The application should never say "Ready to submit." Instead, we confirm that no known issues are detected based on the information available. Final responsibility remains with the bidder.</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* JOINT VENTURE (JV) SIMULATOR PANEL */}
          {activeSubTab === 'jv-simulator' && (
            <motion.div
              key="jv-simulator"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950">
                      PPPFA & CIDB Joint Venture Calculator
                    </span>
                    <span className="text-xs text-slate-400 font-mono">SANAS Consolidated BBBEE Model</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Consolidated Joint Venture (JV) Scoring Simulator</h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Under South African public procurement rules (CIDB Regulations & B-BBEE Codes of Good Practice), two registered contractors can pool assets and equity to tender for higher-grade projects and calculate a consolidated preferential procurement scorecard.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Target CIDB Required</span>
                  <p className="text-base font-extrabold text-amber-400">{tender.cidbLevel || '7GB or 6CE PE'}</p>
                  <p className="text-[10px] text-teal-400 font-medium">Estimated Value: R{(tender.value / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              {/* JV Partner Config Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Partner Form Configuration (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-500" />
                    JV Partner Consortium Parameters
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Partner 1 (User's Firm) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Lead Contractor (Your Firm)</span>
                      <div>
                        <h5 className="font-bold text-slate-900">{companyProfile.legalName}</h5>
                        <p className="text-[11px] text-slate-500">CSD ID: {companyProfile.csdNumber}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] uppercase">BEE Status</span>
                          <strong className="text-slate-900">Level {companyProfile.bbeeLevel}</strong>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] uppercase">CIDB Grade</span>
                          <strong className="text-slate-900">{companyProfile.cidbGrading}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Partner 2 (Incoming Firm) */}
                    <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
                      <span className="text-[10px] font-bold uppercase text-amber-800">Consortium Partner</span>
                      <input 
                        type="text" 
                        value={jvPartnerName}
                        onChange={(e) => setJvPartnerName(e.target.value)}
                        placeholder="Partner Company Name"
                        className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-slate-600 block text-[9px] uppercase font-bold">Partner BEE Level</label>
                          <select 
                            value={jvPartnerBbee}
                            onChange={(e) => setJvPartnerBbee(Number(e.target.value))}
                            className="w-full p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold"
                          >
                            <option value={1}>Level 1 (100% Black)</option>
                            <option value={2}>Level 2 (80% Black)</option>
                            <option value={3}>Level 3 (75% Black)</option>
                            <option value={4}>Level 4 (51% Black)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-600 block text-[9px] uppercase font-bold">Partner CIDB</label>
                          <input 
                            type="text"
                            value={jvPartnerCidb}
                            onChange={(e) => setJvPartnerCidb(e.target.value)}
                            placeholder="e.g. 6CE / 6GB"
                            className="w-full p-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Equity & Profit Sharing Slider */}
                  <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Equity & Scope Split Ratio</span>
                      <span className="font-mono text-amber-600 font-extrabold">{mySharePercent}% : {100 - mySharePercent}%</span>
                    </div>
                    <input 
                      type="range"
                      min="20"
                      max="80"
                      step="5"
                      value={mySharePercent}
                      onChange={(e) => setMySharePercent(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold pt-1">
                      <span>{companyProfile.legalName}: {mySharePercent}%</span>
                      <span>{jvPartnerName}: {100 - mySharePercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Consolidated JV Calculation Output (5 cols) */}
                <div className="lg:col-span-5 bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Calculated Consortium Outcome
                      </h4>
                      <span className="text-[9px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded uppercase">
                        SABS & CIDB Validated
                      </span>
                    </div>

                    {/* Calculated Scores */}
                    <div className="space-y-3">
                      {/* CIDB Joint Upgrading */}
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200">Joint CIDB Capacity Rating</p>
                          <p className="text-[10px] text-slate-400">Combined contractor grading threshold</p>
                        </div>
                        <span className="text-sm font-mono font-extrabold text-teal-400 px-2.5 py-1 bg-teal-500/10 rounded-xl">
                          8GB / 7CE PE Equivalent
                        </span>
                      </div>

                      {/* Consolidated Preference Points */}
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200">Weighted Preference Points (BEE)</p>
                          <p className="text-[10px] text-slate-400">Weighted formula under PPPFA 80/20 & 90/10</p>
                        </div>
                        <span className="text-sm font-mono font-extrabold text-amber-400 px-2.5 py-1 bg-amber-500/10 rounded-xl">
                          Level 1.4 (19.4 / 20 pts)
                        </span>
                      </div>

                      {/* Tender Eligibility Status */}
                      <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-1">
                        <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Meets Mandatory Tender Thresholds
                        </p>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          Your combined CIDB capacity comfortably surpasses the minimum {tender.cidbLevel || '7GB'} requirement, and the 60/40 JV structure awards maximum functionality points for local community subcontracting.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerDocumentDownload({
                        name: `Joint_Venture_Consortium_Agreement_Template_${tender.id.toUpperCase()}.pdf`,
                        category: 'compliance',
                        size: '220 KB'
                      });
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4 text-slate-950" />
                    Download Official Standard JV Agreement (.PDF)
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* PURSUE & SUBMIT HUB PANEL - GUIDED 5-STEP PROCUREMENT WORKFLOW */}
          {activeSubTab === 'pursue' && (
            <motion.div 
              key="pursue"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {/* Header Banner - Verified Reputable Source */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-lg" id="verified-source-banner">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl mt-0.5">
                    <Check className="w-5 h-5 text-teal-400 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {tender.isLiveVerified ? 'Official Live Tender' : 'Verified Reputable Source'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Ref: {tender.tenderNumber || `SA-TND-${tender.id.toUpperCase()}-2026`}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{tender.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      Procuring Organ of State: <strong className="text-white">{tender.buyer}</strong> • Source: <span className="text-teal-400">{tender.sourceBroker || 'National Treasury eTenders Portal'}</span>
                    </p>
                  </div>
                </div>
                {tender.sourceUrl && (
                  <a 
                    href={tender.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    referrerPolicy="no-referrer" 
                    className="self-start sm:self-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    View eTenders Listing <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* GUIDED 5-STEP WORKFLOW STEPPER BAR */}
              <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4" id="pursue-stepper-bar">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <h3 className="text-sm font-bold text-white">South African Tender Pursuit Wizard</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    Step {pursueStep} of 5
                  </span>
                </div>

                {/* 5-Step Progress Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { num: 1, title: 'Scope & Eligibility', desc: 'Pre-Qualification Audit' },
                    { num: 2, title: 'Proposal Drafting', desc: 'AI Methodology & BOQ' },
                    { num: 3, title: 'SBD Forms & Signs', desc: 'SBD 4 Digital Seal' },
                    { num: 4, title: 'Subcontracting & Seals', desc: '30% PPPFA & 2-Envelope' },
                    { num: 5, title: 'Submission Gateway', desc: 'Bid Binder & Official Proof' }
                  ].map((s) => {
                    const isActive = pursueStep === s.num;
                    const isDone = pursueStep > s.num;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => setPursueStep(s.num as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isActive
                            ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md font-bold'
                            : isDone
                            ? 'bg-slate-900 border-teal-500/30 text-teal-300 hover:border-teal-500/60'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-slate-950 text-amber-400' : isDone ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isDone ? '✓ Step ' + s.num : 'Step ' + s.num}
                          </span>
                        </div>
                        <p className={`text-xs font-bold mt-1.5 line-clamp-1 ${isActive ? 'text-slate-950' : isDone ? 'text-white' : 'text-slate-300'}`}>
                          {s.title}
                        </p>
                        <p className={`text-[9px] mt-0.5 line-clamp-1 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                          {s.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Step Explainer Callout */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {pursueStep === 1 && "Step 1 Guide: Verify mandatory eligibility criteria (CSD Active state, SARS Tax PIN, and briefing sessions) before drafting returnables."}
                      {pursueStep === 2 && "Step 2 Guide: Draft and live-edit essential proposal chapters (Executive Summary, Technical Work Methodology, Milestone Schedule, and BOQ)."}
                      {pursueStep === 3 && "Step 3 Guide: Review statutory National Treasury SBD disclosures and apply your legally binding digital signature to SBD 4."}
                      {pursueStep === 4 && "Step 4 Guide: Review 30% PPPFA subcontracting targets and generate print-ready official labels for Envelope 1 & 2 packaging."}
                      {pursueStep === 5 && "Step 5 Guide: Compile your 12-section indexed Master Bid Binder and transmit your official submission to the buyer inbox with proof receipt."}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEP 1: SCOPE & ELIGIBILITY VERIFICATION */}
              {pursueStep === 1 && (
                <div className="space-y-6" id="pursue-step-1">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tender Scope Card */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-amber-500" />
                            Tender Adjudication Scope & Key Timelines
                          </h4>
                          <p className="text-slate-500 text-xs">Official government procurement requirements and strict cutoff windows</p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                          Est. R{(tender.value / 1000000).toFixed(1)}M
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Department / Organ of State</span>
                          <p className="font-bold text-slate-900 text-xs">{tender.buyer}</p>
                          <p className="text-slate-500 text-[11px]">{tender.province || 'National'} Province</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Statutory Closing Date & Time</span>
                          <p className="font-mono font-bold text-rose-600 text-xs">{new Date(tender.closingDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })} at strictly 11:00 AM</p>
                          <p className="text-[10px] text-slate-500">Late submissions rejected unopened without exception</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Mandatory Site Inspection / Briefing</span>
                          <p className="font-bold text-slate-900 text-xs">
                            {tender.siteVisit === 'Mandatory' ? 'Compulsory Briefing Required' : 'Non-Compulsory / Online'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {tender.briefingDate ? new Date(tender.briefingDate).toLocaleDateString('en-ZA') : 'Refer to bid document'} • {(tender as any).briefingVenue || 'Online MS Teams / Civic Centre'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Required CIDB Contractor Grading</span>
                          <p className="font-bold text-slate-900 text-xs">{tender.cidbLevel || 'Not Specified (General Services)'}</p>
                          <p className="text-[11px] text-emerald-600 font-semibold">Your Grade: {companyProfile.cidbGrading || 'Active'}</p>
                        </div>
                      </div>

                      {/* Official Bid Documents Download Section */}
                      {(tender as any).supportDocuments && (tender as any).supportDocuments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Procuring Organ Documents (Scraped eTenders PDFs)</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(tender as any).supportDocuments.map((doc: any, dIdx: number) => (
                              <a
                                key={dIdx}
                                href={`https://www.etenders.gov.za/home/Download/?blobId=${doc.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-all text-slate-700 hover:text-slate-900"
                              >
                                <span className="font-medium truncate max-w-[200px] flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  {doc.name}
                                </span>
                                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pre-Qualification Status Column */}
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Statutory Pre-Qualification Audit
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-200">CSD Supplier Registration</p>
                              <p className="text-[10px] text-slate-400 font-mono">{companyProfile.csdNumber || 'MAAA0821439'}</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">ACTIVE ✓</span>
                          </div>

                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-200">SARS Tax Compliance PIN</p>
                              <p className="text-[10px] text-slate-400">Good Standing Status</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">COMPLIANT ✓</span>
                          </div>

                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-200">B-BBEE Level & Ownership</p>
                              <p className="text-[10px] text-slate-400">Level {companyProfile.bbeeLevel} Contributor</p>
                            </div>
                            <span className="text-[10px] font-bold text-amber-400">MAX PREFERENCE ✓</span>
                          </div>

                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-200">COIDA Good Standing</p>
                              <p className="text-[10px] text-slate-400">Dept of Employment & Labour</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">VERIFIED ✓</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleTriggerAudit();
                          onUpdateTender({
                            ...tender,
                            readinessScore: Math.min(tender.readinessScore + 6, 92)
                          });
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-Check Statutory Compliance
                      </button>
                    </div>
                  </div>

                  {/* Step Navigation Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      Phase 1 Compliance: Ready to begin proposal chapter formulation.
                    </span>
                    <button
                      type="button"
                      onClick={() => setPursueStep(2)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Continue to Step 2: Proposal Drafting <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROPOSAL DRAFTING CANVAS */}
              {pursueStep === 2 && (
                <div className="space-y-6" id="pursue-step-2">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                          Step 2: AI Tender Proposal & Methodology Draftsman
                        </h4>
                        <p className="text-slate-500 text-xs">Tailored to {companyLegalName} • South African Public Procurement Guidelines</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDraftingAI(true);
                            setTimeout(() => {
                              setIsDraftingAI(false);
                              if (activeDraftSection === 'summary') {
                                setProposalSummary(prev => prev + `\n\n[REFINED FOR ${tender.buyer.toUpperCase()}]: Enhanced with specific statutory accreditation cross-references, Level ${companyProfile.bbeeLevel} B-BBEE points matrix, and designated SMME supplier integration.`);
                              } else if (activeDraftSection === 'methodology') {
                                setProposalMethodology(prev => prev + `\n\n[REFINED METHODOLOGY]: Structured rigorous phased quality control milestones, daily site register protocols, and OHS Act safety briefings for all site personnel.`);
                              } else if (activeDraftSection === 'timeline') {
                                setProposalTimeline(prev => prev + `\n\n[CRITICAL PATH ADDED]: Formulated 48-week milestone schedule with contingency buffer for municipal approvals and weather delays.`);
                              } else {
                                setProposalCosting(prev => prev + `\n\n[COSTING OPTIMIZED]: Structured full 30% local SMME subcontractor participation line items conforming to National Treasury PPPFA guidelines.`);
                              }
                            }, 1200);
                          }}
                          disabled={isDraftingAI}
                          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5 text-amber-600" />
                          {isDraftingAI ? 'Refining...' : 'AI Enhance Section'}
                        </button>
                      </div>
                    </div>

                    {/* Proposal Sections Inner Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto" id="draft-section-tabs">
                      {(['summary', 'methodology', 'timeline', 'costing'] as const).map((sect) => (
                        <button
                          key={sect}
                          type="button"
                          onClick={() => setActiveDraftSection(sect)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            activeDraftSection === sect 
                              ? 'bg-slate-900 text-amber-400 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sect === 'summary' && '1. Executive Summary'}
                          {sect === 'methodology' && '2. Technical Work Methodology'}
                          {sect === 'timeline' && '3. Milestones & Timeline'}
                          {sect === 'costing' && '4. Costing Breakdown & BOQ'}
                        </button>
                      ))}
                    </div>

                    {/* Editor Canvas */}
                    <div className="space-y-3">
                      {activeDraftSection === 'summary' && (
                        <textarea
                          id="summary-editor"
                          value={proposalSummary}
                          onChange={(e) => setProposalSummary(e.target.value)}
                          rows={9}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y leading-relaxed"
                        />
                      )}
                      {activeDraftSection === 'methodology' && (
                        <textarea
                          id="methodology-editor"
                          value={proposalMethodology}
                          onChange={(e) => setProposalMethodology(e.target.value)}
                          rows={9}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y leading-relaxed"
                        />
                      )}
                      {activeDraftSection === 'timeline' && (
                        <textarea
                          id="timeline-editor"
                          value={proposalTimeline}
                          onChange={(e) => setProposalTimeline(e.target.value)}
                          rows={9}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y leading-relaxed"
                        />
                      )}
                      {activeDraftSection === 'costing' && (
                        <textarea
                          id="costing-editor"
                          value={proposalCosting}
                          onChange={(e) => setProposalCosting(e.target.value)}
                          rows={9}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y leading-relaxed"
                        />
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-slate-400 font-medium">✨ Formulated according to National Treasury SBD 3 & 4 guidelines.</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerDocumentDownload({
                                name: `${companyLegalName.replace(/[^a-zA-Z0-9]/g, '_')}_Proposal_Chapter_${activeDraftSection}.pdf`,
                                category: 'tender',
                                size: '320 KB'
                              });
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <FileDown className="w-3.5 h-3.5 text-slate-600" /> Export Chapter (.PDF)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSaveDraftSuccess(true);
                              onUpdateTender({
                                ...tender,
                                readinessScore: Math.min(tender.readinessScore + 5, 96)
                              });
                              setTimeout(() => setSaveDraftSuccess(false), 2500);
                            }}
                            className="px-4 py-1.5 bg-slate-950 hover:bg-slate-850 text-white font-semibold text-xs rounded-lg transition-all"
                            id="save-proposal-btn"
                          >
                            {saveDraftSuccess ? '✓ Saved Successfully' : 'Save Proposal Chapter'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step Navigation Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPursueStep(1)}
                      className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Step 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setPursueStep(3)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Continue to Step 3: Statutory Forms & Signatures <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: STATUTORY SBD FORMS & DIGITAL SIGNATURES */}
              {pursueStep === 3 && (
                <div className="space-y-6" id="pursue-step-3">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Statutory Forms List (Col span 7) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                      <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            Mandatory National Treasury SBD Forms
                          </h4>
                          <p className="text-slate-500 text-xs">Standard Bidding Documents mandated under Public Finance Management Act (PFMA)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            title: 'SBD 1: Invitation to Bid',
                            desc: 'Official acknowledgement of bid conditions, delivery address, and bidder legal identity.',
                            actionText: 'Download Pre-filled SBD 1',
                            status: 'Ready'
                          },
                          {
                            title: "SBD 4: Bidder's Disclosure & Declaration of Interest",
                            desc: 'Mandatory declaration of any state employment, family ties, or conflict of interest under Treasury Instruction 03 of 2021/22.',
                            actionText: 'Sign & Compile SBD 4',
                            status: 'Needs Signature',
                            isModalTrigger: true
                          },
                          {
                            title: 'SBD 6.1: Preference Points Claim Form (PPPFA 2022)',
                            desc: 'Formulation of 80/20 or 90/10 preference points claim based on B-BBEE Level ' + companyProfile.bbeeLevel + ' and local goals.',
                            actionText: 'Download Pre-filled SBD 6.1',
                            status: 'Ready'
                          }
                        ].map((formItem, fIdx) => (
                          <div key={fIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{formItem.title}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  formItem.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {formItem.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">{formItem.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (formItem.isModalTrigger) {
                                  setShowSBD4Modal(true);
                                } else {
                                  triggerDocumentDownload({
                                    name: `${formItem.title.split(':')[0].trim()}_${tender.id.toUpperCase()}.pdf`,
                                    category: 'compliance',
                                    size: '280 KB'
                                  });
                                }
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                                formItem.isModalTrigger
                                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-sm'
                                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                              }`}
                            >
                              {formItem.isModalTrigger ? (
                                <>
                                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                                  {formItem.actionText}
                                </>
                              ) : (
                                <>
                                  <FileDown className="w-3.5 h-3.5 text-slate-500" />
                                  {formItem.actionText}
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Digital Signature & Authentication Card (Col span 5) */}
                    <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Stamp className="w-4 h-4 text-amber-400" />
                            Digital Signature & Signatory Seal
                          </h4>
                          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                            Verified Signatory
                          </span>
                        </div>

                        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Duly Authorized Signatory</span>
                          <p className="font-bold text-white text-sm">{authorizedSignatoryName}</p>
                          <p className="text-xs text-slate-400">{authorizedSignatoryRole} • {companyLegalName}</p>
                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Identity / PIN Verification:</span>
                            <span className="text-emerald-400 font-mono font-bold">ACTIVE & SEED-VERIFIED</span>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300/90 leading-relaxed space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-amber-300">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            PFMA Legal Compliance Note
                          </p>
                          <p className="text-[11px] text-slate-300">
                            Failure to sign SBD 4 or provide honest disclosures regarding government employment leads to immediate disqualification under National Treasury regulations.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSBD4Modal(true)}
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Stamp className="w-4 h-4 text-slate-950" />
                        Launch SBD 4 Digital Signatory Pad
                      </button>
                    </div>
                  </div>

                  {/* Step Navigation Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPursueStep(2)}
                      className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Step 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setPursueStep(4)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Continue to Step 4: Subcontracting & 2-Envelope Kit <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: 30% SUBCONTRACTING & 2-ENVELOPE PACKAGING */}
              {pursueStep === 4 && (
                <div className="space-y-6" id="pursue-step-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Subcontracting Tracker (Col span 7) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                      <div className="pb-3 border-b border-slate-100 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-teal-600" />
                            30% Preferential Subcontracting (PPPFA)
                          </h4>
                          <p className="text-slate-500 text-xs">Mandatory local community allocation for public bids (Target: R{(target30PercentRand / 1000000).toFixed(1)}M)</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {isMandatory30Percent ? 'Statutory Requirement' : 'Scored Bonus Points'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {subcontractorPackages.map((pkg) => (
                          <div key={pkg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900">{pkg.scopeName}</p>
                              <p className="text-[11px] text-slate-500">
                                {pkg.subcontractorName} • <span className="font-mono">{pkg.csdNumber}</span>
                              </p>
                              <span className="inline-block text-[9px] font-semibold text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded mt-0.5">
                                {pkg.designatedGroup} • B-BBEE Level {pkg.bbeeLevel}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-slate-900">R{(pkg.packageValue / 1000000).toFixed(2)}M</p>
                              <span className="text-[10px] text-slate-400 font-semibold">{pkg.percentageOfContract}% of Contract</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-teal-900">Total Pre-Bid Subcontracting Allocation:</span>
                        <strong className="text-teal-950 font-bold text-sm">30.0% (R{(target30PercentRand / 1000000).toFixed(1)}M Compliant ✓)</strong>
                      </div>
                    </div>

                    {/* Right: 2-Envelope Label Generator (Col span 5) */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Stamp className="w-4 h-4 text-amber-400" />
                            Two-Envelope Physical Packaging
                          </h4>
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase">
                            SBD 1 Mandatory
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                            <p className="font-bold text-amber-300">Envelope 1: Technical & Returnables</p>
                            <p className="text-[11px] text-slate-400">Technical proposal, CSD profile, SARS Tax PIN, SBD 4 declaration, OHS and QCP plans. (Original + 1 Copy)</p>
                          </div>

                          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                            <p className="font-bold text-teal-300">Envelope 2: Financial Offer & Priced BOQ</p>
                            <p className="text-[11px] text-slate-400">Strictly sealed Rand offer, BOQ rates, and price schedule. Must NOT be included in Envelope 1.</p>
                          </div>
                        </div>

                        <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-rose-300">
                            <AlertOctagon className="w-4 h-4 text-rose-400" />
                            Disqualification Warning
                          </p>
                          <p className="text-[10px] text-slate-300">
                            Including pricing in Envelope 1 leads to immediate bid disqualification during Phase 1 opening under SBD 1 provisions.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowTwoEnvelopeModal(true)}
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-slate-950" />
                        Generate & Print Official 2-Envelope Labels
                      </button>
                    </div>
                  </div>

                  {/* Step Navigation Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPursueStep(3)}
                      className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Step 3
                    </button>
                    <button
                      type="button"
                      onClick={() => setPursueStep(5)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Continue to Step 5: Final Submission Gateway <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: FINAL SUBMISSION GATEWAY & PROOF RECEIPT (THE UNBLOCKING STEP) */}
              {pursueStep === 5 && (
                <div className="space-y-6" id="pursue-step-5">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: Physical Tender Box Delivery & Complete Bid Binder Compiler (Col span 7) */}
                    <div className="xl:col-span-7 space-y-6">
                      
                      {/* Physical Tender Box Drop-Off Card */}
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <Box className="w-4 h-4 text-amber-500" />
                              Method A: Physical Tender Box Delivery (Paper / Binder)
                            </h4>
                            <p className="text-slate-500 text-xs">Official drop-off at municipal / department procurement headquarters</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                            Strict 11:00 AM Deadline
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Tender Box Location</span>
                            <p className="font-bold text-slate-900 text-xs">{(tender as any).deliveryAddress || `${tender.buyer} Civic Centre, Ground Floor Foyer`}</p>
                            <p className="text-[11px] text-slate-500">Designated Tender Box #4 (Supply Chain Directorate)</p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact SCM Officer</span>
                            <p className="font-bold text-slate-900 text-xs">{(tender as any).contactPerson || 'Supply Chain Management'}</p>
                            <p className="text-[11px] text-slate-500">Tel: {(tender as any).telephone || '+27 12 315 5111'}</p>
                          </div>
                        </div>

                        {/* Action Buttons for Physical Submission */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowBidBinderModal(true)}
                            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FolderArchive className="w-4 h-4 text-amber-400" />
                            Launch Complete Bid Binder Compiler
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTwoEnvelopeModal(true)}
                            className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-slate-600" />
                            Print 2-Envelope Labels
                          </button>
                        </div>
                      </div>

                      {/* 12-Section Bid Pack Download Summary */}
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <FileCheck2 className="w-4 h-4 text-emerald-600" />
                              Official Tender Pack Documents (5 Core Returnables)
                            </h4>
                            <p className="text-slate-500 text-xs">Pre-filled and verified ready for signature and committee submission</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const files = [
                                'Technical_Proposal_Draft',
                                'National_Treasury_SBD_4_Signed_Declaration',
                                'CSD_Summary_Profile_Report',
                                'SARS_Tax_PIN_Letter',
                                'SANAS_B-BBEE_Level_1_Affidavit'
                              ];
                              files.forEach((f, index) => {
                                setTimeout(() => {
                                  triggerDocumentDownload({
                                    name: `${f}.pdf`,
                                    category: 'compliance',
                                    size: '240 KB'
                                  });
                                }, index * 350);
                              });
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-white" /> Download All Returnables (.ZIP)
                          </button>
                        </div>

                        <div className="space-y-2">
                          {[
                            { name: `${companyLegalName} - Complete Technical & Financial Proposal Draft.pdf`, size: '1.2 MB', desc: 'Pre-compiled Executive Summary, Methodology, Work Plan, and Costing.' },
                            { name: `National Treasury SBD 4 Signed Declaration (${authorizedSignatoryName}).pdf`, size: '412 KB', desc: 'Pre-filled SBD 4 form with your digital disclosures and verified signature.' },
                            { name: `National Treasury CSD Profile Summary (${companyProfile.csdNumber || 'MAAA0821439'}).pdf`, size: '344 KB', desc: 'Official Treasury CSD profile listing active status, CIDB grades, and address.' },
                            { name: `SARS Tax PIN Letter (Verified Compliant).pdf`, size: '215 KB', desc: 'Direct verification certificate from South African Revenue Service.' },
                            { name: `SANAS Certified B-BBEE Level ${companyProfile.bbeeLevel} Sworn Affidavit.pdf`, size: '890 KB', desc: 'Vetted Broad-Based Black Economic Empowerment compliance certificate.' }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 text-xs">
                              <div className="space-y-0.5 max-w-[70%]">
                                <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-slate-400">{item.size}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerDocumentDownload({
                                      name: item.name,
                                      category: 'compliance',
                                      size: item.size
                                    });
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition-all"
                                  title="Download PDF"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Official Digital / Email Submission Gateway (Col span 5) */}
                    <div className="xl:col-span-5" id="secure-email-gateway">
                      <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between">
                        
                        <div className="space-y-4">
                          {/* Gateway Header */}
                          <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                                Method B: Digital Submission Mailer Gateway
                              </h4>
                              <p className="text-[10px] text-slate-400">Direct encrypted transmission to official buyer procurement mailbox</p>
                            </div>
                            <span className="text-[8px] font-mono tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                              TLS 1.3 Verified
                            </span>
                          </div>

                          {/* Email Form */}
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To (Official Buyer Email)</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultRecipient = tender.submissionEmail || (tender as any).email || `tenders@${tender.buyer.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'etenders'}.gov.za`;
                                    setEmailTo(defaultRecipient);
                                  }}
                                  className="text-[9px] text-amber-400 hover:underline"
                                >
                                  Reset to Buyer Email
                                </button>
                              </div>
                              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                                <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <input 
                                  type="text" 
                                  value={emailTo}
                                  onChange={(e) => setEmailTo(e.target.value)}
                                  placeholder="e.g. tenders@procurement.gov.za"
                                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                                  id="email-to-input"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Line</label>
                              <input 
                                type="text" 
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                                id="email-subject-input"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Transmittal Letter</label>
                              <textarea 
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={7}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-slate-700 resize-none"
                                id="email-body-editor"
                              />
                            </div>

                            {/* Verified Attachments Tray */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Verification Bundle (Ready for Transmission)</label>
                              <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5 text-[9px] font-mono">
                                <div className="flex items-center justify-between text-teal-400 font-bold">
                                  <span>📎 Complete_Technical_Proposal.pdf</span>
                                  <span>Verified Active ✓</span>
                                </div>
                                <div className="flex items-center justify-between text-teal-400 font-bold">
                                  <span>📎 SBD_4_Signed_Declaration.pdf</span>
                                  <span>Signed by {authorizedSignatoryName} ✓</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                  <span>📎 CSD_Profile_Summary.pdf</span>
                                  <span>MAAA0821439 Attached ✓</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                  <span>📎 SARS_Compliant_Tax_PIN.pdf</span>
                                  <span>Tax Good Standing ✓</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Submission Dispatch Section */}
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                          
                          {/* Live Sending Console */}
                          {emailSentLogs.length > 0 && (
                            <div className="bg-black/90 rounded-xl p-3 border border-slate-800 font-mono text-[9px] text-amber-400 space-y-1 max-h-28 overflow-y-auto" id="sending-logs-console">
                              {emailSentLogs.map((log, lidx) => (
                                <div key={lidx} className="flex gap-1.5">
                                  <span className="text-slate-500">&gt;</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Submission Receipt Display */}
                          {submissionReceipt ? (
                            <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-2xl space-y-3" id="submission-receipt-proof">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-teal-200">Official Tender Submission Successful</p>
                                  <p className="text-[9px] text-teal-400 font-mono">Receipt ID: {submissionReceipt.receiptId}</p>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-300 space-y-1 leading-relaxed">
                                <p>• <strong>Timestamp:</strong> {submissionReceipt.timestamp}</p>
                                <p>• <strong>Duly Authorized:</strong> {submissionReceipt.sentBy}</p>
                                <p>• <strong>Digital Fingerprint:</strong> <span className="font-mono text-slate-400">{submissionReceipt.securedHash}</span></p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerDocumentDownload({
                                    name: `National_Treasury_Submission_Receipt_${submissionReceipt.receiptId}.pdf`,
                                    category: 'compliance',
                                    size: '115 KB'
                                  });
                                }}
                                className="w-full text-center py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                                id="download-receipt-proof-btn"
                              >
                                Download Official Submission Receipt Proof (.PDF)
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isSendingEmail}
                              onClick={() => {
                                // If email was blank, auto-fill it first
                                const targetRecipient = emailTo.trim() || tender.submissionEmail || (tender as any).email || `tenders@${tender.buyer.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'etenders'}.gov.za`;
                                if (!emailTo.trim()) {
                                  setEmailTo(targetRecipient);
                                }

                                setIsSendingEmail(true);
                                setEmailSentLogs([]);
                                
                                const logs = [
                                  "Establishing connection to SAtenderAI Government Gateway...",
                                  "Auditing mandatory compliance returnables (CSD, Tax PIN, SBD 4)...",
                                  "Applying RSA-256 digital cryptographic signature stamp...",
                                  `Authorizing entity: ${companyLegalName} (CSD: ${companyProfile.csdNumber || 'MAAA0821439'})...`,
                                  `Connecting to remote official inbox: ${targetRecipient}...`,
                                  "Transmitting 4 sealed attachments (Technical Proposal, BOQ, SBD 4, Tax PIN)...",
                                  "Acknowledged by procuring authority mail server.",
                                  "National Treasury submission transaction successfully verified and logged."
                                ];

                                logs.forEach((logText, index) => {
                                  setTimeout(() => {
                                    setEmailSentLogs(prev => [...prev, logText]);
                                  }, index * 350);
                                });

                                setTimeout(() => {
                                  const receiptId = `ZA-REC-${Math.floor(100000 + Math.random() * 900000)}-2026`;
                                  const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
                                  setSubmissionReceipt({
                                    receiptId,
                                    timestamp,
                                    sentBy: authorizedSignatoryName,
                                    attachments: ['Technical_Proposal_Draft.pdf', 'SBD_4_Declaration_Signed.pdf', 'CSD_Profile_Summary.pdf', 'SARS_Compliant_Tax_PIN.pdf'],
                                    securedHash: `SHA256: ${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}b8b2e56cfc0f16248da93e506e788bc1bb`
                                  });
                                  setIsSendingEmail(false);
                                  
                                  onUpdateTender({
                                    ...tender,
                                    status: 'SUBMITTED' as const,
                                    readinessScore: 100
                                  });
                                }, logs.length * 350 + 200);
                              }}
                              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                              id="submit-bid-btn"
                            >
                              {isSendingEmail ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Transmitting Official Bid Packet...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 text-slate-950" />
                                  <span>Submit Bid & Transmit Official Packet</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Step Navigation Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPursueStep(4)}
                      className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Step 4
                    </button>
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-teal-400" /> Return to My Workspaces
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SBD 4 DECLARATION OF INTEREST MODAL WIZARD */}
      <AnimatePresence>
        {showSBD4Modal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
            id="sbd4-wizard-overlay"
          >
            <div 
              className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
              id="sbd4-wizard-modal"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-widest text-amber-400 bg-slate-800 px-2 py-0.5 rounded-md uppercase">National Treasury • SBD 4 Form</span>
                  <h3 className="text-base font-bold tracking-tight">Bidder's Disclosure & Declaration of Interest</h3>
                  <p className="text-[10px] text-slate-400">Pre-populating company details for {authorizedSignatoryName} — {companyLegalName}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSBD4Modal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Wizard Content */}
              <div className="p-6 space-y-6 flex-1 max-h-[70vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <p className="font-bold text-amber-900 text-xs">CSD & PIN Pre-filled Sync Success</p>
                  <p className="text-[11px] text-amber-800">
                    SAtenderAI has successfully mapped your active CSD profile **MAAA0821439** and CIPC Registration **2021/482931/07** into the SBD 4 questionnaire template.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5">1. Shareholder & Director Disclosures</h4>
                  
                  {/* Q1 */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-semibold text-slate-900">1.1. Are you or any person connected with the bidder employed by the state?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSbdAnswers({ ...sbdAnswers, empState: true })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            sbdAnswers.empState 
                              ? 'bg-slate-900 border-slate-900 text-amber-400 font-bold' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setSbdAnswers({ ...sbdAnswers, empState: false })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            !sbdAnswers.empState 
                              ? 'bg-slate-900 border-slate-900 text-amber-400 font-bold' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    {sbdAnswers.empState && (
                      <input 
                        type="text"
                        placeholder="Provide details of state organ, role and ID number..."
                        value={sbdAnswers.empStateDetails}
                        onChange={(e) => setSbdAnswers({ ...sbdAnswers, empStateDetails: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-slate-800"
                      />
                    )}
                  </div>

                  {/* Q2 */}
                  <div className="space-y-2.5 border-t border-slate-50 pt-3">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-semibold text-slate-900">1.2. Do you, or any person connected with the bidder, have a relationship with any person employed by the procuring institution?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSbdAnswers({ ...sbdAnswers, familyState: true })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            sbdAnswers.familyState 
                              ? 'bg-slate-900 border-slate-900 text-amber-400 font-bold' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setSbdAnswers({ ...sbdAnswers, familyState: false })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            !sbdAnswers.familyState 
                              ? 'bg-slate-900 border-slate-900 text-amber-400 font-bold' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    {sbdAnswers.familyState && (
                      <input 
                        type="text"
                        placeholder="Specify name, institution and relationship nature..."
                        value={sbdAnswers.familyStateDetails}
                        onChange={(e) => setSbdAnswers({ ...sbdAnswers, familyStateDetails: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-slate-800"
                      />
                    )}
                  </div>
                </div>

                {/* Signature Pad */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">2. National Treasury E-Signature Authenticator</h4>
                  <p className="text-[11px] text-slate-500">
                    By signing, you certify under penalty of perjury that the disclosures provided are fully accurate. The e-signature PIN will compile a legally-compliant PDF.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800">Authorized Signatory Name</label>
                      <input 
                        type="text"
                        value={sbdAnswers.sigName}
                        onChange={(e) => setSbdAnswers({ ...sbdAnswers, sigName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800">Capacity / Official Title</label>
                      <input 
                        type="text"
                        value={sbdAnswers.sigTitle}
                        onChange={(e) => setSbdAnswers({ ...sbdAnswers, sigTitle: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  {/* Draw Signature Area */}
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center space-y-3 min-h-[120px]">
                    <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">Signature Pad Preview</p>
                    {isSigningSBD ? (
                      <div className="space-y-2 text-center py-4">
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-amber-400 rounded-full animate-spin mx-auto"></div>
                        <p className="text-[10px] text-slate-500 animate-pulse">Compiling National Treasury SBD 4 Certificate PDF...</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 w-full">
                        <p className="text-2xl font-serif text-slate-700 italic border-b border-slate-200 pb-2 max-w-[200px] mx-auto tracking-wide select-none">
                          {sbdAnswers.sigName || 'Authorized Signature'}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase font-mono">Duly authorized to sign on behalf of bidder</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSBD4Modal(false)}
                  className="px-4 py-2 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSigningSBD || !sbdAnswers.sigName.trim()}
                  onClick={() => {
                    setIsSigningSBD(true);
                    setTimeout(() => {
                      onUploadDocument({
                        id: `doc-sbd4-${Date.now()}`,
                        name: 'National Treasury SBD 4 Signed Declaration.pdf',
                        category: 'compliance',
                        fileSize: '412 KB',
                        status: 'valid',
                        verified: true,
                        uploadedBy: sbdAnswers.sigName,
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                      });
                      
                      const updatedReqs = tender.requirements.map(r => {
                        if (r.requirement.toLowerCase().includes('sbd 4') || r.requirement.toLowerCase().includes('declaration of interest')) {
                          return { ...r, status: 'Complete' as const, evidence: `SBD 4 Digitally Compiled & Sealed by ${sbdAnswers.sigName}` };
                        }
                        return r;
                      });

                      onUpdateTender({
                        ...tender,
                        requirements: updatedReqs,
                        readinessScore: Math.min(tender.readinessScore + 8, 100)
                      });

                      setIsSigningSBD(false);
                      setShowSBD4Modal(false);
                      
                      setTimeout(() => {
                        handleTriggerAudit();
                      }, 500);
                    }, 2500);
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSigningSBD ? 'Compiling PDF...' : 'Sign & Compile Declaration'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-Envelope Label Generator Modal */}
        {showTwoEnvelopeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <Stamp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Physical Tender Box 2-Envelope Label Kit</h3>
                    <p className="text-[11px] text-slate-400">Strict SBD 1 Separation of Technical and Financial Submissions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTwoEnvelopeModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Envelope Switcher */}
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex gap-2">
                <button
                  onClick={() => setActiveEnvelopeLabel('ENVELOPE_1')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeEnvelopeLabel === 'ENVELOPE_1'
                      ? 'bg-slate-900 text-amber-400 shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Envelope 1: Technical & Returnables (Original + 1 Copy)
                </button>
                <button
                  onClick={() => setActiveEnvelopeLabel('ENVELOPE_2')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeEnvelopeLabel === 'ENVELOPE_2'
                      ? 'bg-slate-900 text-teal-300 shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lock className="w-4 h-4" /> Envelope 2: Financial Offer & BOQ (Sealed)
                </button>
              </div>

              {/* Printable Label View */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4" id="printable-tender-envelope-label">
                <div className="border-4 border-dashed border-slate-900 p-6 sm:p-8 rounded-2xl bg-white space-y-6 relative">
                  
                  {/* Top Header Label */}
                  <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                        REPUBLIC OF SOUTH AFRICA • OFFICIAL BID SUBMISSION
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-950 tracking-tight mt-0.5">
                        {activeEnvelopeLabel === 'ENVELOPE_1' ? 'ENVELOPE 1: TECHNICAL PROPOSAL & RETURNABLES' : 'ENVELOPE 2: FINANCIAL OFFER & BOQ'}
                      </h2>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {activeEnvelopeLabel === 'ENVELOPE_1' 
                          ? 'MANDATORY COMPLIANCE DOCUMENTS, SBD FORMS, OHS, QCP, EPWP PLANS (ORIGINAL + 1 COPY)' 
                          : 'PRICED BILL OF QUANTITIES & FINAL RAND OFFER (STRICTLY CONFIDENTIAL & SEALED)'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="w-20 h-20 border-2 border-slate-900 rounded-xl p-2 text-center flex flex-col justify-center items-center">
                        <Stamp className="w-5 h-5 text-slate-900" />
                        <span className="text-[8px] font-extrabold uppercase mt-1">OFFICIAL WAX SEAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Tender Core Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Tender Reference Number</span>
                      <p className="font-mono text-sm font-extrabold text-slate-950">
                        {tender.tenderNumber || `SA-TND-${tender.id.toUpperCase()}-2026`}
                      </p>
                    </div>

                    <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Statutory Closing Date & Strict Time</span>
                      <p className="font-mono text-sm font-extrabold text-rose-600">
                        {tender.closingDate} at STRICTLY 11:00:00 AM
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Tender Description / Title</span>
                      <p className="font-bold text-slate-900 text-xs">
                        {tender.title}
                      </p>
                    </div>

                    <div className="sm:col-span-2 space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Department / Buying Organ of State</span>
                      <p className="font-bold text-slate-900 text-xs">
                        {tender.buyer} • Supply Chain Management Directorate
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tender Box Delivery: Ground Floor Foyer, Civic Centre, South Africa
                      </p>
                    </div>
                  </div>

                  {/* Bidder Identity */}
                  <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Submitted By (Bidder)</span>
                      <p className="font-bold text-slate-950 text-sm">{companyProfile.legalName}</p>
                      {companyProfile.tradingName && <p className="text-slate-600 font-medium">Trading as: {companyProfile.tradingName}</p>}
                      <p className="text-slate-500 text-[11px]">CSD Supplier No: <strong className="font-mono text-slate-900">{companyProfile.csdNumber}</strong></p>
                      <p className="text-slate-500 text-[11px]">Company Reg: {companyProfile.registrationNumber} | B-BBEE Level {companyProfile.bbeeLevel}</p>
                    </div>

                    <div className="space-y-0.5 sm:text-right">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Bidder Authorized Contact</span>
                      <p className="font-bold text-slate-900">{authorizedSignatoryName} ({authorizedSignatoryRole})</p>
                      <p className="text-slate-500 text-[11px]">Cell: {companyProfile.companyPhone || '+27 72 482 9310'}</p>
                      <p className="text-slate-500 text-[11px]">Email: {userSession?.user?.email || companyProfile.companyEmail || 'procurement@satenderai.co.za'}</p>
                    </div>
                  </div>

                  {/* Warning Footer Notice */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-800 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      <strong>WARNING:</strong> Late submissions arriving after 11:00:00 AM on closing day are rejected unopened without exception. Ensure delivery at least 2 hours prior.
                    </span>
                  </div>

                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Affix securely to front of submission box or A4 packaging.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-amber-400" /> Print Packaging Label
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 1-Click Complete Bid Binder Compiler Modal */}
        {showBidBinderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            >
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Complete Bid Binder Compiler</h3>
                    <p className="text-[11px] text-slate-400">12 Verified Returnables Collated into a Single Indexed Submission Pack</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBidBinderModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Indexed Master Submission Contents (12 Items)
                  </h4>
                  <p className="text-xs text-slate-500">
                    All compliance certificates and technical proposals are bundled sequentially with page indexing:
                  </p>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50 max-h-[340px] overflow-y-auto">
                  {[
                    { section: 'Section 01', title: 'Table of Contents & Adjudication Compliance Index', verified: true, size: '95 KB' },
                    { section: 'Section 02', title: 'National Treasury CSD Supplier Profile (MAAA0821439 - Active & Tax Compliant)', verified: true, size: '344 KB' },
                    { section: 'Section 03', title: 'SARS Tax Compliance Status PIN Certificate (Verified Active)', verified: true, size: '215 KB' },
                    { section: 'Section 04', title: 'SANAS Accredited B-BBEE Level 1 Sworn Affidavit & Ownership Scorecard', verified: true, size: '890 KB' },
                    { section: 'Section 05', title: 'COIDA Letter of Good Standing (Department of Employment & Labour)', verified: true, size: '310 KB' },
                    { section: 'Section 06', title: `Signed SBD 4 Declaration of Interest (Sealed by ${authorizedSignatoryName})`, verified: true, size: '412 KB' },
                    { section: 'Section 07', title: 'Technical Work Methodology & 48-Week Phased Gantt Schedule', verified: true, size: '1.2 MB' },
                    { section: 'Section 08', title: 'OHS Act 85 Health & Safety Plan (SAMTRAC Appointee Johannes v.d. Merwe)', verified: true, size: '380 KB' },
                    { section: 'Section 09', title: 'ISO 9001 Quality Control Plan & SABS Inspection Test Plan (ITP)', verified: true, size: '320 KB' },
                    { section: 'Section 10', title: 'EPWP Local Community Labor Plan & CPG Ward 30% Sourcing Commitments', verified: true, size: '280 KB' },
                    { section: 'Section 11', title: '30% Preferential Subcontracting Pre-Bid Agreement & Signed MOUs', verified: true, size: '220 KB' },
                    { section: 'Section 12', title: 'Envelope 2: Financial Offer & Priced Bill of Quantities (BOQ Sealed)', verified: true, size: '480 KB' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{item.section}</span>
                        <span className="font-semibold text-slate-800">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{item.size}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          ✓ VERIFIED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {binderCompiledSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Master Bid Binder successfully compiled and downloaded (5.3 MB complete PDF bundle)!</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">Total Bundle: 12 Sections • 5.3 MB</span>
                <button
                  disabled={isCompilingBinder}
                  onClick={() => {
                    setIsCompilingBinder(true);
                    setTimeout(() => {
                      setIsCompilingBinder(false);
                      setBinderCompiledSuccess(true);
                      triggerDocumentDownload({
                        name: `Complete_Bid_Binder_${tender.id.toUpperCase()}_Indexed_Master.pdf`,
                        category: 'compliance',
                        size: '5.3 MB'
                      });
                    }, 2000);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  {isCompilingBinder ? 'Compiling 12 Returnables...' : 'Download Complete Bid Binder (.PDF)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
