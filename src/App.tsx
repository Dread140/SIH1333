import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { PatientsView } from './views/PatientsView.tsx';
import { FacilityReadinessView } from './views/FacilityReadinessView.tsx';
import { ReferralsView } from './views/ReferralsView.tsx';
import { FollowupsQueueView } from './views/FollowupsQueueView.tsx';
import { PatientPortalView } from './views/PatientPortalView.tsx';
import { DistrictAnalyticsView } from './views/DistrictAnalyticsView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { AiRiskSimulatorView } from './views/AiRiskSimulatorView.tsx';
import { InteroperabilityView } from './views/InteroperabilityView.tsx';
import { AssistedTriageModal } from './views/AssistedTriageModal.tsx';
import { 
  UserRole, Referral, Facility, Patient, 
  Diagnostic, Medicine, Followup, Notification, AuditLog, ReferralStatus 
} from './types/index.ts';
import { Language } from './lib/i18n.ts';
import { 
  apiRequest, getSession, setSession, PRESET_USERS, 
  getOfflineQueue, queueOfflineAction, clearOfflineQueue 
} from './lib/api.ts';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('phc_doctor');
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Network & Offline Queue State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // Core Data
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Navigation & Modals
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [showTriageModal, setShowTriageModal] = useState<boolean>(false);
  const [triageInitialPatientId, setTriageInitialPatientId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync state on load
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentRole(session.role);
      if (session.role === 'patient') {
        setActiveTab('patient_portal');
      }
    }
    setQueuedCount(getOfflineQueue().length);
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [facs, pats, refs, flws, diags, meds, notifs, logs, anlt] = await Promise.all([
        apiRequest('/api/facilities'),
        apiRequest('/api/patients'),
        apiRequest('/api/referrals'),
        apiRequest('/api/followups'),
        apiRequest('/api/diagnostics'),
        apiRequest('/api/medicines'),
        apiRequest('/api/notifications'),
        apiRequest('/api/audit-logs'),
        apiRequest('/api/analytics'),
      ]);

      setFacilities(facs);
      setPatients(pats);
      setReferrals(refs);
      setFollowups(flws);
      setDiagnostics(diags);
      setMedicines(meds);
      setNotifications(notifs);
      setAuditLogs(logs);
      setAnalytics(anlt);

      if (refs.length > 0 && !selectedReferralId) {
        setSelectedReferralId(refs[0].id);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setSession(PRESET_USERS[newRole]);
    if (newRole === 'patient') {
      setActiveTab('patient_portal');
    } else if (activeTab === 'patient_portal') {
      setActiveTab('dashboard');
    }
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      showToast("Field Mode Enabled: Connectivity offline. All actions queued locally for automatic sync.");
    } else {
      showToast("Online Connected: Real-time synchronization active with Cloud SQL.");
    }
  };

  const handleTriggerSync = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      await apiRequest('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'frontline-station-01',
          operations: queue,
        }),
      });
      clearOfflineQueue();
      setQueuedCount(0);
      showToast(`Successfully synchronized ${queue.length} offline actions to district database.`);
      await loadAllData();
    } catch (err) {
      console.error('Sync failed:', err);
      showToast('Synchronization failed. Retrying on next connection window.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRegisterPatient = async (patientData: any) => {
    if (!isOnline) {
      queueOfflineAction({
        type: 'CREATE_PATIENT',
        payload: { ...patientData, tempId: `TEMP-${Date.now()}` },
      });
      setQueuedCount(getOfflineQueue().length);
      showToast("Patient profile queued locally in field offline mode.");
      return;
    }

    try {
      const created = await apiRequest('/api/patients', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
      showToast(`Patient ${created.name} (${created.id}) registered successfully.`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to register patient.");
    }
  };

  const handleSubmitTriageAndReferral = async (triageData: any) => {
    try {
      // 1. Record Triage
      await apiRequest('/api/triage', {
        method: 'POST',
        body: JSON.stringify({
          patientId: triageData.patientId,
          assessmentBy: PRESET_USERS[currentRole].name,
          symptoms: triageData.symptoms,
          durationDays: triageData.durationDays,
          vitals: triageData.vitals,
          urgency: triageData.urgency,
          requiredService: triageData.requiredService,
          triageNotes: triageData.triageNotes,
          redFlagIdentified: triageData.redFlagIdentified,
        }),
      });

      // 2. Query facility readiness for best receiving hospital (e.g. DH Aundh)
      const targetHospital = facilities.find(f => f.type === 'District Hospital') || facilities[0];
      const readiness = await apiRequest(`/api/facilities/${targetHospital.id}/readiness`, {
        method: 'POST',
        body: JSON.stringify({
          requiredSpecialty: triageData.requiredSpecialty,
          requiredDiagnostics: ['ECG', '2D Echo'],
          requiredMedicines: ['Atorvastatin 20mg'],
        }),
      });

      // 3. Create Referral with transparent readiness
      const newRef = await apiRequest('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({
          patientId: triageData.patientId,
          sourceFacilityId: PRESET_USERS[currentRole].facilityId || 'FAC-MH-001',
          destinationFacilityId: targetHospital.id,
          referringDoctorId: PRESET_USERS[currentRole].uid,
          referringDoctorName: PRESET_USERS[currentRole].name,
          requiredService: triageData.requiredService,
          requiredSpecialty: triageData.requiredSpecialty,
          requiredDiagnostics: '2D Echo & ECG',
          requiredMedicines: 'Atorvastatin 20mg',
          clinicalSummary: `${triageData.symptoms}. BP: ${triageData.vitals.bp}, Pulse: ${triageData.vitals.pulse}, SpO2: ${triageData.vitals.spo2}%. Urgency: ${triageData.urgency}.`,
          urgency: triageData.urgency,
          readinessScore: readiness?.totalReadinessScore || 92,
          readinessBreakdown: readiness?.factors || {},
          riskLevel: triageData.urgency === 'Urgent' ? 'High' : 'Moderate',
          riskReasons: [
            `Clinical triage urgency classified as ${triageData.urgency}`,
            `Transit distance approx 62 km to ${targetHospital.name}`,
            'Specialist on duty confirmed available'
          ],
          distanceKm: 62,
        }),
      });

      setShowTriageModal(false);
      showToast(`Referral ${newRef.id} generated with verified facility readiness score (${newRef.readinessScore}%).`);
      await loadAllData();
      setSelectedReferralId(newRef.id);
      setActiveTab('referrals');
    } catch (err: any) {
      console.error('Triage & referral submission failed:', err);
      showToast(err.message || "Failed to submit referral.");
    }
  };

  const handleTransitionStatus = async (
    referralId: string,
    toStatus: ReferralStatus,
    remarks: string,
    appointmentData?: any
  ) => {
    if (!isOnline) {
      queueOfflineAction({
        type: 'TRANSITION_REFERRAL',
        payload: {
          referralId,
          toStatus,
          actor: {
            id: PRESET_USERS[currentRole].uid,
            name: PRESET_USERS[currentRole].name,
            role: currentRole,
            facilityId: PRESET_USERS[currentRole].facilityId,
          },
          remarks,
          appointmentData,
        },
      });
      setQueuedCount(getOfflineQueue().length);
      showToast(`Status update to ${toStatus} queued locally.`);
      return;
    }

    try {
      await apiRequest(`/api/referrals/${referralId}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          toStatus,
          actor: {
            id: PRESET_USERS[currentRole].uid,
            name: PRESET_USERS[currentRole].name,
            role: currentRole,
            facilityId: PRESET_USERS[currentRole].facilityId,
          },
          remarks,
          appointmentData,
        }),
      });
      showToast(`Referral ${referralId} status updated to ${toStatus}.`);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update referral status.");
    }
  };

  const handleRecordFollowupAction = async (
    followupId: number,
    actionTaken: string,
    notes: string,
    status: 'In Progress' | 'Contacted' | 'Completed',
    nextAction?: string
  ) => {
    if (!isOnline) {
      queueOfflineAction({
        type: 'RESOLVE_FOLLOWUP',
        payload: {
          id: followupId,
          actionTaken,
          notes,
          status,
          nextAction,
          actor: {
            id: PRESET_USERS[currentRole].uid,
            name: PRESET_USERS[currentRole].name,
            role: currentRole,
          },
        },
      });
      setQueuedCount(getOfflineQueue().length);
      showToast("Follow-up action queued locally in field offline mode.");
      return;
    }

    try {
      await apiRequest(`/api/followups/${followupId}/action`, {
        method: 'POST',
        body: JSON.stringify({
          actionTaken,
          notes,
          status,
          nextAction,
          actor: {
            id: PRESET_USERS[currentRole].uid,
            name: PRESET_USERS[currentRole].name,
            role: currentRole,
          },
        }),
      });
      showToast("Community follow-up recorded. Stalled status resolved in referral lifecycle.");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to record follow-up.");
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const activePatientForPortal = patients.find(p => p.id === 'PAT-10482') || patients[0];
  const activeReferralForPortal = referrals.find(r => r.id === 'REF-20831') || referrals[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Navigation Header */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        lang={lang}
        onLangChange={setLang}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        queuedCount={queuedCount}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 max-w-md animate-in slide-in-from-bottom">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Body Content Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentRole={currentRole}
            referrals={referrals}
            facilities={facilities}
            analytics={analytics}
            onOpenTriage={() => {
              setTriageInitialPatientId(patients[0]?.id);
              setShowTriageModal(true);
            }}
            onOpenRegister={() => setActiveTab('patients')}
            onSelectReferral={(id) => {
              setSelectedReferralId(id);
              setActiveTab('referrals');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsView
            patients={patients}
            currentRole={currentRole}
            onRegisterPatient={handleRegisterPatient}
            onStartTriage={(patientId) => {
              setTriageInitialPatientId(patientId);
              setShowTriageModal(true);
            }}
            onViewReferral={(id) => {
              setSelectedReferralId(id);
              setActiveTab('referrals');
            }}
          />
        )}

        {activeTab === 'readiness' && (
          <FacilityReadinessView
            facilities={facilities}
            currentRole={currentRole}
            onSelectFacilityForReferral={(facId, specialty, service) => {
              setTriageInitialPatientId(patients[0]?.id);
              setShowTriageModal(true);
            }}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralsView
            referrals={referrals}
            currentRole={currentRole}
            selectedReferralId={selectedReferralId}
            onSelectReferral={setSelectedReferralId}
            onTransitionStatus={handleTransitionStatus}
            onOpenTriage={() => {
              setTriageInitialPatientId(patients[0]?.id);
              setShowTriageModal(true);
            }}
          />
        )}

        {activeTab === 'followups' && (
          <FollowupsQueueView
            followups={followups}
            currentRole={currentRole}
            onRecordAction={handleRecordFollowupAction}
            onInspectReferral={(refId) => {
              setSelectedReferralId(refId);
              setActiveTab('referrals');
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            diagnostics={diagnostics}
            medicines={medicines}
            facilities={facilities}
          />
        )}

        {activeTab === 'analytics' && (
          <DistrictAnalyticsView
            analytics={analytics}
            facilities={facilities}
            referrals={referrals}
          />
        )}

        {activeTab === 'risk_engine' && (
          <AiRiskSimulatorView />
        )}

        {activeTab === 'interoperability' && (
          <InteroperabilityView auditLogs={auditLogs} />
        )}

        {activeTab === 'patient_portal' && activePatientForPortal && (
          <PatientPortalView
            patient={activePatientForPortal}
            activeReferral={activeReferralForPortal}
            appointments={[]}
            lang={lang}
            onLangChange={setLang}
            onInspectCareJourney={() => {
              setSelectedReferralId(activeReferralForPortal.id);
              setActiveTab('referrals');
            }}
          />
        )}
      </main>

      {/* Assisted Triage & Referral Modal */}
      {showTriageModal && (
        <AssistedTriageModal
          patients={patients}
          initialPatientId={triageInitialPatientId}
          onClose={() => setShowTriageModal(false)}
          onSubmitTriageAndReferral={handleSubmitTriageAndReferral}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">SwasthyaSetu (CareLoop)</span>
            <span>•</span>
            <span>Rural Care Coordination &amp; Facility-Readiness-Aware Referral Network</span>
          </div>
          <div className="text-slate-500">
            Designed for interoperability with authorized public health systems (ABDM, eSanjeevani, HMIS)
          </div>
        </div>
      </footer>
    </div>
  );
}
