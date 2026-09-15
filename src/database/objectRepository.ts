import { getDB } from './db';
import { S3Object } from '../types';
import { updateBucketStats } from './bucketRepository';

export const getObjects = async (bucketId: string): Promise<S3Object[]> => {
  const db = await getDB();
  return db.getAllFromIndex('objects', 'by-bucket', bucketId);
};

export const getAllObjects = async (): Promise<S3Object[]> => {
  const db = await getDB();
  return db.getAll('objects');
};

export const getObject = async (id: string): Promise<S3Object | undefined> => {
  const db = await getDB();
  return db.get('objects', id);
};

export const createObject = async (object: S3Object): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['objects', 'buckets'], 'readwrite');
  
  await tx.objectStore('objects').add(object);
  
  const bucketStore = tx.objectStore('buckets');
  const bucket = await bucketStore.get(object.bucketId);
  
  if (bucket) {
    bucket.totalSize += object.size;
    bucket.objectCount += 1;
    await bucketStore.put(bucket);
  }
  
  await tx.done;
};

export const deleteObject = async (id: string): Promise<void> => {
  const db = await getDB();
  
  const tx = db.transaction(['objects', 'buckets'], 'readwrite');
  const objectStore = tx.objectStore('objects');
  const obj = await objectStore.get(id);
  
  if (obj) {
    await objectStore.delete(id);
    
    const bucketStore = tx.objectStore('buckets');
    const bucket = await bucketStore.get(obj.bucketId);
    
    if (bucket) {
      bucket.totalSize -= obj.size;
      bucket.objectCount -= 1;
      await bucketStore.put(bucket);
    }
  }
  
  await tx.done;
};
