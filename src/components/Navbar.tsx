import React, { useState } from 'react';
import { 
  Activity, Users, ShieldCheck, Hospital, 
  Wifi, WifiOff, RefreshCw, Bell, Globe, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';
import { UserRole, Notification } from '../types/index.ts';
import { Language, translations } from '../lib/i18n.ts';
import { CurrentSession, PRESET_USERS, setSession } from '../lib/api.ts';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  queuedCount: number;
  notifications: Notification[];
  onMarkNotificationRead: (id: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  lang,
  onLangChange,
  isOnline,
  onToggleOnline,
  isSyncing,
  onTriggerSync,
  queuedCount,
  notifications,
  onMarkNotificationRead,
  activeTab,
  onTabChange,
}) => {
  const t = translations[lang];
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = PRESET_USERS[currentRole];
  const unreadNotifications = notifications.filter(n => !n.isRead);

  const roleLabels: Record<UserRole, { title: string; subtitle: string; icon: string }> = {
    frontline_worker: {
      title: 'Sunita Shinde',
      subtitle: 'ASHA Facilitator (Shirwal)',
      icon: '👩‍⚕️',
    },
    phc_doctor: {
      title: 'Dr. Rajesh Kulkarni',
      subtitle: 'Medical Officer (PHC Shirwal)',
      icon: '🩺',
    },
    facility_officer: {
      title: 'Dr. Smita Deshmukh',
      subtitle: 'Referral Officer (DH Aundh)',
      icon: '🏥',
    },
    district_admin: {
      title: 'Dr. Anand Gaikwad',
      subtitle: 'District Health Officer (Pune)',
      icon: '🏛️',
    },
    patient: {
      title: 'Anusaya G. Jadhav',
      subtitle: 'Patient (ABHA: 91-8472-1094)',
      icon: '👤',
    },
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, roles: ['frontline_worker', 'phc_doctor', 'facility_officer', 'district_admin'] },
    { id: 'patients', label: t.patients, roles: ['frontline_worker', 'phc_doctor'] },
    { id: 'readiness', label: t.facilityReadiness, roles: ['frontline_worker', 'phc_doctor', 'facility_officer', 'district_admin'] },
    { id: 'referrals', label: t.referrals, roles: ['frontline_worker', 'phc_doctor', 'facility_officer', 'district_admin'] },
    { id: 'followups', label: `${t.followupsQueue} (Alerts)`, roles: ['frontline_worker', 'phc_doctor', 'district_admin'], badge: true },
    { id: 'inventory', label: t.diagnostics + ' & ' + t.medicines, roles: ['phc_doctor', 'facility_officer', 'district_admin'] },
    { id: 'analytics', label: t.analytics, roles: ['district_admin', 'facility_officer'] },
    { id: 'risk_engine', label: t.aiRiskEngine, roles: ['phc_doctor', 'facility_officer', 'district_admin'] },
    { id: 'interoperability', label: t.interoperability, roles: ['district_admin', 'facility_officer'] },
    { id: 'patient_portal', label: 'My Care Journey', roles: ['patient'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Government Platform Indicator Bar */}
      <div className="bg-slate-950 px-4 py-1 text-xs border-b border-slate-800 flex justify-between items-center text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center space-x-1.5 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PUBLIC HEALTHCARE REFERRAL NETWORK</span>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">Facility-Readiness-Aware Closed-Loop Coordination (CareLoop)</span>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="hidden lg:inline text-slate-400">Interoperability-Ready (ABDM / FHIR)</span>
        </div>

        {/* Offline / Online Field Mode Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleOnline}
            title="Toggle between online and field offline sync mode"
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs transition-colors font-medium ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900' 
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/60 hover:bg-amber-900'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online (Live Cloud SQL)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Mode (Offline Queue: {queuedCount})</span>
              </>
            )}
          </button>

          {queuedCount > 0 && isOnline && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {queuedCount}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
            >
              <Globe className="w-3 h-3 text-slate-400" />
              <span>{lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-28 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onLangChange('mr'); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                >
                  मराठी
                </button>
                <button
                  onClick={() => { onLangChange('hi'); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => { onLangChange('en'); setShowLangMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200"
                >
                  English
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main App Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange(currentRole === 'patient' ? 'patient_portal' : 'dashboard')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{t.appName}</h1>
              <span className="text-xs bg-sky-950 text-sky-300 font-semibold px-2 py-0.5 rounded border border-sky-800">
                CareLoop
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.subtagline}
            </p>
          </div>
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-200">Alerts & System Notifications</span>
                  <span className="text-[11px] text-slate-400">{unreadNotifications.length} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No active notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-3 cursor-pointer hover:bg-slate-800/80 transition-colors ${!n.isRead ? 'bg-sky-950/30' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
                        </div>
                        <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors text-left"
            >
              <span className="text-lg">{roleLabels[currentRole].icon}</span>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-100">{roleLabels[currentRole].title}</div>
                <div className="text-[10px] text-sky-400 font-medium">{roleLabels[currentRole].subtitle}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Role
                </div>
                {(Object.keys(PRESET_USERS) as UserRole[]).map(roleKey => {
                  const item = roleLabels[roleKey];
                  const isSelected = currentRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      onClick={() => {
                        onRoleChange(roleKey);
                        setSession(PRESET_USERS[roleKey]);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 transition-colors ${
                        isSelected ? 'bg-sky-950/80 text-sky-300 font-medium' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-100">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 overflow-x-auto text-xs font-medium border-t border-slate-800/80 scrollbar-none py-1">
        {visibleNavItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-2 rounded-md whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
