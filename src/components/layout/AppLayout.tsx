import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cda-dark-950 flex flex-col font-sans text-slate-100 selection:bg-cda-yellow-500 selection:text-black">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex-1 flex overflow-hidden relative min-w-0">
        {/* Sidebar (Desktop static, Mobile drawer) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gradient-to-b from-cda-dark-950 to-cda-dark-900 w-full">
          <div className="max-w-7xl mx-auto pb-12 sm:pb-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
