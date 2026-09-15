import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { getBuckets, createBucket, deleteBucket } from '../database/bucketRepository';
import { getObjects } from '../database/objectRepository';
import { createActivity } from '../database/activityRepository';
import { Bucket } from '../types';

export const Buckets = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketRegion, setNewBucketRegion] = useState('ap-south-1');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const loadBuckets = async () => {
    try {
      const data = await getBuckets();
      setBuckets(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      showError('Failed to load buckets');
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newBucketName.trim()) {
      setError('Bucket name is required');
      return;
    }

    if (/[^a-z0-9.-]/.test(newBucketName)) {
      setError('Bucket name can only contain lowercase letters, numbers, dots, and hyphens');
      return;
    }

    try {
      const newBucket: Bucket = {
        id: crypto.randomUUID(),
        name: newBucketName.toLowerCase(),
        region: newBucketRegion,
        createdAt: Date.now(),
        objectCount: 0,
        totalSize: 0,
      };

      await createBucket(newBucket);
      await createActivity({
        id: crypto.randomUUID(),
        type: 'BUCKET_CREATED',
        description: `Created bucket ${newBucket.name}`,
        bucketId: newBucket.id,
        timestamp: Date.now()
      });

      success(`Bucket ${newBucket.name} created successfully`);
      setIsCreateModalOpen(false);
      setNewBucketName('');
      loadBuckets();
    } catch (err: any) {
      if (err.name === 'ConstraintError') {
        setError('Bucket name already exists');
      } else {
        setError('Failed to create bucket');
      }
    }
  };

  const handleDeleteBucket = async (bucket: Bucket) => {
    try {
      // Check if empty
      const objects = await getObjects(bucket.id);
      if (objects.length > 0) {
        showError('Bucket cannot be deleted because it contains objects.');
        return;
      }

      if (window.confirm(`Are you sure you want to delete the bucket "${bucket.name}"?`)) {
        await deleteBucket(bucket.id);
        await createActivity({
          id: crypto.randomUUID(),
          type: 'BUCKET_DELETED',
          description: `Deleted bucket ${bucket.name}`,
          timestamp: Date.now()
        });
        success(`Bucket ${bucket.name} deleted successfully`);
        loadBuckets();
      }
    } catch (err) {
      showError('Failed to delete bucket');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 mb-1">Buckets are containers used to organize objects in Amazon S3.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus size={18} />
          Create Bucket
        </Button>
      </div>

      {buckets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
          <Database size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No buckets yet</h3>
          <p className="text-slate-500 mb-6">Create a bucket to start storing your objects.</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>Create Your First Bucket</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <Card key={bucket.id} className="hover:border-aws transition-colors group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded text-aws">
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 truncate max-w-[150px]" title={bucket.name}>
                        {bucket.name}
                      </h3>
                      <p className="text-xs text-slate-500">{bucket.region}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBucket(bucket)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    title="Delete Bucket"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500 mb-0.5">Objects</p>
                    <p className="font-medium text-slate-700">{bucket.objectCount}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500 mb-0.5">Storage</p>
                    <p className="font-medium text-slate-700">{formatSize(bucket.totalSize)}</p>
                  </div>
                </div>

                <Button 
                  variant="secondary" 
                  className="w-full justify-center gap-2"
                  onClick={() => navigate(`/buckets/${bucket.id}`)}
                >
                  <ExternalLink size={16} />
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Bucket"
      >
        <form onSubmit={handleCreateBucket} className="space-y-4">
          <Input
            label="Bucket Name"
            placeholder="e.g. college-project"
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            error={error}
            autoFocus
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              AWS Region
            </label>
            <select
              value={newBucketRegion}
              onChange={(e) => setNewBucketRegion(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aws"
            >
              <option value="us-east-1">US East (N. Virginia) us-east-1</option>
              <option value="us-west-2">US West (Oregon) us-west-2</option>
              <option value="ap-south-1">Asia Pacific (Mumbai) ap-south-1</option>
              <option value="eu-central-1">Europe (Frankfurt) eu-central-1</option>
            </select>
          </div>

          <div className="bg-blue-50 text-blue-800 p-3 rounded text-sm flex gap-2 items-start mt-4">
            <Database size={16} className="mt-0.5 shrink-0" />
            <p>Bucket names must be globally unique across all AWS accounts and contain only lowercase letters, numbers, and hyphens.</p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Bucket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
