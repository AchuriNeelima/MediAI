import { useState, useRef } from 'react';
import { Upload, Image, Shield, X, Eye, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import MarkdownRenderer from '@/components/features/MarkdownRenderer';
import { generateImageAnalysis } from '@/lib/aiResponses';
import { cn } from '@/lib/utils';

const SUPPORTED = ['JPG', 'JPEG', 'PNG', 'WEBP'];

export default function ImageAnalysis() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [finalResult, setFinalResult] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const runAnalysis = async (file: File) => {
    setError('');
    setFinalResult('');
    setStreamContent('');
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));

    try {
      setUploading(true);
      const imageBase64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      setUploading(false);
      setIsStreaming(true);

      const result = await generateImageAnalysis(
        (chunk) => setStreamContent(chunk),
        imageBase64,
        mimeType
      );

      setFinalResult(result);
      setStreamContent('');
      setIsStreaming(false);
    } catch (err) {
      setUploading(false);
      setIsStreaming(false);
      setStreamContent('');
      setError(err instanceof Error ? err.message : 'Failed to analyze the image.');
    }
  };

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (!SUPPORTED.includes(ext || '')) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    runAnalysis(file);
  };

  const reset = () => {
    setPreview(null);
    setFinalResult('');
    setStreamContent('');
    setFileName('');
    setError('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Medical Image Analysis" subtitle="Upload a medical image for AI-powered analysis" />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-5xl w-full mx-auto">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            <strong>Disclaimer:</strong> This AI analysis is for educational purposes only and is NOT a medical diagnosis. Always consult a licensed radiologist or physician.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left — upload panel */}
          <div className="lg:col-span-2 space-y-4">
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className={cn(
                  'rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 text-center',
                  dragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
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
                  <img src={preview} alt="Uploaded medical image" className="w-full h-64 object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm font-medium">Processing...</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800 truncate">{fileName}</span>
                  </div>
                  {finalResult && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600 font-medium">Analysis complete</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">Supported Image Types</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {['X-rays (chest, bone, dental)', 'MRI scans', 'CT scan images', 'Ultrasound images', 'Dermatological images', 'Other medical photos'].map((t, i) => (
                  <li key={i} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — AI result */}
          <div className="lg:col-span-3">
            {(isStreaming && streamContent) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1"><div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" /></div>
                  <span className="text-sm font-semibold text-blue-600">Analyzing your image...</span>
                </div>
                <MarkdownRenderer content={streamContent} />
                <span className="inline-block w-0.5 h-4 bg-blue-500 animate-blink ml-0.5 align-text-bottom" />
              </div>
            )}

            {finalResult && !isStreaming && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm animate-slide-up">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-900">AI Image Analysis</span>
                  <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Educational only
                  </span>
                </div>
                <MarkdownRenderer content={finalResult} />
              </div>
            )}

            {!preview && !isStreaming && !finalResult && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-semibold text-gray-500 mb-1">No image uploaded</h3>
                <p className="text-sm text-gray-400">Upload a medical image to get an AI-powered analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
