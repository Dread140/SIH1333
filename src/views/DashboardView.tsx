import React from 'react';
import { 
  Users, Activity, CheckCircle2, Clock, 
  AlertTriangle, ShieldAlert, ArrowUpRight, Plus, 
  Search, Stethoscope, ChevronRight, Hospital, Calendar
} from 'lucide-react';
import { UserRole, Referral, Facility } from '../types/index.ts';
import { ReadinessBadge } from '../components/ReadinessBadge.tsx';

interface DashboardViewProps {
  currentRole: UserRole;
  referrals: Referral[];
  facilities: Facility[];
  analytics: any;
  onOpenTriage: () => void;
  onOpenRegister: () => void;
  onSelectReferral: (referralId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentRole,
  referrals,
  facilities,
  analytics,
  onOpenTriage,
  onOpenRegister,
  onSelectReferral,
  onNavigateTab,
}) => {
  const kpis = analytics?.kpis || {
    totalPatients: 6,
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter(r => r.status === 'SERVICE_COMPLETED' || r.status === 'CLOSED').length,
    pendingReferrals: referrals.filter(r => ['CREATED', 'REVIEWED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED'].includes(r.status)).length,
    stalledReferrals: referrals.filter(r => r.isStalled || r.status === 'STALLED').length,
    completionRate: 85,
    followupRate: 92,
    avgTurnaroundHours: 28,
  };

  const stalledReferrals = referrals.filter(r => r.isStalled || r.status === 'STALLED');
  const recentReferrals = referrals.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-sky-900/60 text-sky-300 text-xs font-semibold border border-sky-700/50 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>CARE COORDINATION &amp; REFERRAL INTELLIGENCE</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Facility-Readiness-Aware Closed-Loop Referral Operations
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Verifying specialist duty rosters, diagnostic equipment uptime, and pharmacy inventory before patient dispatch to eliminate non-actionable journeys.
            </p>
          </div>

          {/* Quick Action Buttons according to role */}
          <div className="flex flex-wrap items-center gap-2.5">
            {(currentRole === 'frontline_worker' || currentRole === 'phc_doctor') && (
              <>
                <button
                  onClick={onOpenRegister}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Patient</span>
                </button>
                <button
                  onClick={onOpenTriage}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Assisted Triage &amp; Referral</span>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigateTab('readiness')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <Hospital className="w-4 h-4 text-sky-400" />
              <span>Check Facility Readiness</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Referrals</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalReferrals}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 7 network centers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Completed Care</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{kpis.completedReferrals}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {kpis.completionRate}% completion rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-2">{kpis.pendingReferrals}</div>
          <div className="text-[11px] text-slate-500 mt-1">Under facility coordination</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${stalledReferrals.length > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Requires Follow-up</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{kpis.stalledReferrals}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            Stalled &gt;48 hrs
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Turnaround</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.avgTurnaroundHours}h</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Within standard protocol</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Follow-up Rate</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">{kpis.followupRate}%</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">ASHA verified home visits</div>
        </div>
      </div>

      {/* Critical Alert: Stalled Referrals Queue Banner */}
      {stalledReferrals.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-rose-900">
                    Priority Escalation: {stalledReferrals.length} Stalled Referral Requires Community Follow-up
                  </h3>
                  <span className="text-[11px] bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1 max-w-3xl leading-relaxed">
                  Referral <span className="font-mono font-bold">{stalledReferrals[0].id}</span> (Patient: {stalledReferrals[0].patientId}) has exceeded the 48-hour scheduled arrival threshold at destination facility. Immediate frontline worker follow-up is assigned.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('followups')}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all whitespace-nowrap self-start sm:self-auto flex items-center space-x-1.5"
            >
              <span>Open Follow-up Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout: Active Care Pathways & Network Facility Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Care Pathways (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Care Pathways</h3>
              <p className="text-xs text-slate-500">Live patient referrals tracked through closed-loop lifecycle</p>
            </div>
            <button
              onClick={() => onNavigateTab('referrals')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
            >
              <span>View All ({referrals.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentReferrals.map((ref) => {
              const statusColors: Record<string, string> = {
                CREATED: 'bg-slate-100 text-slate-700',
                REVIEWED: 'bg-blue-50 text-blue-700',
                ACCEPTED: 'bg-sky-100 text-sky-800',
                APPOINTMENT_SCHEDULED: 'bg-indigo-100 text-indigo-800',
                PATIENT_ARRIVED: 'bg-amber-100 text-amber-800',
                SERVICE_COMPLETED: 'bg-emerald-100 text-emerald-800',
                CLOSED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                STALLED: 'bg-rose-100 text-rose-800 font-bold animate-pulse',
              };

              return (
                <div
                  key={ref.id}
                  onClick={() => onSelectReferral(ref.id)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border border-sky-100">
                      REF
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{ref.id}</span>
                        <span className="text-xs font-medium text-slate-600">• {ref.patientId}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[ref.status] || 'bg-slate-100 text-slate-700'}`}>
                          {ref.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {ref.requiredService}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span>From: {ref.sourceFacilityId}</span>
                        <span>➔</span>
                        <span className="font-medium text-slate-700">To: {ref.destinationFacilityId}</span>
                        <span>•</span>
                        <span>{ref.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:self-center">
                    <ReadinessBadge score={ref.readinessScore} breakdownJson={ref.readinessBreakdownJson} size="sm" />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Facility Readiness Snapshot (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hospital Network Readiness</h3>
              <p className="text-xs text-slate-500">Live capacity &amp; service readiness</p>
            </div>
            <button
              onClick={() => onNavigateTab('readiness')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Compare
            </button>
          </div>

          <div className="space-y-3">
            {facilities.map((fac) => {
              const occupancy = fac.totalBeds > 0 ? Math.round((fac.occupiedBeds / fac.totalBeds) * 100) : 50;
              return (
                <div key={fac.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{fac.name}</div>
                      <div className="text-[11px] text-slate-500">{fac.type} • {fac.taluka}, {fac.district}</div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                      {fac.id}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Bed Occupancy</span>
                      <span className="font-semibold">{fac.occupiedBeds} / {fac.totalBeds} ({occupancy}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${occupancy > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-700 font-medium">✓ Emergency 24x7</span>
                    <span>Ambulance: {fac.ambulanceAvailable ? 'Available' : 'En route'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
