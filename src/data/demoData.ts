import { createBucket, getBuckets, deleteBucket } from '../database/bucketRepository';
import { createObject, getAllObjects, deleteObject } from '../database/objectRepository';
import { createActivity } from '../database/activityRepository';
import { Bucket, S3Object } from '../types';

export const loadDemoData = async () => {
  // Create sample buckets
  const buckets = [
    { name: 'college-project', region: 'ap-south-1' },
    { name: 'media-library', region: 'us-east-1' },
    { name: 'website-assets', region: 'eu-central-1' }
  ];

  for (const b of buckets) {
    const existing = await getBuckets();
    if (!existing.find(eb => eb.name === b.name)) {
      const bucket: Bucket = {
        id: crypto.randomUUID(),
        name: b.name,
        region: b.region,
        createdAt: Date.now() - Math.floor(Math.random() * 10000000000),
        objectCount: 0,
        totalSize: 0
      };
      await createBucket(bucket);
      
      await createActivity({
        id: crypto.randomUUID(),
        type: 'BUCKET_CREATED',
        description: `Created demo bucket ${bucket.name}`,
        bucketId: bucket.id,
        timestamp: bucket.createdAt
      });

      // Create some objects for this bucket
      const objCount = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < objCount; i++) {
        const types = [
          { type: 'image/jpeg', name: `photo-${i}.jpg`, size: 1024 * 1024 * (Math.random() * 5 + 1) },
          { type: 'application/pdf', name: `report-${i}.pdf`, size: 1024 * 1024 * (Math.random() * 2 + 0.5) },
          { type: 'video/mp4', name: `demo-video-${i}.mp4`, size: 1024 * 1024 * (Math.random() * 50 + 10) },
          { type: 'text/plain', name: `notes-${i}.txt`, size: 1024 * (Math.random() * 100 + 1) }
        ];
        
        const fileDef = types[Math.floor(Math.random() * types.length)];
        
        // Create a fake Blob
        const blob = new Blob([new ArrayBuffer(Math.floor(fileDef.size))], { type: fileDef.type });
        
        const objectId = crypto.randomUUID();
        const s3Obj: S3Object = {
          id: objectId,
          bucketId: bucket.id,
          key: `demo/${fileDef.name}`,
          fileName: fileDef.name,
          fileType: fileDef.type,
          size: fileDef.size,
          lastModified: Date.now() - Math.floor(Math.random() * 100000000),
          uploadedAt: Date.now() - Math.floor(Math.random() * 100000000),
          fileData: blob
        };

        await createObject(s3Obj);
        
        await createActivity({
          id: crypto.randomUUID(),
          type: 'OBJECT_UPLOADED',
          description: `Uploaded demo object ${s3Obj.fileName}`,
          bucketId: bucket.id,
          objectId: s3Obj.id,
          timestamp: s3Obj.uploadedAt
        });
      }
    }
  }
};

export const clearDemoData = async () => {
  const buckets = await getBuckets();
  const objects = await getAllObjects();
  
  // Clean up only demo data if possible, or clear all for simplicity in simulation
  // The instructions say "Do not delete real user-uploaded data when clearing demo data unless explicitly confirmed."
  // But wait, the user says "unless explicitly confirmed". We can just prompt "This will delete all data. Continue?"
  // Or we can identify demo data by the bucket names.
  const demoBucketNames = ['college-project', 'media-library', 'website-assets'];
  
  const demoBuckets = buckets.filter(b => demoBucketNames.includes(b.name));
  
  for (const b of demoBuckets) {
    const bucketObjs = objects.filter(o => o.bucketId === b.id);
    for (const o of bucketObjs) {
      await deleteObject(o.id);
    }
    await deleteBucket(b.id);
  }
};
