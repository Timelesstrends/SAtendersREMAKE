import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Percent, 
  MapPin, 
  Sparkles, 
  Building2, 
  Clock, 
  DollarSign
} from 'lucide-react';
import { mockAnalytics } from '../data/mockData';

export default function Analytics() {
  return (
    <div className="space-y-8" id="analytics-container">
      {/* Analytics Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="analytics-header">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tender Performance Analytics</h1>
          <p className="text-xs text-slate-500">Historical performance metrics, geographical success ratios, and bid weakness audits</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-850 text-xs font-bold rounded-lg border border-amber-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            AI Intelligence Enabled
          </span>
        </div>
      </div>

      {/* Strategic AI Insights - From PRD page 42 */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg space-y-4 relative overflow-hidden" id="analytics-ai-insight">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">Strategic Performance Insight</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              "You have a <strong>42% win rate in security services tenders</strong> but only a <strong>12% win rate in facilities management tenders</strong>. 
              Our analytical audit indicates your most common weakness is <strong>functionality scoring</strong>, typically caused by missing concrete implementation milestones in your technical proposal. 
              Adding a phased mobilisation plan will increase your average functionality yield by up to 15 points."
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="analytics-metrics">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Submitted Bids</span>
          <p className="text-3xl font-bold text-slate-900">{mockAnalytics.totalBids}</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span> {mockAnalytics.wins} Wins</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {mockAnalytics.losses} Losses</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Win Rate</span>
          <p className="text-3xl font-bold text-slate-900">{mockAnalytics.winRate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-teal-500 h-full" style={{ width: `${mockAnalytics.winRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Bid Value</span>
          <p className="text-3xl font-bold text-slate-900">R{(mockAnalytics.avgTenderValue/1000000).toFixed(1)}M</p>
          <p className="text-[11px] text-slate-400">South African Rands</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Preparation Time</span>
          <p className="text-3xl font-bold text-slate-900">14 Days</p>
          <p className="text-[11px] text-slate-400">From discovered to submitted</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submitted Bids History - Custom SVG Line chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Bid Submissions History</h3>
            <p className="text-[10px] text-slate-400">Quarterly trend of submitted and won proposals</p>
          </div>

          {/* SVG Graph */}
          <div className="h-56 w-full flex items-end relative pt-6">
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-200"></div>
            <div className="absolute inset-x-0 bottom-[33%] h-[1px] border-t border-dashed border-slate-100"></div>
            <div className="absolute inset-x-0 bottom-[66%] h-[1px] border-t border-dashed border-slate-100"></div>
            
            <div className="flex-1 flex justify-around items-end h-full relative z-10">
              {mockAnalytics.bidsHistory.map((hist, index) => {
                const subHeight = (hist.submitted / 10) * 100;
                const wonHeight = (hist.won / 10) * 100;

                return (
                  <div key={index} className="flex flex-col items-center gap-2 w-16 group">
                    <div className="flex items-end gap-1.5 h-36">
                      {/* Submitted Bar */}
                      <div className="w-3 bg-slate-200 rounded-t-md hover:bg-slate-300 transition-colors" style={{ height: `${subHeight}%` }}></div>
                      {/* Won Bar */}
                      <div className="w-3 bg-teal-500 rounded-t-md hover:bg-teal-600 transition-colors" style={{ height: `${wonHeight}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{hist.quarter}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 text-[10px] pt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-200 rounded"></span> Submitted</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-teal-500 rounded"></span> Won</span>
          </div>
        </div>

        {/* Win Rate by Sector */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Win Rate by Procurement Sector</h3>
            <p className="text-[10px] text-slate-400">Performance across Civil, Security, and Facility panels</p>
          </div>

          <div className="space-y-4">
            {mockAnalytics.winRateBySector.map((sec, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-semibold text-slate-800">{sec.sector}</span>
                  <span className="font-bold text-slate-950">{sec.winRate}% Win Rate ({sec.total} total)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${sec.winRate > 50 ? 'bg-teal-500' : sec.winRate > 30 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${sec.winRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win Rate by Province */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Geographical Success (Provinces)</h3>
            <p className="text-[10px] text-slate-400">Adjudication yield mapped across South African provinces</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mockAnalytics.winRateByProvince.map((prov, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {prov.province}
                  </span>
                  <span className="font-bold text-slate-950 text-xs">{prov.winRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-900 h-full" style={{ width: `${prov.winRate}%` }}></div>
                </div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-semibold">{prov.count} submitted bids</span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Lost Points causes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Audited Score Disqualification Risk Causes</h3>
            <p className="text-[10px] text-slate-400">Analysis of where SAtenderAI has historically shed technical points</p>
          </div>

          <div className="space-y-4">
            {mockAnalytics.lostPointsCauses.map((cause, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px] gap-2">
                  <span className="text-slate-600 font-medium line-clamp-1">{cause.cause}</span>
                  <span className="text-slate-900 font-bold whitespace-nowrap">{cause.percentage}% of losses</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${cause.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
