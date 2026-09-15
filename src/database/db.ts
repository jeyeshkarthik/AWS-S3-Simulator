import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bucket, S3Object, Activity } from '../types';

interface CloudDriveDB extends DBSchema {
  buckets: {
    key: string;
    value: Bucket;
    indexes: { 'by-name': string };
  };
  objects: {
    key: string;
    value: S3Object;
    indexes: { 'by-bucket': string };
  };
  activities: {
    key: string;
    value: Activity;
    indexes: { 'by-time': number };
  };
}

const DB_NAME = 'clouddrive-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CloudDriveDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CloudDriveDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('buckets')) {
          const bucketStore = db.createObjectStore('buckets', { keyPath: 'id' });
          bucketStore.createIndex('by-name', 'name', { unique: true });
        }
        
        if (!db.objectStoreNames.contains('objects')) {
          const objectStore = db.createObjectStore('objects', { keyPath: 'id' });
          objectStore.createIndex('by-bucket', 'bucketId');
        }

        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('by-time', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};
