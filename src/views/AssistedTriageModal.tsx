import React, { useState } from 'react';
import { 
  Stethoscope, AlertTriangle, ShieldCheck, 
  HeartPulse, Activity, X, ArrowRight, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Patient, UrgencyLevel, UserRole } from '../types/index.ts';

interface AssistedTriageModalProps {
  patients: Patient[];
  initialPatientId?: string;
  onClose: () => void;
  onSubmitTriageAndReferral: (triageData: any) => Promise<void>;
}

export const AssistedTriageModal: React.FC<AssistedTriageModalProps> = ({
  patients,
  initialPatientId,
  onClose,
  onSubmitTriageAndReferral,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || (patients[0]?.id ?? ''));
  const [symptoms, setSymptoms] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  
  // Vitals
  const [bpSystolic, setBpSystolic] = useState('140');
  const [bpDiastolic, setBpDiastolic] = useState('90');
  const [pulse, setPulse] = useState('84');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('97');
  const [rbs, setRbs] = useState('160');

  // Red Flag Indicators
  const [redFlags, setRedFlags] = useState<{ [key: string]: boolean }>({
    chestPainRadiating: false,
    severeBreathlessness: false,
    alteredSensorium: false,
    severeAbdominalPain: false,
    uncontrolledBleeding: false,
    faintingEpisodes: false,
  });

  // Required clinical service
  const [requiredSpecialty, setRequiredSpecialty] = useState('Cardiology');
  const [requiredService, setRequiredService] = useState('Cardiology Consultation & 2D Echo');
  const [triageNotes, setTriageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Dynamic Urgency Calculation
  const hasRedFlags = Object.values(redFlags).some(Boolean);
  const isBpHypertensiveCrisis = Number(bpSystolic) >= 180 || Number(bpDiastolic) >= 110;
  const isSpo2Critical = Number(spo2) < 92;
  const isPulseAbnormal = Number(pulse) < 50 || Number(pulse) > 120;

  let calculatedUrgency: UrgencyLevel = 'Routine';
  if (hasRedFlags || isBpHypertensiveCrisis || isSpo2Critical) {
    calculatedUrgency = 'Urgent';
  } else if (Number(bpSystolic) >= 150 || Number(spo2) <= 95 || Number(durationDays) > 14) {
    calculatedUrgency = 'Priority';
  }

  const handleToggleRedFlag = (key: string) => {
    setRedFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleServiceChange = (specialty: string) => {
    setRequiredSpecialty(specialty);
    const serviceMap: Record<string, string> = {
      Cardiology: 'Cardiology Consultation & 2D Echo',
      OBGYN: 'High-Risk OBGYN & Obstetric USG',
      Orthopedics: 'Orthopedic Evaluation & Digital X-Ray',
      Pulmonology: 'Pulmonology Consult & Sputum CBNAAT',
      Ophthalmology: 'Ophthalmic Exam & Retinal Imaging',
      Pediatrics: 'Pediatric Specialist Evaluation',
      GeneralMedicine: 'General Medicine & Diagnostic Workup',
    };
    setRequiredService(serviceMap[specialty] || `${specialty} Specialist Care`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !symptoms) return;

    setIsSubmitting(true);
    try {
      await onSubmitTriageAndReferral({
        patientId: selectedPatientId,
        symptoms,
        durationDays: Number(durationDays),
        vitals: {
          bp: `${bpSystolic}/${bpDiastolic}`,
          pulse: Number(pulse),
          temp,
          spo2: Number(spo2),
          rbs: Number(rbs),
        },
        urgency: calculatedUrgency,
        requiredSpecialty,
        requiredService,
        triageNotes: triageNotes || `Operational triage completed at PHC point of care. Urgency determined as ${calculatedUrgency}.`,
        redFlagIdentified: hasRedFlags || isBpHypertensiveCrisis,
      });
    } catch (err) {
      console.error('Triage submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-xs relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                Primary Assisted Triage &amp; Referral Routing
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                Operational Protocol
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Structured clinical parameter screening to determine routing urgency and resource requirements.
            </p>
          </div>
        </div>

        {/* Mandatory Operational Disclaimer */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2.5 text-slate-700 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>
            <strong>Operational Notice:</strong> Operational triage supports care pathway coordination and referral readiness. It does not constitute a definitive medical diagnosis.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) • Age {p.age} • {p.village} (ABHA: {p.abhaId})
                </option>
              ))}
            </select>
          </div>

          {/* Symptoms & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Presenting Symptoms *</label>
              <input
                type="text"
                required
                placeholder="e.g. Exertional chest heaviness, recurrent dizziness"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Vitals Recording Grid */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              <span>Objective Vital Parameters</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">BP Systolic</span>
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-lg border text-center font-bold ${
                    Number(bpSystolic) >= 160 ? 'bg-rose-50 border-rose-400 text-rose-800' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">BP Diastolic</span>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Pulse (bpm)</span>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</span>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-lg border text-center font-bold ${
                    Number(spo2) < 95 ? 'bg-rose-50 border-rose-400 text-rose-800' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">Temp (°F)</span>
                <input
                  type="text"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">RBS (mg/dL)</span>
                <input
                  type="number"
                  value={rbs}
                  onChange={(e) => setRbs(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Red Flag Indicators Checklist */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Red Flag Danger Signs Checklist</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redFlags.chestPainRadiating}
                  onChange={() => handleToggleRedFlag('chestPainRadiating')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-800">Radiating chest pain or pressure</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redFlags.severeBreathlessness}
                  onChange={() => handleToggleRedFlag('severeBreathlessness')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-800">Severe respiratory distress / dyspnea</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redFlags.alteredSensorium}
                  onChange={() => handleToggleRedFlag('alteredSensorium')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-800">Altered sensorium or confusion</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redFlags.faintingEpisodes}
                  onChange={() => handleToggleRedFlag('faintingEpisodes')}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-800">Syncope or collapse episodes</span>
              </label>
            </div>
          </div>

          {/* Specialty & Required Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Required Specialist</label>
              <select
                value={requiredSpecialty}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="OBGYN">Obstetrics &amp; Gynecology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="GeneralMedicine">General Medicine</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Required Service Title</label>
              <input
                type="text"
                value={requiredService}
                onChange={(e) => setRequiredService(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Calculated Operational Urgency Result */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            calculatedUrgency === 'Urgent'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : calculatedUrgency === 'Priority'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Assisted Operational Urgency Classification:
              </div>
              <div className="text-base font-extrabold flex items-center space-x-2 mt-0.5">
                <span>{calculatedUrgency} Urgency</span>
                <span className="text-xs font-normal opacity-80">
                  {calculatedUrgency === 'Urgent' ? '• Fast-track immediate coordination (<24h)' : calculatedUrgency === 'Priority' ? '• Coordinated dispatch within 48-72h' : '• Routine scheduled appointment'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              calculatedUrgency === 'Urgent' ? 'bg-rose-600 text-white' : calculatedUrgency === 'Priority' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              !
            </div>
          </div>

          {/* Submission & Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition-all"
            >
              <span>{isSubmitting ? 'Evaluating Readiness...' : 'Proceed to Facility Readiness & Referral'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
