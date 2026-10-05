import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// 1. Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID or system user ID
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // frontline_worker, phc_doctor, facility_officer, district_admin, patient
  facilityId: text("facility_id"),
  phone: text("phone"),
  department: text("department"),
  designation: text("designation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Facilities
export const facilities = pgTable("facilities", {
  id: text("id").primaryKey(), // e.g. FAC-MH-001
  name: text("name").notNull(),
  type: text("type").notNull(), // PHC, Rural Hospital, Sub-District Hospital, District Hospital
  district: text("district").notNull(),
  taluka: text("taluka").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  operatingHours: text("operating_hours").notNull(),
  totalBeds: integer("total_beds").default(0).notNull(),
  occupiedBeds: integer("occupied_beds").default(0).notNull(),
  emergencyService: boolean("emergency_service").default(true).notNull(),
  ambulanceAvailable: boolean("ambulance_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Specialists at Facilities
export const specialists = pgTable("specialists", {
  id: serial("id").primaryKey(),
  facilityId: text("facility_id").references(() => facilities.id).notNull(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(), // Cardiology, Orthopedics, Pediatrics, OBGYN, General Medicine, Ophthalmology, Pulmonology
  qualification: text("qualification").notNull(),
  scheduleDays: text("schedule_days").notNull(), // e.g. Mon,Tue,Wed,Fri
  status: text("status").notNull(), // Available, On Leave, In OT, Ward Round
  nextSlotAvailable: text("next_slot_available").notNull(), // e.g. Tomorrow 09:30 AM
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Diagnostics at Facilities
export const diagnostics = pgTable("diagnostics", {
  id: serial("id").primaryKey(),
  facilityId: text("facility_id").references(() => facilities.id).notNull(),
  testName: text("test_name").notNull(), // ECG, USG Abdomen, Chest X-Ray, CBC, 2D Echo, CT Scan, HbA1c, Liver Function
  category: text("category").notNull(), // Radiology, Pathology, Cardiology, Biochemistry
  status: text("status").notNull(), // Available, Limited, Unavailable
  waitingTimeDays: integer("waiting_time_days").default(0).notNull(),
  equipmentStatus: text("equipment_status").notNull(), // Operational, Under Maintenance, Calibration Required
  avgTurnaroundHours: integer("avg_turnaround_hours").default(2).notNull(),
  requiresPriorBooking: boolean("requires_prior_booking").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Medicines at Facilities
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  facilityId: text("facility_id").references(() => facilities.id).notNull(),
  medicineName: text("medicine_name").notNull(), // e.g. Metformin 500mg, Atorvastatin 20mg, Amlodipine 5mg, Amoxicillin 500mg
  category: text("category").notNull(), // Cardiac, Diabetic, Antibiotic, Analgesic, Respiratory
  stockLevel: text("stock_level").notNull(), // Available, Limited, Unavailable
  unitsInStock: integer("units_in_stock").default(0).notNull(),
  minThreshold: integer("min_threshold").default(50).notNull(),
  lastRestocked: text("last_restocked").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Patients
export const patients = pgTable("patients", {
  id: text("id").primaryKey(), // e.g. PAT-10482
  abhaId: text("abha_id").notNull(), // e.g. 91-8472-1094-3201
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // Male, Female, Other
  phone: text("phone").notNull(),
  village: text("village").notNull(),
  taluka: text("taluka").notNull(),
  district: text("district").notNull(),
  assignedAshaId: text("assigned_asha_id"),
  assignedAshaName: text("assigned_asha_name"),
  emergencyContact: text("emergency_contact"),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  preferredLanguage: text("preferred_language").default("mr").notNull(), // mr, hi, en
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Triage Records
export const triageRecords = pgTable("triage_records", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  assessmentBy: text("assessment_by").notNull(),
  symptoms: text("symptoms").notNull(),
  durationDays: integer("duration_days").notNull(),
  vitalsJson: text("vitals_json").notNull(), // bp, pulse, temp, spo2, rbs
  urgency: text("urgency").notNull(), // Routine, Priority, Urgent
  requiredService: text("required_service").notNull(),
  triageNotes: text("triage_notes").notNull(),
  redFlagIdentified: boolean("red_flag_identified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Referrals
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey(), // e.g. REF-20831
  patientId: text("patient_id").references(() => patients.id).notNull(),
  sourceFacilityId: text("source_facility_id").references(() => facilities.id).notNull(),
  destinationFacilityId: text("destination_facility_id").references(() => facilities.id).notNull(),
  referringDoctorId: text("referring_doctor_id").notNull(),
  referringDoctorName: text("referring_doctor_name").notNull(),
  requiredService: text("required_service").notNull(), // e.g. Cardiology Consultation & 2D Echo
  requiredSpecialty: text("required_specialty").notNull(),
  requiredDiagnostics: text("required_diagnostics"),
  requiredMedicines: text("required_medicines"),
  clinicalSummary: text("clinical_summary").notNull(),
  urgency: text("urgency").notNull(), // Routine, Priority, Urgent
  status: text("status").notNull(), 
  // CREATED -> REVIEWED -> ACCEPTED -> APPOINTMENT_SCHEDULED -> PATIENT_NOTIFIED -> PATIENT_ARRIVED -> SERVICE_COMPLETED -> FOLLOW_UP -> CLOSED
  // Also: PENDING, STALLED, CANCELLED
  readinessScore: integer("readiness_score").default(85).notNull(),
  readinessBreakdownJson: text("readiness_breakdown_json").notNull(),
  riskLevel: text("risk_level").notNull(), // Low, Moderate, High
  riskReasonsJson: text("risk_reasons_json").notNull(),
  distanceKm: integer("distance_km").default(25).notNull(),
  isStalled: boolean("is_stalled").default(false).notNull(),
  stalledReason: text("stalled_reason"),
  expectedArrivalDate: text("expected_arrival_date"),
  appointmentScheduledDate: text("appointment_scheduled_date"),
  appointmentScheduledTime: text("appointment_scheduled_time"),
  lastActionAt: timestamp("last_action_at").defaultNow().notNull(),
  serviceCompletedAt: timestamp("service_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Referral Events (Audit & Care Journey Timeline)
export const referralEvents = pgTable("referral_events", {
  id: serial("id").primaryKey(),
  referralId: text("referral_id").references(() => referrals.id).notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  facilityId: text("facility_id"),
  remarks: text("remarks").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Appointments
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(), // e.g. APT-48291
  referralId: text("referral_id").references(() => referrals.id).notNull(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  facilityId: text("facility_id").references(() => facilities.id).notNull(),
  department: text("department").notNull(),
  doctorName: text("doctor_name").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  tokenNumber: integer("token_number").notNull(),
  status: text("status").notNull(), // Scheduled, Confirmed, Arrived, Completed, Missed, Rescheduled
  roomNumber: text("room_number"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Follow-ups (Dedicated Queue for Stalled & Discharge Follow-up)
export const followups = pgTable("followups", {
  id: serial("id").primaryKey(),
  referralId: text("referral_id").references(() => referrals.id).notNull(),
  patientId: text("patient_id").references(() => patients.id).notNull(),
  assignedWorkerId: text("assigned_worker_id").notNull(),
  assignedWorkerName: text("assigned_worker_name").notNull(),
  delayHours: integer("delay_hours").default(0).notNull(),
  triggerReason: text("trigger_reason").notNull(),
  status: text("status").notNull(), // Pending, In Progress, Contacted, Completed
  urgency: text("urgency").notNull(), // Routine, Priority, Urgent
  actionTaken: text("action_taken"),
  notes: text("notes"),
  lastContactDate: text("last_contact_date"),
  nextAction: text("next_action"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// 12. Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientType: text("recipient_type").notNull(), // patient, frontline_worker, facility_officer, district_admin
  recipientId: text("recipient_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // appointment, stalled_referral, referral_accepted, follow_up, high_risk
  referralId: text("referral_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 13. Audit Logs (Government Grade Traceability)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Offline Sync Queue (For low-connectivity frontline field sync)
export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  operation: text("operation").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull(), // pending, synced, failed
  retryCount: integer("retry_count").default(0).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationships
export const facilitiesRelations = relations(facilities, ({ many }) => ({
  specialists: many(specialists),
  diagnostics: many(diagnostics),
  medicines: many(medicines),
  outgoingReferrals: many(referrals, { relationName: "sourceFacility" }),
  incomingReferrals: many(referrals, { relationName: "destinationFacility" }),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  triageRecords: many(triageRecords),
  referrals: many(referrals),
  appointments: many(appointments),
  followups: many(followups),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  patient: one(patients, {
    fields: [referrals.patientId],
    references: [patients.id],
  }),
  sourceFacility: one(facilities, {
    fields: [referrals.sourceFacilityId],
    references: [facilities.id],
    relationName: "sourceFacility",
  }),
  destinationFacility: one(facilities, {
    fields: [referrals.destinationFacilityId],
    references: [facilities.id],
    relationName: "destinationFacility",
  }),
  events: many(referralEvents),
  appointments: many(appointments),
  followups: many(followups),
}));
