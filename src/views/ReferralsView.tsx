import React, { useState } from 'react';
import { 
  Activity, Search, Filter, Calendar, MapPin, 
  User, CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  Stethoscope, FileText, ChevronRight, X, ShieldAlert 
} from 'lucide-react';
import { Referral, ReferralStatus, UserRole } from '../types/index.ts';
import { ReadinessBadge } from '../components/ReadinessBadge.tsx';
import { CareJourneyTimeline } from '../components/CareJourneyTimeline.tsx';

interface ReferralsViewProps {
  referrals: Referral[];
  currentRole: UserRole;
  selectedReferralId?: string | null;
  onSelectReferral: (id: string | null) => void;
  onTransitionStatus: (
    referralId: string, 
    toStatus: ReferralStatus, 
    remarks: string, 
    appointmentData?: any
  ) => Promise<void>;
  onOpenTriage: () => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({
  referrals,
  currentRole,
  selectedReferralId,
  onSelectReferral,
  onTransitionStatus,
  onOpenTriage,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transition Action Modal state
  const [actionModal, setActionModal] = useState<{
    type: 'ACCEPT' | 'SCHEDULE' | 'ARRIVE' | 'COMPLETE' | 'FOLLOWUP' | 'CLOSE';
    referral: Referral;
  } | null>(null);

  const [remarks, setRemarks] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('2026-10-02');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Shinde');
  const [department, setDepartment] = useState('Cardiology OPD');
  const [roomNumber, setRoomNumber] = useState('Room 204');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeReferral = referrals.find(r => r.id === selectedReferralId);

  const filteredReferrals = referrals.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter || (statusFilter === 'STALLED' && r.isStalled);
    const matchesSearch = 
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requiredService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.destinationFacilityId && r.destinationFacilityId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    setIsSubmitting(true);
    try {
      const ref = actionModal.referral;
      let targetStatus: ReferralStatus = 'ACCEPTED';
      let aptData: any = undefined;

      if (actionModal.type === 'ACCEPT') {
        targetStatus = 'ACCEPTED';
      } else if (actionModal.type === 'SCHEDULE') {
        targetStatus = 'APPOINTMENT_SCHEDULED';
        aptData = {
          appointmentDate,
          appointmentTime,
          doctorName,
          department,
          roomNumber,
          tokenNumber: Math.floor(10 + Math.random() * 25),
        };
      } else if (actionModal.type === 'ARRIVE') {
        targetStatus = 'PATIENT_ARRIVED';
      } else if (actionModal.type === 'COMPLETE') {
        targetStatus = 'SERVICE_COMPLETED';
      } else if (actionModal.type === 'FOLLOWUP') {
        targetStatus = 'FOLLOW_UP';
      } else if (actionModal.type === 'CLOSE') {
        targetStatus = 'CLOSED';
      }

      await onTransitionStatus(
        ref.id,
        targetStatus,
        remarks || `Transitioned to ${targetStatus}`,
        aptData
      );

      setActionModal(null);
      setRemarks('');
    } catch (err) {
      console.error('Transition error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>LIFECYCLE REFERRAL ENGINE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Referral Coordination &amp; Tracking
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end operational lifecycle with verified facility readiness, appointments, and care completion.
            </p>
          </div>

          {(currentRole === 'frontline_worker' || currentRole === 'phc_doctor') && (
            <button
              onClick={onOpenTriage}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Create New Referral</span>
            </button>
          )}
        </div>

        {/* Filter Pills & Search */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs font-medium scrollbar-none">
            {['ALL', 'CREATED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED', 'PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'STALLED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Referrals' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Pane Layout: List on Left, Active Care Journey Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Referral List (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 text-xs font-bold text-slate-700 flex justify-between items-center bg-slate-50/50">
            <span>Referrals ({filteredReferrals.length})</span>
            <span className="text-[11px] text-slate-400">Click to inspect care journey</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[750px]">
            {filteredReferrals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No referrals matching selected filter.
              </div>
            ) : (
              filteredReferrals.map((ref) => {
                const isSelected = activeReferral?.id === ref.id;
                return (
                  <div
                    key={ref.id}
                    onClick={() => onSelectReferral(ref.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? 'bg-sky-50/90 border-l-4 border-sky-600' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">{ref.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ref.urgency === 'Urgent' 
                              ? 'bg-rose-100 text-rose-800' 
                              : ref.urgency === 'Priority' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ref.urgency}
                          </span>
                          {ref.isStalled && (
                            <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
                              STALLED
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1">
                          {ref.requiredService}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Patient: <span className="font-semibold text-slate-700">{ref.patientId}</span> • {ref.distanceKm} km
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          To: <span className="font-medium text-slate-700">{ref.destinationFacilityId}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <ReadinessBadge score={ref.readinessScore} size="sm" showDetailsButton={false} />
                        <span className="text-[10px] font-mono text-slate-400">
                          {ref.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Referral Inspection & Action Workspace (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {activeReferral ? (
            <div className="space-y-6">
              {/* Care Journey Visual Stepper Component */}
              <CareJourneyTimeline
                currentStatus={activeReferral.status}
                events={activeReferral.events}
                urgency={activeReferral.urgency}
                isStalled={activeReferral.isStalled}
                stalledReason={activeReferral.stalledReason}
              />

              {/* Action Toolbar Based on Current Role & Status */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Lifecycle Transition Actions
                    </h4>
                    <div className="text-xs text-slate-800 font-medium mt-0.5">
                      Current Status: <span className="font-bold text-sky-700">{activeReferral.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Role: <span className="font-semibold capitalize">{currentRole.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Workflow Transition Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {/* Step 1: Receiving Facility Acceptance */}
                  {['CREATED', 'REVIEWED'].includes(activeReferral.status) && (
                    <button
                      onClick={() => setActionModal({ type: 'ACCEPT', referral: activeReferral })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Referral &amp; Verify Bed/Specialist</span>
                    </button>
                  )}

                  {/* Step 2: Schedule Appointment */}
                  {['ACCEPTED'].includes(activeReferral.status) && (
                    <button
                      onClick={() => setActionModal({ type: 'SCHEDULE', referral: activeReferral })}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Schedule OPD Appointment &amp; Token</span>
                    </button>
                  )}

                  {/* Step 3: Patient Arrived */}
                  {['APPOINTMENT_SCHEDULED', 'PATIENT_NOTIFIED'].includes(activeReferral.status) && (
                    <button
                      onClick={() => setActionModal({ type: 'ARRIVE', referral: activeReferral })}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Confirm Patient Arrival (OPD Desk)</span>
                    </button>
                  )}

                  {/* Step 4: Service Completed */}
                  {['PATIENT_ARRIVED'].includes(activeReferral.status) && (
                    <button
                      onClick={() => setActionModal({ type: 'COMPLETE', referral: activeReferral })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Record Service Completion (Discharge)</span>
                    </button>
                  )}

                  {/* Step 5: Follow-up & Close */}
                  {['SERVICE_COMPLETED'].includes(activeReferral.status) && (
                    <button
                      onClick={() => setActionModal({ type: 'CLOSE', referral: activeReferral })}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Close Care Pathway (Follow-up Verified)</span>
                    </button>
                  )}

                  {/* If Stalled */}
                  {activeReferral.isStalled && (
                    <button
                      onClick={() => setActionModal({ type: 'ARRIVE', referral: activeReferral })}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Resolve Stalled State (Register Patient Arrival)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Referral Clinical Details Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
                <h4 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                  Referral Parameters &amp; Clinical Summary
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Referring Doctor:</span>
                    <span className="font-bold text-slate-800">{activeReferral.referringDoctorName}</span>
                    <span className="text-slate-500 text-[11px] block">{activeReferral.sourceFacilityId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Receiving Facility:</span>
                    <span className="font-bold text-slate-800">{activeReferral.destinationFacilityId}</span>
                    <span className="text-slate-500 text-[11px] block">{activeReferral.distanceKm} km transit distance</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block font-medium">Clinical Summary:</span>
                  <p className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed font-normal">
                    {activeReferral.clinicalSummary}
                  </p>
                </div>

                {activeReferral.requiredDiagnostics && (
                  <div>
                    <span className="text-slate-500 block font-medium">Required Diagnostics:</span>
                    <span className="font-bold text-slate-800">{activeReferral.requiredDiagnostics}</span>
                  </div>
                )}

                {activeReferral.requiredMedicines && (
                  <div>
                    <span className="text-slate-500 block font-medium">Prescribed Medicines:</span>
                    <span className="font-bold text-slate-800">{activeReferral.requiredMedicines}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-xs text-slate-500">
              Select a referral from the list to view its complete closed-loop care journey.
            </div>
          )}
        </div>
      </div>

      {/* Transition Execution Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs relative">
            <button
              onClick={() => setActionModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {actionModal.type === 'ACCEPT' && 'Accept Referral at Facility'}
              {actionModal.type === 'SCHEDULE' && 'Schedule Hospital OPD Appointment'}
              {actionModal.type === 'ARRIVE' && 'Confirm Patient Arrival at Desk'}
              {actionModal.type === 'COMPLETE' && 'Mark Service & Consultation Completed'}
              {actionModal.type === 'CLOSE' && 'Complete & Close Care Pathway'}
            </h3>

            <form onSubmit={handleExecuteTransition} className="mt-4 space-y-4">
              {actionModal.type === 'SCHEDULE' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                      <input
                        type="text"
                        required
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Consulting Specialist *</label>
                    <input
                      type="text"
                      required
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">OPD Room</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Remarks / Clinical Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter remarks recorded to closed-loop audit history..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl shadow transition-all"
                >
                  {isSubmitting ? 'Recording Transition...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
