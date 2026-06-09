import { useState, useRef } from 'react';
import { Upload, Image, Shield, X, Eye, AlertTriangle, ChevronDown, ChevronUp, BookOpen, HelpCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { MOCK_IMAGE_ANALYSIS } from '@/constants/mockData';
import { generateImageAnalysis } from '@/lib/aiResponses';
import { cn, sleep } from '@/lib/utils';
import type { ImageAnalysis as ImageAnalysisType } from '@/types';

const SUPPORTED = ['JPG', 'JPEG', 'PNG', 'WEBP'];

export default function ImageAnalysis() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisType | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ observations: true, context: true, safety: true, followup: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const runAnalysis = async (file: File | null, url: string, name: string) => {
    setFileName(name);
    setPreview(url);
    setAnalysis(null);
    setStreamContent('');
    setUploading(true);
    await sleep(1200);
    setUploading(false);
    setIsStreaming(true);
    await generateImageAnalysis((chunk) => setStreamContent(chunk));
    setStreamContent('');
    setIsStreaming(false);
    setAnalysis({ ...MOCK_IMAGE_ANALYSIS, fileName: name, imageUrl: url });
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (!SUPPORTED.includes(ext || '')) { alert('Please upload a JPG, PNG, or WEBP image.'); return; }
    const url = URL.createObjectURL(file);
    await runAnalysis(file, url, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => { setPreview(null); setAnalysis(null); setStreamContent(''); setFileName(''); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medical Image Analysis" subtitle="AI-powered educational image understanding" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-5xl w-full mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            <strong>Critical Disclaimer:</strong> AI image analysis is NOT a medical diagnosis. Medical imaging must be interpreted by a licensed radiologist. Do not make health decisions based on this analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn('rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 text-center', dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50')}
              >
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Upload Medical Image</h3>
                <p className="text-sm text-gray-500 mb-3">X-rays, MRIs, CT scans, ultrasounds</p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {SUPPORTED.map(f => <span key={f} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">{f}</span>)}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="relative">
                  <img src={preview} alt="Medical image" className="w-full h-64 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">Analyzing...</p>
                      </div>
                    </div>
                  )}
                  <button onClick={reset} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800 truncate">{fileName}</span>
                  </div>
                  {analysis && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600 font-medium">Analysis complete</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!preview && (
              <button
                onClick={() => runAnalysis(null, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=400&fit=crop', 'demo_chest_xray.jpg')}
                className="btn-gradient w-full text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Try Demo Image
              </button>
            )}

            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">Supported Image Types</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {['X-rays (chest, bone, dental)', 'MRI scans', 'CT scan images', 'Ultrasound images', 'Dermatological images', 'Other medical photographs'].map((t, i) => (
                  <li key={i} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {isStreaming && streamContent && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1"><div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" /></div>
                  <span className="text-sm font-semibold text-blue-600">Analyzing image with AI Vision...</span>
                </div>
                <MarkdownRenderer content={streamContent} />
                <span className="inline-block w-0.5 h-4 bg-blue-500 animate-blink ml-0.5 align-text-bottom" />
              </div>
            )}

            {!preview && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-500 mb-1">No image uploaded</h3>
                <p className="text-sm text-gray-400">Upload a medical image to get AI-powered educational observations</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-3 animate-slide-up">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('observations')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><Eye className="w-4 h-4 text-blue-600" /></div>
                      <span className="font-bold text-gray-900">Visual Observations</span>
                      <span className="text-xs text-gray-400">({analysis.observations?.length})</span>
                    </div>
                    {expanded.observations ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expanded.observations && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <ul className="mt-4 space-y-2">
                        {analysis.observations?.map((obs, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('context')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-teal-600" /></div>
                      <span className="font-bold text-gray-900">Medical Context</span>
                    </div>
                    {expanded.context ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expanded.context && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed mt-4">{analysis.medicalContext}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('safety')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><Shield className="w-4 h-4 text-red-600" /></div>
                      <span className="font-bold text-gray-900">Safety & Disclaimer</span>
                    </div>
                    {expanded.safety ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expanded.safety && (
                    <div className="px-5 pb-5 border-t border-red-100">
                      <ul className="mt-4 space-y-2">
                        {analysis.safetyNotes?.map((note, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 rounded-lg p-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('followup')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center"><HelpCircle className="w-4 h-4 text-purple-600" /></div>
                      <span className="font-bold text-gray-900">Follow-up Questions</span>
                    </div>
                    {expanded.followup ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expanded.followup && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <ul className="mt-4 space-y-2">
                        {analysis.followUpQuestions?.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-purple-500 font-bold">Q{i + 1}.</span>{q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
