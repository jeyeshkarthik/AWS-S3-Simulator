import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UploadCloud, RefreshCw, Filter, File, Image as ImageIcon, FileText, Video, LayoutList } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { UploadModal } from '../components/UploadModal';
import { ObjectDetailsModal } from '../components/ObjectDetailsModal';
import { getBucket } from '../database/bucketRepository';
import { getObjects, deleteObject } from '../database/objectRepository';
import { createActivity } from '../database/activityRepository';
import { Bucket, S3Object } from '../types';

export const BucketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOption, setSortOption] = useState('Newest');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);

  const loadBucketData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const b = await getBucket(id);
      if (b) {
        setBucket(b);
        const objs = await getObjects(id);
        setObjects(objs);
      } else {
        error('Bucket not found');
        navigate('/buckets');
      }
    } catch (err) {
      error('Failed to load bucket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBucketData();
  }, [id]);

  const handleDownload = (obj: S3Object) => {
    try {
      const url = URL.createObjectURL(obj.fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = obj.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      createActivity({
        id: crypto.randomUUID(),
        type: 'OBJECT_DOWNLOADED',
        description: `Downloaded ${obj.fileName}`,
        bucketId: obj.bucketId,
        objectId: obj.id,
        timestamp: Date.now()
      });
    } catch (err) {
      error('Failed to download object');
    }
  };

  const handleDelete = async (obj: S3Object) => {
    if (!bucket) return;
    
    if (window.confirm(`Are you sure you want to delete ${obj.fileName}?`)) {
      try {
        await deleteObject(obj.id);
        
        await createActivity({
          id: crypto.randomUUID(),
          type: 'OBJECT_DELETED',
          description: `Deleted ${obj.fileName}`,
          bucketId: obj.bucketId,
          timestamp: Date.now()
        });
        
        success('Object deleted successfully');
        loadBucketData();
      } catch (err) {
        error('Failed to delete object');
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={18} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Video size={18} className="text-purple-500" />;
    if (type.includes('pdf') || type.includes('text/')) return <FileText size={18} className="text-orange-500" />;
    return <File size={18} className="text-slate-500" />;
  };

  const filteredObjects = useMemo(() => {
    let result = objects;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o => o.fileName.toLowerCase().includes(q) || o.key.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'All') {
      result = result.filter(o => {
        if (typeFilter === 'Images') return o.fileType.startsWith('image/');
        if (typeFilter === 'Videos') return o.fileType.startsWith('video/');
        if (typeFilter === 'Documents') return o.fileType.includes('pdf') || o.fileType.includes('document');
        if (typeFilter === 'Text') return o.fileType.startsWith('text/');
        return !o.fileType.startsWith('image/') && !o.fileType.startsWith('video/') && !o.fileType.includes('pdf') && !o.fileType.startsWith('text/');
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'Name': return a.fileName.localeCompare(b.fileName);
        case 'Size': return b.size - a.size;
        case 'Newest': return b.uploadedAt - a.uploadedAt;
        case 'Oldest': return a.uploadedAt - b.uploadedAt;
        case 'Type': return a.fileType.localeCompare(b.fileType);
        default: return 0;
      }
    });

    return result;
  }, [objects, searchQuery, typeFilter, sortOption]);

  if (loading || !bucket) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Breadcrumb & Header */}
      <div>
        <button 
          onClick={() => navigate('/buckets')}
          className="text-aws hover:underline flex items-center gap-1 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16} /> Back to Buckets
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-lg"><LayoutList size={24} /></span>
              {bucket.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Region: {bucket.region}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={loadBucketData} className="gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
              <UploadCloud size={16} /> Upload Objects
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Objects</p>
          <p className="text-xl font-bold text-slate-800">{bucket.objectCount}</p>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Storage</p>
          <p className="text-xl font-bold text-slate-800">{formatSize(bucket.totalSize)}</p>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Created At</p>
          <p className="text-lg font-medium text-slate-800">{new Date(bucket.createdAt).toLocaleDateString()}</p>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search objects by name or prefix..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="w-full h-10 pl-10 pr-3 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-aws outline-none bg-white appearance-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Images">Images</option>
                <option value="Documents">Documents</option>
                <option value="Videos">Videos</option>
                <option value="Text">Text</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="relative flex-1 md:w-48">
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-aws outline-none bg-white"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="Newest">Sort: Newest First</option>
                <option value="Oldest">Sort: Oldest First</option>
                <option value="Name">Sort: Name (A-Z)</option>
                <option value="Size">Sort: Size (Largest)</option>
                <option value="Type">Sort: File Type</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Objects Table */}
      <Card className="border-slate-200 overflow-hidden">
        {objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <UploadCloud size={48} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">This bucket is empty</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              Upload files to this bucket to start storing and managing objects.
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>Upload Objects</Button>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No objects match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-sm">
                  <th className="p-4 font-semibold text-slate-700">Name</th>
                  <th className="p-4 font-semibold text-slate-700">Type</th>
                  <th className="p-4 font-semibold text-slate-700">Size</th>
                  <th className="p-4 font-semibold text-slate-700">Last Modified</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredObjects.map((obj) => (
                  <tr key={obj.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                      {getFileIcon(obj.fileType)}
                      <span className="truncate max-w-[250px]" title={obj.fileName}>{obj.fileName}</span>
                    </td>
                    <td className="p-4 text-slate-600 truncate max-w-[150px]" title={obj.fileType}>
                      {obj.fileType || 'Unknown'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {formatSize(obj.size)}
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(obj.uploadedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedObject(obj)}>
                          View
                        </Button>
                        <button 
                          onClick={() => handleDownload(obj)}
                          className="p-1.5 text-slate-400 hover:text-aws hover:bg-orange-50 rounded transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(obj)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        bucketId={bucket.id}
        onUploadSuccess={loadBucketData}
      />

      <ObjectDetailsModal
        isOpen={!!selectedObject}
        onClose={() => setSelectedObject(null)}
        object={selectedObject}
        onDownload={handleDownload}
        onDelete={(obj) => {
          handleDelete(obj);
          setSelectedObject(null);
        }}
      />
    </div>
  );
};
