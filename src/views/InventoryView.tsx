import React, { useState } from 'react';
import { 
  Stethoscope, Pill, Search, Filter, 
  Hospital, CheckCircle2, AlertTriangle, XCircle, Clock 
} from 'lucide-react';
import { Diagnostic, Medicine, Facility } from '../types/index.ts';

interface InventoryViewProps {
  diagnostics: Diagnostic[];
  medicines: Medicine[];
  facilities: Facility[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  diagnostics,
  medicines,
  facilities,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'medicines'>('diagnostics');
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const facilityMap = facilities.reduce((acc, f) => {
    acc[f.id] = f.name;
    return acc;
  }, {} as Record<string, string>);

  const filteredDiagnostics = diagnostics.filter(d => {
    const matchFacility = selectedFacility === 'ALL' || d.facilityId === selectedFacility;
    const matchSearch = d.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFacility && matchSearch;
  });

  const filteredMedicines = medicines.filter(m => {
    const matchFacility = selectedFacility === 'ALL' || m.facilityId === selectedFacility;
    const matchSearch = m.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFacility && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold mb-2">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>FACILITY RESOURCE READINESS REPOSITORY</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Diagnostics &amp; Medicines Availability Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live inventory tracking across PHCs and District Hospitals to ensure referrals match on-ground equipment and medicine stocks.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'diagnostics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Diagnostic Tests ({diagnostics.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'medicines' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Pharmacy Stock ({medicines.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Network Facilities</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'diagnostics' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3.5">Diagnostic Test</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Facility Location</th>
                  <th className="p-3.5">Availability Status</th>
                  <th className="p-3.5">Equipment Condition</th>
                  <th className="p-3.5">Turnaround Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDiagnostics.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{d.testName}</td>
                    <td className="p-3.5 text-slate-600">{d.category}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{facilityMap[d.facilityId] || d.facilityId}</div>
                      <span className="text-[10px] font-mono text-slate-400">{d.facilityId}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-semibold inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] ${
                        d.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Limited' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.status === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                        {d.status === 'Limited' && <AlertTriangle className="w-3 h-3" />}
                        {d.status === 'Unavailable' && <XCircle className="w-3 h-3" />}
                        <span>{d.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{d.equipmentStatus}</td>
                    <td className="p-3.5 text-slate-600">{d.avgTurnaroundHours} Hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Therapeutic Class</th>
                  <th className="p-3.5">Facility Location</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Quantity in Store</th>
                  <th className="p-3.5">Last Restocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredMedicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{m.medicineName}</td>
                    <td className="p-3.5 text-slate-600">{m.category}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{facilityMap[m.facilityId] || m.facilityId}</div>
                      <span className="text-[10px] font-mono text-slate-400">{m.facilityId}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`font-semibold inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] ${
                        m.stockLevel === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                        m.stockLevel === 'Limited' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.stockLevel === 'Available' && <CheckCircle2 className="w-3 h-3" />}
                        {m.stockLevel === 'Limited' && <AlertTriangle className="w-3 h-3" />}
                        {m.stockLevel === 'Unavailable' && <XCircle className="w-3 h-3" />}
                        <span>{m.stockLevel}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{m.unitsInStock} Units</td>
                    <td className="p-3.5 text-slate-500">{m.lastRestocked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
