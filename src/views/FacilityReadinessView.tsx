import React, { useState, useEffect } from 'react';
import { 
  Hospital, CheckCircle2, XCircle, AlertTriangle, 
  MapPin, Clock, Calendar, ShieldCheck, ArrowRight, 
  Filter, Search, UserCheck, Stethoscope, Sparkles
} from 'lucide-react';
import { Facility, ReadinessEvaluation, UserRole } from '../types/index.ts';
import { apiRequest } from '../lib/api.ts';
import { ReadinessBadge } from '../components/ReadinessBadge.tsx';

interface FacilityReadinessViewProps {
  facilities: Facility[];
  currentRole: UserRole;
  onSelectFacilityForReferral?: (facilityId: string, specialty: string, service: string) => void;
}

export const FacilityReadinessView: React.FC<FacilityReadinessViewProps> = ({
  facilities,
  currentRole,
  onSelectFacilityForReferral,
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Cardiology');
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<string[]>(['ECG', '2D Echo']);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>(['Atorvastatin 20mg', 'Clopidogrel 75mg']);
  const [readinessData, setReadinessData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const specialties = [
    'Cardiology',
    'OBGYN',
    'Orthopedics',
    'Pulmonology',
    'Ophthalmology',
    'Pediatrics',
    'General Medicine',
  ];

  const diagnosticOptions = [
    'ECG',
    '2D Echo',
    'USG Abdomen',
    'Chest X-Ray',
    'CT Scan',
    'CBC & Blood Glucose',
  ];

  const medicineOptions = [
    'Atorvastatin 20mg',
    'Clopidogrel 75mg',
    'Amlodipine 5mg',
    'Telmisartan 40mg',
    'Metformin 500mg',
    'Insulin Glargine',
  ];

  const fetchReadiness = async () => {
    setLoading(true);
    try {
      const receivingFacilities = facilities.filter(f => f.type !== 'PHC');
      const results = await Promise.all(
        receivingFacilities.map(async (fac) => {
          const res = await apiRequest(`/api/facilities/${fac.id}/readiness`, {
            method: 'POST',
            body: JSON.stringify({
              requiredSpecialty: selectedSpecialty,
              requiredDiagnostics: selectedDiagnostics,
              requiredMedicines: selectedMedicines,
            }),
          });
          return {
            facility: fac,
            readiness: res,
          };
        })
      );

      // Sort by readiness score descending
      results.sort((a, b) => b.readiness.totalReadinessScore - a.readiness.totalReadinessScore);
      setReadinessData(results);
    } catch (err) {
      console.error('Failed to evaluate facility readiness:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facilities.length > 0) {
      fetchReadiness();
    }
  }, [facilities, selectedSpecialty, selectedDiagnostics, selectedMedicines]);

  const toggleDiagnostic = (item: string) => {
    setSelectedDiagnostics(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleMedicine = (item: string) => {
    setSelectedMedicines(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TRANSPARENT FACILITY READINESS ENGINE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Facility Service &amp; Capacity Evaluation
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Before issuing a referral, verify whether the destination hospital currently possesses the on-duty specialist, functional diagnostic machines, required pharmaceutical inventory, and available OPD slot.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Detailed Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                viewMode === 'table' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Comparison Matrix
            </button>
          </div>
        </div>

        {/* Clinical Requirement Selectors */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Required Specialty */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Required Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {specialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Queries specialist roster and duty status</p>
          </div>

          {/* 2. Required Diagnostics */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Required Diagnostics
            </label>
            <div className="flex flex-wrap gap-1.5">
              {diagnosticOptions.map(diag => {
                const isSelected = selectedDiagnostics.includes(diag);
                return (
                  <button
                    key={diag}
                    type="button"
                    onClick={() => toggleDiagnostic(diag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{diag}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Checks equipment operational uptime</p>
          </div>

          {/* 3. Essential Medicines */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Critical Medication
            </label>
            <div className="flex flex-wrap gap-1.5">
              {medicineOptions.map(med => {
                const isSelected = selectedMedicines.includes(med);
                return (
                  <button
                    key={med}
                    type="button"
                    onClick={() => toggleMedicine(med)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      isSelected 
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{med}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verifies pharmacy inventory threshold</p>
          </div>
        </div>
      </div>

      {/* Facilities Comparison Content */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xs text-slate-600 mt-3 font-medium">Calculating multi-factor readiness scores across hospital network...</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Detailed Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {readinessData.map(({ facility, readiness }) => {
            const factors = readiness.factors;
            const score = readiness.totalReadinessScore;

            return (
              <div 
                key={facility.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Header with name and readiness badge */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <Hospital className="w-4 h-4 text-sky-600" />
                        <h3 className="font-bold text-sm text-slate-900">{facility.name}</h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {facility.type} • {facility.taluka}, {facility.district}
                      </div>
                    </div>
                    <ReadinessBadge score={score} size="md" />
                  </div>

                  {/* Readiness Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Composite Readiness</span>
                      <span className={score >= 85 ? 'text-emerald-700' : score >= 65 ? 'text-amber-700' : 'text-rose-700'}>
                        {score}% Verified
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Transparent Factors Checklist */}
                  <div className="mt-4 space-y-2.5 text-xs">
                    {/* Specialist */}
                    <div className="flex items-start justify-between">
                      <span className="text-slate-600 font-medium">Specialist:</span>
                      <div className="text-right">
                        <span className={`font-semibold inline-flex items-center space-x-1 ${
                          factors.specialist.available ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {factors.specialist.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{factors.specialist.available ? 'Available' : 'Unavailable'}</span>
                        </span>
                        <div className="text-[11px] text-slate-500">{factors.specialist.name}</div>
                      </div>
                    </div>

                    {/* Diagnostics */}
                    <div className="flex items-start justify-between">
                      <span className="text-slate-600 font-medium">Diagnostics:</span>
                      <div className="text-right">
                        <span className={`font-semibold inline-flex items-center space-x-1 ${
                          factors.diagnostics.available ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {factors.diagnostics.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{factors.diagnostics.available ? 'Fully Operational' : 'Limited Queue'}</span>
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {selectedDiagnostics.map(d => `${d}: ${factors.diagnostics.breakdown[d] || 'Available'}`).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Medicines */}
                    <div className="flex items-start justify-between">
                      <span className="text-slate-600 font-medium">Medicines:</span>
                      <div className="text-right">
                        <span className={`font-semibold inline-flex items-center space-x-1 ${
                          factors.medicines.available ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {factors.medicines.available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{factors.medicines.available ? 'In Stock' : 'Partial Stock'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Next Appointment Slot */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Next OPD Slot:</span>
                      <span className="font-semibold text-slate-800">{factors.appointment.nextSlot}</span>
                    </div>

                    {/* Bed Capacity */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Beds Available:</span>
                      <span className="font-semibold text-slate-800">
                        {factors.capacity.totalBeds - factors.capacity.occupiedBeds} free ({factors.capacity.occupancyPercent}% load)
                      </span>
                    </div>

                    {/* Distance from PHC */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Transit Distance:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {facility.type === 'District Hospital' ? '62 km (Direct Bus)' : '38 km'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (onSelectFacilityForReferral) {
                        onSelectFacilityForReferral(
                          facility.id, 
                          selectedSpecialty, 
                          `${selectedSpecialty} Consultation & ${selectedDiagnostics.join(', ')}`
                        );
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                      score >= 85
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Route Referral to this Facility</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3.5">Facility Name</th>
                  <th className="p-3.5">Readiness Score</th>
                  <th className="p-3.5">Specialist ({selectedSpecialty})</th>
                  <th className="p-3.5">Diagnostics</th>
                  <th className="p-3.5">Medicine Stock</th>
                  <th className="p-3.5">Next Slot</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {readinessData.map(({ facility, readiness }) => {
                  const factors = readiness.factors;
                  return (
                    <tr key={facility.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{facility.name}</div>
                        <div className="text-[11px] text-slate-500">{facility.type} • {facility.taluka}</div>
                      </td>
                      <td className="p-3.5">
                        <ReadinessBadge score={readiness.totalReadinessScore} size="sm" />
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${factors.specialist.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {factors.specialist.available ? '✓ Available' : '✗ Unavailable'}
                        </span>
                        <div className="text-[10px] text-slate-500">{factors.specialist.name}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${factors.diagnostics.available ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {factors.diagnostics.available ? '✓ Available' : '⚠ Limited'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-semibold ${factors.medicines.available ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {factors.medicines.available ? '✓ In Stock' : '⚠ Limited'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">{factors.appointment.nextSlot}</td>
                      <td className="p-3.5 text-slate-600">
                        {facility.type === 'District Hospital' ? '62 km' : '38 km'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            if (onSelectFacilityForReferral) {
                              onSelectFacilityForReferral(
                                facility.id, 
                                selectedSpecialty, 
                                `${selectedSpecialty} Consultation & ${selectedDiagnostics.join(', ')}`
                              );
                            }
                          }}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
