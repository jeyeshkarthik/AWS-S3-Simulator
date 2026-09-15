import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ToastProvider } from './components/ui/Toast';
import { Dashboard } from './pages/Dashboard';
import { Buckets } from './pages/Buckets';
import { BucketDetail } from './pages/BucketDetail';
import { Analytics } from './pages/Analytics';
import { Activity } from './pages/Activity';
import { About } from './pages/About';

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
