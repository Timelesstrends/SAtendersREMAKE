import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  MapPin, 
  FileText 
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  buyer: string;
  date: string;
  type: 'closing' | 'briefing' | 'clarification';
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState('July 2026');

  const events: CalendarEvent[] = [
    {
      id: 'e-1',
      title: 'Provision of Security Services Panel',
      buyer: 'Eskom Holdings SOC',
      date: '2026-07-19',
      type: 'closing'
    },
    {
      id: 'e-2',
      title: 'Construction of Community Hall and Recreation Centre',
      buyer: 'City of Johannesburg Local Municipality',
      date: '2026-07-28',
      type: 'briefing'
    },
    {
      id: 'e-3',
      title: 'Construction of Community Hall and Recreation Centre',
      buyer: 'City of Johannesburg Local Municipality',
      date: '2026-08-14',
      type: 'closing'
    },
    {
      id: 'e-4',
      title: 'Facility Care, Repairs and General Maintenance Services',
      buyer: 'City of Cape Town',
      date: '2026-08-10',
      type: 'briefing'
    },
    {
      id: 'e-5',
      title: 'Facility Care, Repairs and General Maintenance Services',
      buyer: 'City of Cape Town',
      date: '2026-08-28',
      type: 'closing'
    }
  ];

  // Custom static calendar grid for July/August 2026
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6" id="calendar-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="calendar-header">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tender Workspace Calendar</h1>
          <p className="text-xs text-slate-500">Track site briefings, clarification cut-offs, and final submission deadlines</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-1">
          <button className="p-1.5 hover:bg-white rounded-lg transition-all" onClick={() => setCurrentMonth('July 2026')}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 bg-white rounded-lg shadow-sm text-slate-800">{currentMonth}</span>
          <button className="p-1.5 hover:bg-white rounded-lg transition-all" onClick={() => setCurrentMonth('August 2026')}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div className="grid grid-cols-7 gap-2 h-80" id="calendar-grid-cells">
            {/* Render 31 days with static events */}
            {daysInMonth.map((day) => {
              const fullDateStr = `2026-07-${day < 10 ? '0' + day : day}`;
              const dayEvents = events.filter(e => e.date === fullDateStr);

              return (
                <div 
                  key={day} 
                  className="border border-slate-50 rounded-xl p-2 bg-slate-50/20 flex flex-col justify-between hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-pointer group min-h-[48px]"
                >
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-950">{day}</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.map((evt) => (
                      <div 
                        key={evt.id} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          evt.type === 'closing' ? 'bg-rose-500' : evt.type === 'briefing' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        title={`${evt.title} (${evt.buyer})`}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Events Sidebar List Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Milestones</h3>

            <div className="space-y-4" id="calendar-events-list">
              {events.map((evt) => (
                <div key={evt.id} className="flex gap-3 text-xs border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 ${
                    evt.type === 'closing' 
                      ? 'bg-rose-50 border-rose-100 text-rose-700 font-extrabold' 
                      : 'bg-amber-50 border-amber-100 text-amber-700 font-extrabold'
                  }`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                      {evt.type === 'closing' ? 'CLSG' : 'BRFG'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-900 line-clamp-1">{evt.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{evt.buyer}</p>
                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Date: {new Date(evt.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-xs text-amber-800 space-y-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
            <h4 className="font-bold text-slate-900 text-sm">Site Briefings Calendar Sync</h4>
            <p className="text-slate-700 leading-relaxed">
              Missing a mandatory site briefing session results in immediate disqualification. SAtenderAI syncs briefing invites directly to your Gmail and Outlook accounts automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
