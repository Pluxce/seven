'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, Suspense } from 'react';
import { Avatar, Badge } from '@/components/ui';
import { db } from '@/lib/db';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: Record<string, NavSection[]> = {
  patient: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      ],
    },
    {
      title: 'Mon suivi',
      items: [
        { name: 'Mes rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Mes visites', href: '/visits', icon: TruckIcon },
        { name: 'Mon dossier', href: '/records', icon: FileIcon },
        { name: 'Mes documents', href: '/documents', icon: InboxIcon },
        { name: 'Évaluations', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { name: 'Mes factures', href: '/invoices', icon: CreditCardIcon },
      ],
    },
  ],
  agent_terrain: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      ],
    },
    {
      title: 'Travail terrain',
      items: [
        { name: 'Mes visites', href: '/visits', icon: TruckIcon },
        { name: 'Patients', href: '/patients', icon: UsersIcon },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { name: 'Dossiers médicaux', href: '/records', icon: FileIcon },
      ],
    },
  ],
  medecin: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients & Consultations',
      items: [
        { name: 'Patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites à domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Évaluations',
      items: [
        { name: 'Évaluations gériatriques', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { name: 'Dossiers médicaux', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
      ],
    },
    {
      title: 'Analyse',
      items: [
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
  ],
  chef_cabinet: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients & Consultations',
      items: [
        { name: 'Patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites à domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Évaluations',
      items: [
        { name: 'Évaluations gériatriques', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { name: 'Dossiers médicaux', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Analyse',
      items: [
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Administration', href: '/admin', icon: SettingsIcon },
      ],
    },
  ],
  admin: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients & Consultations',
      items: [
        { name: 'Patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites à domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Évaluations',
      items: [
        { name: 'Évaluations gériatriques', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { name: 'Dossiers médicaux', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Analyse',
      items: [
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Gestion utilisateurs', href: '/admin', icon: SettingsIcon },
        { name: 'Rôles & Permissions', href: '/admin', icon: ShieldIcon, query: 'roles' },
        { name: 'Profils & Postes', href: '/admin', icon: BriefcaseIcon, query: 'profiles' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Structure',
      items: [
        { name: 'Cabinets', href: '/cabinets', icon: BuildingIcon },
        { name: 'Utilisateurs', href: '/admin', icon: UsersIcon },
      ],
    },
    {
      title: 'Patients & Consultations',
      items: [
        { name: 'Patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites à domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Évaluations',
      items: [
        { name: 'Évaluations gériatriques', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Analyse',
      items: [
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
    {
      title: 'Facturation',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Gestion utilisateurs', href: '/admin', icon: SettingsIcon },
        { name: 'Rôles & Permissions', href: '/admin', icon: ShieldIcon, query: 'roles' },
        { name: 'Profils & Postes', href: '/admin', icon: BriefcaseIcon, query: 'profiles' },
      ],
    },
  ],
};

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-40" />}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user && ['chef_cabinet', 'admin', 'super_admin', 'medecin'].includes(user.role)) {
      setPendingCount(db.getPendingRequestsCount());
    }
  }, [user]);

  if (!user) return null;

  const navSections = navigation[user.role] || navigation.patient;

  const getHref = (href: string, query?: string) => {
    if (query) {
      return `${href}?tab=${query}`;
    }
    return href;
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-40">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center">
            <span className="text-white dark:text-zinc-900 font-bold text-xl">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-none">SEVEN</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-0.5">Centre Médical</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-8 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const itemQuery = (item as any).query;
                const href = getHref(item.href, itemQuery);
                
                // Detailed check for active state
                const isExactPath = pathname === item.href;
                const isTabMatch = currentTab === (itemQuery || null);
                
                let isActive = false;
                if (item.href === '/dashboard') {
                  isActive = isExactPath;
                } else if (item.href === '/admin') {
                  isActive = isExactPath && isTabMatch;
                } else {
                  isActive = isExactPath || (pathname.startsWith(item.href + '/'));
                }
                
                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200 dark:bg-white dark:text-zinc-900 dark:shadow-none'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 transition-colors ${isActive ? '' : 'group-hover:text-zinc-900 dark:group-hover:text-white'}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.href === '/demandes' && pendingCount > 0 && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${isActive ? 'bg-white text-zinc-900' : 'bg-amber-500 text-white'}
                      `}>
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
        <Link
          href="/settings"
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
            ${pathname === '/settings'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
            }
          `}
        >
          <SettingsIcon className="h-5 w-5" />
          Paramètres
        </Link>
      </div>
    </aside>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const notifs = db.getNotifications(user.id);
      setNotifications(notifs.slice(0, 8));
      setUnreadCount(db.getUnreadCount(user.id));
    }
  }, [user]);

  const markAllRead = () => {
    if (!user) return;
    db.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    patient: 'Patient',
    medecin: 'Médecin',
    agent_terrain: 'Agent de terrain',
    chef_cabinet: 'Chef de Cabinet',
    admin: 'Administrateur',
    super_admin: 'Super Admin',
  };

  const notifTypeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 relative">
      {/* Left: search placeholder */}
      <div className="flex items-center gap-3 text-zinc-400 text-sm hidden sm:flex">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Recherche rapide...</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <BellIcon className="h-5 w-5 text-zinc-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 z-40 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400">Aucune notification</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onClick={() => {
                          db.markNotificationAsRead(n.id);
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                          setUnreadCount(prev => Math.max(0, prev - 1));
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${notifTypeColors[n.type] || 'bg-zinc-100 text-zinc-600'}`}>
                          {n.type === 'info' ? 'ℹ' : n.type === 'success' ? '✓' : n.type === 'warning' ? '⚠' : '!'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.isRead ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{n.message}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User info */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {roleLabels[user.role]}
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Se déconnecter"
        >
          <LogoutIcon className="h-5 w-5 text-zinc-500" />
        </button>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="pl-72">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M8 17h8M8 17v-6a2 2 0 00-2-2h-1.5a1.5 1.5 0 01-1.5-1.5V6a3 3 0 00-3-3H5a3 3 0 00-3 3v6m3 0v6m0 0h6m-6 0H5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path d="M3 17h2.5a2.5 2.5 0 100-5H3v5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function RequestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
