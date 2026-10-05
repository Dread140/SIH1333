import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, UserCheck, 
  Calendar, Stethoscope, FileCheck, ArrowRight, ShieldAlert, Check
} from 'lucide-react';
import { ReferralStatus, ReferralEvent } from '../types/index.ts';

interface CareJourneyTimelineProps {
  currentStatus: ReferralStatus;
  events?: ReferralEvent[];
  urgency?: string;
  isStalled?: boolean;
  stalledReason?: string;
}

interface StepConfig {
  id: string;
  keyStatus: ReferralStatus[];
  title: string;
  subtitle: string;
  icon: any;
}

export const CareJourneyTimeline: React.FC<CareJourneyTimelineProps> = ({
  currentStatus,
  events = [],
  urgency = 'Routine',
  isStalled = false,
  stalledReason,
}) => {
  const steps: StepConfig[] = [
    {
      id: 'assessment',
      keyStatus: ['CREATED', 'REVIEWED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED', 'PATIENT_NOTIFIED', 'PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'PHC Assessment',
      subtitle: 'Primary Triage & Vitals',
      icon: Stethoscope,
    },
    {
      id: 'referral_created',
      keyStatus: ['CREATED', 'REVIEWED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED', 'PATIENT_NOTIFIED', 'PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'Referral Generated',
      subtitle: 'Readiness Verified',
      icon: FileCheck,
    },
    {
      id: 'facility_accepted',
      keyStatus: ['REVIEWED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED', 'PATIENT_NOTIFIED', 'PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'Facility Accepted',
      subtitle: 'Capacity Confirmed',
      icon: CheckCircle2,
    },
    {
      id: 'appointment_scheduled',
      keyStatus: ['APPOINTMENT_SCHEDULED', 'PATIENT_NOTIFIED', 'PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'Appointment Scheduled',
      subtitle: 'Token & OPD Slot Issued',
      icon: Calendar,
    },
    {
      id: 'patient_arrived',
      keyStatus: ['PATIENT_ARRIVED', 'SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'Patient Arrived',
      subtitle: 'Hospital OPD Check-in',
      icon: UserCheck,
    },
    {
      id: 'service_completed',
      keyStatus: ['SERVICE_COMPLETED', 'FOLLOW_UP', 'CLOSED'],
      title: 'Service Completed',
      subtitle: 'Consultation & Diagnostics',
      icon: Stethoscope,
    },
    {
      id: 'followup_closed',
      keyStatus: ['FOLLOW_UP', 'CLOSED'],
      title: 'Follow-up & Closed',
      subtitle: 'Community Continuity',
      icon: CheckCircle2,
    },
  ];

  // Helper to determine step status
  const getStepStatus = (index: number) => {
    if (isStalled && currentStatus === 'STALLED') {
      // Find where stalled
      if (index === 4) return 'stalled';
    }

    const stepOrder: ReferralStatus[] = [
      'CREATED',
      'REVIEWED',
      'ACCEPTED',
      'APPOINTMENT_SCHEDULED',
      'PATIENT_ARRIVED',
      'SERVICE_COMPLETED',
      'CLOSED'
    ];

    const currentIdx = stepOrder.indexOf(currentStatus as any);
    if (currentIdx === -1) {
      if (currentStatus === 'STALLED') return index <= 3 ? 'completed' : index === 4 ? 'stalled' : 'pending';
      return index === 0 ? 'active' : 'pending';
    }

    // Map 7 visual steps to status indices
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">Facility-Readiness-Aware Closed-Loop Care Journey</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              urgency === 'Urgent' 
                ? 'bg-rose-100 text-rose-800' 
                : urgency === 'Priority' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {urgency} Priority
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end operational traceability from primary assessment to verified follow-up closure.
          </p>
        </div>

        {isStalled && (
          <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-800 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Operational Delay Alert: Stalled &gt;48 Hours</span>
          </div>
        )}
      </div>

      {/* Visual Stepper */}
      <div className="py-6 overflow-x-auto">
        <div className="min-w-[720px] flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0">
            <div 
              className={`h-full transition-all duration-500 ${isStalled ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{
                width: currentStatus === 'CLOSED' ? '100%' :
                       currentStatus === 'SERVICE_COMPLETED' ? '85%' :
                       currentStatus === 'PATIENT_ARRIVED' ? '70%' :
                       currentStatus === 'APPOINTMENT_SCHEDULED' ? '50%' :
                       currentStatus === 'ACCEPTED' ? '35%' :
                       currentStatus === 'REVIEWED' ? '25%' :
                       currentStatus === 'CREATED' ? '15%' : '50%'
              }}
            />
          </div>

          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10 w-28 text-center">
                <div 
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
                    status === 'completed'
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                      : status === 'active'
                      ? 'bg-sky-600 text-white ring-4 ring-sky-100 animate-pulse'
                      : status === 'stalled'
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100 animate-bounce'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : status === 'stalled' ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-5 h-5 stroke-[2]" />
                  )}
                </div>

                <div className="mt-2.5">
                  <div className={`text-xs font-bold ${
                    status === 'completed' 
                      ? 'text-slate-800' 
                      : status === 'active' 
                      ? 'text-sky-700' 
                      : status === 'stalled' 
                      ? 'text-rose-700 font-extrabold' 
                      : 'text-slate-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {step.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stalled Alert Box */}
      {isStalled && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-800">Operational Delay Detected: Requires Follow-up</div>
              <p className="mt-1 text-rose-700 leading-relaxed">
                {stalledReason || "This referral exceeded the expected arrival timeframe (>48h). The patient has not registered at the receiving facility desk. A dedicated follow-up task has been assigned to the frontline ASHA worker."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timestamped Audit Event History */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
          <span>Official Event Log &amp; Closed-Loop Audit Trail ({events.length} records)</span>
          <span className="text-[11px] text-slate-400 font-normal">FHIR Provenance &amp; AuditEvent Compliant</span>
        </h4>

        {events.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
            No events recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => (
              <div 
                key={evt.id || idx}
                className="flex items-start space-x-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold text-[11px]">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="font-bold text-slate-900">
                      <span className="text-slate-600">{evt.fromStatus}</span>
                      <ArrowRight className="inline w-3 h-3 mx-1.5 text-slate-400" />
                      <span className="text-sky-700">{evt.toStatus}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(evt.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <p className="text-slate-700 mt-1 text-xs leading-relaxed">
                    {evt.remarks}
                  </p>

                  <div className="mt-1.5 flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">{evt.actorName}</span>
                    <span>•</span>
                    <span className="capitalize">{evt.actorRole.replace('_', ' ')}</span>
                    {evt.facilityId && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1 rounded">{evt.facilityId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
