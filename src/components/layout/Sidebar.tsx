import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Boxes,
  Calculator,
  Settings,
  Smartphone,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Sparkles,
  Headphones,
  LogOut,
} from 'lucide-react';
import { MaintenanceTicket, Product, UserRole, StoreInfo } from '../../types';

export type NavTab = 'dashboard' | 'pos' | 'maintenance' | 'inventory' | 'accounting' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  maintenanceTickets: MaintenanceTicket[];
  products: Product[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentRole?: UserRole;
  onOpenRoleModal?: () => void;
  onOpenSupport?: () => void;
  onLockSession?: () => void;
  storeInfo?: StoreInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  maintenanceTickets,
  products,
  isOpenMobile,
  onCloseMobile,
  currentRole = 'admin',
  onOpenRoleModal,
  onOpenSupport,
  onLockSession,
  storeInfo,
}) => {
  // Count active repair devices
  const activeRepairsCount = maintenanceTickets.filter(
    (t) => t.status !== 'delivered' && t.status !== 'cancelled'
  ).length;

  // Count low stock items
  const lowStockCount = products.filter(
    (p) => p.quantity <= p.minAlertQuantity
  ).length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'لوحة التحكم',
      description: 'نظرة عامة وإحصائيات',
      icon: LayoutDashboard,
    },
    {
      id: 'pos' as NavTab,
      label: 'نقطة البيع والشراء',
      description: 'كاشير وشراء مستعمل',
      icon: ShoppingCart,
    },
    {
      id: 'maintenance' as NavTab,
      label: 'قسم الصيانة والإصلاح',
      description: 'كروت الأجهزة والورشة',
      icon: Wrench,
      badge: activeRepairsCount > 0 ? activeRepairsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inventory' as NavTab,
      label: 'المخزون وقطع الغيار',
      description: 'الأجهزة والشاشات والقطع',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'accounting' as NavTab,
      label: 'المحاسبة والصناديق',
      description: 'الخزائن، المصارفة، السندات',
      icon: Calculator,
    },
    {
      id: 'settings' as NavTab,
      label: 'الإعدادات وأسعار الصرف',
      description: 'العملات والنسخ الاحتياطي',
      icon: Settings,
    },
  ];

  // Filter nav items strictly by role
  const filteredNavItems = navItems.filter((item) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'cashier') {
      return item.id === 'pos' || item.id === 'maintenance' || item.id === 'inventory';
    }
    if (currentRole === 'technician') {
      return item.id === 'maintenance' || item.id === 'inventory';
    }
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 right-0 h-full w-72 bg-slate-900 text-slate-200 z-50 flex flex-col border-l border-slate-800 transition-transform duration-300 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Smartphone className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-tight leading-none flex items-center gap-1.5 truncate max-w-[170px]" title={storeInfo?.name || 'المتجر'}>
                {storeInfo?.name || (storeInfo?.storeId && storeInfo.storeId !== 'store-shamiri-01' ? 'جاري التحميل...' : 'الشميري فون')}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate max-w-[170px]" title={storeInfo?.subtitle || 'إدارة الجوالات والصيانة'}>
                {storeInfo?.subtitle || 'إدارة الجوالات والصيانة متعددة العملات'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={onOpenRoleModal}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all hover:scale-105 ${
                    currentRole === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                      : currentRole === 'cashier'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                  title="اضغط لتغيير الصلاحية أو تسجيل خروج"
                >
                  <span>
                    {currentRole === 'admin'
                      ? '🛡️ مدير المحل'
                      : currentRole === 'cashier'
                      ? '💵 كاشير المبيعات'
                      : '🔧 فني الصيانة'}
                  </span>
                  <span className="text-[8px] opacity-75">▼</span>
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full text-right flex items-center justify-between p-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-snug">{item.label}</div>
                    <div
                      className={`text-[11px] ${
                        isActive ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Highlights Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 m-3 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              جاهزية الورشة
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {activeRepairsCount} قيد الصيانة
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, activeRepairsCount * 25)}%`,
              }}
            />
          </div>

          {lowStockCount > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-rose-400">
              <span className="flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                نواقص المخزون
              </span>
              <span className="font-bold">{lowStockCount} صنف</span>
            </div>
          )}

          {/* Support & Logout Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5">
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 transition-all"
                title="الدعم الفني والصيانة المباشرة (773419308)"
              >
                <Headphones className="w-3 h-3 text-indigo-400" />
                <span>الدعم الفني</span>
              </button>
            )}

            {onLockSession && (
              <button
                type="button"
                onClick={onLockSession}
                className="py-1.5 px-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 rounded-xl text-[10px] flex items-center gap-1 transition-all"
                title="تسجيل الخروج وقفل الشاشة"
              >
                <LogOut className="w-3 h-3" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
