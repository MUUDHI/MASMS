'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, CreditCard, Award, X } from 'lucide-react';
import logoSrc from '../../public/logo.png';
import { useNav } from '@/context/NavContext';

export function Sidebar() {
  const pathname = usePathname();
  const { mobileMenuOpen, closeMobileMenu } = useNav();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Fee Ledgers', href: '/fees', icon: CreditCard },
    { name: 'Exams & Results', href: '/exams', icon: Award },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`w-64 glass-panel h-screen flex flex-col fixed left-0 top-0 text-secondary-blue border-r border-white/50 z-50 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/40 bg-white/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-full overflow-hidden shadow-md border-2 border-primary-green/30 shrink-0">
              <Image src={logoSrc} alt="Murtazim Logo" fill className="object-cover" />
            </div>
            <div className="font-extrabold leading-tight truncate">
              <span className="block text-primary-green text-base font-extrabold tracking-tight">Murtazim</span>
              <span className="block text-secondary-blue text-base font-extrabold tracking-tight">Academy</span>
            </div>
          </div>

          {/* Close Mobile Menu Button */}
          <button 
            onClick={closeMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white/50 transition-colors shrink-0 ml-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-green text-white shadow-lg shadow-primary-green/25 translate-x-1'
                    : 'text-secondary-blue hover:bg-white/60 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-secondary-blue'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer - Settings */}
        <div className="p-4 border-t border-white/40 bg-white/20 shrink-0">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/50 border border-white/60 text-secondary-blue shadow-xs hover:bg-white/70 transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary-green text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
              M
            </div>
            <span className="font-bold text-sm text-gray-800 tracking-wide">Settings</span>
          </div>
        </div>
      </aside>
    </>
  );
}
