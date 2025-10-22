'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderKanban,
  Laptop,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Ticket,
  BookOpen
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['admin'] },
  { name: 'Users', href: '/users', icon: UserCog, roles: ['admin'] },
  { name: 'Projects', href: '/projects', icon: FolderKanban, roles: ['admin'] },
  { name: 'Assets', href: '/assets', icon: Laptop, roles: ['admin'] },
  { name: 'Tickets', href: '/tickets', icon: Ticket, roles: ['admin', 'employee'] },
  { name: 'Knowledge Base', href: '/tickets/knowledge', icon: BookOpen, roles: ['admin', 'employee'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'My Dashboard', href: '/employee-dashboard', icon: LayoutDashboard, roles: ['employee'] },
  { name: 'My Projects', href: '/my-projects', icon: FolderKanban, roles: ['employee'] },
  { name: 'My Assets', href: '/my-assets', icon: Laptop, roles: ['employee'] },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background shadow-md"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "sidebar-container bg-card shadow-lg",
        isOpen && "open"
      )}>
        <div className="flex flex-col h-screen lg:h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-border">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="ml-2 text-xl font-bold text-foreground">Corporate MIS</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-border p-4">
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center w-full justify-start px-3 py-2 text-sm"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
