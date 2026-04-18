'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, Suspense } from 'react';
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
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
      ],
    },
    {
      title: 'Mon suivi',
      items: [
        { name: 'Mes rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Mes visites', href: '/visits', icon: TruckIcon },
        { name: 'Mon dossier', href: '/records', icon: FileIcon },
        { name: 'Mes documents', href: '/documents', icon: InboxIcon },
        { name: 'Evaluations', href: '/evaluations', icon: ClipboardIcon },
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
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
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
        { name: 'Dossiers medicaux', href: '/records', icon: FileIcon },
      ],
    },
  ],
  medecin: [
    {
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients',
      items: [
        { name: 'Liste patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Medical',
      items: [
        { name: 'Evaluations', href: '/evaluations', icon: ClipboardIcon },
        { name: 'Dossiers', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
  ],
  chef_cabinet: [
    {
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients',
      items: [
        { name: 'Liste patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Medical',
      items: [
        { name: 'Evaluations', href: '/evaluations', icon: ClipboardIcon },
        { name: 'Dossiers', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
        { name: 'Administration', href: '/admin', icon: SettingsIcon },
      ],
    },
  ],
  admin: [
    {
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Patients',
      items: [
        { name: 'Liste patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Medical',
      items: [
        { name: 'Evaluations', href: '/evaluations', icon: ClipboardIcon },
        { name: 'Dossiers', href: '/records', icon: FileIcon },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Utilisateurs', href: '/admin', icon: SettingsIcon },
        { name: 'Roles', href: '/admin', icon: ShieldIcon, query: 'roles' },
        { name: 'Profils', href: '/admin', icon: BriefcaseIcon, query: 'profiles' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'Menu',
      items: [
        { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
        { name: 'Demandes RDV', href: '/demandes', icon: RequestIcon },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { name: 'Utilisateurs', href: '/admin', icon: UsersIcon },
      ],
    },
    {
      title: 'Patients',
      items: [
        { name: 'Liste patients', href: '/patients', icon: UsersIcon },
        { name: 'Rendez-vous', href: '/appointments', icon: CalendarIcon },
        { name: 'Visites domicile', href: '/visits', icon: TruckIcon },
      ],
    },
    {
      title: 'Medical',
      items: [
        { name: 'Evaluations', href: '/evaluations', icon: ClipboardIcon },
      ],
    },
    {
      title: 'Finance',
      items: [
        { name: 'Factures', href: '/invoices', icon: CreditCardIcon },
        { name: 'Rapports', href: '/reports', icon: ChartIcon },
      ],
    },
    {
      title: 'Administration',
      items: [
        { name: 'Parametres', href: '/admin', icon: SettingsIcon },
        { name: 'Roles', href: '/admin', icon: ShieldIcon, query: 'roles' },
        { name: 'Profils', href: '/admin', icon: BriefcaseIcon, query: 'profiles' },
      ],
    },
  ],
};

export function Sidebar() {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-accent animate-pulse" />
        <div className="ml-3 h-4 w-20 bg-sidebar-accent rounded animate-pulse" />
      </div>
      <div className="flex-1 p-4 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 bg-sidebar-accent rounded animate-pulse" />
            <div className="space-y-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-9 bg-sidebar-accent rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (user && ['chef_cabinet', 'admin', 'super_admin', 'medecin'].includes(user.role)) {
      setPendingCount(db.getPendingRequestsCount());
    }
  }, [user]);

  useEffect(() => {
    // Auto-expand section containing current page
    if (user) {
      const navSections = navigation[user.role] || navigation.patient;
      const activeSection = navSections.find(section =>
        section.items.some(item => {
          if (item.href === '/admin') {
            const itemQuery = (item as any).query;
            return pathname === item.href && currentTab === (itemQuery || null);
          }
          return pathname === item.href || pathname.startsWith(item.href + '/');
        })
      );
      if (activeSection && !expandedSections.includes(activeSection.title)) {
        setExpandedSections(prev => [...prev, activeSection.title]);
      }
    }
  }, [pathname, currentTab, user]);

  if (!user) return null;

  const navSections = navigation[user.role] || navigation.patient;

  const getHref = (href: string, query?: string) => {
    if (query) {
      return `${href}?tab=${query}`;
    }
    return href;
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const roleLabels: Record<string, string> = {
    patient: 'Patient',
    medecin: 'Medecin',
    agent_terrain: 'Agent terrain',
    chef_cabinet: 'Chef de Cabinet',
    admin: 'Administrateur',
    super_admin: 'Super Admin',
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-20 px-4 flex items-center border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center justify-center w-full group">
          <img 
            src="/logo.png" 
            alt="SEVEN Cabinet" 
            className="h-14 w-auto object-contain group-hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {navSections.map((section, sectionIdx) => {
          const isExpanded = expandedSections.includes(section.title);
          const hasActiveItem = section.items.some(item => {
            if (item.href === '/dashboard') return pathname === item.href;
            if (item.href === '/admin') {
              const itemQuery = (item as any).query;
              return pathname === item.href && currentTab === (itemQuery || null);
            }
            return pathname === item.href || pathname.startsWith(item.href + '/');
          });

          return (
            <div key={section.title} className="mb-1">
              <button
                onClick={() => toggleSection(section.title)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-lg transition-colors
                  ${hasActiveItem ? 'text-primary' : 'text-sidebar-muted hover:text-sidebar-foreground'}
                `}
              >
                <span>{section.title}</span>
                <ChevronIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`
                overflow-hidden transition-all duration-200 ease-out
                ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
              `}>
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const itemQuery = (item as any).query;
                    const href = getHref(item.href, itemQuery);
                    
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
                        key={item.name + (itemQuery || '')}
                        href={href}
                        className={`
                          group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                          }
                        `}
                      >
                        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? '' : 'opacity-60 group-hover:opacity-100'}`} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.href === '/demandes' && pendingCount > 0 && (
                          <span className={`
                            min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center
                            ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-amber-500 text-white'}
                          `}>
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Profile & Settings */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <Link
          href="/settings"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
            ${pathname === '/settings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }
          `}
        >
          <SettingsIcon className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Parametres</span>
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-sidebar-muted truncate">
              {roleLabels[user.role]}
            </p>
          </div>
        </div>
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

  const notifTypeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm w-64 cursor-pointer hover:bg-muted transition-colors">
        <SearchIcon className="w-4 h-4" />
        <span>Rechercher...</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <BellIcon className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 z-40 w-80 bg-popover rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-popover-foreground text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Aucune notification</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          db.markNotificationAsRead(n.id);
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
                          setUnreadCount(prev => Math.max(0, prev - 1));
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${notifTypeColors[n.type] || 'bg-muted text-muted-foreground'}`}>
                          {n.type === 'info' ? 'i' : n.type === 'success' ? '!' : n.type === 'warning' ? '!' : '!'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Se deconnecter"
        >
          <LogoutIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
    </svg>
  );
}

function RequestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}
