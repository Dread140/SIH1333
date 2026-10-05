import React, { useState } from 'react';
import { ShieldCheck, Check, AlertTriangle, X, Info } from 'lucide-react';

interface ReadinessBadgeProps {
  score: number;
  breakdownJson?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetailsButton?: boolean;
}

export const ReadinessBadge: React.FC<ReadinessBadgeProps> = ({
  score,
  breakdownJson,
  size = 'md',
  showDetailsButton = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  let colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let barColor = 'bg-emerald-500';
  let label = 'High Readiness';

  if (score < 65) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
    barColor = 'bg-rose-500';
    label = 'Low Readiness';
  } else if (score < 85) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    barColor = 'bg-amber-500';
    label = 'Moderate Readiness';
  }

  let breakdown: any = null;
  try {
    if (breakdownJson) {
      breakdown = typeof breakdownJson === 'string' ? JSON.parse(breakdownJson) : breakdownJson;
    }
  } catch {}

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  return (
    <div className="relative inline-block">
      <div 
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center space-x-1.5 rounded-full border font-semibold cursor-pointer shadow-sm ${colorClasses} ${sizeClasses}`}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor.replace('bg-', '') }}></span>
        <span>{score}% Ready</span>
        {showDetailsButton && <Info className="w-3 h-3 opacity-70 ml-0.5" />}
      </div>

      {showTooltip && breakdown && (
        <div className="absolute left-0 mt-2 w-72 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-2xl p-3 z-50 text-xs text-left animate-in fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold text-slate-900">
            <span>Readiness Verification ({score}%)</span>
            <button onClick={() => setShowTooltip(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Specialist:</span>
              <span className={`font-semibold flex items-center space-x-1 ${breakdown.specialist ? 'text-emerald-700' : 'text-rose-700'}`}>
                {breakdown.specialist ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-600" />}
                <span>{breakdown.specialist ? 'Verified Available' : 'On Leave / Unavailable'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Diagnostics:</span>
              <span className={`font-semibold flex items-center space-x-1 ${breakdown.diagnostic ? 'text-emerald-700' : 'text-amber-700'}`}>
                {breakdown.diagnostic ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                <span>{breakdown.diagnostic ? 'Operational' : 'Limited Queue'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Medicines:</span>
              <span className={`font-semibold flex items-center space-x-1 ${breakdown.medicine ? 'text-emerald-700' : 'text-rose-700'}`}>
                {breakdown.medicine ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-600" />}
                <span>{breakdown.medicine ? 'Stock Available' : 'Stock Critical'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">Appointment Slot:</span>
              <span className="font-semibold text-slate-800">{breakdown.appointment || 'Next Day Available'}</span>
            </div>

            {breakdown.capacity && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Bed Capacity:</span>
                <span className="font-semibold text-slate-800">{breakdown.capacity}% Occupied</span>
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            Verified across specialist roster, diagnostic schedule, and drug store inventory.
          </div>
        </div>
      )}
    </div>
  );
};
