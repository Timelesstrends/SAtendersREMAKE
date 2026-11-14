import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Briefcase, 
  Percent, 
  TrendingUp, 
  Compass,
  FileCheck
} from 'lucide-react';
import { TenderOpportunity, CompanyProfile } from '../types';

interface DashboardProps {
  companyProfile: CompanyProfile;
  tenders: TenderOpportunity[];
  currentSession?: import('../types').UserSession | null;
  onNavigate: (tab: string, tenderId?: string) => void;
}

export default function Dashboard({ companyProfile, tenders, currentSession, onNavigate }: DashboardProps) {
  const [briefing, setBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);
  const [isSimulatedBriefing, setIsSimulatedBriefing] = useState<boolean>(false);

  const companyDisplayName = companyProfile.tradingName || companyProfile.legalName || 'SAtenderAI Group';
  const userName = currentSession?.user?.name || companyProfile.employees[0]?.name || 'Austin Mpapane';
  const userRole = currentSession?.user?.role || companyProfile.employees[0]?.role || 'Managing Director';

  // Derive counts
  const activeBids = tenders.filter(t => t.status !== 'DISCOVERED' && t.status !== 'WON' && t.status !== 'LOST' && t.status !== 'CANCELLED');
  const upcomingDeadlinesCount = activeBids.filter(t => {
    const diffTime = Math.abs(new Date(t.closingDate).getTime() - new Date().getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  }).length;

  const avgMatchScore = Math.round(
    tenders.reduce((sum, t) => sum + t.companyMatch, 0) / tenders.length
  );

  const fetchMorningBriefing = async (forceRefresh = false) => {
    setLoadingBriefing(true);
    try {
      const response = await fetch('/api/morning-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyDisplayName,
          bbeeLevel: companyProfile.bbeeLevel,
          activeTendersCount: activeBids.length,
          nextDeadline: activeBids[0] ? `${activeBids[0].title} (${activeBids[0].buyer})` : 'None active',
          industry: companyProfile.industry,
          forceRefresh
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('NON_JSON_RESPONSE');
      }

      const data = await response.json();
      setBriefing(data.text || 'Unable to generate morning briefing at this time.');
      setIsSimulatedBriefing(!!data.isSimulated);
    } catch (error) {
      console.warn('Serving resilient fallback morning briefing:', error);
      setBriefing(`Good morning, ${userName}.

I found **${activeBids.length || 3} tenders requiring attention today** for **${companyDisplayName}** (B-BBEE Level ${companyProfile.bbeeLevel}).
* **Eskom - Security Services Panel**: Closes soon. Your technical methodology is drafted; ensuring your OHS and risk mitigation plan are attached will optimize functionality scoring.
* **City of Johannesburg - Infrastructure Development**: Priority opportunity matching your verified CIDB grading and Gauteng operational footprint.
* **National Treasury CSD Compliance**: Ensure your active SARS Tax PIN and B-BBEE affidavit remain synchronized before adjudication.

*Priority Action Recommendation:* Review mandatory briefing dates and finalize returnable compliance documents before deadline expiration.`);
      setIsSimulatedBriefing(true);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchMorningBriefing();
  }, [tenders]);

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-8 border border-slate-800 text-white shadow-xl relative overflow-hidden" id="dashboard-hero">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Briefcase className="w-64 h-64 text-white" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs text-amber-400 font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{companyDisplayName} • {userRole}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Good morning, {userName}</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Welcome back to {companyDisplayName}. Your company intelligence profile and equipment fleet have been synced with the latest National Treasury eTenders database.
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-3 relative z-10">
          <button 
            id="nav-opportunities-btn"
            onClick={() => onNavigate('opportunities')} 
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-medium rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Discover Tenders
          </button>
          <button 
            id="nav-profile-btn"
            onClick={() => onNavigate('company')} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all duration-200"
          >
            Intelligence Profile
          </button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-metrics">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-250">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Active Bids</p>
            <p className="text-3xl font-semibold text-slate-900">{activeBids.length}</p>
            <p className="text-xs text-slate-400">Pursued workspaces</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-250">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Avg Match Score</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-semibold text-slate-900">{avgMatchScore}</p>
              <span className="text-sm font-semibold text-slate-500">%</span>
            </div>
            <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High Compatibility
            </p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-250">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Upcoming Deadlines</p>
            <p className="text-3xl font-semibold text-slate-900">{upcomingDeadlinesCount}</p>
            <p className="text-xs text-slate-400">Closing within 14 days</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-250">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">B-BBEE Status</p>
            <p className="text-3xl font-semibold text-slate-900">Level {companyProfile.bbeeLevel}</p>
            <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> 100% Preferential Points
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: AI Morning Briefing & Priority Tenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Morning Briefing Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4" id="morning-briefing-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 text-amber-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Morning Briefing</h2>
                <p className="text-xs text-slate-500">Real-time procurement analysis & recommended priority actions</p>
              </div>
            </div>
            <button
              onClick={() => fetchMorningBriefing(true)}
              disabled={loadingBriefing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {loadingBriefing ? 'Analyzing...' : 'Refresh Briefing'}
            </button>
          </div>

          <div className="relative min-h-[220px]">
            {loadingBriefing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 animate-pulse">SAtenderAI is reading tender circulars & checking compliance...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-slate max-w-none text-slate-600 space-y-4 leading-relaxed text-sm"
              >
                {briefing.split('\n\n').map((paragraph, index) => {
                  // Render paragraph cleanly with bullets
                  if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
                    return (
                      <ul key={index} className="space-y-2.5 my-2 pl-4 list-disc marker:text-amber-500">
                        {paragraph.split('\n').map((bullet, bIdx) => {
                          const cleaned = bullet.replace(/^[\s*-]+/, '').trim();
                          // Bold styling inside bullet
                          const parts = cleaned.split('**');
                          return (
                            <li key={bIdx} className="text-slate-600">
                              {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{p}</strong> : p)}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  }
                  
                  // Regular paragraph
                  const parts = paragraph.split('**');
                  return (
                    <p key={index} className="text-slate-600">
                      {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{p}</strong> : p)}
                    </p>
                  );
                })}

                {isSimulatedBriefing && (
                  <div className="mt-6 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Running in local simulation mode. Configure a valid <strong>GEMINI_API_KEY</strong> in Secrets for custom live-generated briefings.</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Priority Bids & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6" id="priority-tenders-card">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Priority Bids</h2>
            <p className="text-xs text-slate-500">Active workspaces requiring critical progress today</p>
          </div>

          <div className="space-y-4">
            {activeBids.slice(0, 3).map((t) => {
              const daysLeft = Math.ceil((new Date(t.closingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 2;

              return (
                <div 
                  key={t.id} 
                  className={`p-4 rounded-xl border transition-all duration-200 hover:border-slate-300 ${isUrgent ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100 bg-slate-50/30'}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900 text-sm line-clamp-1">{t.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${
                        isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {daysLeft < 0 ? 'Closed' : daysLeft === 0 ? 'Closing Today' : daysLeft === 1 ? 'closes in 18h' : `${daysLeft} days left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{t.buyer}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Readiness: <strong className="text-slate-700 font-semibold">{t.readinessScore}%</strong>
                      </span>
                      <button 
                        onClick={() => onNavigate('tenders', t.id)}
                        className="text-xs text-slate-800 hover:text-amber-600 font-medium flex items-center gap-1 transition-colors group"
                      >
                        Open Workspace
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeBids.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Compass className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No active tender bids in progress.</p>
                <button 
                  onClick={() => onNavigate('opportunities')}
                  className="text-xs text-amber-600 hover:underline font-semibold"
                >
                  Find a high-match tender now
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 relative overflow-hidden shadow-md">
            <div className="space-y-1 relative z-10">
              <h4 className="text-xs text-amber-400 font-semibold tracking-wider uppercase">B-BBEE Optimizer</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your SANAS B-BBEE affidavit expires in <strong>21 days</strong>. SAtenderAI can pre-fill and generate a fresh Level 1 commissioner affidavit in seconds.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('compliance')} 
              className="text-[11px] font-bold text-white hover:text-amber-300 flex items-center gap-1 relative z-10"
            >
              Renew Document now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute -bottom-6 -right-6 opacity-10">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
