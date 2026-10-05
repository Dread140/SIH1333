import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, 
  MapPin, Clock, Stethoscope, ArrowRight, UserCheck 
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';

export const AiRiskSimulatorView: React.FC = () => {
  const [urgency, setUrgency] = useState<'Routine' | 'Priority' | 'Urgent'>('Priority');
  const [distanceKm, setDistanceKm] = useState(62);
  const [appointmentDelayDays, setAppointmentDelayDays] = useState(2);
  const [previousMissedFollowup, setPreviousMissedFollowup] = useState(false);
  const [diagnosticAvailability, setDiagnosticAvailability] = useState(true);
  const [medicineAvailability, setMedicineAvailability] = useState(true);
  const [isStalled, setIsStalled] = useState(false);
  
  const [result, setResult] = useState<any>({
    risk: 'Moderate',
    riskScore: 35,
    reasons: [
      'Priority referral requires completed care within 48-72 hours',
      'Long transit distance (62 km) across taluka borders increases travel barrier',
      'Patient requires family attendant due to occasional dizziness'
    ],
    recommendedAction: 'ASHA telephonic reminder within 24h of scheduled appointment and village transport confirmation.',
    engine: 'Operational Risk Rules Engine',
  });

  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/risk/referral', {
        method: 'POST',
        body: JSON.stringify({
          urgency,
          distanceKm,
          appointmentDelayDays,
          previousMissedFollowup,
          diagnosticAvailability,
          medicineAvailability,
          isStalled,
        }),
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to evaluate risk:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>OPERATIONAL DECISION SUPPORT</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          AI &amp; Rules-Based Referral Risk Engine
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Assesses operational friction factors (transit barrier, delay duration, past follow-up adherence, equipment uptime) to predict care pathway dropout risk and recommend frontline interventions.
        </p>

        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>
            <strong>Safety Protocol:</strong> The operational risk engine analyzes logistic and coordination barriers only. It never provides medical diagnoses, drug recommendations, or clinical treatment advice.
          </span>
        </div>
      </div>

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
            Operational Parameter Inputs
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Referral Urgency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Routine', 'Priority', 'Urgent'] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    urgency === u
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transit Distance: {distanceKm} km
              </label>
              <input
                type="range"
                min="5"
                max="120"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Local (5 km)</span>
                <span>Inter-District (120 km)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Appointment Delay: {appointmentDelayDays} Days
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={appointmentDelayDays}
                onChange={(e) => setAppointmentDelayDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Immediate (0d)</span>
                <span>Delayed (10d)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="font-semibold text-slate-800">Previous Missed Follow-up History</span>
              <input
                type="checkbox"
                checked={previousMissedFollowup}
                onChange={(e) => setPreviousMissedFollowup(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="font-semibold text-slate-800">Destination Diagnostics Functional</span>
              <input
                type="checkbox"
                checked={diagnosticAvailability}
                onChange={(e) => setDiagnosticAvailability(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="font-semibold text-slate-800">Prescribed Medicine In-Stock at Hospital</span>
              <input
                type="checkbox"
                checked={medicineAvailability}
                onChange={(e) => setMedicineAvailability(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-200 cursor-pointer">
              <span className="font-semibold text-rose-800">Flag as Stalled (&gt;48h Without Arrival)</span>
              <input
                type="checkbox"
                checked={isStalled}
                onChange={(e) => setIsStalled(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
            </label>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl shadow transition-all text-xs flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Evaluating Model Rationale...' : 'Evaluate Operational Dropout Risk'}</span>
          </button>
        </div>

        {/* Right: Operational Decision Support Output (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Operational Risk Evaluation Output
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {result?.engine || 'CareLoop Risk Model'}
              </span>
            </div>

            {/* Risk Level Badge */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              result?.risk === 'High' 
                ? 'bg-rose-50 border-rose-300 text-rose-900' 
                : result?.risk === 'Moderate' 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">Predicted Referral Risk</span>
                <span className="text-xl font-extrabold">{result?.risk} Operational Risk</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{result?.riskScore || 0}</span>
                <span className="text-xs block opacity-80">/ 100 Index</span>
              </div>
            </div>

            {/* Explainable Rationale */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Explainable Rationale Factors:
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {result?.reasons?.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Frontline Action */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-sky-900 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-sky-700" />
                <span>Recommended Operational Action:</span>
              </span>
              <p className="text-sky-800 leading-relaxed font-medium">
                "{result?.recommendedAction}"
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Powered by deterministic decision tree &amp; operational nuance intelligence. Compliant with non-clinical health coordination guidelines.
          </div>
        </div>
      </div>
    </div>
  );
};
