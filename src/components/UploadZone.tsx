import React, { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (text: string, filename: string) => void;
  loading: boolean;
}

export default function UploadZone({ onUpload, loading }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  const validateFile = (f: File) => {
    if (!allowedTypes.includes(f.type)) {
      setError("Only PDF, DOCX, and TXT files are supported");
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return false;
    }
    setError("");
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleUpload = () => {
    if (!file) return;
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    fetch("/api/cv/upload", { method: "POST", body: formData })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok && data.success) {
          onUpload(data.text, data.filename);
        } else {
          setError(data.error || `Upload failed (${r.status})`);
        }
      })
      .catch((e) => setError(`Upload failed: ${e.message}`));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-indigo-500 bg-indigo-50/50"
            : file
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              Drop your CV here or <span className="text-indigo-600">browse</span>
            </p>
            <p className="text-xs text-gray-400">Supports PDF, DOCX, TXT (max 10MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Parse
            </>
          )}
        </button>
      )}
    </div>
  );
}
