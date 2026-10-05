import React, { useState } from 'react';
import { 
  Users, Plus, Search, Filter, Phone, 
  MapPin, Calendar, FileText, ArrowRight, X, CheckCircle2, Stethoscope, ChevronRight 
} from 'lucide-react';
import { Patient, UserRole } from '../types/index.ts';

interface PatientsViewProps {
  patients: Patient[];
  currentRole: UserRole;
  onRegisterPatient: (patientData: any) => Promise<void>;
  onStartTriage: (patientId: string) => void;
  onViewReferral: (referralId: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  currentRole,
  onRegisterPatient,
  onStartTriage,
  onViewReferral,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('Shirwal');
  const [taluka, setTaluka] = useState('Khandala');
  const [district, setDistrict] = useState('Satara');
  const [abhaId, setAbhaId] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.abhaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !village) return;

    setIsSubmitting(true);
    try {
      await onRegisterPatient({
        name,
        age: Number(age) || 30,
        gender,
        phone,
        village,
        taluka,
        district,
        abhaId: abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        chronicConditions,
        bloodGroup,
        preferredLanguage: 'mr',
      });
      setShowRegisterModal(false);
      // Reset form
      setName('');
      setAge('');
      setPhone('');
      setAbhaId('');
      setChronicConditions('');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>COMMUNITY HEALTH RECORD MANAGEMENT</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Registered Patients Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rural patient roster with ABHA identity, assigned ASHA workers, and active care pathways.
            </p>
          </div>

          {(currentRole === 'frontline_worker' || currentRole === 'phc_doctor') && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Patient</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Patient Name, ID, ABHA number, or Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Patient Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Total Records: {filteredPatients.length}</span>
          <span className="text-slate-400 font-normal">Click any patient to view clinical history &amp; referrals</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border border-slate-200">
                  {patient.gender === 'Female' ? '👩' : '👨'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{patient.name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {patient.id}
                    </span>
                    <span className="text-xs text-slate-500">• {patient.age} yrs, {patient.gender}</span>
                  </div>

                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-sky-700 font-medium">ABHA: {patient.abhaId}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{patient.village}, {patient.taluka}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{patient.phone}</span>
                    </span>
                  </div>

                  {patient.chronicConditions && (
                    <div className="mt-1.5 inline-block text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                      Conditions: {patient.chronicConditions}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 md:self-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTriage(patient.id);
                  }}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-sky-200 flex items-center space-x-1 transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Start Triage</span>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPatient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xl font-bold">
                {selectedPatient.gender === 'Female' ? '👩' : '👨'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPatient.name}</h3>
                <div className="font-mono text-sky-700 font-semibold mt-0.5">
                  ABHA ID: {selectedPatient.abhaId}
                </div>
                <div className="text-slate-500 mt-0.5">
                  {selectedPatient.id} • {selectedPatient.age} Years • {selectedPatient.gender} • Blood Group: {selectedPatient.bloodGroup || 'Not Tested'}
                </div>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="font-bold text-slate-700">Location: </span>
                <span className="text-slate-600">{selectedPatient.village}, Taluka: {selectedPatient.taluka}, District: {selectedPatient.district}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Contact Number: </span>
                <span className="text-slate-600">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Assigned ASHA Worker: </span>
                <span className="text-slate-600">{selectedPatient.assignedAshaName || 'Sunita Shinde'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Chronic Medical History: </span>
                <span className="text-slate-600">{selectedPatient.chronicConditions || 'None reported'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Known Drug Allergies: </span>
                <span className="text-slate-600">{selectedPatient.allergies || 'No known drug allergies (NKDA)'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const id = selectedPatient.id;
                  setSelectedPatient(null);
                  onStartTriage(id);
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Perform Assisted Triage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Register New Community Patient
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakuntala B. Gaikwad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 48"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98220 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ABHA Health ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="91-XXXX-XXXX-XXXX"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taluka</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Known Chronic Medical Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Diabetes, Asthma"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all"
                >
                  {isSubmitting ? 'Registering...' : 'Save Patient Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
