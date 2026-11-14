import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  MapPin, 
  FileText,
  AlertTriangle,
  CheckCircle,
  Building2,
  DollarSign,
  Download,
  Filter,
  ExternalLink,
  Plus
} from 'lucide-react';
import { TenderOpportunity } from '../types';

interface CalendarProps {
  tenders: TenderOpportunity[];
  onNavigate: (tab: string, tenderId?: string) => void;
}

interface DynamicCalendarEvent {
  id: string;
  tenderId: string;
  tenderNumber?: string;
  title: string;
  buyer: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string;
  type: 'closing' | 'briefing' | 'clarification';
  siteVisit?: 'Mandatory' | 'Optional' | 'None';
  value: number;
  status: string;
  sector: string;
}

export default function Calendar({ tenders, onNavigate }: CalendarProps) {
  // Determine starting month from active future tenders or current date (November 2026)
  const initialDate = useMemo(() => {
    const active = tenders.find(t => {
      const closing = new Date(t.closingDate).getTime();
      return !isNaN(closing) && closing >= Date.now();
    });
    if (active) {
      const d = new Date(active.closingDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [tenders]);

  const [currentYear, setCurrentYear] = useState<number>(() => initialDate.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => initialDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'CLOSING' | 'BRIEFING'>('ALL');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Derive calendar events dynamically from tenders
  const allEvents = useMemo(() => {
    const list: DynamicCalendarEvent[] = [];

    tenders.forEach(t => {
      // 1. Closing date event
      if (t.closingDate) {
        const closeDate = new Date(t.closingDate);
        if (!isNaN(closeDate.getTime())) {
          const dateStr = closeDate.toISOString().split('T')[0];
          const hours = closeDate.getUTCHours();
          const mins = closeDate.getUTCMinutes();
          const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} SAST`;

          list.push({
            id: `evt-close-${t.id}`,
            tenderId: t.id,
            tenderNumber: t.tenderNumber || t.id,
            title: t.title,
            buyer: t.buyer,
            dateStr,
            timeStr,
            type: 'closing',
            siteVisit: t.siteVisit,
            value: t.value,
            status: t.status,
            sector: t.sector
          });
        }
      }

      // 2. Briefing date event
      if (t.briefingDate) {
        const briefDate = new Date(t.briefingDate);
        if (!isNaN(briefDate.getTime())) {
          const dateStr = briefDate.toISOString().split('T')[0];
          const hours = briefDate.getUTCHours();
          const mins = briefDate.getUTCMinutes();
          const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} SAST`;

          list.push({
            id: `evt-brief-${t.id}`,
            tenderId: t.id,
            tenderNumber: t.tenderNumber || t.id,
            title: `Site Briefing: ${t.title}`,
            buyer: t.buyer,
            dateStr,
            timeStr,
            type: 'briefing',
            siteVisit: t.siteVisit,
            value: t.value,
            status: t.status,
            sector: t.sector
          });
        }
      }
    });

    return list;
  }, [tenders]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'CLOSING') return allEvents.filter(e => e.type === 'closing');
    if (filterType === 'BRIEFING') return allEvents.filter(e => e.type === 'briefing');
    return allEvents;
  }, [allEvents, filterType]);

  // Calendar days calculation
  const { daysInMonth, firstDayOfWeekOffset } = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    // getDay returns 0 for Sunday, 1 for Monday. We want Monday = 0
    let dayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = Monday, 6 = Sunday

    return {
      daysInMonth: totalDays,
      firstDayOfWeekOffset: offset
    };
  }, [currentYear, currentMonthIndex]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleJumpToTenders = () => {
    // Jump to month with highest count of events
    if (allEvents.length > 0) {
      const firstEvt = allEvents[0];
      const d = new Date(firstEvt.dateStr);
      setCurrentYear(d.getFullYear());
      setCurrentMonthIndex(d.getMonth());
      setSelectedDateStr(firstEvt.dateStr);
    }
  };

  // Export events to standard iCal format
  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SAtenderAI//Tender Calendar//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    allEvents.forEach(evt => {
      const cleanDate = evt.dateStr.replace(/-/g, '');
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${evt.id}@satenderai.co.za\n`;
      icsContent += `DTSTAMP:${cleanDate}T090000Z\n`;
      icsContent += `DTSTART:${cleanDate}T090000Z\n`;
      icsContent += `DTEND:${cleanDate}T110000Z\n`;
      icsContent += `SUMMARY:${evt.type === 'closing' ? '[DEADLINE]' : '[BRIEFING]'} ${evt.title.replace(/[,\n]/g, ' ')}\n`;
      icsContent += `DESCRIPTION:Procuring Entity: ${evt.buyer}. Estimated Value: R${(evt.value/1000000).toFixed(1)}M. Ref: ${evt.tenderNumber}\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SAtenderAI_Procurement_Calendar_${currentYear}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Events for selected date or upcoming in current month
  const currentMonthPrefix = `${currentYear}-${(currentMonthIndex + 1).toString().padStart(2, '0')}`;
  const monthEvents = filteredEvents.filter(e => e.dateStr.startsWith(currentMonthPrefix));
  const activeSelectedEvents = selectedDateStr 
    ? filteredEvents.filter(e => e.dateStr === selectedDateStr)
    : monthEvents;

  return (
    <div className="space-y-6" id="calendar-container">
      {/* Calendar Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="calendar-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Procurement & Tender Calendar</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {allEvents.length} Active Milestones
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time tracking of mandatory site inspections, clarification questions, and closing submission dates across all pursued tenders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              All Events ({allEvents.length})
            </button>
            <button
              onClick={() => setFilterType('BRIEFING')}
              className={`px-3 py-1 rounded-lg transition-all ${filterType === 'BRIEFING' ? 'bg-amber-500 text-slate-950 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              Site Briefings
            </button>
            <button
              onClick={() => setFilterType('CLOSING')}
              className={`px-3 py-1 rounded-lg transition-all ${filterType === 'CLOSING' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-slate-600'}`}
            >
              Closing Dates
            </button>
          </div>

          <button
            onClick={handleExportICS}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            title="Download iCal file to sync with Google Calendar or Outlook"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export .ICS</span>
          </button>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button 
              className="p-1.5 hover:bg-white rounded-lg transition-all cursor-pointer text-slate-600" 
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white rounded-lg shadow-xs text-slate-900 font-bold min-w-[120px] text-center">
              {monthNames[currentMonthIndex]} {currentYear}
            </span>
            <button 
              className="p-1.5 hover:bg-white rounded-lg transition-all cursor-pointer text-slate-600" 
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Calendar Grid Column */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900">
                {monthNames[currentMonthIndex]} {currentYear}
              </span>
              {selectedDateStr && (
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md"
                >
                  Clear Selection (Show Month)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Mandatory Briefing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Closing Deadline
              </span>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2" id="calendar-grid-cells">
            {/* Preceding blank cells */}
            {Array.from({ length: firstDayOfWeekOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/40 border border-transparent opacity-30" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${(currentMonthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter(e => e.dateStr === dateStr);
              const isSelected = selectedDateStr === dateStr;
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(isSelected ? null : dateStr)}
                  className={`h-24 rounded-xl p-2 border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-400'
                      : hasEvents
                      ? 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                      : 'border-slate-100 bg-slate-50/20 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-900 font-black' : hasEvents ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}>
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-400 font-mono">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(evt => (
                      <div
                        key={evt.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded truncate font-semibold leading-tight flex items-center gap-1 ${
                          evt.type === 'closing'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                        title={`${evt.title} (${evt.buyer})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${evt.type === 'closing' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span className="truncate">{evt.type === 'closing' ? 'Due' : 'Site'}: {evt.buyer}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date & Upcoming Milestones Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedDateStr ? `Events for ${selectedDateStr}` : `Upcoming Milestones (${monthNames[currentMonthIndex]})`}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {activeSelectedEvents.length} event{activeSelectedEvents.length === 1 ? '' : 's'} recorded
                </p>
              </div>

              {selectedDateStr && (
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="calendar-events-list">
              {activeSelectedEvents.map((evt) => {
                const isClosing = evt.type === 'closing';

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isClosing
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {isClosing ? <Clock className="w-3 h-3 text-rose-600" /> : <MapPin className="w-3 h-3 text-amber-600" />}
                        {isClosing ? 'Submission Deadline' : 'Mandatory Site Meeting'}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-900">
                        R{(evt.value / 1000000).toFixed(1)}M
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {evt.buyer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">
                        {new Date(evt.dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} at {evt.timeStr}
                      </span>
                      <button
                        onClick={() => onNavigate('tenders', evt.tenderId)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Workspace <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {activeSelectedEvents.length === 0 && (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">No tender milestones recorded for this period.</p>
                  <button
                    onClick={handleJumpToTenders}
                    className="text-[11px] text-amber-600 hover:underline font-bold"
                  >
                    Jump to active tender dates
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Briefing Advisory */}
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-xs text-amber-900 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>National Treasury Site Briefing Regulation</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Under South African SCM policies, failure to attend a <strong>compulsory briefing meeting</strong> results in immediate, non-negotiable disqualification prior to functionality scoring. Ensure your representative signs the physical attendance register on-site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
