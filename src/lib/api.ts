import { UserRole } from '../types/index.ts';

const SYNC_QUEUE_KEY = 'careloop_offline_queue';

export interface OfflineAction {
  id: string;
  type: 'CREATE_PATIENT' | 'CREATE_REFERRAL' | 'TRANSITION_REFERRAL' | 'RESOLVE_FOLLOWUP';
  payload: any;
  timestamp: string;
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
  const current = getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([...current, newAction]));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

// Global active session for evaluation across all 5 roles
export interface CurrentSession {
  uid: string;
  name: string;
  role: UserRole;
  email: string;
  facilityId?: string;
  designation?: string;
}

export const PRESET_USERS: Record<UserRole, CurrentSession> = {
  frontline_worker: {
    uid: 'USR-ASHA-01',
    name: 'Sunita Shinde',
    role: 'frontline_worker',
    email: 'sunita.shinde@swasthyasetu.org',
    facilityId: 'FAC-MH-001',
    designation: 'Senior ASHA Facilitator (Shirwal Sector)',
  },
  phc_doctor: {
    uid: 'USR-DR-01',
    name: 'Dr. Rajesh Kulkarni',
    role: 'phc_doctor',
    email: 'dr.rajesh.kulkarni@swasthyasetu.org',
    facilityId: 'FAC-MH-001',
    designation: 'Medical Officer, PHC Shirwal',
  },
  facility_officer: {
    uid: 'USR-FAC-01',
    name: 'Dr. Smita Deshmukh',
    role: 'facility_officer',
    email: 'dr.smita.deshmukh@swasthyasetu.org',
    facilityId: 'FAC-MH-006',
    designation: 'Chief Referral Officer, District Hospital Aundh',
  },
  district_admin: {
    uid: 'USR-ADMIN-01',
    name: 'Dr. Anand Gaikwad',
    role: 'district_admin',
    email: 'dr.anand.gaikwad@swasthyasetu.org',
    facilityId: 'FAC-MH-006',
    designation: 'District Health Officer (DHO), Pune District',
  },
  patient: {
    uid: 'USR-PAT-01',
    name: 'Anusaya G. Jadhav',
    role: 'patient',
    email: 'anusaya.jadhav@patient.swasthyasetu.org',
    facilityId: 'FAC-MH-001',
    designation: 'ABHA Holder (Shirwal Village)',
  },
};

let currentSessionState: CurrentSession = PRESET_USERS.frontline_worker;

export function getSession(): CurrentSession {
  try {
    const saved = localStorage.getItem('careloop_active_session');
    if (saved) return JSON.parse(saved);
  } catch {}
  return currentSessionState;
}

export function setSession(session: CurrentSession) {
  currentSessionState = session;
  localStorage.setItem('careloop_active_session', JSON.stringify(session));
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = getSession();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-session-uid', session.uid);
  headers.set('x-session-role', session.role);

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP error ${res.status}`);
  }

  return res.json();
}
