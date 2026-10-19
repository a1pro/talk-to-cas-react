import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CompactLogo } from "@/components/CompactLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MENU_GROUPS_BY_ROLE, findActiveMenuItem, type RoleKey } from "@/lib/workspace";

// Simplified icon components using Heroicons style
const Icons = {
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Merchants: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Venues: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Vouchers: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Create: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Theme: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Reports: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const getIconForItem = (label: string) => {
  const normalized = label.toLowerCase();

  if (normalized.includes('merchant')) return <Icons.Merchants />;
  if (normalized.includes('venue') || normalized.includes('address')) return <Icons.Venues />;
  if (normalized.includes('voucher') || normalized.includes('record') || normalized.includes('download')) return <Icons.Vouchers />;
  if (normalized.includes('upload') || normalized.includes('create')) return <Icons.Create />;
  if (normalized.includes('user')) return <Icons.Users />;
  if (normalized.includes('setting') || normalized.includes('integration') || normalized.includes('whatsapp') || normalized.includes('information')) return <Icons.Settings />;
  if (normalized.includes('finance') || normalized.includes('report') || normalized.includes('offer') || normalized.includes('launch')) return <Icons.Reports />;
  if (normalized.includes('dashboard') || normalized.includes('overview')) return <Icons.Dashboard />;

  return null;
};

// Type definition for menu items that can have children
interface MenuItem {
  path: string;
  label: string;
  description?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = (user?.primary_role || "user") as RoleKey;
  const menuGroups = MENU_GROUPS_BY_ROLE[role] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  const activeMenuItem = useMemo(
    () => findActiveMenuItem(role, location.pathname),
    [location.pathname, role]
  );

  // Auto-expand groups that contain the active menu item
  useEffect(() => {
    const newOpenGroups = { ...openGroups };
    let hasChanges = false;

    menuGroups.forEach((group) => {
      const hasActiveItem = group.items.some(item => activeMenuItem?.path === item.path);
      if (hasActiveItem && !openGroups[group.label]) {
        newOpenGroups[group.label] = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setOpenGroups(newOpenGroups);
    }
  }, [activeMenuItem, menuGroups]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  const workspaceLabel = `${role.charAt(0).toUpperCase()}${role.slice(1)} Workspace`;
  const productLabel = role === "admin" ? "CAS Admin" : role === "merchant" ? "CAS Merchant" : "CAS";
  const pageKicker = activeMenuItem ? `${workspaceLabel} / ${activeMenuItem.label}` : workspaceLabel;

  // Group items by their logical categories (Merchants, Venues, Users, Vouchers, etc.)
  const categorizeItems = (items: MenuItem[]): Record<string, MenuItem[]> => {
    const categories: Record<string, MenuItem[]> = {
      'Overview': [],
      'Merchants': [],
      'Venues': [],
      'Users': [],
      'Vouchers': [],
      'Reports': [],
      'Settings': [],
    };

    items.forEach(item => {
      const label = item.label.toLowerCase();

      if (label.includes('dashboard') || label.includes('overview')) {
        categories['Overview'].push(item);
      } else if (label.includes('merchant')) {
        categories['Merchants'].push(item);
      } else if (label.includes('venue') || label.includes('address')) {
        categories['Venues'].push(item);
      } else if (label.includes('user')) {
        categories['Users'].push(item);
      } else if (label.includes('voucher') || label.includes('record') || label.includes('download')) {
        categories['Vouchers'].push(item);
      } else if (label.includes('finance') || label.includes('report') || label.includes('offer') || label.includes('launch')) {
        categories['Reports'].push(item);
      } else if (label.includes('setting') || label.includes('integration') || label.includes('whatsapp') || label.includes('information')) {
        categories['Settings'].push(item);
      }
    });

    // 🔥 Force order (Overview always top)
    const orderedKeys = [
      'Overview',
      'Merchants',
      'Venues',
      'Users',
      'Vouchers',
      'Reports',
      'Settings'
    ];

    return Object.fromEntries(
      orderedKeys
        .map(key => [key, categories[key]])
        .filter(([_, items]) => items.length > 0)
    );
  };

  // Transform menu groups into categorized dropdowns
  const categorizedGroups = useMemo(() => {
    const allItems = menuGroups.flatMap(group => group.items);
    return categorizeItems(allItems);
  }, [menuGroups]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Fixed height with internal scroll */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col transition-transform duration-300 ease-in-out z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        {/* Brand Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CompactLogo className="w-8 h-8" />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {productLabel}
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || user?.phone || "No contact"}
              </p>
            </div>
          </div>
          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
            {workspaceLabel}
          </span>
        </div>

        {/* Navigation with Scroll - Only this section scrolls */}
        <nav className="flex-1 overflow-y-auto min-h-0 py-4 px-3">
          <div className="space-y-4">
            {Object.entries(categorizedGroups).map(([category, items], idx) => {
              const isOpen = openGroups[category];
              const categoryIcon = getIconForItem(category);
              
              return (
                <div key={category}>
                  {/* Dropdown Header */}
                  <button
                    onClick={() => toggleGroup(category)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200 ease-in-out
                      hover:bg-gray-50 dark:hover:bg-gray-700/50
                      text-gray-700 dark:text-gray-300
                    `}
                  >
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                      {categoryIcon || <Icons.Dashboard />}
                    </span>
                    <span className="flex-1 text-left">{category}</span>
                    <span className="flex-shrink-0 text-gray-400">
                      {isOpen ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                    </span>
                  </button>

                  {/* Dropdown Items */}
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                      {items.map((item) => {
                        const isActive = activeMenuItem?.path === item.path;
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`
                              group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                              transition-all duration-200 ease-in-out
                              ${isActive 
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }
                            `}
                          >
                            <span className={`
                              flex-shrink-0 w-5 h-5 transition-colors duration-200
                              ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
                            `}>
                              {/* Small dot for sub-items */}
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-1.5 h-1.5 mt-2">
                                <circle cx="12" cy="12" r="6" />
                              </svg>
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="block truncate">{item.label}</span>
                              {item.description && (
                                <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <span className="w-1 h-6 bg-indigo-500 rounded-full flex-shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions - Fixed */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <Icons.Theme />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
            </div>
            <ThemeToggle />
          </div>
          
          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Icons.Logout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Full height with internal scroll */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header - Fixed */}
        <header className="flex-shrink-0 sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{pageKicker}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}