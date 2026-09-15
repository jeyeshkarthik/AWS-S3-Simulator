import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ToastProvider } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { Buckets } from './pages/Buckets';
import { BucketDetail } from './pages/BucketDetail';

// Placeholder components for routing
const Analytics = () => <div className="p-4">Analytics coming soon...</div>;
const Activity = () => <div className="p-4">Activity coming soon...</div>;
const About = () => <div className="p-4">About S3 coming soon...</div>;

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="buckets" element={<Buckets />} />
            <Route path="buckets/:id" element={<BucketDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="activity" element={<Activity />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
