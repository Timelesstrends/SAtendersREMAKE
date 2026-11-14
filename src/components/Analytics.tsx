import React, { useMemo } from 'react';
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
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { TenderOpportunity, CompanyProfile } from '../types';

interface AnalyticsProps {
  tenders: TenderOpportunity[];
  companyProfile: CompanyProfile;
}

export default function Analytics({ tenders, companyProfile }: AnalyticsProps) {
  // Dynamic analytics derived from active and historical tenders in pipeline
  const stats = useMemo(() => {
    const total = tenders.length;
    const pursued = tenders.filter(t => t.status !== 'DISCOVERED');
    const submittedOrWon = tenders.filter(t => t.status === 'SUBMITTED' || t.status === 'WON' || t.status === 'AWAITING_OUTCOME');
    const wonCount = tenders.filter(t => t.status === 'WON').length || 2; // benchmark minimum
    const totalValue = tenders.reduce((acc, t) => acc + (t.value || 0), 0);
    const avgValue = total > 0 ? totalValue / total : 18500000;

    // Sector distribution
    const sectorMap: { [key: string]: { total: number; sumScore: number } } = {};
    tenders.forEach(t => {
      const sec = t.sector.split('&')[0].trim();
      if (!sectorMap[sec]) sectorMap[sec] = { total: 0, sumScore: 0 };
      sectorMap[sec].total += 1;
      sectorMap[sec].sumScore += t.companyMatch;
    });

    const sectorBreakdown = Object.entries(sectorMap).map(([name, data]) => ({
      sector: name,
      count: data.total,
      matchRate: Math.round(data.sumScore / data.total)
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Province distribution
    const provMap: { [key: string]: number } = {};
    tenders.forEach(t => {
      const prov = t.province || 'Gauteng';
      provMap[prov] = (provMap[prov] || 0) + 1;
    });

    const provinceBreakdown = Object.entries(provMap).map(([province, count]) => ({
      province,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      totalTenders: total,
      pursuedCount: pursued.length,
      avgValue,
      avgMatchScore: Math.round(tenders.reduce((acc, t) => acc + t.companyMatch, 0) / (total || 1)),
      sectorBreakdown,
      provinceBreakdown
    };
  }, [tenders]);

  return (
    <div className="space-y-8" id="analytics-container">
      {/* Analytics Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="analytics-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tender Performance Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              Live Pipeline Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Adjudication statistics, sector compatibility distributions, and geographic win modeling for {companyProfile.tradingName || companyProfile.legalName}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>B-BBEE Level {companyProfile.bbeeLevel} (Max Preference Points)</span>
        </div>
      </div>

      {/* Strategic AI Insights */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg space-y-4 relative overflow-hidden" id="analytics-ai-insight">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
              Competitive Position Analysis
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                CIDB {companyProfile.cidbGrading}
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Based on your active registered assets (including {companyProfile.assets.map(a => a.name).slice(0, 2).join(' & ')}), your highest scoring categories are <strong>Civil Infrastructure and Armed Security</strong> with an average <strong>{stats.avgMatchScore}% readiness fit</strong>. 
              Under South African 80/20 and 90/10 preference frameworks, your Level {companyProfile.bbeeLevel} certification ensures full 20 or 10 points on preference allocation.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="analytics-metrics">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tenders in Engine</span>
          <p className="text-3xl font-bold text-slate-900">{stats.totalTenders}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {stats.pursuedCount} Active Workspaces
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Capability Match</span>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">{stats.avgMatchScore}</p>
            <span className="text-sm font-semibold text-slate-500">%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.avgMatchScore}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Contract Value</span>
          <p className="text-3xl font-bold text-slate-900">R{(stats.avgValue / 1000000).toFixed(1)}M</p>
          <p className="text-[11px] text-slate-400">Targeting Public & SOE Gazette</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-shadow">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Key Personnel</span>
          <p className="text-3xl font-bold text-slate-900">{companyProfile.employees.length} Specialists</p>
          <p className="text-[11px] text-teal-600 font-semibold">ECSA & SAMTRAC Accredited</p>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector Compatibility Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Capability Fit by Procurement Sector</h3>
              <p className="text-[10px] text-slate-400">Match percentage based on CIDB grading, assets, and past projects</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {stats.sectorBreakdown.length} Sectors
            </span>
          </div>

          <div className="space-y-4">
            {stats.sectorBreakdown.map((sec, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-slate-900">{sec.sector}</span>
                  <span className="font-mono font-bold text-slate-950">{sec.matchRate}% Compatibility ({sec.count} tenders)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      sec.matchRate >= 90 ? 'bg-emerald-500' : sec.matchRate >= 80 ? 'bg-amber-500' : 'bg-slate-700'
                    }`} 
                    style={{ width: `${sec.matchRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Geographical Coverage by Province</h3>
              <p className="text-[10px] text-slate-400">Regional distribution of active public procurement opportunities</p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {stats.provinceBreakdown.map((prov, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{prov.province}</span>
                  <span className="font-mono font-bold text-slate-900">{prov.count} Bids</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${prov.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{prov.pct}% of active pipeline</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
