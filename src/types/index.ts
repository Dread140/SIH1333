export type UserRole = 
  | 'frontline_worker' 
  | 'phc_doctor' 
  | 'facility_officer' 
  | 'district_admin' 
  | 'patient';

export type ReferralStatus = 
  | 'CREATED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'PATIENT_NOTIFIED'
  | 'PATIENT_ARRIVED'
  | 'SERVICE_COMPLETED'
  | 'FOLLOW_UP'
  | 'CLOSED'
  | 'PENDING'
  | 'STALLED'
  | 'CANCELLED';

export type UrgencyLevel = 'Routine' | 'Priority' | 'Urgent';

export interface User {
  id?: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  facilityId?: string;
  phone?: string;
  department?: string;
  designation?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  district: string;
  taluka: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  operatingHours: string;
  totalBeds: number;
  occupiedBeds: number;
  emergencyService: boolean;
  ambulanceAvailable: boolean;
}

export interface Specialist {
  id: number;
  facilityId: string;
  name: string;
  specialty: string;
  qualification: string;
  scheduleDays: string;
  status: string;
  nextSlotAvailable: string;
}

export interface Diagnostic {
  id: number;
  facilityId: string;
  testName: string;
  category: string;
  status: 'Available' | 'Limited' | 'Unavailable';
  waitingTimeDays: number;
  equipmentStatus: string;
  avgTurnaroundHours: number;
  requiresPriorBooking: boolean;
}

export interface Medicine {
  id: number;
  facilityId: string;
  medicineName: string;
  category: string;
  stockLevel: 'Available' | 'Limited' | 'Unavailable';
  unitsInStock: number;
  minThreshold: number;
  lastRestocked: string;
}

export interface Patient {
  id: string;
  abhaId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  assignedAshaId?: string;
  assignedAshaName?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  preferredLanguage: string;
  createdAt: string;
  referrals?: Referral[];
  triageRecords?: any[];
  appointments?: Appointment[];
}

export interface Referral {
  id: string;
  patientId: string;
  sourceFacilityId: string;
  destinationFacilityId: string;
  referringDoctorId: string;
  referringDoctorName: string;
  requiredService: string;
  requiredSpecialty: string;
  requiredDiagnostics?: string;
  requiredMedicines?: string;
  clinicalSummary: string;
  urgency: UrgencyLevel;
  status: ReferralStatus;
  readinessScore: number;
  readinessBreakdownJson: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  riskReasonsJson: string;
  distanceKm: number;
  isStalled: boolean;
  stalledReason?: string;
  expectedArrivalDate?: string;
  appointmentScheduledDate?: string;
  appointmentScheduledTime?: string;
  lastActionAt: string;
  serviceCompletedAt?: string;
  createdAt: string;
  patient?: Patient;
  sourceFacility?: Facility;
  destinationFacility?: Facility;
  events?: ReferralEvent[];
  appointments?: Appointment[];
  followups?: Followup[];
}

export interface ReferralEvent {
  id: number;
  referralId: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  facilityId?: string;
  remarks: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  referralId: string;
  patientId: string;
  facilityId: string;
  department: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNumber: number;
  status: string;
  roomNumber?: string;
  instructions?: string;
  createdAt: string;
}

export interface Followup {
  id: number;
  referralId: string;
  patientId: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  delayHours: number;
  triggerReason: string;
  status: 'Pending' | 'In Progress' | 'Contacted' | 'Completed';
  urgency: UrgencyLevel;
  actionTaken?: string;
  notes?: string;
  lastContactDate?: string;
  nextAction?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReadinessEvaluation {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  district: string;
  totalReadinessScore: number;
  factors: {
    specialist: {
      available: boolean;
      name: string;
      specialty: string;
      status: string;
      score: number;
    };
    diagnostics: {
      available: boolean;
      breakdown: Record<string, string>;
      score: number;
    };
    medicines: {
      available: boolean;
      breakdown: Record<string, string>;
      score: number;
    };
    appointment: {
      nextSlot: string;
      score: number;
    };
    capacity: {
      totalBeds: number;
      occupiedBeds: number;
      occupancyPercent: number;
      emergencyService: boolean;
      ambulanceAvailable: boolean;
      score: number;
    };
  };
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  recipientType: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  referralId?: string;
  isRead: boolean;
  createdAt: string;
}
