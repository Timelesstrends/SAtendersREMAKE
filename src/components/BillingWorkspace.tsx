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
  FileCheck
} from 'lucide-react';
import { CommercialDocument, BillingLineItem, CompanyProfile, TenderOpportunity } from '../types';
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'INVOICE' | 'QUOTATION'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CommercialDocument | null>(documents[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

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
      
      // Auto-suggest BOQ line items
      setLineItems([
        {
          id: 'item-tender-1',
          description: `Contract Mobilisation & Project Execution: ${tender.title}`,
          unit: 'Sum',
          quantity: 1,
          rate: Math.round(tender.value * 0.15),
          amount: Math.round(tender.value * 0.15)
        },
        {
          id: 'item-tender-2',
          description: 'Specialist Skilled Labor, Technical Compliance & Quality Assurance Sign-offs',
          unit: 'Sum',
          quantity: 1,
          rate: Math.round(tender.value * 0.2),
          amount: Math.round(tender.value * 0.2)
        }
      ]);
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

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'ALL' || 
      (activeTab === 'INVOICE' && doc.type === 'TAX_INVOICE') ||
      (activeTab === 'QUOTATION' && doc.type === 'QUOTATION');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'ALL' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('INVOICE')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'INVOICE' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('QUOTATION')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'QUOTATION' ? 'bg-white text-slate-950 font-bold shadow-xs' : 'text-slate-500'
                }`}
              >
                Quotes
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

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      doc.status === 'PAID'
                        ? 'bg-teal-500/20 text-teal-300'
                        : doc.status === 'SENT'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {doc.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{doc.clientName}</p>
                    {doc.tenderTitle && (
                      <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        Ref: {doc.tenderTitle}
                      </p>
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Line Items & Bill of Quantities (BOQ)</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
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
                  {selectedDoc.status !== 'PAID' && selectedDoc.type === 'TAX_INVOICE' && (
                    <button
                      onClick={() => {
                        onUpdateDocument({ ...selectedDoc, status: 'PAID' });
                        setSelectedDoc({ ...selectedDoc, status: 'PAID' });
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Mark as Paid (EFT)
                    </button>
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

              {/* Document Sheet Layout (Paper Preview) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 font-sans" id="printable-commercial-doc">
                {/* Header Row: Company Info & Invoice Label */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm">
                        SA
                      </div>
                      <span className="font-extrabold text-base tracking-tight text-slate-900">{companyProfile.legalName}</span>
                    </div>
                    <p className="text-xs text-slate-500">Registration: {companyProfile.registrationNumber}</p>
                    <p className="text-xs text-slate-500">CSD Supplier ID: <strong className="text-slate-800">{companyProfile.csdNumber}</strong></p>
                    <p className="text-xs text-slate-500">B-BBEE Status: Level {companyProfile.bbeeLevel} Contributor</p>
                    <p className="text-xs text-slate-500">VAT Registration No: 4890219482</p>
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
    </div>
  );
}
