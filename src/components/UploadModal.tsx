import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { createObject } from '../../database/objectRepository';
import { createActivity } from '../../database/activityRepository';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketId: string;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, bucketId, onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const objectId = crypto.randomUUID();
        const s3Object = {
          id: objectId,
          bucketId,
          key: `${Date.now()}-${file.name}`,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          size: file.size,
          lastModified: file.lastModified,
          uploadedAt: Date.now(),
          fileData: file
        };

        await createObject(s3Object);
        await createActivity({
          id: crypto.randomUUID(),
          type: 'OBJECT_UPLOADED',
          description: `Uploaded ${file.name}`,
          bucketId,
          objectId,
          timestamp: Date.now()
        });
        
        successCount++;
      } catch (err) {
        error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      success(`${successCount} object(s) uploaded successfully`);
      setFiles([]);
      onUploadSuccess();
      onClose();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Objects" className="max-w-2xl">
      <div className="space-y-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${isDragging ? 'border-aws bg-orange-50' : 'border-slate-300 hover:border-slate-400'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud size={48} className={`mx-auto mb-4 ${isDragging ? 'text-aws' : 'text-slate-400'}`} />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Drag and drop files here</h3>
          <p className="text-slate-500 mb-6 text-sm">or click below to browse your computer</p>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
          />
          <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
            Browse Files
          </Button>
        </div>

        {files.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex justify-between">
              Selected Files ({files.length})
              <span className="text-slate-500 font-normal">
                {formatSize(files.reduce((acc, f) => acc + f.size, 0))} Total
              </span>
            </h4>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon size={16} className="text-slate-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
