import { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Shield, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { extractPdfText } from '@/lib/pdf-extractor';
import { generateReportAnalysis } from '@/lib/aiResponses';
import { cn, formatFileSize } from '@/lib/utils';

export default function ReportAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [finalResult, setFinalResult] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please upload a PDF under 10MB.');
      return;
    }

    setError('');
    setFinalResult('');
    setStreamContent('');
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    try {
      setUploading(true);
      setProgress(0);

      // Extract text from PDF
      const interval = setInterval(() => setProgress(p => { if (p >= 80) { clearInterval(interval); return 80; } return p + 10; }), 80);
      const pdfText = await extractPdfText(file);
      clearInterval(interval);

      if (!pdfText.trim()) {
        setUploading(false);
        setError('Could not extract text from this PDF. Please make sure it is a text-based PDF (not a scanned image).');
        return;
      }

      setProgress(100);
      setTimeout(() => { setUploading(false); setProgress(0); }, 300);

      setIsStreaming(true);
      const result = await generateReportAnalysis(
        (chunk) => setStreamContent(chunk),
        pdfText
      );
      setFinalResult(result);
      setStreamContent('');
      setIsStreaming(false);
    } catch (err) {
      setUploading(false);
      setIsStreaming(false);
      setStreamContent('');
      setError(err instanceof Error ? err.message : 'Failed to analyze the report. Please try again.');
    }
  };

  const reset = () => {
    setFinalResult('');
    setStreamContent('');
    setFileName('');
    setFileSize('');
    setError('');
  };

  const hasResult = finalResult || isStreaming || uploading;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medical Report Analyzer" subtitle="Upload your lab report and get a plain-English explanation" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl w-full mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Educational Use Only:</strong> This tool helps you understand your results in simple terms. Always review with your doctor before making any health decisions.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Upload zone — hide once we have a result */}
        {!hasResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={cn(
              'relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 p-12 text-center mb-6',
              dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
            )}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {uploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <p className="font-semibold text-gray-800">Reading your report...</p>
                <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500">{progress}%</p>
              </div>
            ) : (
              <>
                <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors', dragging ? 'bg-blue-100' : 'bg-gray-100')}>
                  <Upload className={cn('w-10 h-10 transition-colors', dragging ? 'text-blue-600' : 'text-gray-400')} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{dragging ? 'Drop your report here' : 'Upload Medical Report'}</h3>
                <p className="text-gray-500 mb-4">Blood tests, lab reports, CBC, metabolic panels — any PDF medical report</p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {['Blood Test', 'CBC Report', 'Metabolic Panel', 'Lipid Panel', 'Urinalysis', 'Any Lab PDF'].map(t => (
                    <span key={t} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">PDF only · Max 10MB</p>
              </>
            )}
          </div>
        )}

        {/* Streaming in progress */}
        {isStreaming && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1"><div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" /></div>
              <span className="text-sm font-semibold text-blue-600">
                {streamContent ? `Analyzing ${fileName}...` : 'Reading your report...'}
              </span>
            </div>
            {streamContent && <MarkdownRenderer content={streamContent} />}
            <span className="inline-block w-0.5 h-4 bg-blue-500 animate-blink ml-0.5 align-text-bottom" />
          </div>
        )}

        {/* Final result */}
        {finalResult && !isStreaming && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{fileName}</p>
                  <p className="text-xs text-gray-400">{fileSize} · Analyzed just now</p>
                </div>
              </div>
              <button onClick={reset} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <MarkdownRenderer content={finalResult} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
