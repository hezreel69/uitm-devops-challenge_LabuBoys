'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSignature,
  Building,
  Users,
  RefreshCw
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/agreements', icon: FileSignature, label: 'Agreements' },
    { href: '/admin/properties', icon: Building, label: 'Properties' },
    { href: '/admin/users', icon: Users, label: 'Users' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-slate-600 text-sm">Manage your platform</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-sm"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                active
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
