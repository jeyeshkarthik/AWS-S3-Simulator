import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
// Placeholder components for routing
const Dashboard = () => <div className="p-4">Dashboard coming soon...</div>;
const Buckets = () => <div className="p-4">Buckets coming soon...</div>;
const Analytics = () => <div className="p-4">Analytics coming soon...</div>;
const Activity = () => <div className="p-4">Activity coming soon...</div>;
const About = () => <div className="p-4">About S3 coming soon...</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="buckets" element={<Buckets />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<Activity />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
