import { useState, useRef } from 'react';
import {
  Upload, FileText, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronUp, Shield, X, RefreshCw, MessageSquare
} from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { MOCK_REPORT_ANALYSIS } from '@/constants/mockData';
import { generateReportAnalysis } from '@/lib/aiResponses';
import { cn, formatFileSize, sleep } from '@/lib/utils';
import type { ReportAnalysis } from '@/types';

const STATUS_CONFIG = {
  low: { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
  moderate: { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
};

const SIGNIFICANCE_CONFIG = {
  normal: { label: 'Normal', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  watch: { label: 'Watch', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  concern: { label: 'Concern', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

const ABNORMAL_CONFIG = {
  high: { label: '↑ High', color: 'text-red-600', bg: 'bg-red-50' },
  low: { label: '↓ Low', color: 'text-blue-600', bg: 'bg-blue-50' },
  critical: { label: '⚠ Critical', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function ReportAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true, findings: true, abnormal: true, questions: false, steps: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf') && !file.type.includes('pdf')) {
      alert('Please upload a PDF file.');
      return;
    }
    setUploading(true);
    setAnalysis(null);
    setStreamContent('');

    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      await sleep(40);
    }
    await sleep(300);
    setUploading(false);

    setIsStreaming(true);
    setStreamContent('');
    await generateReportAnalysis((chunk) => setStreamContent(chunk));
    setStreamContent('');
    setIsStreaming(false);
    setAnalysis(MOCK_REPORT_ANALYSIS);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const riskStatus = analysis?.riskLevel ? STATUS_CONFIG[analysis.riskLevel] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medical Report Analyzer" subtitle="Upload and understand your lab reports & test results" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-5xl w-full mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Educational Use Only:</strong> This tool provides explanations to help you understand your results. It does not provide medical diagnoses. Always review results with your healthcare provider.
          </p>
        </div>

        {!analysis && !isStreaming && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn('relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 p-12 text-center mb-6', dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50')}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {uploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <p className="font-semibold text-gray-800">Processing your report...</p>
                <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500">{progress}% — Extracting and analyzing content</p>
              </div>
            ) : (
              <>
                <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors', dragging ? 'bg-blue-100' : 'bg-gray-100')}>
                  <Upload className={cn('w-10 h-10 transition-colors', dragging ? 'text-blue-600' : 'text-gray-400')} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{dragging ? 'Drop your report here' : 'Upload Medical Report'}</h3>
                <p className="text-gray-500 mb-4">Drag & drop or click to upload your PDF lab report, blood test, or medical summary</p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {['Blood Test', 'CBC Report', 'Metabolic Panel', 'Lipid Panel', 'Urinalysis', 'Lab Summary'].map(t => (
                    <span key={t} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">PDF only · Max 10MB · Your data stays private</p>
              </>
            )}
          </div>
        )}

        {!analysis && !isStreaming && !uploading && (
          <div className="text-center mb-6">
            <button
              onClick={() => handleFile(new File([''], 'sample_CBC.pdf', { type: 'application/pdf' }))}
              className="btn-gradient text-white text-sm font-semibold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
            >
              <FileText className="w-4 h-4" />
              Try Demo Analysis
            </button>
            <p className="text-xs text-gray-400 mt-2">Uses a sample CBC report to demonstrate the analysis</p>
          </div>
        )}

        {isStreaming && streamContent && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1"><div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" /></div>
              <span className="text-sm font-semibold text-blue-600">Analyzing your report...</span>
            </div>
            <MarkdownRenderer content={streamContent} />
            <span className="inline-block w-0.5 h-4 bg-blue-500 animate-blink ml-0.5 align-text-bottom" />
          </div>
        )}

        {analysis && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{analysis.fileName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />Analyzed just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {riskStatus && (
                    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold', riskStatus.bg, riskStatus.border, riskStatus.color)}>
                      <riskStatus.icon className="w-4 h-4" />
                      {riskStatus.label}
                    </div>
                  )}
                  <button onClick={() => { setAnalysis(null); setStreamContent(''); }} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('summary')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-600" /></div>
                  <span className="font-bold text-gray-900">Executive Summary</span>
                </div>
                {expandedSections.summary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.summary && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed mt-4">{analysis.summary}</p>
                </div>
              )}
            </div>

            {/* Key Findings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('findings')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-indigo-600" /></div>
                  <span className="font-bold text-gray-900">Key Findings</span>
                  <span className="text-xs text-gray-400">({analysis.keyFindings?.length})</span>
                </div>
                {expandedSections.findings ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.findings && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="space-y-3 mt-4">
                    {analysis.keyFindings?.map(finding => {
                      const sig = SIGNIFICANCE_CONFIG[finding.significance];
                      return (
                        <div key={finding.id} className={cn('flex items-start gap-3 p-3 rounded-xl border', sig.bg, sig.border)}>
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full bg-white border mt-0.5 flex-shrink-0', sig.border, sig.color)}>{sig.label}</span>
                          <div>
                            <p className={cn('text-sm font-semibold', sig.color)}>{finding.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{finding.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Abnormal Values */}
            {analysis.abnormalValues && analysis.abnormalValues.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => toggleSection('abnormal')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                    <span className="font-bold text-gray-900">Abnormal Values</span>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{analysis.abnormalValues.length}</span>
                  </div>
                  {expandedSections.abnormal ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSections.abnormal && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>{['Test', 'Your Value', 'Reference Range', 'Unit', 'Status'].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analysis.abnormalValues.map(val => {
                            const s = ABNORMAL_CONFIG[val.status];
                            return (
                              <tr key={val.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-800">{val.name}</td>
                                <td className={cn('px-4 py-3 font-bold', s.color)}>{val.value}</td>
                                <td className="px-4 py-3 text-gray-600">{val.reference}</td>
                                <td className="px-4 py-3 text-gray-500">{val.unit}</td>
                                <td className="px-4 py-3"><span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', s.bg, s.color)}>{s.label}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Questions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('questions')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-purple-600" /></div>
                  <span className="font-bold text-gray-900">Questions for Your Doctor</span>
                </div>
                {expandedSections.questions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.questions && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <ul className="mt-4 space-y-2">
                    {analysis.doctorQuestions?.map((q, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('steps')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center"><RefreshCw className="w-4 h-4 text-teal-600" /></div>
                  <span className="font-bold text-gray-900">Recommended Next Steps</span>
                </div>
                {expandedSections.steps ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.steps && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <ul className="mt-4 space-y-2">
                    {analysis.nextSteps?.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Important Disclaimer:</strong> This analysis is for educational purposes only. It is not a medical diagnosis. Please discuss all findings with your qualified healthcare provider before making any health decisions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
