import React, { useState } from 'react';
import { ShieldCheck, FileText, X, CheckCircle, Lock, Scale, Download } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CURRENT_TOS_VERSION } from '../lib/firebase';

interface LegalComplianceModalProps {
  isOpen: boolean;
  initialTab?: 'tos' | 'popia';
  companyName?: string;
  acceptedAt?: string;
  acceptedByEmail?: string;
  onClose: () => void;
  onAcceptConsent?: () => void;
}

export default function LegalComplianceModal({
  isOpen,
  initialTab = 'popia',
  companyName = 'Your Company',
  acceptedAt,
  acceptedByEmail,
  onClose,
  onAcceptConsent
}: LegalComplianceModalProps) {
  const [activeDoc, setActiveDoc] = useState<'tos' | 'popia'>(initialTab);

  if (!isOpen) return null;

  const handleDownloadDpa = async () => {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    let y = 790;

    const drawWrapped = (text: string, font: any, size: number, color = rgb(0.1, 0.14, 0.2)) => {
      const words = text.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) > 505) {
          page.drawText(line, { x: 45, y, size, font, color });
          y -= size + 5;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: 45, y, size, font, color });
        y -= size + 6;
      }
    };

    page.drawText('SATENDERAI - SOUTH AFRICAN SAAS TERMS & POPIA DPA', {
      x: 45,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.05, 0.09, 0.16)
    });
    y -= 24;

    const metaLines = [
      `Agreement Version: ${CURRENT_TOS_VERSION}`,
      `Responsible Party (Company): ${companyName}`,
      `Authorized User: ${acceptedByEmail || 'Pending Acceptance'}`,
      `Consent Timestamp: ${acceptedAt || new Date().toISOString()}`
    ];
    for (const m of metaLines) {
      drawWrapped(m, fontRegular, 10, rgb(0.25, 0.3, 0.4));
    }
    y -= 10;

    const sections = [
      {
        heading: '1. PROTECTION OF PERSONAL INFORMATION ACT (ACT 4 OF 2013 - POPIA)',
        bullets: [
          `SAtenderAI operates strictly as an Operator under Section 20 of POPIA processing tender returnable records on behalf of the Responsible Party (${companyName}).`,
          'CIPC registration documents, SARS Tax Compliance PINs, CSD supplier numbers, B-BBEE affidavits, CIDB certificates, and employee CVs are encrypted in transit (TLS 1.3) and tenant-isolated in Cloud Firestore.',
          'Zero Resale / Zero Cross-Tenant Sharing: Pricing schedules, BOQs, and technical methodologies remain restricted strictly to verified company workspace members.'
        ]
      },
      {
        heading: '2. ELECTRONIC COMMUNICATIONS AND TRANSACTIONS ACT (ACT 25 OF 2002 - ECTA)',
        bullets: [
          'Digital stamps, timestamps, and SBD 1 / SBD 4 / SBD 6.1 declarations generated within SAtenderAI require final review and authorization by a duly mandated company signatory prior to eTender portal or tender-box submission.'
        ]
      },
      {
        heading: '3. SUBSCRIPTION & SAAS PROCUREMENT TERMS',
        bullets: [
          'Public procurement notices are aggregated from National Treasury eTenders and SOE bulletins. Final verification of addenda, compulsory briefing sessions, and closing deadlines prior to 11:00 SAST remains the bidder responsibility.',
          'Governed by the laws of the Republic of South Africa.'
        ]
      }
    ];

    for (const sec of sections) {
      y -= 6;
      drawWrapped(sec.heading, fontBold, 11, rgb(0.05, 0.09, 0.16));
      for (const b of sec.bullets) {
        drawWrapped(`- ${b}`, fontRegular, 9.5, rgb(0.2, 0.25, 0.33));
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAtenderAI_POPIA_ToS_${CURRENT_TOS_VERSION}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                South African SaaS Legal &amp; POPIA Compliance Center
              </h2>
              <p className="text-[11px] text-slate-400">
                Act 4 of 2013 (POPIA) &amp; ECTA Act 25 of 2002 • Agreement v{CURRENT_TOS_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveDoc('popia')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDoc === 'popia'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              POPIA Privacy &amp; Data Processing (Act 4 of 2013)
            </button>
            <button
              onClick={() => setActiveDoc('tos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDoc === 'tos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SaaS Terms of Service (RSA)
            </button>
          </div>

          <button
            onClick={handleDownloadDpa}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Signed PDF Notice
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {acceptedAt && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">POPIA &amp; ToS Consent Recorded</p>
                  <p className="text-[11px] text-emerald-700">
                    Accepted by <strong>{acceptedByEmail}</strong> on {new Date(acceptedAt).toLocaleString('en-ZA')}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                v{CURRENT_TOS_VERSION}
              </span>
            </div>
          )}

          {activeDoc === 'popia' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Roles under POPIA (Responsible Party vs Operator)
                </h3>
                <p>
                  Your subscribing enterprise acts as the <strong>Responsible Party</strong> regarding director IDs, employee CVs, client references, and subcontractor CSD details uploaded into SAtenderAI. SAtenderAI operates strictly as a bonded <strong>Operator</strong> under Section 20 &amp; Section 21 of the Protection of Personal Information Act (POPIA), Act 4 of 2013.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">2. Purpose Limitation &amp; Statutory Documents Processed</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Corporate Credentials:</strong> CIPC registration numbers, CSD MAAA supplier profiles, SARS Tax Compliance Status PINs, and SANAS/Sworn B-BBEE affidavits.</li>
                  <li><strong>Signatory &amp; Team Records:</strong> Director names, work emails, professional council numbers (ECSA, PSIRA, CIDB, SAHPRA), and CV summaries strictly for compiling SBD 1, SBD 4, SBD 6.1, and technical methodologies.</li>
                  <li><strong>Zero Cross-Tenant Leakage:</strong> Cloud Firestore security rules enforce strict tenant isolation (`companies/&#123;companyId&#125;`). Pricing schedules, bid margins, and submitted returnables are never visible to competing bidders or used to train third-party AI models.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">3. Security Safeguards &amp; Data Subject Rights (Sections 19–24)</h4>
                <p>
                  All sessions authenticate via verified Google OAuth tokens with TLS 1.3 encryption in transit and AES-256 encryption at rest. Authorized company administrators can export, correct, or request permanent deletion of team member records and tender binders at any time, in compliance with Section 24 of POPIA and the Information Regulator of South Africa.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">4. Transactional Email &amp; Alert Consent</h4>
                <p>
                  Opted-in team members receive automated 07:30 AM SAST Procurement Briefings and 48-Hour Tender Closing Alerts via configured transactional mail relays (Postmark / SendGrid). Recipients may adjust or opt out of alerts per company workspace at any time in <strong>Workspace Settings &gt; Notification Rules</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-amber-600" />
                  1. Scope of SaaS Platform License
                </h3>
                <p>
                  Subject to active subscription and team member seat limits, SAtenderAI grants {companyName} a non-exclusive, multi-user enterprise license to access tender discovery feeds, compliance checkers, PDF assembly tools, and commercial invoicing modules across South Africa.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">2. Public Procurement &amp; ECTA (Act 25 of 2002) Disclaimer</h4>
                <p>
                  While SAtenderAI synchronizes with National Treasury eTenders and public SOE portals, procuring entities occasionally issue urgent errata or extend deadlines without API notice. The bidding company remains solely responsible for inspecting official tender documents, attending compulsory site briefings, and verifying final bid box or electronic delivery before the statutory 11:00 SAST cut-off.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">3. Multi-Employee Access &amp; RBAC Governance</h4>
                <p>
                  Company Administrators control workspace Invite Codes and employee roles (`ADMIN`, `BID_MANAGER`, `ESTIMATOR`, `COMPLIANCE`, `VIEWER`). Only duly authorized directors or mandated signatories may stamp and dispatch binding SBD 1, SBD 4, and SBD 6.1 declarations.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">4. Governing Law &amp; Jurisdiction</h4>
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of the Republic of South Africa, including the Electronic Communications and Transactions Act (ECTA), the Preferential Procurement Policy Framework Act (PPPFA), and the Companies Act 71 of 2008.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Protected under POPIA Act 4 of 2013
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
            {onAcceptConsent && (
              <button
                onClick={() => {
                  onAcceptConsent();
                  onClose();
                }}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                I Accept POPIA &amp; Terms
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
