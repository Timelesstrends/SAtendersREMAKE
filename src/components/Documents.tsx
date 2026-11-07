import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Calendar,
  Lock,
  Eye,
  FileDown
} from 'lucide-react';
import { CompanyDocument } from '../types';
import { triggerDocumentDownload } from '../lib/download';

interface DocumentsProps {
  documents: CompanyDocument[];
  onUploadDocument: (doc: CompanyDocument) => void;
  onDeleteDocument: (id: string) => void;
}

export default function Documents({ documents, onUploadDocument, onDeleteDocument }: DocumentsProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDragging, setIsDragging] = useState(false);

  const categories = ['All', 'compliance', 'company', 'employee', 'project', 'financial', 'policy'];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle mock upload trigger
  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: CompanyDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      category: 'compliance',
      fileSize: `${Math.round(file.size / 1024)} KB`,
      status: 'valid',
      verified: true,
      uploadedBy: 'Austin M.'
    };

    onUploadDocument(newDoc);
  };

  return (
    <div className="space-y-6" id="documents-container">
      {/* Expiry alerts dashboard panel */}
      <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 shadow-sm" id="documents-warning-banner">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-sm">Automated Document Expiry Monitoring</p>
          <p className="text-slate-700">
            SAtenderAI has reviewed your statutory compliance certificates. Your **SANAS B-BBEE Level 1 Affidavit** expires in **21 days**. 
            An expired affidavit results in a score of 0 preference points or outright disqualification during tender adjudication. Draft a renewed affidavit with our Commissioner tool.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document List Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 text-slate-800"
              />
            </div>

            {/* Category Filter dropdown */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-all ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 border-slate-900 text-amber-400 font-bold' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Document list */}
          <div className="space-y-4" id="documents-list">
            <AnimatePresence mode="popLayout">
              {filteredDocs.map((doc) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  key={doc.id} 
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all duration-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">{doc.name}</h4>
                        {doc.verified && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-bold rounded-md border border-teal-100">
                            <CheckCircle className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {doc.category} • {doc.fileSize} • Uploaded by {doc.uploadedBy || 'Austin'}
                      </p>
                      {doc.expiresAt && (
                        <p className={`text-[10px] font-medium ${doc.status === 'warning' ? 'text-amber-600' : 'text-slate-400'}`}>
                          Expires: {new Date(doc.expiresAt).toLocaleDateString('en-ZA')} (expires in 21 days)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => triggerDocumentDownload({ name: doc.name, category: doc.category, size: doc.fileSize })}
                      title={`Download ${doc.name}`}
                      className="p-2 hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-2 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredDocs.length === 0 && (
              <div className="bg-white border border-slate-150 p-12 text-center rounded-2xl text-slate-500 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">No company documents found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload File Panel Column */}
        <div className="space-y-6">
          <div 
            className={`bg-white rounded-2xl border-2 p-8 text-center transition-all duration-200 flex flex-col justify-center min-h-[300px] shadow-sm ${
              isDragging 
                ? 'border-amber-400 bg-amber-50/10' 
                : 'border-dashed border-slate-200 hover:border-slate-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
            id="drag-drop-zone"
          >
            <div className="space-y-4 max-w-xs mx-auto">
              <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-6 h-6 text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 text-xs">Drag & drop your files here</p>
                <p className="text-[11px] text-slate-400">or click to browse from local computer</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Supports PDF, DOCX, XLSX, and certified PNG. Uploading auto-extracts compliance metadata.
              </p>
              <label className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-sm transition-all">
                Select File
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleMockUpload}
                />
              </label>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-sm text-slate-100">National Security & Audit Shield</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              All files uploaded are processed in high-security, encrypted sandbox containers. Corporate data complies with POPI Act regulations and will never be shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
