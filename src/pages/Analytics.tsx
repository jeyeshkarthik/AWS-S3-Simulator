import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Card, CardContent } from '../components/ui/Card';
import { getBuckets } from '../database/bucketRepository';
import { getAllObjects } from '../database/objectRepository';
import { Bucket, S3Object } from '../types';

const COLORS = ['#aa3bff', '#3b82f6', '#ec7211', '#10b981', '#f43f5e', '#64748b'];

export const Analytics = () => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBuckets, loadedObjects] = await Promise.all([
          getBuckets(),
          getAllObjects()
        ]);
        setBuckets(loadedBuckets);
        setObjects(loadedObjects);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalStorage = buckets.reduce((sum, b) => sum + b.totalSize, 0);
  const totalObjects = objects.length;
  const avgObjectSize = totalObjects > 0 ? totalStorage / totalObjects : 0;
  
  // Storage Usage Warning (Threshold 1GB for simulation purposes)
  const WARNING_THRESHOLD = 1 * 1024 * 1024 * 1024; // 1 GB
  const isHighStorage = totalStorage > WARNING_THRESHOLD;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Data for Chart A: Storage by File Type
  const storageByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    objects.forEach(obj => {
      let category = 'Other';
      if (obj.fileType.startsWith('image/')) category = 'Images';
      else if (obj.fileType.startsWith('video/')) category = 'Videos';
      else if (obj.fileType.includes('pdf') || obj.fileType.includes('document')) category = 'Documents';
      else if (obj.fileType.startsWith('text/')) category = 'Text';
      else if (obj.fileType.includes('audio/')) category = 'Audio';
      
      typeMap.set(category, (typeMap.get(category) || 0) + obj.size);
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
  }, [objects]);

  // Data for Chart B: Storage by Bucket
  const storageByBucket = useMemo(() => {
    return buckets
      .filter(b => b.totalSize > 0)
      .map(b => ({
        name: b.name.length > 15 ? b.name.substring(0, 15) + '...' : b.name,
        value: b.totalSize,
        sizeFormatted: formatSize(b.totalSize)
      }))
      .sort((a, b) => b.value - a.value);
  }, [buckets]);

  // Data for Chart C: Object Count by File Type
  const countByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    objects.forEach(obj => {
      let category = 'Other';
      if (obj.fileType.startsWith('image/')) category = 'Images';
      else if (obj.fileType.startsWith('video/')) category = 'Videos';
      else if (obj.fileType.includes('pdf') || obj.fileType.includes('document')) category = 'Documents';
      else if (obj.fileType.startsWith('text/')) category = 'Text';
      
      typeMap.set(category, (typeMap.get(category) || 0) + 1);
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
  }, [objects]);

  // Top 5 Largest Objects
  const largestObjects = useMemo(() => {
    return [...objects].sort((a, b) => b.size - a.size).slice(0, 5);
  }, [objects]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded text-sm">
          <p className="font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-slate-600">
            {payload[0].dataKey === 'value' && payload[0].payload.sizeFormatted 
              ? payload[0].payload.sizeFormatted 
              : payload[0].name === 'Objects' 
                ? `${payload[0].value} items` 
                : formatSize(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
          <BarChart3 size={24} className="text-aws" /> Storage Analytics
        </h2>
        <p className="text-slate-500">Understand how your simulated S3 storage is being used.</p>
      </div>

      {isHighStorage ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <h4 className="font-semibold">Storage Usage Warning</h4>
            <p className="text-sm">Storage usage is high. You have used more than 1 GB of storage in this simulation.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 text-green-800">
          <div className="bg-green-200 rounded-full p-1 mt-0.5 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <h4 className="font-semibold">Storage Status</h4>
            <p className="text-sm">Storage usage is within normal limits.</p>
          </div>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Storage Used</p>
          <p className="text-2xl font-bold text-slate-800">{formatSize(totalStorage)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Objects</p>
          <p className="text-2xl font-bold text-slate-800">{totalObjects}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Buckets</p>
          <p className="text-2xl font-bold text-slate-800">{buckets.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Avg Object Size</p>
          <p className="text-2xl font-bold text-slate-800">{formatSize(avgObjectSize)}</p>
        </Card>
      </div>

      {objects.length === 0 ? (
        <Card className="py-20 text-center">
          <PieChartIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-1">No analytics data</h3>
          <p className="text-slate-500">Upload objects to generate storage analytics.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage by File Type */}
            <Card className="p-5 flex flex-col h-[400px]">
              <h3 className="font-semibold text-slate-800 mb-6">Storage by File Type</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={storageByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {storageByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Storage by Bucket */}
            <Card className="p-5 flex flex-col h-[400px]">
              <h3 className="font-semibold text-slate-800 mb-6">Storage by Bucket</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storageByBucket} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {storageByBucket.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Object Count by File Type */}
            <Card className="p-5 flex flex-col h-[350px]">
              <h3 className="font-semibold text-slate-800 mb-6">Object Count by Type</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countByType}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                    <Bar dataKey="value" fill="#aa3bff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Largest Objects */}
            <Card className="p-5 flex flex-col h-[350px]">
              <h3 className="font-semibold text-slate-800 mb-4">Largest Objects</h3>
              <div className="space-y-4 flex-1 overflow-auto pr-2">
                {largestObjects.map((obj, i) => (
                  <div key={obj.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                      <div className="bg-slate-200 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-sm text-slate-800 truncate" title={obj.fileName}>{obj.fileName}</p>
                        <p className="text-xs text-slate-500">{buckets.find(b => b.id === obj.bucketId)?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-slate-700 whitespace-nowrap shrink-0">
                      {formatSize(obj.size)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
