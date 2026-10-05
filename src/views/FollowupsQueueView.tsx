import React, { useState } from 'react';
import { 
  ShieldAlert, Clock, AlertTriangle, UserCheck, 
  MapPin, Phone, CheckCircle2, Stethoscope, X, ArrowRight, UserPlus 
} from 'lucide-react';
import { Followup, UserRole } from '../types/index.ts';

interface FollowupsQueueViewProps {
  followups: Followup[];
  currentRole: UserRole;
  onRecordAction: (
    followupId: number, 
    actionTaken: string, 
    notes: string, 
    status: 'In Progress' | 'Contacted' | 'Completed', 
    nextAction?: string
  ) => Promise<void>;
  onInspectReferral: (referralId: string) => void;
}

export const FollowupsQueueView: React.FC<FollowupsQueueViewProps> = ({
  followups,
  currentRole,
  onRecordAction,
  onInspectReferral,
}) => {
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [actionTaken, setActionTaken] = useState('Home visit conducted by ASHA worker');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('Patient accompanied to hospital OPD on morning bus');
  const [status, setStatus] = useState<'In Progress' | 'Contacted' | 'Completed'>('Completed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingQueue = followups.filter(f => f.status !== 'Completed');
  const completedQueue = followups.filter(f => f.status === 'Completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowup) return;

    setIsSubmitting(true);
    try {
      await onRecordAction(
        selectedFollowup.id,
        actionTaken,
        notes || 'Frontline field follow-up completed and documented.',
        status,
        nextAction
      );
      setSelectedFollowup(null);
      setNotes('');
    } catch (err) {
      console.error('Follow-up recording error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-xs font-bold mb-1.5">
                <span>STALLED REFERRAL DETECTION &amp; RESOLUTION QUEUE</span>
              </div>
              <h2 className="text-xl font-bold text-rose-950">
                Follow-up Required ({pendingQueue.length} Active Cases)
              </h2>
              <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                Referrals automatically escalated because the patient did not reach the receiving hospital within the protocol timeframe (&gt;48 hours). Frontline health workers conduct community intervention to prevent dropouts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Follow-up Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>Active Community Follow-up Queue ({pendingQueue.length})</span>
          <span className="text-slate-400 font-normal">Auto-detected delay threshold: 48h</span>
        </h3>

        {pendingQueue.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>No stalled referrals currently pending follow-up. All patient care journeys active on schedule.</span>
          </div>
        ) : (
          pendingQueue.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border-2 border-rose-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                      {item.referralId}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      Patient: {item.patientId}
                    </span>
                    <span className="text-xs bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.delayHours} Hours Elapsed</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.urgency === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.urgency} Urgency
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900">
                    <strong className="text-rose-800">Operational Delay Reason: </strong>
                    <span>{item.triggerReason}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <span className="flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Assigned Worker: <strong>{item.assignedWorkerName}</strong></span>
                    </span>
                    <span>•</span>
                    <span>Status: <strong className="text-amber-700">{item.status}</strong></span>
                    {item.lastContactDate && (
                      <>
                        <span>•</span>
                        <span>Last Contact: {item.lastContactDate}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedFollowup(item)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record Follow-up Action</span>
                  </button>
                  <button
                    onClick={() => onInspectReferral(item.referralId)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-300 flex items-center justify-center space-x-1 transition-colors"
                  >
                    <span>Inspect Care Journey</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completed Follow-ups List */}
      {completedQueue.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resolved Follow-up History ({completedQueue.length})
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {completedQueue.map((item) => (
              <div key={item.id} className="p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">{item.referralId}</span>
                    <span className="font-semibold text-slate-700">Patient: {item.patientId}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ✓ Resolved
                    </span>
                  </div>
                  <div className="text-slate-700 mt-1">
                    <strong>Action Taken:</strong> {item.actionTaken}
                  </div>
                  {item.notes && (
                    <div className="text-slate-500 mt-0.5 text-[11px]">
                      Notes: {item.notes}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 sm:text-right">
                  <span>Verified by {item.assignedWorkerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Follow-up Modal */}
      {selectedFollowup && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs relative">
            <button
              onClick={() => setSelectedFollowup(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Record Community Follow-up Resolution
            </h3>

            <div className="py-2 text-slate-600">
              Referral: <strong>{selectedFollowup.referralId}</strong> (Patient: {selectedFollowup.patientId})
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Performed *</label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Home visit conducted by ASHA worker">Home visit conducted by ASHA worker</option>
                  <option value="Telephonic contact with patient and family attendant">Telephonic contact with patient and family attendant</option>
                  <option value="Emergency transportation & ambulance coordinated">Emergency transportation &amp; ambulance coordinated</option>
                  <option value="Appointment rescheduled with patient consent">Appointment rescheduled with patient consent</option>
                  <option value="Patient accompanied to District Hospital OPD desk">Patient accompanied to District Hospital OPD desk</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Observation / Vitals Check Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Visited patient residence in Shirwal. Verified blood pressure (144/88). Transportation delay was due to missed morning bus. Arranged accompaniment on 08:30 AM bus tomorrow."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Scheduled Step</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Outcome</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                >
                  <option value="Completed">Resolved &amp; Restored to Active Coordination (Completed)</option>
                  <option value="In Progress">Investigation In Progress (Pending Transit)</option>
                  <option value="Contacted">Contacted - Awaiting Arrival Confirmation</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedFollowup(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow transition-all"
                >
                  {isSubmitting ? 'Updating Status...' : 'Save & Resolve Stalled Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
