import React from 'react';
import { Database, File, Info, HardDrive, Shield, Globe } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export const About = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">About Amazon S3</h2>
        <p className="text-slate-500 text-lg">Understanding Object Storage concepts through simulation</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-5">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
          <Info size={20} /> Educational Notice
        </h3>
        <p>This application is an educational simulation and does not directly connect to Amazon S3. It is designed to demonstrate core concepts of AWS Simple Storage Service (S3) using your browser's local storage.</p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">What is Amazon S3?</h3>
        <p className="text-slate-600 leading-relaxed mb-4">
          Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance. Customers of all sizes and industries can use Amazon S3 to store and protect any amount of data for a range of use cases, such as data lakes, websites, mobile applications, backup and restore, archive, enterprise applications, IoT devices, and big data analytics.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Core Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-aws transition-colors">
            <CardContent className="p-5 flex gap-4">
              <Database className="text-aws shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Buckets</h4>
                <p className="text-sm text-slate-600">A bucket is a container for objects stored in Amazon S3. Every object is contained in a bucket. Buckets organize the Amazon S3 namespace at the highest level.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-aws transition-colors">
            <CardContent className="p-5 flex gap-4">
              <File className="text-aws shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Objects</h4>
                <p className="text-sm text-slate-600">Objects are the fundamental entities stored in Amazon S3. They consist of object data and metadata. The data portion is opaque to Amazon S3.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-aws transition-colors">
            <CardContent className="p-5 flex gap-4">
              <Globe className="text-aws shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Regions</h4>
                <p className="text-sm text-slate-600">You choose the geographical AWS Region where Amazon S3 will store the buckets that you create. You might choose a Region to optimize latency or minimize costs.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-aws transition-colors">
            <CardContent className="p-5 flex gap-4">
              <HardDrive className="text-aws shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Keys</h4>
                <p className="text-sm text-slate-600">An object key is the unique identifier for an object within a bucket. Every object in a bucket has exactly one key.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">How This Simulator Works</h3>
        <Card>
          <div className="p-6">
            <ul className="space-y-4 text-slate-600">
              <li className="flex gap-3">
                <div className="bg-slate-100 p-1.5 rounded-full shrink-0 h-min"><Shield size={16} className="text-slate-500" /></div>
                <div>
                  <strong>Local Persistence:</strong> Instead of AWS servers, this simulator uses IndexedDB in your browser to store buckets, file data (Blobs), and metadata. Data persists across page refreshes.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-slate-100 p-1.5 rounded-full shrink-0 h-min"><Shield size={16} className="text-slate-500" /></div>
                <div>
                  <strong>No Credentials Required:</strong> Since it's a simulation, it does not require AWS access keys or secrets, making it 100% secure for educational purposes.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-slate-100 p-1.5 rounded-full shrink-0 h-min"><Shield size={16} className="text-slate-500" /></div>
                <div>
                  <strong>Enhancement - Analytics:</strong> Moving beyond the standard S3 console, this application includes a dynamic storage analytics dashboard to visualize data usage, mimicking advanced enterprise tools.
                </div>
              </li>
            </ul>
          </div>
        </Card>
      </div>

    </div>
  );
};
