export interface Bucket {
  id: string;
  name: string;
  region: string;
  createdAt: number;
  objectCount: number;
  totalSize: number;
}

export interface S3Object {
  id: string;
  bucketId: string;
  key: string;
  fileName: string;
  fileType: string;
  size: number;
  lastModified: number;
  uploadedAt: number;
  fileData: Blob;
}

export interface Activity {
  id: string;
  type: 'BUCKET_CREATED' | 'BUCKET_DELETED' | 'OBJECT_UPLOADED' | 'OBJECT_DELETED' | 'OBJECT_DOWNLOADED';
  description: string;
  bucketId?: string;
  objectId?: string;
  timestamp: number;
}
