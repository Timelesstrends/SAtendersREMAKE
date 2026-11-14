import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Printer, 
  Download, 
  Send, 
  Trash2, 
  Edit3, 
  Building, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Scale,
  AlertTriangle,
  FileWarning,
  X
} from 'lucide-react';
import { CommercialDocument, BillingLineItem, CompanyProfile, TenderOpportunity } from '../types';
import { getSectorBillingItems } from '../data/industryProposals';
import { triggerDocumentDownload } from '../lib/download';

interface BillingWorkspaceProps {
  companyProfile: CompanyProfile;
  tenders: TenderOpportunity[];
  documents: CommercialDocument[];
  onAddDocument: (doc: CommercialDocument) => void;
  onUpdateDocument: (doc: CommercialDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export default function BillingWorkspace({
  companyProfile,
  tenders,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument
}: BillingWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'INVOICE' | 'QUOTATION' | 'PFMA_AGING'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CommercialDocument | null>(documents[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [demandLetterDoc, setDemandLetterDoc] = useState<CommercialDocument | null>(null);
  const [demandCopied, setDemandCopied] = useState(false);

  // Statutory Mora Interest under Prescribed Rate of Interest Act No. 55 of 1975
  // Gazetted mora rate in South Africa is 11.25% p.a.
  const STATUTORY_INTEREST_RATE = 0.1125;

  const calculateOverdueDays = (dueDateStr: string): number => {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diffMs = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateStatutoryInterest = (amount: number, overdueDays: number): number => {
    if (overdueDays <= 0) return 0;
    const dailyRate = STATUTORY_INTEREST_RATE / 365;
    return Math.round(amount * dailyRate * overdueDays);
  };

  // New Document Draft State
  const [docType, setDocType] = useState<'TAX_INVOICE' | 'QUOTATION'>('TAX_INVOICE');
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientDepartment, setClientDepartment] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientVatNumber, setClientVatNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(
    'Payment strictly within 30 days of tax invoice date via EFT. Please quote reference number on deposit.'
  );
  const [retentionPercent, setRetentionPercent] = useState<number>(0); // e.g. 0, 5, or 10%

  // Line items state
  const [lineItems, setLineItems] = useState<BillingLineItem[]>([
    {
      id: 'item-1',
      description: 'Preliminary & General, Site Establishment & Safety Induction',
      unit: 'Sum',
      quantity: 1,
      rate: 150000,
      amount: 150000
    }
  ]);

  // Totals calculations
  const calculateSubtotal = (items: BillingLineItem[]) => {
    return items.reduce((acc, it) => acc + (it.quantity * it.rate), 0);
  };

  const handleLineItemChange = (index: number, field: keyof BillingLineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const r = field === 'rate' ? Number(value) : item.rate;
      item.amount = q * r;
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: '',
        unit: 'Sum',
        quantity: 1,
        rate: 0,
        amount: 0
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Convert Quote to Tax Invoice
  const handleConvertQuoteToInvoice = (quote: CommercialDocument) => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceDoc: CommercialDocument = {
      ...quote,
      id: `doc-${Date.now()}`,
      type: 'TAX_INVOICE',
      docNumber: `INV-2026-${randNum}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'SENT',
      notes: `Converted from official quotation ${quote.docNumber}. ${quote.notes || ''}`
    };
    onAddDocument(invoiceDoc);
    setSelectedDoc(invoiceDoc);
  };

  // Pre-fill from selected tender
  const handleSelectTender = (tId: string) => {
    setSelectedTenderId(tId);
    const tender = tenders.find(t => t.id === tId);
    if (tender) {
      setClientName(tender.buyer);
      setClientEmail(tender.submissionEmail || 'procurement@buyer.gov.za');
      setClientAddress('Civic Centre, Procurement & Supply Chain Directorate, South Africa');
      setNotes(`Quotation / Tax Invoice strictly aligned with Tender Reference: SA-TND-${tender.id.toUpperCase()}-2026 for "${tender.title}".`);
      
      // Auto-suggest sector-appropriate BOQ line items
      const sectorItems = getSectorBillingItems(tender.sector, tender.value);
      setLineItems(sectorItems);
    }
  };

  const handleSaveDocument = () => {
    const sub = calculateSubtotal(lineItems);
    const vat = Math.round(sub * 0.15);
    const retRate = (retentionPercent || 0) / 100;
    const retAmount = Math.round(sub * retRate);
    const tot = sub + vat - retAmount;
    const docPrefix = docType === 'TAX_INVOICE' ? 'INV' : 'QT';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const docNumber = `${docPrefix}-2026-${randNum}`;

    const newDoc: CommercialDocument = {
      id: `doc-${Date.now()}`,
      type: docType,
      docNumber,
      tenderId: selectedTenderId || undefined,
      tenderTitle: tenders.find(t => t.id === selectedTenderId)?.title,
      clientName: clientName || 'South African Client',
      clientDepartment,
      clientEmail,
      clientAddress,
      clientVatNumber,
      orderNumber,
      issueDate,
      dueDate,
      status: 'SENT',
      items: lineItems,
      subtotal: sub,
      vatRate: 0.15,
      vatAmount: vat,
      retentionRate: retRate > 0 ? retRate : undefined,
      retentionAmount: retAmount > 0 ? retAmount : undefined,
      totalAmount: tot,
      notes,
      bankingDetails: {
        bankName: 'Standard Bank South Africa',
        accountName: companyProfile.legalName,
        accountNumber: '0821439201',
        branchCode: '051001',
        accountType: 'Commercial Cheque Account'
      }
    };

    onAddDocument(newDoc);
    setSelectedDoc(newDoc);
    setIsCreating(false);
  };

  // Calculate overdue and statutory interest metrics
  const overdueTaxInvoices = documents.filter(
    d => d.type === 'TAX_INVOICE' && d.status !== 'PAID' && calculateOverdueDays(d.dueDate) > 0
  );

  const totalOverdueCapital = overdueTaxInvoices.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalAccruedMoraInterest = overdueTaxInvoices.reduce(
    (acc, d) => acc + calculateStatutoryInterest(d.totalAmount, calculateOverdueDays(d.dueDate)),
    0
  );

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const isDocOverdue = doc.type === 'TAX_INVOICE' && doc.status !== 'PAID' && calculateOverdueDays(doc.dueDate) > 0;
    const matchesTab = activeTab === 'ALL' || 
      (activeTab === 'INVOICE' && doc.type === 'TAX_INVOICE') ||
      (activeTab === 'QUOTATION' && doc.type === 'QUOTATION') ||
      (activeTab === 'PFMA_AGING' && isDocOverdue);
    const matchesSearch = doc.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (doc.tenderTitle && doc.tenderTitle.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Calculate high-level financial metrics
  const totalInvoiced = documents
    .filter(d => d.type === 'TAX_INVOICE')
    .reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPaid = documents
    .filter(d => d.type === 'TAX_INVOICE' && d.status === 'PAID')
    .reduce((acc, d) => acc + d.totalAmount, 0);
  const totalQuoted = documents
    .filter(d => d.type === 'QUOTATION')
    .reduce((acc, d) => acc + d.totalAmount, 0);

  return (
    <div className="space-y-6" id="billing-workspace-container">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tax Invoices</span>
            <h3 className="text-xl font-extrabold text-slate-900">R{(totalInvoiced).toLocaleString('en-ZA')}</h3>
            <p className="text-[11px] text-teal-600 font-medium">R{(totalPaid).toLocaleString('en-ZA')} Collected via EFT</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* PFMA 30-Day Overdue & Statutory Interest Monitor */}
        <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white p-5 rounded-2xl border border-rose-900/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">PFMA 30-Day Monitor</span>
              <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                {overdueTaxInvoices.length} Overdue
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">R{(totalOverdueCapital).toLocaleString('en-ZA')}</h3>
            <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Scale className="w-3 h-3" /> +R{(totalAccruedMoraInterest).toLocaleString('en-ZA')} Mora Int. (11.25%)
            </p>
          </div>
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
            <FileWarning className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Quotations & Estimates</span>
            <h3 className="text-xl font-extrabold text-slate-900">R{(totalQuoted).toLocaleString('en-ZA')}</h3>
            <p className="text-[11px] text-amber-600 font-medium">90-day validity window</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">South African Tax Status</span>
            <h3 className="text-xl font-extrabold text-slate-900">15.0% VAT Rate</h3>
            <p className="text-[11px] text-slate-500 font-medium">SARS Compliant Tax Invoices</p>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* PFMA Legal Protection Banner */}
      {overdueTaxInvoices.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">
                Statutory Non-Compliance Alert: Section 38(1)(f) of the Public Finance Management Act (PFMA No. 1 of 1999)
              </p>
              <p className="text-slate-600 leading-relaxed">
                South African Organs of State and Municipalities are legally mandated by Treasury Regulation 8.2.3 to settle all compliant contractor invoices within <strong>30 days</strong>. You have <strong>{overdueTaxInvoices.length} delinquent invoices</strong> accumulating statutory mora interest at <strong>11.25% p.a.</strong> under the Prescribed Rate of Interest Act No. 55 of 1975.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('PFMA_AGING')}
            className="self-start md:self-center px-4 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm"
          >
            Review Overdue & Demand Letters ({overdueTaxInvoices.length})
          </button>
        </div>
      )}

      {/* Main Billing Hub View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Documents Directory & Filter Tabs (4 Cols) */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Billing & Quotations Hub</h2>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setSelectedDoc(null);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create New
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'ALL' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('INVOICE')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'INVOICE' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('QUOTATION')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'QUOTATION' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Quotes
              </button>
              <button
                onClick={() => setActiveTab('PFMA_AGING')}
                className={`py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'PFMA_AGING' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                PFMA ({overdueTaxInvoices.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, client, PO..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* List of documents */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id && !isCreating;
              const isInvoice = doc.type === 'TAX_INVOICE';
              const overdueDays = isInvoice && doc.status !== 'PAID' ? calculateOverdueDays(doc.dueDate) : 0;
              const isOverdue = overdueDays > 0;
              const moraInterest = isOverdue ? calculateStatutoryInterest(doc.totalAmount, overdueDays) : 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setIsCreating(false);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                      : isOverdue
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 text-slate-800'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100/10">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isInvoice 
                          ? isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                          : isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isInvoice ? 'Tax Invoice' : 'Quotation'}
                      </span>
                      <span className="font-mono text-xs font-bold">{doc.docNumber}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOverdue && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" /> {overdueDays}d overdue
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'PAID'
                          ? 'bg-teal-500/20 text-teal-300'
                          : isOverdue
                          ? 'bg-rose-500/20 text-rose-300'
                          : doc.status === 'SENT'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{doc.clientName}</p>
                    {doc.tenderTitle && (
                      <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        Ref: {doc.tenderTitle}
                      </p>
                    )}
                    
                    {isOverdue && (
                      <div className={`text-[10px] py-1 px-2 rounded-lg font-mono flex items-center justify-between ${
                        isSelected ? 'bg-slate-800 text-amber-300' : 'bg-amber-100/70 text-amber-900'
                      }`}>
                        <span>Accrued Statutory Interest:</span>
                        <strong className="font-bold">+R{moraInterest.toLocaleString('en-ZA')}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        Due: {doc.dueDate}
                      </span>
                      <span className={`text-xs font-extrabold font-mono ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                        R{(doc.totalAmount).toLocaleString('en-ZA')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Invoice/Quote Viewer OR Generator Form (8 Cols) */}
        <div className="xl:col-span-8">
          {isCreating ? (
            /* Creation Form */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Create New Official Commercial Document
                  </h3>
                  <p className="text-xs text-slate-500">Draft South African VAT-compliant Tax Invoices or Quotations with automated BOQ items</p>
                </div>
                <button onClick={() => setIsCreating(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">
                  Cancel
                </button>
              </div>

              {/* Document Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDocType('TAX_INVOICE')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                    docType === 'TAX_INVOICE'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📄 Tax Invoice (For Progress Payment Claims)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('QUOTATION')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                    docType === 'QUOTATION'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  💼 Formal Quotation / Bill of Quantities (BOQ)
                </button>
              </div>

              {/* Link Tender Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Link to Tender / Project (Auto-populate Client & BOQ)</label>
                <select
                  value={selectedTenderId}
                  onChange={(e) => handleSelectTender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                >
                  <option value="">-- Standalone Client Document (No Tender) --</option>
                  {tenders.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.buyer}] {t.title} (Est. R{(t.value / 1000000).toFixed(1)}M)
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Client / Buyer Legal Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. City of Johannesburg Metropolitan Municipality"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Client Department / Division</label>
                  <input
                    type="text"
                    value={clientDepartment}
                    onChange={(e) => setClientDepartment(e.target.value)}
                    placeholder="e.g. Supply Chain & Infrastructure Development"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Client Billing Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g. accounts-payable@buyer.gov.za"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Purchase Order / Official Order Number</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PO-COJ-849102-2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Client Physical Address</label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="e.g. 158 Civic Boulevard, Braamfontein, Johannesburg"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Due / Expiry Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Line Items & Bill of Quantities (BOQ)</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>
                </div>

                {/* Quick Industry Presets Toolbar */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Auto-fill Sector BOQ Template:
                    </span>
                    <span className="text-[10px] text-slate-400">Universal for any South African SME</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'catering', label: '🥗 Catering / NSNP' },
                      { key: 'ict', label: '💻 ICT / Software' },
                      { key: 'security', label: '🛡️ Security / Armed' },
                      { key: 'cleaning', label: '✨ Facilities / Hygiene' },
                      { key: 'medical', label: '🩺 Medical Supplies' },
                      { key: 'logistics', label: '🚚 Freight / Fleet' },
                      { key: 'consulting', label: '📊 Professional Advisory' },
                      { key: 'water', label: '💧 Water Reticulation' },
                      { key: 'civil', label: '🏗️ Civil & Building' }
                    ].map(sec => (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => {
                          const items = getSectorBillingItems(sec.key, 1200000);
                          setLineItems(items);
                        }}
                        className="px-2 py-0.8 bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-700 hover:text-amber-900 rounded-lg text-[10px] font-semibold transition-all shadow-2xs"
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                          placeholder="Item scope description..."
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                          placeholder="Unit (m², hrs...)"
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleLineItemChange(idx, 'rate', e.target.value)}
                          placeholder="Rate (R)"
                          className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Retention Withheld Selector */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Contract Retention Guarantee Deduction (CIDB / JBCC)</label>
                    <span className="text-[10px] text-slate-500 font-mono">Current: {retentionPercent}% withheld</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { val: 0, label: '0% (Standard Services / Supply)' },
                      { val: 5, label: '5% (Minor Civil Works)' },
                      { val: 10, label: '10% (Major Engineering / Construction)' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setRetentionPercent(opt.val)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          retentionPercent === opt.val
                            ? 'bg-slate-900 border-slate-900 text-amber-400'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totals Preview in Form */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-400">Subtotal: R{(calculateSubtotal(lineItems)).toLocaleString('en-ZA')}</p>
                    <p className="text-slate-400">VAT (15%): R{(Math.round(calculateSubtotal(lineItems) * 0.15)).toLocaleString('en-ZA')}</p>
                    {retentionPercent > 0 && (
                      <p className="text-amber-300 font-medium">
                        Less {retentionPercent}% Contract Retention: -R{(Math.round(calculateSubtotal(lineItems) * (retentionPercent / 100))).toLocaleString('en-ZA')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Rand Payable</span>
                    <p className="text-lg font-extrabold text-amber-400">
                      R{(Math.round(calculateSubtotal(lineItems) * 1.15 - calculateSubtotal(lineItems) * (retentionPercent / 100))).toLocaleString('en-ZA')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  Save & Issue {docType === 'TAX_INVOICE' ? 'Tax Invoice' : 'Quotation'}
                </button>
              </div>
            </div>
          ) : selectedDoc ? (
            /* Printable Standard Document View */
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-900">{selectedDoc.docNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedDoc.status === 'PAID' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedDoc.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDoc.type === 'QUOTATION' && (
                    <button
                      onClick={() => handleConvertQuoteToInvoice(selectedDoc)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Convert to Tax Invoice
                    </button>
                  )}
                  {selectedDoc.type === 'TAX_INVOICE' && selectedDoc.status !== 'PAID' && (
                    <>
                      <button
                        onClick={() => setDemandLetterDoc(selectedDoc)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        title="Generate Legal Demand Letter under PFMA Sec 38(1)(f) and Prescribed Rate of Interest Act No. 55 of 1975"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-300" /> PFMA Demand Letter
                      </button>
                      <button
                        onClick={() => {
                          onUpdateDocument({ ...selectedDoc, status: 'PAID' });
                          setSelectedDoc({ ...selectedDoc, status: 'PAID' });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Mark Paid (EFT)
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => {
                      triggerDocumentDownload({
                        name: `${selectedDoc.docNumber}-${selectedDoc.clientName.replace(/\s+/g, '_')}.pdf`,
                        category: 'financial',
                        size: '145 KB'
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>

              {/* Overdue Statutory Notice Callout */}
              {selectedDoc.type === 'TAX_INVOICE' && selectedDoc.status !== 'PAID' && calculateOverdueDays(selectedDoc.dueDate) > 0 && (
                <div className="p-4 bg-gradient-to-r from-rose-950 to-slate-900 border border-rose-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-300 rounded-xl mt-0.5 border border-rose-500/30">
                      <Scale className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <p className="font-bold text-rose-200 flex items-center gap-2">
                        <span>Statutory Default: {calculateOverdueDays(selectedDoc.dueDate)} Days in Breach of PFMA 30-Day Rule</span>
                        <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">Breach</span>
                      </p>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Statutory Mora Interest Accrued: <strong className="text-amber-300 font-mono">+R{calculateStatutoryInterest(selectedDoc.totalAmount, calculateOverdueDays(selectedDoc.dueDate)).toLocaleString('en-ZA')}</strong> (11.25% p.a. under Act 55 of 1975). Total claimable sum: <strong className="text-white font-mono">R{(selectedDoc.totalAmount + calculateStatutoryInterest(selectedDoc.totalAmount, calculateOverdueDays(selectedDoc.dueDate))).toLocaleString('en-ZA')}</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDemandLetterDoc(selectedDoc)}
                    className="self-start sm:self-center px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5 text-slate-950" /> Issue Letter of Demand
                  </button>
                </div>
              )}

              {/* Document Sheet Layout (Paper Preview) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 font-sans" id="printable-commercial-doc">
                {/* Header Row: Company Info & Invoice Label */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center gap-3">
                      {companyProfile.logoUrl ? (
                        <img 
                          src={companyProfile.logoUrl} 
                          alt={companyProfile.tradingName || companyProfile.legalName} 
                          className="h-10 w-auto max-w-[140px] object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-sm">
                          {(companyProfile.tradingName || companyProfile.legalName).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-extrabold text-base tracking-tight text-slate-900 block">
                          {companyProfile.tradingName || companyProfile.legalName}
                        </span>
                        {companyProfile.slogan && (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {companyProfile.slogan}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 leading-relaxed pt-1">
                      {companyProfile.physicalAddress && (
                        <p>{companyProfile.physicalAddress}</p>
                      )}
                      <p>
                        <span>Tel: <strong className="text-slate-700">{companyProfile.companyPhone || '+27 (0)11 802 4490'}</strong></span>
                        <span className="mx-1.5">•</span>
                        <span>Email: <strong className="text-slate-700">{companyProfile.companyEmail || 'accounts@satenderai.co.za'}</strong></span>
                      </p>
                      <p>
                        <span>Reg: <strong className="text-slate-700">{companyProfile.registrationNumber}</strong></span>
                        <span className="mx-1.5">•</span>
                        <span>CSD: <strong className="text-slate-800 font-mono">{companyProfile.csdNumber}</strong></span>
                        <span className="mx-1.5">•</span>
                        <span>B-BBEE Level {companyProfile.bbeeLevel}</span>
                      </p>
                      <p>
                        VAT Registration No: <strong className="text-slate-700">{companyProfile.taxNumber || '4890219482'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {selectedDoc.type === 'TAX_INVOICE' ? 'TAX INVOICE' : 'FORMAL QUOTATION'}
                    </h2>
                    <p className="text-xs font-mono font-bold text-amber-600">{selectedDoc.docNumber}</p>
                    <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                      <p>Issue Date: <strong>{selectedDoc.issueDate}</strong></p>
                      <p>Payment Due: <strong>{selectedDoc.dueDate}</strong></p>
                      {selectedDoc.orderNumber && (
                        <p>Order / PO Ref: <strong className="font-mono text-slate-800">{selectedDoc.orderNumber}</strong></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill To & Tender Association */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To (Client / Buyer)</span>
                    <h4 className="text-xs font-bold text-slate-900">{selectedDoc.clientName}</h4>
                    {selectedDoc.clientDepartment && (
                      <p className="text-xs text-slate-600">{selectedDoc.clientDepartment}</p>
                    )}
                    <p className="text-xs text-slate-500">{selectedDoc.clientAddress}</p>
                    {selectedDoc.clientEmail && (
                      <p className="text-xs text-slate-500 font-mono">{selectedDoc.clientEmail}</p>
                    )}
                    {selectedDoc.clientVatNumber && (
                      <p className="text-xs text-slate-500">Client VAT: {selectedDoc.clientVatNumber}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Associated Procurement Context</span>
                    {selectedDoc.tenderTitle ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-2">{selectedDoc.tenderTitle}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          Verified Tender Deliverable
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">General Public / Corporate Procurement Contract</p>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 font-bold">Item Description</th>
                        <th className="py-2.5 text-center font-bold">Unit</th>
                        <th className="py-2.5 text-center font-bold">Qty</th>
                        <th className="py-2.5 text-right font-bold">Unit Rate</th>
                        <th className="py-2.5 text-right font-bold">Total (ZAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDoc.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 font-medium text-slate-800 pr-4">{item.description}</td>
                          <td className="py-3 text-center text-slate-500">{item.unit}</td>
                          <td className="py-3 text-center text-slate-700 font-semibold">{item.quantity}</td>
                          <td className="py-3 text-right text-slate-600 font-mono">R{(item.rate).toLocaleString('en-ZA')}</td>
                          <td className="py-3 text-right text-slate-900 font-mono font-bold">R{(item.amount).toLocaleString('en-ZA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Calculations & Remittance Banking Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                  {/* Banking Remittance */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Banking & EFT Details</span>
                    <div className="space-y-1 text-slate-700">
                      <p>Bank: <strong>{selectedDoc.bankingDetails.bankName}</strong></p>
                      <p>Account Name: <strong>{selectedDoc.bankingDetails.accountName}</strong></p>
                      <p>Account Number: <strong className="font-mono">{selectedDoc.bankingDetails.accountNumber}</strong></p>
                      <p>Branch Code: <strong className="font-mono">{selectedDoc.bankingDetails.branchCode}</strong></p>
                      <p>Account Type: {selectedDoc.bankingDetails.accountType}</p>
                    </div>
                  </div>

                  {/* Final rand sum totals */}
                  <div className="space-y-2 text-right">
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Subtotal Excl. VAT:</span>
                        <span className="font-mono font-medium text-slate-800">R{(selectedDoc.subtotal).toLocaleString('en-ZA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Value Added Tax (15.0% VAT):</span>
                        <span className="font-mono font-medium text-slate-800">R{(selectedDoc.vatAmount).toLocaleString('en-ZA')}</span>
                      </div>
                      {selectedDoc.retentionAmount && selectedDoc.retentionAmount > 0 && (
                        <div className="flex justify-between text-amber-700 font-medium">
                          <span>Less Contract Retention ({((selectedDoc.retentionRate || 0.1) * 100).toFixed(0)}%):</span>
                          <span className="font-mono">-R{(selectedDoc.retentionAmount).toLocaleString('en-ZA')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-900 uppercase">Net Amount Payable:</span>
                      <span className="text-xl font-extrabold font-mono text-slate-950">
                        R{(selectedDoc.totalAmount).toLocaleString('en-ZA')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1">All amounts quoted in South African Rand (ZAR)</p>
                  </div>
                </div>

                {/* Footer Notes */}
                {selectedDoc.notes && (
                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">Terms & Instructions: </strong>
                    {selectedDoc.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No document selected</h3>
              <p className="text-xs text-slate-400">Select an existing tax invoice or quotation from the directory, or click Create New.</p>
            </div>
          )}
        </div>

      </div>

      {/* Statutory PFMA Demand Letter Modal */}
      <AnimatePresence>
        {demandLetterDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            >
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Statutory PFMA Notice of Demand</h3>
                    <p className="text-[11px] text-slate-400">Section 38(1)(f) PFMA 1999 • Prescribed Rate of Interest Act 55 of 1975</p>
                  </div>
                </div>
                <button
                  onClick={() => setDemandLetterDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Letter Content */}
              <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 font-sans text-xs leading-relaxed" id="pfma-printable-demand-letter">
                {/* Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="font-extrabold text-base text-slate-950">
                      {companyProfile.tradingName || companyProfile.legalName}
                    </h2>
                    <p className="text-[11px] text-slate-500">{companyProfile.physicalAddress}</p>
                    <p className="text-[11px] text-slate-500">
                      Reg: {companyProfile.registrationNumber} • CSD: {companyProfile.csdNumber} • VAT: {companyProfile.taxNumber || '4890219482'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tel: {companyProfile.companyPhone || '+27 (0)11 802 4490'} • Email: {companyProfile.companyEmail || 'accounts@satenderai.co.za'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded uppercase font-mono">
                      Statutory Demand
                    </span>
                    <p className="text-xs font-mono text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-ZA')}</p>
                    <p className="text-xs font-mono font-bold text-slate-800">Ref: DEM-{demandLetterDoc.docNumber}</p>
                  </div>
                </div>

                {/* Recipient */}
                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">TO: THE ACCOUNTING OFFICER & CHIEF FINANCIAL OFFICER</p>
                  <p className="font-semibold text-slate-800">{demandLetterDoc.clientName}</p>
                  {demandLetterDoc.clientDepartment && <p className="text-slate-600">{demandLetterDoc.clientDepartment}</p>}
                  <p className="text-slate-500">{demandLetterDoc.clientAddress}</p>
                  {demandLetterDoc.clientEmail && <p className="text-slate-500 font-mono">{demandLetterDoc.clientEmail}</p>}
                </div>

                {/* Subject Header */}
                <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl">
                  <p className="font-extrabold text-slate-950 text-xs uppercase tracking-wide">
                    FORMAL NOTICE OF DEFAULT & FINAL STATUTORY DEMAND FOR IMMEDIATE PAYMENT: TAX INVOICE {demandLetterDoc.docNumber}
                  </p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Pursuant to Section 38(1)(f) of the Public Finance Management Act (Act 1 of 1999), Treasury Regulation 8.2.3, and the Prescribed Rate of Interest Act (Act 55 of 1975)
                  </p>
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-3 text-slate-700">
                  <p>Dear Accounting Officer,</p>
                  <p>
                    1. We write to place your office on formal notice regarding tax invoice <strong>{demandLetterDoc.docNumber}</strong> (Order Ref: <strong>{demandLetterDoc.orderNumber || 'Contract Agreement'}</strong>) issued on <strong>{demandLetterDoc.issueDate}</strong>, with a statutory due date of <strong>{demandLetterDoc.dueDate}</strong>, for verified goods/services rendered in connection with: <em>"{demandLetterDoc.tenderTitle || 'Public Procurement Scope of Work'}"</em>.
                  </p>
                  <p>
                    2. In terms of <strong>Section 38(1)(f) of the Public Finance Management Act (PFMA No. 1 of 1999)</strong> and <strong>National Treasury Regulation 8.2.3</strong>, the Accounting Officer of a department, trading entity, or constitutional institution must settle all contractual commitments and pay all money owing within <strong>thirty (30) days</strong> of receiving a valid tax invoice.
                  </p>
                  <p>
                    3. As of today's date, this tax invoice has been in default for <strong>{calculateOverdueDays(demandLetterDoc.dueDate)} calendar days</strong> past the statutory 30-day deadline. Consequently, in accordance with the <strong>Prescribed Rate of Interest Act (Act No. 55 of 1975)</strong>, statutory mora interest is accruing at the gazetted rate of <strong>11.25% per annum</strong>.
                  </p>
                </div>

                {/* Itemized Calculation Schedule */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100 p-2.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Statutory Claim Statement
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Principal Tax Invoice Sum (Incl. 15% VAT):</span>
                      <span className="font-mono font-bold text-slate-900">R{demandLetterDoc.totalAmount.toLocaleString('en-ZA')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Period in Statutory Default:</span>
                      <span className="font-mono font-semibold text-rose-600">{calculateOverdueDays(demandLetterDoc.dueDate)} Days Past Statutory Due Date</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Prescribed Mora Interest Rate (Act 55 of 1975):</span>
                      <span className="font-mono text-slate-700">11.25% per annum</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-amber-800 font-semibold">
                      <span>Accrued Statutory Mora Interest:</span>
                      <span className="font-mono">+R{calculateStatutoryInterest(demandLetterDoc.totalAmount, calculateOverdueDays(demandLetterDoc.dueDate)).toLocaleString('en-ZA')}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-extrabold text-slate-950">
                      <span>TOTAL SETTLEMENT DEMANDED:</span>
                      <span className="font-mono text-rose-600">
                        R{(demandLetterDoc.totalAmount + calculateStatutoryInterest(demandLetterDoc.totalAmount, calculateOverdueDays(demandLetterDoc.dueDate))).toLocaleString('en-ZA')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Demand & Remittance Notice */}
                <div className="space-y-3 text-slate-700">
                  <p>
                    4. Demand is hereby formally made for the immediate settlement of <strong>R{(demandLetterDoc.totalAmount + calculateStatutoryInterest(demandLetterDoc.totalAmount, calculateOverdueDays(demandLetterDoc.dueDate))).toLocaleString('en-ZA')}</strong> to be remitted via Electronic Funds Transfer (EFT) within <strong>seven (7) business days</strong> of receipt of this notice into our verified commercial bank account on record:
                  </p>
                  
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs">
                    <p><strong>Bank:</strong> {demandLetterDoc.bankingDetails.bankName}</p>
                    <p><strong>Account Name:</strong> {demandLetterDoc.bankingDetails.accountName}</p>
                    <p><strong>Account Number:</strong> {demandLetterDoc.bankingDetails.accountNumber}</p>
                    <p><strong>Branch Code:</strong> {demandLetterDoc.bankingDetails.branchCode} ({demandLetterDoc.bankingDetails.accountType})</p>
                    <p><strong>Payment Reference:</strong> {demandLetterDoc.docNumber}</p>
                  </div>

                  <p>
                    5. Should payment not be reflected within seven (7) business days, our office will without further notice:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    <li>Submit a formal dispute to the <strong>National Treasury SCM Complaints & Non-Payment Directorate</strong>;</li>
                    <li>Notify the <strong>Auditor-General of South Africa (AGSA)</strong> of persistent statutory non-compliance and material irregular financial management; and</li>
                    <li>Lodge a complaint of maladministration and financial prejudice with the <strong>Office of the Public Protector</strong>.</li>
                  </ul>
                  <p>We trust this serious matter will receive your immediate intervention.</p>
                </div>

                {/* Sign-off */}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Yours faithfully,</p>
                    <p className="font-bold text-slate-800">Austin Mpapane</p>
                    <p className="text-slate-500 text-[11px]">Managing Director & Accounting Contact</p>
                    <p className="text-slate-500 text-[11px]">{companyProfile.legalName}</p>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-xl text-center bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Digital Verification</span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">✓ STATUTORILY CERTIFIED</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-slate-500">
                  Ready for official transmission to Accounting Officer and Chief Financial Officer.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const letterEl = document.getElementById('pfma-printable-demand-letter');
                      if (letterEl) {
                        navigator.clipboard.writeText(letterEl.innerText);
                        setDemandCopied(true);
                        setTimeout(() => setDemandCopied(false), 2500);
                      }
                    }}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    {demandCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {demandCopied ? 'Copied to Clipboard!' : 'Copy Letter Text'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    Print Official Demand Letter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
