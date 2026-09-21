import React, { useState, useRef } from 'react';
import { UploadCloud, Image, FileVideo, X } from 'lucide-react';

export const EvidenceUploader = ({ onFileSelect, selectedFile, onRemoveFile }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black uppercase tracking-wider text-brand-dark">
        Photo / Video Evidence (Will be pinned to IPFS)
      </label>

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-3 border-dashed border-black p-6 text-center transition-all bg-white hover:bg-brand-muted ${
            dragOver ? 'bg-yellow-100 border-brand-red' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="w-8 h-8 mx-auto text-brand-dark mb-2" />
          <p className="font-bold text-xs text-brand-dark">
            Click to browse or drag & drop evidence file
          </p>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            PNG, JPG, MP4 or MOV up to 25MB
          </p>
        </div>
      ) : (
        <div className="border-3 border-black p-3 bg-brand-muted flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold truncate">
            {selectedFile.type.startsWith('video') ? (
              <FileVideo className="w-5 h-5 text-brand-red flex-shrink-0" />
            ) : (
              <Image className="w-5 h-5 text-brand-red flex-shrink-0" />
            )}
            <span className="truncate">{selectedFile.name}</span>
            <span className="text-gray-500 text-[10px]">
              ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>

          <button
            type="button"
            onClick={onRemoveFile}
            className="border-2 border-black p-1 bg-white hover:bg-red-100 text-brand-red"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
