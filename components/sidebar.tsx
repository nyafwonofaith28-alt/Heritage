'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Pill,
  Truck,
  ClipboardList,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: 'staff' | 'admin';
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export function Sidebar({ role, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const staffLinks = [
    { name: 'POS', href: '/staff', icon: ShoppingCart },
    { name: 'Inventory', href: '/staff/inventory', icon: Package },
    { name: 'Customers', href: '/staff/customers', icon: Users },
    { name: 'Prescriptions', href: '/staff/prescriptions', icon: Pill },
    { name: 'Shift & Sales', href: '/staff/shift', icon: ClipboardList },
  ];

  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Staff', href: '/admin/staff', icon: Users },
    { name: 'Suppliers', href: '/admin/suppliers', icon: Truck },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const links = role === 'admin' ? adminLinks : staffLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 md:relative flex flex-col h-full bg-white/95 md:bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_0_rgba(0,0,0,0.02)] transition-transform duration-300 z-50 md:z-20 md:translate-x-0",
        collapsed ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Stylish Toggle Button (Desktop only) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-4 top-8 bg-white border border-slate-200 shadow-md rounded-full p-1.5 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all z-30"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="md:hidden absolute right-4 top-6 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all z-30"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center p-6 border-b border-slate-200/50">
        {!collapsed ? (
          <div className="flex items-center gap-3 font-bold text-red-700 text-lg tracking-tight">
            <div className="p-2 bg-red-100 rounded-xl shadow-inner shrink-0">
              <Pill className="h-6 w-6 text-red-600" />
            </div>
            <span className="leading-tight">HERITAGE<br/>DRUG SHOP</span>
          </div>
        ) : (
          <div className="flex justify-center w-full text-red-700">
            <div className="p-2 bg-red-100 rounded-xl shadow-inner">
              <Pill className="h-6 w-6 text-red-600" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-3">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen?.(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-red-50 text-red-700 font-semibold shadow-sm border border-red-100" 
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm border border-transparent"
                )}
                title={collapsed ? link.name : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full"></div>
                )}
                <link.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-red-600" : "text-slate-400 group-hover:text-red-500")} />
                {!collapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200/50 bg-white/30 backdrop-blur-md">
        {!collapsed && (
          <div className="mb-4 px-3">
            <p className="text-sm font-bold text-slate-900 truncate">{profile?.name}</p>
            <p className="text-xs font-medium text-slate-500 truncate capitalize">{profile?.role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-100 transition-all font-medium",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
      </div>
    </>
  );
}
