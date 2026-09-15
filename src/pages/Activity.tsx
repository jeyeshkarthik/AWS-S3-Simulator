import React, { useState, useEffect } from 'react';
import { Clock, Database, File, Trash2, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { getActivities, clearActivities } from '../database/activityRepository';
import { Activity as ActivityType } from '../types';

export const Activity = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const loadActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleClearActivities = async () => {
    if (window.confirm('Are you sure you want to clear the entire activity log?')) {
      try {
        await clearActivities();
        success('Activity log cleared successfully');
        loadActivities();
      } catch (err) {
        error('Failed to clear activity log');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BUCKET_CREATED':
        return <Database size={16} className="text-green-500" />;
      case 'BUCKET_DELETED':
        return <Trash2 size={16} className="text-red-500" />;
      case 'OBJECT_UPLOADED':
        return <File size={16} className="text-blue-500" />;
      case 'OBJECT_DELETED':
        return <Trash2 size={16} className="text-red-500" />;
      case 'OBJECT_DOWNLOADED':
        return <Download size={16} className="text-purple-500" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="p-8">Loading activity...</div>;

  // Group activities by date
  const groupedActivities = activities.reduce((acc, curr) => {
    const dateStr = formatDate(curr.timestamp);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(curr);
    return acc;
  }, {} as Record<string, ActivityType[]>);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Clock size={24} className="text-aws" /> Activity Log
          </h2>
          <p className="text-slate-500">Track recent actions in your simulated S3 environment.</p>
        </div>
        
        {activities.length > 0 && (
          <Button variant="danger" onClick={handleClearActivities} className="gap-2 shrink-0">
            <Trash2 size={16} /> Clear Log
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <Card className="py-20 text-center">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-1">No activity yet</h3>
          <p className="text-slate-500">Actions like creating buckets and uploading files will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 pl-4 border-l-2 border-slate-200">
                {date}
              </h3>
              <Card className="overflow-hidden border-slate-200">
                <div className="divide-y divide-slate-100">
                  {dayActivities.map((activity) => (
                    <div key={activity.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="mt-1 bg-white border border-slate-200 rounded-full p-2 h-8 w-8 flex items-center justify-center shrink-0 shadow-sm">
                        {getIcon(activity.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={12} />
                            {formatTime(activity.timestamp)}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {activity.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
