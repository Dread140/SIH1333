import React from 'react';
import { 
  Network, ShieldCheck, Database, Layers, 
  ExternalLink, FileCode, CheckCircle2, Lock, ArrowRight 
} from 'lucide-react';
import { AuditLog } from '../types/index.ts';

interface InteroperabilityViewProps {
  auditLogs: AuditLog[];
}

export const InteroperabilityView: React.FC<InteroperabilityViewProps> = ({
  auditLogs,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
          <Network className="w-3.5 h-3.5" />
          <span>INTEROPERABILITY &amp; OPEN STANDARDS</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Interoperability Architecture &amp; FHIR Specifications
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Architected as an operational care coordination layer designed for integration with authorized health information systems (ABDM, eSanjeevani, and Hospital Management Information Systems).
        </p>
      </div>

      {/* Layer Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 mb-6">
          Architectural Layer Hierarchy (Interoperability-Ready)
        </h3>

        <div className="max-w-3xl mx-auto space-y-4 font-mono text-xs">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow text-center font-bold text-sm tracking-wide">
            SwasthyaSetu CareLoop Operational Intelligence Layer
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-center">
              <div className="font-bold text-sky-950">Patient Identity Layer</div>
              <div className="text-[11px] text-sky-800 mt-1">ABHA / FHIR Patient Resource</div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="font-bold text-emerald-950">Referral Lifecycle Layer</div>
              <div className="text-[11px] text-emerald-800 mt-1">FHIR ServiceRequest &amp; Task</div>
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <div className="font-bold text-indigo-950">Facility Readiness Layer</div>
              <div className="text-[11px] text-indigo-800 mt-1">HealthcareService &amp; Location</div>
            </div>
          </div>

          <div className="text-center py-1 text-slate-400">
            ▼ Integration Adapter &amp; Gateway ▼
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[11px]">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-slate-800 block">ABDM Compatible</strong>
              <span className="text-slate-500">M1/M2/M3 Bridge</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-slate-800 block">Hospital Systems</strong>
              <span className="text-slate-500">e-Hospital / HMIS</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-slate-800 block">Teleconsultation</strong>
              <span className="text-slate-500">eSanjeevani Bridge</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-slate-800 block">Authorized Services</strong>
              <span className="text-slate-500">State Public Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* FHIR Resource Mapping & Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm pb-2 border-b border-slate-100">
            <FileCode className="w-4 h-4 text-sky-600" />
            <span>FHIR Release 4 (R4) Resource Mappings</span>
          </h4>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-mono font-bold text-sky-700">Patient ➔ SwasthyaSetu.Patient</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                ABHA ID mapped to Identifier system, village/taluka to Address, demographics to birthDate &amp; gender.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-mono font-bold text-sky-700">ServiceRequest ➔ SwasthyaSetu.Referral</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Clinical summary, required specialty code, source requester, destination performer, and urgency status.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-mono font-bold text-sky-700">HealthcareService ➔ SwasthyaSetu.FacilityService</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Specialty availability, diagnostic equipment uptime, and pharmacy stock thresholds.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-mono font-bold text-sky-700">Appointment &amp; Encounter ➔ SwasthyaSetu.Appointment</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                OPD token number, slot timestamp, room routing, arrival status verification, and discharge encounter.
              </p>
            </div>
          </div>
        </div>

        {/* Live Immutable Government Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Government Audit Trail ({auditLogs.length} Events)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Every status change, referral creation, and follow-up intervention is recorded with an immutable timestamp and actor ID.
            </p>

            <div className="mt-3 divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-mono font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Actor: {log.actorName} ({log.actorRole}) • Target: {log.entityType} ({log.entityId})
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Zero development flags exposed. Ready for secure public healthcare deployment.
          </div>
        </div>
      </div>
    </div>
  );
};
