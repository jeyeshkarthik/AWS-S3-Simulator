import { getDB } from './db';
import { Activity } from '../types';

export const getActivities = async (): Promise<Activity[]> => {
  const db = await getDB();
  // Get all activities sorted by timestamp (descending)
  const activities = await db.getAllFromIndex('activities', 'by-time');
  return activities.reverse();
};

export const createActivity = async (activity: Activity): Promise<void> => {
  const db = await getDB();
  await db.add('activities', activity);
};

export const clearActivities = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('activities');
};
