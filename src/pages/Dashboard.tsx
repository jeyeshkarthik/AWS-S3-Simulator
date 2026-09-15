import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, File, HardDrive, PieChart, ExternalLink, Download, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getBuckets } from '../database/bucketRepository';
import { getAllObjects, deleteObject } from '../database/objectRepository';
import { createActivity } from '../database/activityRepository';
import { Bucket, S3Object } from '../types';
import { useToast } from '../components/ui/Toast';

export const Dashboard = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBuckets, loadedObjects] = await Promise.all([
          getBuckets(),
          getAllObjects()
        ]);
        setBuckets(loadedBuckets);
        // Sort by most recent
        setObjects(loadedObjects.sort((a, b) => b.uploadedAt - a.uploadedAt));
      } catch (err) {
        error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  const totalStorage = buckets.reduce((acc, bucket) => acc + bucket.totalSize, 0);
  const MAX_STORAGE = 5 * 1024 * 1024 * 1024; // 5 GB limit for simulator visually
  const storagePercentage = Math.min((totalStorage / MAX_STORAGE) * 100, 100);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
    if (window.confirm(`Are you sure you want to delete ${obj.fileName}?`)) {
      try {
        await deleteObject(obj.id);
        setObjects(objects.filter(o => o.id !== obj.id));
        const updatedBuckets = await getBuckets();
        setBuckets(updatedBuckets);
        
        await createActivity({
          id: crypto.randomUUID(),
          type: 'OBJECT_DELETED',
          description: `Deleted ${obj.fileName}`,
          bucketId: obj.bucketId,
          timestamp: Date.now()
        });
        success('Object deleted successfully');
      } catch (err) {
        error('Failed to delete object');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">CloudDrive</h2>
        <p className="text-slate-500 text-lg">AWS S3 Storage Simulator</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Buckets</p>
              <h3 className="text-2xl font-bold text-slate-800">{buckets.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <File size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Objects</p>
              <h3 className="text-2xl font-bold text-slate-800">{objects.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
              <HardDrive size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Storage Used</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatSize(totalStorage)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
              <PieChart size={24} />
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-500">Usage (5GB max)</p>
                <p className="text-sm font-bold text-slate-800">{storagePercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${storagePercentage > 80 ? 'bg-red-500' : 'bg-purple-500'}`} 
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Visualization */}
      <Card className="bg-slate-800 text-white border-slate-700">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <HardDrive size={18} /> Storage Overview
            </h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/analytics')}>
              View Analytics
            </Button>
          </div>
          <div className="flex gap-1 h-8 rounded-md overflow-hidden bg-slate-900 mb-2">
            {buckets.length > 0 ? buckets.map((bucket, i) => {
              const width = totalStorage === 0 ? 0 : (bucket.totalSize / totalStorage) * 100;
              const colors = ['bg-aws', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
              if (width === 0) return null;
              return (
                <div 
                  key={bucket.id} 
                  title={`${bucket.name}: ${formatSize(bucket.totalSize)}`}
                  className={`${colors[i % colors.length]} h-full transition-all`} 
                  style={{ width: `${width}%` }}
                />
              );
            }) : (
              <div className="w-full h-full bg-slate-700 opacity-50 flex items-center justify-center text-xs text-slate-400">Empty</div>
            )}
          </div>
          <div className="flex justify-between text-sm text-slate-400 mt-2">
            <span>{formatSize(totalStorage)} used</span>
            <span>{buckets.length} buckets</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Objects */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">Recent Objects</h3>
        <Card>
          {objects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File size={40} className="text-slate-300 mb-3" />
              <h4 className="text-slate-800 font-medium mb-1">No objects yet</h4>
              <p className="text-slate-500 mb-4">You haven't uploaded any files.</p>
              <Button onClick={() => navigate('/buckets')}>Go to Buckets</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-sm">
                    <th className="p-4 font-medium text-slate-500">File Name</th>
                    <th className="p-4 font-medium text-slate-500">Bucket</th>
                    <th className="p-4 font-medium text-slate-500">Type</th>
                    <th className="p-4 font-medium text-slate-500">Size</th>
                    <th className="p-4 font-medium text-slate-500">Uploaded</th>
                    <th className="p-4 font-medium text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {objects.slice(0, 5).map((obj) => {
                    const bucketName = buckets.find(b => b.id === obj.bucketId)?.name || 'Unknown';
                    return (
                      <tr key={obj.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                          <File size={16} className="text-slate-400" />
                          <span className="truncate max-w-[200px]" title={obj.fileName}>{obj.fileName}</span>
                        </td>
                        <td className="p-4 text-slate-600">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {bucketName}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 text-sm truncate max-w-[120px]" title={obj.fileType}>
                          {obj.fileType || 'Unknown'}
                        </td>
                        <td className="p-4 text-slate-600 text-sm whitespace-nowrap">
                          {formatSize(obj.size)}
                        </td>
                        <td className="p-4 text-slate-600 text-sm whitespace-nowrap">
                          {new Date(obj.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => navigate(`/buckets/${obj.bucketId}`)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Bucket"
                            >
                              <ExternalLink size={16} />
                            </button>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
