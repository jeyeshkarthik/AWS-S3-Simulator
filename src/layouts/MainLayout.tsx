import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { loadDemoData, clearDemoData } from '../data/demoData';
import { 
  Database, 
  LayoutDashboard, 
  BarChart3, 
  Info, 
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const SidebarLink = ({ to, icon: Icon, label, onClick }: { to: string, icon: React.ElementType, label: string, onClick?: () => void }) => {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
};

export const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLoadDemo = async () => {
    if (window.confirm('Load demo data into the simulator?')) {
      await loadDemoData();
      window.location.reload();
    }
  };

  const handleClearDemo = async () => {
    if (window.confirm('Clear all demo data from the simulator? This will only remove demo buckets.')) {
      await clearDemoData();
      window.location.reload();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.startsWith('/buckets')) return 'Buckets';
    if (location.pathname === '/analytics') return 'Analytics';
    if (location.pathname === '/about') return 'About S3';
    if (location.pathname === '/activity') return 'Activity';
    return 'CloudDrive';
  };

  return (
    <div className="flex h-screen bg-bg-light overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 flex items-center gap-3">
          <Database className="text-aws" size={28} />
          <div>
            <h1 className="font-bold text-xl text-slate-800 leading-tight">CloudDrive</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">AWS S3 Simulator</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/buckets" icon={Database} label="Buckets" />
          <SidebarLink to="/analytics" icon={BarChart3} label="Analytics" />
          <SidebarLink to="/activity" icon={Activity} label="Activity" />
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <SidebarLink to="/about" icon={Info} label="About S3" />
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button onClick={handleLoadDemo} className="text-xs text-blue-600 hover:underline text-left px-4">Load Demo Data</button>
            <button onClick={handleClearDemo} className="text-xs text-red-600 hover:underline text-left px-4">Clear Demo Data</button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <Database className="text-aws" size={24} />
          <h1 className="font-bold text-lg text-slate-800">CloudDrive</h1>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-10 flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={closeMobileMenu} />
            <SidebarLink to="/buckets" icon={Database} label="Buckets" onClick={closeMobileMenu} />
            <SidebarLink to="/analytics" icon={BarChart3} label="Analytics" onClick={closeMobileMenu} />
            <SidebarLink to="/activity" icon={Activity} label="Activity" onClick={closeMobileMenu} />
            <div className="my-4 border-t border-slate-200"></div>
            <SidebarLink to="/about" icon={Info} label="About S3" onClick={closeMobileMenu} />
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:overflow-hidden relative pt-16 md:pt-0">
        {/* Top Header Area */}
        <header className="hidden md:flex bg-white h-16 border-b border-slate-200 items-center px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">{getPageTitle()}</h2>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-bg-light">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
