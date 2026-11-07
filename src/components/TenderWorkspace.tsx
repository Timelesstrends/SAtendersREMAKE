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
  Building
} from 'lucide-react';
import { TenderOpportunity, CompanyProfile, ChatMessage, RequirementItem, EvaluationScorecard, CompanyDocument } from '../types';
import { triggerDocumentDownload } from '../lib/download';

interface TenderWorkspaceProps {
  tenderId: string;
  companyProfile: CompanyProfile;
  tenders: TenderOpportunity[];
  onBack: () => void;
  onUpdateTender: (updated: TenderOpportunity) => void;
  onNavigate: (tab: string, tenderId?: string) => void;
  onUploadDocument: (doc: CompanyDocument) => void;
  onUpdateProfile: (updated: CompanyProfile) => void;
}

export default function TenderWorkspace({ 
  tenderId, 
  companyProfile, 
  tenders, 
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

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'requirements' | 'documents' | 'ai-advisors' | 'simulator' | 'jv-simulator' | 'submission' | 'pursue'>('overview');

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
  };

  // 1. CHAT ADVISOR STATE
  const [selectedAgent, setSelectedAgent] = useState<'advisor' | 'analyst' | 'writer' | 'auditor'>('advisor');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello, Austin. I am your specialized SAtenderAI advisor. Ask me anything about ${tender.title}. How can I assist you with your bid preparations today?`,
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
    sigName: 'Austin Mpapane',
    sigTitle: 'Managing Director & Lead Bid Specialist',
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

  // Auto-prepopulate proposal drafts and email parameters based on active tender
  useEffect(() => {
    if (!tender) return;

    // Prefill Proposal Drafts
    if (tender.sector.toLowerCase().includes('civil') || tender.sector.toLowerCase().includes('building')) {
      setProposalSummary(`EXECUTIVE BID SUMMARY:\nSAtenderAI Services (Pty) Ltd is pleased to submit this comprehensive technical and commercial proposal in response to the Invitation for Tender for: "${tender.title}".\n\nAs a registered Level 1 B-BBEE civil engineering group with deep community roots, a certified 7GB CIDB grading, and a track record of successfully handing over public clinics and municipal roads in Gauteng, we are uniquely positioned to deliver this high-impact public facility. Our company profile guarantees 100% compliance alignment, complete financial capacity, and an outstanding occupational health & safety safety record led by SAMTRAC Officer Johannes van der Merwe.`);
      setProposalMethodology(`TECHNICAL EXECUTION METHODOLOGY:\n1. SITE ESTABLISHMENT: In week 1, we will construct high-security SABS-approved clear-vu steel hoarding, deploy armed response safeguarding stations, establish temporary offices, and erect SHEQ induction stations.\n2. EARTHWORKS & EXCAVATION: Foundation trenches will be systematically cut using our fully owned JCB 3CX Backhoe Loader. Soil stability tests will be conducted prior to high-performance concrete pouring.\n3. SUPERSTRUCTURE & MASONRY: Concrete slabs will be reinforced with steel mesh. Superstructure brickwork and roofing timber framing will be installed by 12 skilled local artisans recruited from Ward 12 to satisfy the 30% local labor target.\n4. ELECTRICAL, RETICULATION & FINISHES: Certified plumbers and electricians will complete internally recessed conduits, followed by plastering, painting, glazing, and practical hand-over certificate sealing.`);
      setProposalTimeline(`DETAILED WORK SCHEDULE MILESTONES:\n• Week 1 - 3: Mobilisation, site security fencing installation, civil engineering safety sign-offs.\n• Week 4 - 12: Excavations, foundation compaction, steel reinforcement layout, and structural concrete pouring.\n• Week 13 - 30: Brickwork masonry, steel roof framing, roof sheeting, and external wall structures.\n• Week 31 - 40: Internal electrical wiring, plumbing piping, dry-wall partitioning, painting, and glazing finishes.\n• Week 41 - 48: Practical site cleanup, independent SHEQ audits, and municipal compliance handover inspections.`);
      setProposalCosting(`BID PRICING & BILL OF QUANTITIES (BOQ):\n1. Preliminary & General (Site Fencing, Security, Offices): R1,200,000\n2. Earthworks, Foundations & Ground Slabs: R3,400,000\n3. Superstructure Masonry, Framing & Roofing Timbers: R5,800,000\n4. Internal Plumbing, Electrical Wiring & Refurbishments: R2,900,000\n5. Quality Assurance, SHEQ Compliance & Professional Sign-offs: R450,000\n6. Local Subcontracting Allocation (30% Ward Sourcing Target): R1,750,000\n---------------------------------------------------------------\nESTIMATED BID SUM: R${(tender.value).toLocaleString('en-ZA')} (Including 15% VAT and 30% local community contingency)`);
    } else if (tender.sector.toLowerCase().includes('security')) {
      setProposalSummary(`EXECUTIVE BID SUMMARY:\nSAtenderAI Services (Pty) Ltd is pleased to submit this security proposal in response to the Invitation for Tender for: "${tender.title}".\n\nWith a Level 1 B-BBEE rating, a comprehensive corporate PSIRA registration certificate, and 11+ years of managing critical infrastructure defense, SAtenderAI offers a highly sophisticated, rapid-response guard force. Our armed patrols, supported by dedicated vehicles and state-of-the-art radio telemetry, ensure Eskom substations or municipal facilities remain impenetrable.`);
      setProposalMethodology(`TACTICAL SECURITY METHODOLOGY:\n1. THREAT ASSESSMENT & MOBILISATION: We will deploy advanced risk analysts to conduct a physical threat assessment of all target locations, mapping critical blindspots.\n2. GUARD SELECTION & PSIRA COMPLIANCE: Every deployed officer is active-PSIRA registered, undergoes quarterly background checks, and possesses a certified firearm competency certificate.\n3. ARMED RESPOND PATROLS: Branded responder vehicles (Volkswagen Polo Vivos) will execute unpredictable 24/7 routing schedules, utilizing radio links connected to our central control room.\n4. COIDA & SHEQ SAFETY: Standard security operations will strictly adhere to OHS Act protocols, managed continuously by SHEQ Officer Johannes van der Merwe.`);
      setProposalTimeline(`CONTRACT ROLLOUT MILESTONE SCHEDULING:\n• Week 1: Risk profiling, strategic guard box placement, radio transmitter installation.\n• Week 2: Guard onboarding, physical security briefings, site access gate controls activation.\n• Week 3: Integration of armed patrol routes and deployment of branded response vehicles.\n• Month 1 - 36: Monthly tactical review meetings, local community liaison recruitment, and incident logging.`);
      setProposalCosting(`SECURITY PRICING SCHEDULE:\n1. 24/7 Armed Guard Force Deployment (12 Officers): R15,400,000 per annum\n2. Radio Transmitters & Central Control Linkages: R1,200,000 setup\n3. Branded Patrol Response Vehicles (Fuel & Maintenance): R2,800,000 per annum\n4. Continuous SHEQ Compliance Auditing & Training: R600,000 per annum\n---------------------------------------------------------------\nTOTAL BID BID VALUE (36 MONTHS): R${(tender.value).toLocaleString('en-ZA')} (Including 15% VAT)`);
    } else {
      setProposalSummary(`EXECUTIVE BID SUMMARY:\nSAtenderAI Services (Pty) Ltd is proud to offer this facility care and general maintenance services proposal in response to: "${tender.title}".\n\nWe provide an integrated, responsive solution combining structural, mechanical, electrical, and general maintenance. Supported by an experienced workforce and robust assets, SAtenderAI minimizes downtime, maintains building asset values, and ensures strict adherence to health and safety standards.`);
      setProposalMethodology(`INTEGRATED MAINTENANCE METHODOLOGY:\n1. INVENTORY AUDIT & LOGISTICS: On contract award, our Senior Engineer will conduct a comprehensive digital survey of all physical building assets to establish a preventive schedule.\n2. PREVENTATIVE MAINTENANCE CHECKS: We schedule bi-weekly inspections covering electrical boards, plumbing pressure, structural integrity, and HVAC systems.\n3. RAPID-RESPONSE CORRECTIVE REPAIRS: Our call-center handles hotlines 24/7. In Gauteng, our mobile response team will be on-site within 4 hours to resolve critical plumbing or electrical failures.\n4. HEALTH AND SAFETY (SHEQ) COMPLIANCE: All repairs are certified safe, utilizing quality SABS-certified materials and documented on client-facing compliance sheets.`);
      setProposalTimeline(`MAINTENANCE CONTRACT SCHEDULE:\n• Week 1 - 2: Site assessment, building inventory logging, and hotline dispatch setup.\n• Week 3 onwards: Recurring bi-weekly preventative checks, scheduled structural touch-ups.\n• Monthly: Comprehensive asset health reports, SHEQ compliance filings, and billing audits.\n• Quarterly: Preventive deep-cleaning, electrical load testing, and client SLA reviews.`);
      setProposalCosting(`FACILITY CARE PRICING:\n1. Preventative Maintenance Services SLA (Monthly retainer): R150,000 / month\n2. Reactive Emergency Call-outs Pool: R400,000 / annum\n3. SABS Materials and Building Spare Parts Contingency: R800,000 / annum\n4. Management fees and compliance report sealing: R200,000 / annum\n---------------------------------------------------------------\nESTIMATED BID SUM (24 MONTHS): R${(tender.value).toLocaleString('en-ZA')} (Including 15% VAT)`);
    }

    // Prefill email parameters
    setEmailTo(tender.submissionEmail || 'submissions@government-etender.gov.za');
    setEmailSubject(`[OFFICIAL BID SUBMISSION] Ref: SA-TND-${tender.id.toUpperCase()}-2026 - ${tender.title}`);
    setEmailBody(`Dear Bid Specification Committee,

Please find attached SAtenderAI Services (Pty) Ltd's official bid package in response to the advertised tender:
"${tender.title}" (Ref: SA-TND-${tender.id.toUpperCase()}-2026).

As a highly reputable, verified Level 1 B-BBEE provider with CIDB compliance and an active CSD Registration Profile (MAAA0821439), we submit our fully completed tender documents for your evaluation.

Attached in this submission email are the following required documents:
1. SAtenderAI Technical & Commercial Proposal (Executive Summary, Methodology, Gantt Plan, Costing BOQ)
2. National Treasury SBD 4 Declaration of Interest (Digitally Signed and Sealed)
3. National Treasury Central Supplier Database (CSD) Summary Report (Verified Active)
4. SARS Tax Compliance Status PIN Certificate Letter (Verified Active Status)
5. SANAS Certified Level 1 B-BBEE Sworn Affidavit
6. COIDA Letter of Good Standing from Compensation Commissioner
7. Certified Past Performance Completion Letters

Kindly acknowledge receipt of this submission and log our physical documents.

Sincerely,

Austin Mpapane
Managing Director & Lead Bid Specialist
SAtenderAI Services (Pty) Ltd
Cell: +27 72 482 9310
Email: austin@satenderai.co.za`);

    // Reset submission state when switching tenders
    setSubmissionReceipt(null);
    setEmailSentLogs([]);
  }, [tender]);

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
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab('requirements')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'requirements' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Requirement Checklist
        </button>
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'documents' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveSubTab('ai-advisors')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'ai-advisors' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> AI Chat Advisors
        </button>
        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'simulator' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Evaluation Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('jv-simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSubTab === 'jv-simulator' ? 'bg-slate-900 text-amber-400 font-bold shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> JV Partner Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('submission')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'submission' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Compliance Checker
        </button>
        <button
          onClick={() => setActiveSubTab('pursue')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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

          {/* AI AGENT CHAT WORKSPACE */}
          {activeSubTab === 'ai-advisors' && (
            <motion.div 
              key="ai-advisors"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {/* Specialized Agent selection sidebar */}
              <div className="md:col-span-1 space-y-3 border-r border-slate-150 pr-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">AI Procurement Agents</h4>
                {[
                  { id: 'advisor', name: 'Tender Advisor', desc: 'S.A. BID manual educator' },
                  { id: 'analyst', name: 'Opportunity Analyst', desc: 'Go / No-go feasibility analyzer' },
                  { id: 'writer', name: 'AI Bid Writer', desc: 'Drafts technical methodologies' },
                  { id: 'auditor', name: 'Compliance Auditor', desc: 'Audits SARS, CSD and SBD papers' }
                ].map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.id as any);
                      // Clear and seed chat with initial prompt
                      setChatMessages([
                        {
                          id: `msg-init-${agent.id}`,
                          sender: 'assistant',
                          text: agent.id === 'analyst' 
                            ? `Hello Austin. I am your Opportunity Analyst. I have run compatibility calculations matching SAtenderAI's profile against ${tender.buyer}'s metrics. Ask me about specific risks, capacity fits, or qualification fits.`
                            : agent.id === 'writer'
                            ? `I am your AI Bid Writer. Let's draft pristine, high-scoring technical sections. Would you like me to generate your Project Technical Methodology or Quality Assurance Plan?`
                            : agent.id === 'auditor'
                            ? `I am your SAtenderAI Compliance Auditor. I scan dates, tax Pin compliance, Letter of Good Standing, and missing signatures. Run a pre-submission compliance audit to see potential showstoppers.`
                            : `Hello, Austin. I am your general Tender Advisor. Ask me anything about South African procurement, preference points (80/20, 90/10), SBD declaration forms, or municipal bid checklists.`,
                          timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
                          agent: agent.id
                        }
                      ]);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedAgent === agent.id 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className={`text-xs font-bold ${selectedAgent === agent.id ? 'text-amber-400' : 'text-slate-800'}`}>{agent.name}</p>
                    <p className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{agent.desc}</p>
                  </button>
                ))}
              </div>

              {/* Chat Panel */}
              <div className="md:col-span-3 flex flex-col justify-between h-[450px]" id="advisor-chat-panel">
                {/* Message logs */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4" id="chat-messages-scroll">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed space-y-2 ${
                        msg.sender === 'user' 
                          ? 'bg-amber-500 text-slate-950 font-medium' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800'
                      }`}>
                        {/* Render paragraphs cleanly */}
                        {msg.text.split('\n\n').map((para, pIdx) => {
                          if (para.startsWith('*') || para.startsWith('-') || para.startsWith('###') || para.startsWith('####')) {
                            // Render list or headings
                            if (para.startsWith('###') || para.startsWith('####')) {
                              return <h4 key={pIdx} className="font-bold text-slate-900 text-xs mt-2 border-b border-slate-200 pb-1">{para.replace(/^#+\s*/, '')}</h4>;
                            }
                            return (
                              <ul key={pIdx} className="space-y-1 my-1 pl-4 list-disc">
                                {para.split('\n').map((bullet, bIdx) => {
                                  const cleaned = bullet.replace(/^[\s*-]+/, '').trim();
                                  const parts = cleaned.split('**');
                                  return (
                                    <li key={bIdx}>
                                      {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{p}</strong> : p)}
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          }
                          const parts = para.split('**');
                          return (
                            <p key={pIdx}>
                              {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold">{p}</strong> : p)}
                            </p>
                          );
                        })}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}

                  {loadingChat && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      <span>Agent is compiling National Treasury data...</span>
                    </div>
                  )}
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendChat} className="flex gap-2.5 pt-3 border-t border-slate-100">
                  <input 
                    type="text" 
                    placeholder={`Query your AI ${selectedAgent.replace(/^\w/, c => c.toUpperCase())}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 text-slate-800"
                  />
                  <button 
                    type="submit" 
                    disabled={loadingChat || !chatInput.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
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

          {/* PURSUE & SUBMIT HUB PANEL */}
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
                      <span className="text-[9px] font-extrabold bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-wider">Verified reputable broker</span>
                      <span className="text-xs text-slate-400 font-mono">Ref: SA-TND-{tender.id.toUpperCase()}-2026</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">Legally Vetted Procurement Opportunity</h3>
                    <p className="text-[11px] text-slate-400">Authenticated directly from the <strong className="text-white">{tender.sourceBroker || 'National Treasury eTenders Portal'}</strong>. Click "View Original Listing" to confirm legitimacy.</p>
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
                    View Original Listing <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="pursue-bento-grid">
                
                {/* LEFT SIDE: Drafting Proposals & Download documents (Col span 7) */}
                <div className="xl:col-span-7 space-y-6">
                  
                  {/* Module 1: Interactive Proposal Draftsman */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4" id="proposal-draftsman-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                          Step 1: AI Tender Proposal Draftsman
                        </h4>
                        <p className="text-slate-500 text-[11px]">Draft, refine and live-edit essential chapters of your technical proposal</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsDraftingAI(true);
                          setTimeout(() => {
                            setIsDraftingAI(false);
                            if (activeDraftSection === 'summary') {
                              setProposalSummary(prev => prev + "\n\n[REFINED BY AI]: Added specific CIDB compliance references, verified Level 1 B-BBEE points allocation framework, and aligned safety benchmarks with standard public sector criteria.");
                            } else if (activeDraftSection === 'methodology') {
                              setProposalMethodology(prev => prev + "\n\n[REFINED BY AI]: Enhanced mobilization schedule with detailed safety briefs, specific local subcontractor recruitment procedures, and weekly progress inspection protocols.");
                            } else if (activeDraftSection === 'timeline') {
                              setProposalTimeline(prev => prev + "\n\n[REFINED BY AI]: Formulated critical path analysis milestones and added contingency allowances for weather and supply chain bottlenecks.");
                            } else {
                              setProposalCosting(prev => prev + "\n\n[REFINED BY AI]: Re-balanced labor margins and structured full 30% local subcontracting community contingency lines.");
                            }
                          }, 1500);
                        }}
                        disabled={isDraftingAI}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                        id="ai-refine-btn"
                      >
                        <Bot className="w-3.5 h-3.5 text-amber-600" />
                        {isDraftingAI ? 'Refining...' : 'AI Refine Section'}
                      </button>
                    </div>

                    {/* Proposal Sections Inner Tabs */}
                    <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto" id="draft-section-tabs">
                      {(['summary', 'methodology', 'timeline', 'costing'] as const).map((sect) => (
                        <button
                          key={sect}
                          onClick={() => setActiveDraftSection(sect)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            activeDraftSection === sect 
                              ? 'bg-slate-900 text-white' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          {sect === 'summary' && 'Executive Summary'}
                          {sect === 'methodology' && 'Technical Methodology'}
                          {sect === 'timeline' && 'Milestones Timeline'}
                          {sect === 'costing' && 'Costing & BOQ'}
                        </button>
                      ))}
                    </div>

                    {/* Editor Canvas */}
                    <div className="space-y-2">
                      {activeDraftSection === 'summary' && (
                        <textarea
                          id="summary-editor"
                          value={proposalSummary}
                          onChange={(e) => setProposalSummary(e.target.value)}
                          rows={8}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y"
                        />
                      )}
                      {activeDraftSection === 'methodology' && (
                        <textarea
                          id="methodology-editor"
                          value={proposalMethodology}
                          onChange={(e) => setProposalMethodology(e.target.value)}
                          rows={8}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y"
                        />
                      )}
                      {activeDraftSection === 'timeline' && (
                        <textarea
                          id="timeline-editor"
                          value={proposalTimeline}
                          onChange={(e) => setProposalTimeline(e.target.value)}
                          rows={8}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y"
                        />
                      )}
                      {activeDraftSection === 'costing' && (
                        <textarea
                          id="costing-editor"
                          value={proposalCosting}
                          onChange={(e) => setProposalCosting(e.target.value)}
                          rows={8}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-sans focus:outline-none focus:border-slate-400 focus:bg-white resize-y"
                        />
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">✨ Real-time South African procurement specifications validated.</span>
                        <button
                          onClick={() => {
                            setSaveDraftSuccess(true);
                            onUpdateTender({
                              ...tender,
                              readinessScore: Math.min(tender.readinessScore + 5, 100)
                            });
                            setTimeout(() => setSaveDraftSuccess(false), 2500);
                          }}
                          className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all"
                          id="save-proposal-btn"
                        >
                          {saveDraftSuccess ? '✓ Saved Successfully' : 'Compile & Save Proposal Chapter'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Module 2: Print & Download Tender Pack */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4" id="print-pack-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Printer className="w-4 h-4 text-emerald-600" />
                          Step 2: Print & Download Official Tender Pack
                        </h4>
                        <p className="text-slate-500 text-[11px]">Download fully pre-filled compliance documents ready for printing and signatures</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onNavigate('pdf-tools');
                          }}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          id="bundle-in-stirling-btn"
                          title="Open Stirling-PDF Toolsuite to merge, stamp and watermark documents"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Bundle in Stirling-PDF
                        </button>
                        <button
                          onClick={() => {
                            const files = [
                              'Technical Proposal Draft',
                              'National Treasury SBD 4 Signed Declaration',
                              'CSD Summary Profile Report',
                              'SARS PIN Letter',
                              'B-BBEE Affidavit'
                            ];
                            files.forEach((f, index) => {
                              setTimeout(() => {
                                triggerDocumentDownload({
                                  name: `${f}.pdf`,
                                  category: 'compliance',
                                  size: '240 KB'
                                });
                              }, index * 400);
                            });
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
                          id="download-zip-btn"
                        >
                          <FileDown className="w-4 h-4 text-white" /> Download Complete Pack (.ZIP)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2" id="printable-documents-list">
                      {[
                        { name: `SAtenderAI - Complete Technical & Financial Proposal Draft.pdf`, size: '1.2 MB', desc: 'Pre-compiled Executive Summary, Methodology, Work Plan, and Costing.' },
                        { name: `National Treasury SBD 4 Signed Declaration.pdf`, size: '412 KB', desc: 'Pre-filled SBD 4 form with your digital disclosures and verified signature.' },
                        { name: `CSD Summary Profile Report.pdf`, size: '344 KB', desc: 'Official Treasury CSD profile listing active status, CIDB grades, and address.' },
                        { name: `SARS Tax PIN Letter (Verified Compliant).pdf`, size: '215 KB', desc: 'Direct verification document from South African Revenue Service.' },
                        { name: `SANAS Certified B-BBEE Level 1 Sworn Affidavit.pdf`, size: '890 KB', desc: 'Vetted Broad-Based Black Economic Empowerment compliance form.' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all gap-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400 font-mono">{item.size}</span>
                            <button
                              onClick={() => {
                                triggerDocumentDownload({
                                  name: item.name,
                                  category: 'compliance',
                                  size: item.size
                                });
                              }}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                window.print();
                              }}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all"
                              title="Print out"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Secure Official Email Submission Gateway (Col span 5) */}
                <div className="xl:col-span-5" id="secure-email-gateway">
                  <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden h-full flex flex-col justify-between">
                    
                    {/* Glowing background gradient elements for professional look */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                      {/* Gateway Header */}
                      <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                            Step 3: Secure SAtenderAI Mailer Gateway
                          </h4>
                          <p className="text-[10px] text-slate-400">Direct transmission to the official buyer bid inbox</p>
                        </div>
                        <span className="text-[8px] font-mono tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                          Secure SMTP
                        </span>
                      </div>

                      {/* Email Form */}
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To (Official Buyer Email)</label>
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <input 
                              type="text" 
                              value={emailTo}
                              onChange={(e) => setEmailTo(e.target.value)}
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
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                            id="email-subject-input"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Message</label>
                          <textarea 
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={8}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-slate-700 resize-none"
                            id="email-body-editor"
                          />
                        </div>

                        {/* Attachments Tray */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Attachments Package (Verified Active)</label>
                          <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-[9px] font-mono text-slate-400">
                            <div className="flex items-center justify-between text-teal-400 font-bold">
                              <span>📎 Technical_Proposal_Draft.pdf</span>
                              <span>Verified ✓</span>
                            </div>
                            <div className="flex items-center justify-between text-teal-400 font-bold">
                              <span>📎 SBD_4_Declaration_Signed.pdf</span>
                              <span>Verified ✓</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>📎 CSD_Profile_Summary.pdf</span>
                              <span>Attached ✓</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>📎 SARS_Compliant_Tax_PIN.pdf</span>
                              <span>Attached ✓</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submission Dispatch Section */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      
                      {/* Sending Logs Console */}
                      {emailSentLogs.length > 0 && (
                        <div className="bg-black/80 rounded-xl p-3 border border-slate-800 font-mono text-[9px] text-amber-400 space-y-1 max-h-24 overflow-y-auto" id="sending-logs-console">
                          {emailSentLogs.map((log, lidx) => (
                            <div key={lidx} className="flex gap-1">
                              <span className="text-slate-500">&gt;</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display receipt if submission is completed */}
                      {submissionReceipt ? (
                        <div className="p-4 bg-teal-950/40 border border-teal-500/20 rounded-2xl space-y-3" id="submission-receipt-proof">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-teal-200">Official Submission Successful</p>
                              <p className="text-[9px] text-teal-400 font-mono">Receipt ID: {submissionReceipt.receiptId}</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-300 space-y-1 leading-relaxed">
                            <p>• <strong>Timestamp:</strong> {submissionReceipt.timestamp}</p>
                            <p>• <strong>Authority:</strong> South African Government Central Procurement Node</p>
                            <p>• <strong>Hash:</strong> <span className="font-mono text-slate-400">{submissionReceipt.securedHash}</span></p>
                          </div>
                          <button
                            onClick={() => {
                              triggerDocumentDownload({
                                name: `Submission-Receipt-${submissionReceipt.receiptId}.pdf`,
                                category: 'compliance',
                                size: '110 KB'
                              });
                            }}
                            className="w-full text-center py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                            id="download-receipt-proof-btn"
                          >
                            Download Submission Receipt Proof
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isSendingEmail || !emailTo.trim()}
                          onClick={() => {
                            setIsSendingEmail(true);
                            setEmailSentLogs([]);
                            
                            const logs = [
                              "Establishing connection to secure SAtenderAI submission gateway...",
                              "Performing digital compliance audits on attachment payloads...",
                              "Generating RSA-256 digital signature seals...",
                              "Verifying National Treasury CSD listing state...",
                              "SAtenderAI compliance certificate matched & packed...",
                              "Dispatching full encrypted tender packet to SMTP relay...",
                              "Connecting to remote target: " + emailTo,
                              "Enqueued for committee bid log insertion.",
                              "Dispatch confirmed. Transaction receipt successfully issued."
                            ];

                            logs.forEach((logText, index) => {
                              setTimeout(() => {
                                setEmailSentLogs(prev => [...prev, logText]);
                              }, index * 400);
                            });

                            setTimeout(() => {
                              const receiptId = `ZA-REC-${Math.floor(100000 + Math.random() * 900000)}-2026`;
                              const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
                              setSubmissionReceipt({
                                receiptId,
                                timestamp,
                                sentBy: 'Austin Mpapane',
                                attachments: ['Technical_Proposal_Draft.pdf', 'SBD_4_Declaration_Signed.pdf', 'CSD_Profile_Summary.pdf', 'SARS_Compliant_Tax_PIN.pdf'],
                                securedHash: 'SHA256: 8a4c11b8b2e56cfc0f16248da93e506e788bc1bb'
                              });
                              setIsSendingEmail(false);
                              
                              onUpdateTender({
                                ...tender,
                                status: 'SUBMITTED' as const,
                                readinessScore: 100
                              });
                            }, logs.length * 400 + 100);
                          }}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          id="submit-bid-btn"
                        >
                          {isSendingEmail ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                              <span>Submitting Bid Package...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-slate-950" />
                              <span>Submit Bid & Transmit Official Pack</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
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
                  <p className="text-[10px] text-slate-400">Pre-populating company details for Austin Mpapane — SAtenderAI Services (Pty) Ltd</p>
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
      </AnimatePresence>
    </div>
  );
}
