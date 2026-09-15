import { getDB } from './db';
import { Bucket } from '../types';

export const getBuckets = async (): Promise<Bucket[]> => {
  const db = await getDB();
  return db.getAll('buckets');
};

export const getBucket = async (id: string): Promise<Bucket | undefined> => {
  const db = await getDB();
  return db.get('buckets', id);
};

export const getBucketByName = async (name: string): Promise<Bucket | undefined> => {
  const db = await getDB();
  return db.getFromIndex('buckets', 'by-name', name);
};

export const createBucket = async (bucket: Bucket): Promise<void> => {
  const db = await getDB();
  await db.add('buckets', bucket);
};

export const deleteBucket = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('buckets', id);
};

export const updateBucketStats = async (id: string, sizeChange: number, countChange: number): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('buckets', 'readwrite');
  const store = tx.objectStore('buckets');
  const bucket = await store.get(id);
  
  if (bucket) {
    bucket.totalSize += sizeChange;
    bucket.objectCount += countChange;
    await store.put(bucket);
  }
  await tx.done;
};
