'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, Search, User, ShieldCheck, Menu } from 'lucide-react';
import { useNav } from '@/context/NavContext';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { toggleMobileMenu } = useNav();

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname.startsWith('/students')) return 'Student Management';
    if (pathname.startsWith('/subjects')) return 'Subject Management';
    if (pathname.startsWith('/fees')) return 'Fee Management Ledger';
    if (pathname.startsWith('/exams')) return 'Exams & Results Matrix';
    return 'Murtazim Academy System';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-20 glass flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white/60 border border-white/80 text-secondary-blue hover:bg-white transition-all cursor-pointer shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-lg sm:text-2xl font-extrabold text-secondary-blue tracking-tight truncate">{getPageTitle()}</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Murtazim Academy • School Management System</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..." 
            className="pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 rounded-full border border-white/70 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary-green w-28 sm:w-48 md:w-64 text-xs sm:text-sm text-gray-800 backdrop-blur-sm transition-all"
          />
        </form>
        
        <div className="relative p-2 rounded-full bg-white/50 border border-white/60 text-secondary-blue shadow-sm shrink-0">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary-green rounded-full border-2 border-white"></span>
        </div>
        
        <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-gray-200 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-blue/10 border border-secondary-blue/20 flex items-center justify-center shadow-inner">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-blue" />
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-gray-900 leading-none">Admin User</p>
              <ShieldCheck className="w-3.5 h-3.5 text-primary-green" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
