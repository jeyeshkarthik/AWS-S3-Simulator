import React, { useState, useEffect } from 'react';
import { Download, Trash2, File as FileIcon, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { S3Object } from '../types';

interface ObjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: S3Object | null;
  onDownload: (obj: S3Object) => void;
  onDelete: (obj: S3Object) => void;
}

export const ObjectDetailsModal: React.FC<ObjectDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  object, 
  onDownload, 
  onDelete 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (object && object.fileType.startsWith('image/')) {
      const url = URL.createObjectURL(object.fileData);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [object]);

  if (!object) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Object Details" className="max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Properties</h4>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Object Name</span>
                <span className="font-medium text-slate-900 break-all">{object.fileName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Object Key</span>
                <span className="font-medium text-slate-900 break-all">{object.key}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Type</span>
                <span className="font-medium text-slate-900">{object.fileType || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Size</span>
                <span className="font-medium text-slate-900">{formatSize(object.size)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Uploaded</span>
                <span className="font-medium text-slate-900">{formatDate(object.uploadedAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
            <h5 className="font-semibold mb-1">AWS Concept: Object Metadata</h5>
            <p>An object is the individual piece of data stored inside an S3 bucket. In Amazon S3, an object consists of the object data and metadata like its key, size, and type.</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Preview</h4>
          <div className="bg-slate-100 rounded-lg border border-slate-200 h-64 flex items-center justify-center overflow-hidden relative">
            {previewUrl ? (
              <img src={previewUrl} alt={object.fileName} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-slate-400">
                <FileIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p>Preview unavailable for this file type</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
        <Button variant="danger" className="gap-2" onClick={() => {
          onDelete(object);
          onClose();
        }}>
          <Trash2 size={16} /> Delete
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button className="gap-2" onClick={() => onDownload(object)}>
            <Download size={16} /> Download Object
          </Button>
        </div>
      </div>
    </Modal>
  );
};
