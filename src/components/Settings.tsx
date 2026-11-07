import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  Bell, 
  Lock, 
  HelpCircle,
  Database,
  Sparkles,
  FileText
} from 'lucide-react';
import StirlingPdfWorkspace from './StirlingPdfWorkspace';
import { CompanyDocument } from '../types';

interface SettingsProps {
  documents?: CompanyDocument[];
  onUploadDocument?: (doc: CompanyDocument) => void;
  initialSubTab?: 'parameters' | 'stirling-pdf' | 'members' | 'notifications' | 'databases';
}

export default function Settings({ documents = [], onUploadDocument, initialSubTab = 'stirling-pdf' }: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'parameters' | 'stirling-pdf' | 'members' | 'notifications' | 'databases'>(initialSubTab);

  return (
    <div className="space-y-6" id="settings-container">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="settings-header">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Workspace Settings & Tools</h1>
          <p className="text-xs text-slate-500">Configure procurement parameters, database connections, and PDF processing engines</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('stirling-pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'stirling-pdf' 
                ? 'bg-slate-950 text-amber-400 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Stirling PDF Suite
          </button>
          <button 
            onClick={() => setActiveSubTab('parameters')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'parameters' 
                ? 'bg-slate-950 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            General Rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1.5 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm h-fit">
          <button 
            onClick={() => setActiveSubTab('stirling-pdf')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
              activeSubTab === 'stirling-pdf'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 ${activeSubTab === 'stirling-pdf' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Stirling PDF Tools</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              activeSubTab === 'stirling-pdf' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'
            }`}>
              v0.44+
            </span>
          </button>

          <button 
            onClick={() => setActiveSubTab('parameters')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'parameters'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeSubTab === 'parameters' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>General Parameters</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('members')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'members'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className={`w-4 h-4 ${activeSubTab === 'members' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Account Members</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'notifications'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className={`w-4 h-4 ${activeSubTab === 'notifications' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Notification Rules</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('databases')}
            className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeSubTab === 'databases'
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database className={`w-4 h-4 ${activeSubTab === 'databases' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Database Connections</span>
          </button>
        </div>

        {/* Configurations Forms or Stirling PDF Workspace */}
        <div className="md:col-span-9 space-y-6">
          {activeSubTab === 'stirling-pdf' && (
            <StirlingPdfWorkspace 
              documents={documents}
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
                      <p className="text-[10px] text-slate-400">Pulls National eTender Portal & Municipalities overnight</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800">Email Expiry Reminders</p>
                      <p className="text-[10px] text-slate-400">Receive warnings 30 days before CSD / SARS cert expirations</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800">Strict Compliance Gatekeeper</p>
                      <p className="text-[10px] text-slate-400">Blocks submission generation if any statutory SBD forms are missing</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-slate-900 border-slate-350 focus:ring-slate-900 rounded" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 leading-relaxed">
                <h4 className="font-bold text-slate-950 flex items-center gap-1">
                  <Lock className="w-4 h-4 text-slate-500" /> Secure Workspace Environment
                </h4>
                <p className="text-[11px] text-slate-500">
                  SAtenderAI uses strict, server-side sandboxed processes for all AI model calls. No sensitive data, director details, CSD reports, or SARS pin configurations are exposed to external clients or models.
                </p>
              </div>
            </div>
          )}

          {activeSubTab === 'members' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                Team & Authorized Signatories
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Austin Mpapane</p>
                  <p className="text-[11px] text-slate-500">Managing Director • Lead Bid Specialist (austinmpapane97@gmail.com)</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Owner & Signatory</span>
              </div>
            </div>
          )}

          {activeSubTab === 'notifications' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-slate-500" />
                Alerts & Expiry Notifications
              </h3>
              <p className="text-slate-500">Configure alert channels for statutory compliance certificate expirations (B-BBEE, SARS PIN, COIDA).</p>
            </div>
          )}

          {activeSubTab === 'databases' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-500" />
                Procurement Feeds & Broker Endpoints
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>National Treasury eTenders (OCDS API)</span>
                  <span className="text-emerald-700 font-bold">Active</span>
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
