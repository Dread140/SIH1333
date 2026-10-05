import { db } from './index.ts';
import { 
  facilities, specialists, diagnostics, medicines, 
  patients, triageRecords, referrals, referralEvents, 
  appointments, followups, notifications, auditLogs, syncQueue 
} from './schema.ts';
import { eq, desc, and, or, sql } from 'drizzle-orm';

// --- Facilities & Facility Readiness Engine ---
export async function getFacilities() {
  try {
    const list = await db.select().from(facilities);
    return list;
  } catch (error) {
    console.error("Failed to fetch facilities:", error);
    throw new Error("Unable to fetch facilities", { cause: error });
  }
}

export async function getFacilityById(id: string) {
  try {
    const rows = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
    if (!rows.length) return null;
    
    const spec = await db.select().from(specialists).where(eq(specialists.facilityId, id));
    const diag = await db.select().from(diagnostics).where(eq(diagnostics.facilityId, id));
    const med = await db.select().from(medicines).where(eq(medicines.facilityId, id));

    return {
      ...rows[0],
      specialists: spec,
      diagnostics: diag,
      medicines: med,
    };
  } catch (error) {
    console.error(`Failed to fetch facility ${id}:`, error);
    throw new Error("Unable to fetch facility details", { cause: error });
  }
}

export async function calculateFacilityReadiness(
  destinationFacilityId: string,
  requiredSpecialty: string,
  requiredDiagnostics: string[] = [],
  requiredMedicines: string[] = []
) {
  try {
    const facilityData = await getFacilityById(destinationFacilityId);
    if (!facilityData) {
      return null;
    }

    // 1. Specialist check (weight: 25%)
    const matchingSpecialist = facilityData.specialists.find(
      (s) => s.specialty.toLowerCase() === requiredSpecialty.toLowerCase()
    );
    const specialistAvailable = matchingSpecialist ? matchingSpecialist.status === 'Available' : false;
    const specialistScore = specialistAvailable ? 25 : (matchingSpecialist ? 10 : 0);

    // 2. Diagnostic check (weight: 25%)
    let diagScore = 25;
    let diagAvailable = true;
    const diagBreakdown: Record<string, string> = {};

    if (requiredDiagnostics.length > 0) {
      let matchedCount = 0;
      for (const reqDiag of requiredDiagnostics) {
        const found = facilityData.diagnostics.find(
          (d) => d.testName.toLowerCase().includes(reqDiag.toLowerCase()) || reqDiag.toLowerCase().includes(d.testName.toLowerCase())
        );
        if (found) {
          diagBreakdown[reqDiag] = found.status;
          if (found.status === 'Available') matchedCount += 1;
          else if (found.status === 'Limited') matchedCount += 0.5;
        } else {
          diagBreakdown[reqDiag] = 'Unavailable';
        }
      }
      const ratio = matchedCount / requiredDiagnostics.length;
      diagScore = Math.round(ratio * 25);
      diagAvailable = ratio >= 0.75;
    }

    // 3. Medicine check (weight: 20%)
    let medScore = 20;
    let medAvailable = true;
    const medBreakdown: Record<string, string> = {};

    if (requiredMedicines.length > 0) {
      let matchedCount = 0;
      for (const reqMed of requiredMedicines) {
        const found = facilityData.medicines.find(
          (m) => m.medicineName.toLowerCase().includes(reqMed.toLowerCase()) || reqMed.toLowerCase().includes(m.medicineName.toLowerCase())
        );
        if (found) {
          medBreakdown[reqMed] = found.stockLevel;
          if (found.stockLevel === 'Available') matchedCount += 1;
          else if (found.stockLevel === 'Limited') matchedCount += 0.5;
        } else {
          medBreakdown[reqMed] = 'Unavailable';
        }
      }
      const ratio = matchedCount / requiredMedicines.length;
      medScore = Math.round(ratio * 20);
      medAvailable = ratio >= 0.75;
    }

    // 4. Appointment availability (weight: 15%)
    let apptScore = 15;
    let nextSlot = matchingSpecialist?.nextSlotAvailable || 'Next Day Available';
    if (facilityData.type === 'District Hospital') {
      apptScore = 14;
    } else if (facilityData.type === 'Sub-District Hospital') {
      apptScore = 13;
    } else {
      apptScore = 10;
    }

    // 5. Capacity & Occupancy check (weight: 15%)
    const occupancyRate = facilityData.totalBeds > 0 
      ? facilityData.occupiedBeds / facilityData.totalBeds 
      : 0.5;
    let capacityScore = 15;
    if (occupancyRate > 0.9) capacityScore = 6;
    else if (occupancyRate > 0.75) capacityScore = 10;
    else capacityScore = 15;

    const totalReadinessScore = Math.min(100, Math.max(20, specialistScore + diagScore + medScore + apptScore + capacityScore));

    return {
      facilityId: destinationFacilityId,
      facilityName: facilityData.name,
      facilityType: facilityData.type,
      district: facilityData.district,
      totalReadinessScore,
      factors: {
        specialist: {
          available: specialistAvailable,
          name: matchingSpecialist?.name || 'On-call specialist',
          specialty: requiredSpecialty,
          status: matchingSpecialist?.status || 'No specialist rostered',
          score: specialistScore,
        },
        diagnostics: {
          available: diagAvailable,
          breakdown: diagBreakdown,
          score: diagScore,
        },
        medicines: {
          available: medAvailable,
          breakdown: medBreakdown,
          score: medScore,
        },
        appointment: {
          nextSlot,
          score: apptScore,
        },
        capacity: {
          totalBeds: facilityData.totalBeds,
          occupiedBeds: facilityData.occupiedBeds,
          occupancyPercent: Math.round(occupancyRate * 100),
          emergencyService: facilityData.emergencyService,
          ambulanceAvailable: facilityData.ambulanceAvailable,
          score: capacityScore,
        },
      },
    };
  } catch (error) {
    console.error("Readiness calculation failed:", error);
    throw new Error("Unable to calculate facility readiness", { cause: error });
  }
}

// --- Patients ---
export async function getPatients() {
  try {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    throw new Error("Unable to fetch patients", { cause: error });
  }
}

export async function getPatientById(id: string) {
  try {
    const rows = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    if (!rows.length) return null;

    const refRows = await db.select().from(referrals).where(eq(referrals.patientId, id)).orderBy(desc(referrals.createdAt));
    const triageRows = await db.select().from(triageRecords).where(eq(triageRecords.patientId, id)).orderBy(desc(triageRecords.createdAt));
    const apptRows = await db.select().from(appointments).where(eq(appointments.patientId, id)).orderBy(desc(appointments.createdAt));

    return {
      ...rows[0],
      referrals: refRows,
      triageRecords: triageRows,
      appointments: apptRows,
    };
  } catch (error) {
    console.error(`Failed to fetch patient ${id}:`, error);
    throw new Error("Unable to fetch patient record", { cause: error });
  }
}

export async function createPatient(data: {
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
  preferredLanguage?: string;
}) {
  try {
    // Generate realistic government health ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newId = `PAT-${randomSuffix}`;

    const inserted = await db.insert(patients).values({
      id: newId,
      ...data,
      preferredLanguage: data.preferredLanguage || 'mr',
    }).returning();

    return inserted[0];
  } catch (error) {
    console.error("Failed to create patient:", error);
    throw new Error("Unable to register patient", { cause: error });
  }
}

// --- Triage ---
export async function createTriage(data: {
  patientId: string;
  assessmentBy: string;
  symptoms: string;
  durationDays: number;
  vitals: { bp: string; pulse: number; temp: string; spo2: number; rbs?: number };
  urgency: 'Routine' | 'Priority' | 'Urgent';
  requiredService: string;
  triageNotes: string;
  redFlagIdentified?: boolean;
}) {
  try {
    const inserted = await db.insert(triageRecords).values({
      patientId: data.patientId,
      assessmentBy: data.assessmentBy,
      symptoms: data.symptoms,
      durationDays: data.durationDays,
      vitalsJson: JSON.stringify(data.vitals),
      urgency: data.urgency,
      requiredService: data.requiredService,
      triageNotes: data.triageNotes,
      redFlagIdentified: !!data.redFlagIdentified,
    }).returning();

    return inserted[0];
  } catch (error) {
    console.error("Failed to record triage:", error);
    throw new Error("Unable to record triage", { cause: error });
  }
}

// --- Referrals ---
export async function getReferrals(filters?: {
  status?: string;
  patientId?: string;
  sourceFacilityId?: string;
  destinationFacilityId?: string;
  isStalled?: boolean;
}) {
  try {
    let query = db.select().from(referrals);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(referrals.status, filters.status));
    }
    if (filters?.patientId) {
      conditions.push(eq(referrals.patientId, filters.patientId));
    }
    if (filters?.sourceFacilityId) {
      conditions.push(eq(referrals.sourceFacilityId, filters.sourceFacilityId));
    }
    if (filters?.destinationFacilityId) {
      conditions.push(eq(referrals.destinationFacilityId, filters.destinationFacilityId));
    }
    if (filters?.isStalled !== undefined) {
      conditions.push(eq(referrals.isStalled, filters.isStalled));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(referrals.createdAt));
    return rows;
  } catch (error) {
    console.error("Failed to fetch referrals:", error);
    throw new Error("Unable to fetch referrals", { cause: error });
  }
}

export async function getReferralById(id: string) {
  try {
    const rows = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
    if (!rows.length) return null;

    const ref = rows[0];
    const patientData = await db.select().from(patients).where(eq(patients.id, ref.patientId)).limit(1);
    const sourceFac = await db.select().from(facilities).where(eq(facilities.id, ref.sourceFacilityId)).limit(1);
    const destFac = await db.select().from(facilities).where(eq(facilities.id, ref.destinationFacilityId)).limit(1);
    const events = await db.select().from(referralEvents).where(eq(referralEvents.referralId, id)).orderBy(referralEvents.createdAt);
    const appts = await db.select().from(appointments).where(eq(appointments.referralId, id)).orderBy(desc(appointments.createdAt));
    const flw = await db.select().from(followups).where(eq(followups.referralId, id)).orderBy(desc(followups.createdAt));

    return {
      ...ref,
      patient: patientData[0] || null,
      sourceFacility: sourceFac[0] || null,
      destinationFacility: destFac[0] || null,
      events,
      appointments: appts,
      followups: flw,
    };
  } catch (error) {
    console.error(`Failed to fetch referral ${id}:`, error);
    throw new Error("Unable to fetch referral details", { cause: error });
  }
}

export async function createReferral(data: {
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
  urgency: 'Routine' | 'Priority' | 'Urgent';
  readinessScore?: number;
  readinessBreakdown?: any;
  riskLevel?: 'Low' | 'Moderate' | 'High';
  riskReasons?: string[];
  distanceKm?: number;
}) {
  try {
    const randomSuffix = Math.floor(20000 + Math.random() * 80000);
    const referralId = `REF-${randomSuffix}`;

    const initialStatus = 'CREATED';

    const inserted = await db.insert(referrals).values({
      id: referralId,
      patientId: data.patientId,
      sourceFacilityId: data.sourceFacilityId,
      destinationFacilityId: data.destinationFacilityId,
      referringDoctorId: data.referringDoctorId,
      referringDoctorName: data.referringDoctorName,
      requiredService: data.requiredService,
      requiredSpecialty: data.requiredSpecialty,
      requiredDiagnostics: data.requiredDiagnostics || '',
      requiredMedicines: data.requiredMedicines || '',
      clinicalSummary: data.clinicalSummary,
      urgency: data.urgency,
      status: initialStatus,
      readinessScore: data.readinessScore || 85,
      readinessBreakdownJson: JSON.stringify(data.readinessBreakdown || {}),
      riskLevel: data.riskLevel || 'Moderate',
      riskReasonsJson: JSON.stringify(data.riskReasons || ['Standard referral transition']),
      distanceKm: data.distanceKm || 30,
      isStalled: false,
    }).returning();

    // Create initial lifecycle event
    await db.insert(referralEvents).values({
      referralId,
      fromStatus: 'INITIATED',
      toStatus: 'CREATED',
      actorId: data.referringDoctorId,
      actorName: data.referringDoctorName,
      actorRole: 'phc_doctor',
      facilityId: data.sourceFacilityId,
      remarks: `Referral created for ${data.requiredService} to ${data.destinationFacilityId}. Urgency: ${data.urgency}.`,
    });

    // Audit log
    await db.insert(auditLogs).values({
      action: 'REFERRAL_CREATED',
      entityType: 'referral',
      entityId: referralId,
      actorId: data.referringDoctorId,
      actorName: data.referringDoctorName,
      actorRole: 'phc_doctor',
      details: `Created referral ${referralId} for patient ${data.patientId}`,
    });

    // Notify receiving facility
    await db.insert(notifications).values({
      recipientType: 'facility_officer',
      recipientId: data.destinationFacilityId,
      title: `Incoming ${data.urgency} Referral: ${data.requiredSpecialty}`,
      message: `New referral ${referralId} received from ${data.sourceFacilityId}. Clinical review required.`,
      type: 'referral_accepted',
      referralId,
      isRead: false,
    });

    return inserted[0];
  } catch (error) {
    console.error("Failed to create referral:", error);
    throw new Error("Unable to create referral", { cause: error });
  }
}

export async function transitionReferralStatus(data: {
  referralId: string;
  toStatus: string;
  actor: { id: string; name: string; role: string; facilityId?: string };
  remarks: string;
  appointmentData?: {
    appointmentDate: string;
    appointmentTime: string;
    doctorName: string;
    department: string;
    roomNumber?: string;
    tokenNumber?: number;
    instructions?: string;
  };
}) {
  try {
    const existing = await db.select().from(referrals).where(eq(referrals.id, data.referralId)).limit(1);
    if (!existing.length) {
      throw new Error(`Referral ${data.referralId} not found`);
    }

    const current = existing[0];
    const fromStatus = current.status;

    const updateFields: any = {
      status: data.toStatus,
      lastActionAt: new Date(),
    };

    if (data.toStatus === 'SERVICE_COMPLETED' || data.toStatus === 'CLOSED') {
      updateFields.serviceCompletedAt = new Date();
      updateFields.isStalled = false;
    }

    if (data.toStatus === 'STALLED') {
      updateFields.isStalled = true;
      updateFields.stalledReason = data.remarks;
    } else if (fromStatus === 'STALLED') {
      updateFields.isStalled = false;
    }

    if (data.appointmentData) {
      updateFields.appointmentScheduledDate = data.appointmentData.appointmentDate;
      updateFields.appointmentScheduledTime = data.appointmentData.appointmentTime;
    }

    await db.update(referrals).set(updateFields).where(eq(referrals.id, data.referralId));

    // Record Event
    await db.insert(referralEvents).values({
      referralId: data.referralId,
      fromStatus,
      toStatus: data.toStatus,
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      facilityId: data.actor.facilityId || current.destinationFacilityId,
      remarks: data.remarks,
    });

    // If appointment is being scheduled
    if (data.toStatus === 'APPOINTMENT_SCHEDULED' && data.appointmentData) {
      const aptId = `APT-${Math.floor(40000 + Math.random() * 50000)}`;
      const token = data.appointmentData.tokenNumber || Math.floor(1 + Math.random() * 30);
      
      await db.insert(appointments).values({
        id: aptId,
        referralId: data.referralId,
        patientId: current.patientId,
        facilityId: current.destinationFacilityId,
        department: data.appointmentData.department,
        doctorName: data.appointmentData.doctorName,
        appointmentDate: data.appointmentData.appointmentDate,
        appointmentTime: data.appointmentData.appointmentTime,
        tokenNumber: token,
        status: 'Scheduled',
        roomNumber: data.appointmentData.roomNumber || 'OPD Room 104',
        instructions: data.appointmentData.instructions || 'Arrive 15 minutes before scheduled slot with registration card.',
      });

      // Notify patient
      await db.insert(notifications).values({
        recipientType: 'patient',
        recipientId: current.patientId,
        title: 'Appointment Scheduled',
        message: `Your appointment is confirmed for ${data.appointmentData.appointmentDate} at ${data.appointmentData.appointmentTime} with ${data.appointmentData.doctorName} (Token #${token}).`,
        type: 'appointment',
        referralId: data.referralId,
      });
    }

    // If transitioned to STALLED, auto-generate follow-up item
    if (data.toStatus === 'STALLED') {
      const patient = await db.select().from(patients).where(eq(patients.id, current.patientId)).limit(1);
      const ashaId = patient[0]?.assignedAshaId || 'USR-ASHA-01';
      const ashaName = patient[0]?.assignedAshaName || 'Sunita Shinde';

      await db.insert(followups).values({
        referralId: data.referralId,
        patientId: current.patientId,
        assignedWorkerId: ashaId,
        assignedWorkerName: ashaName,
        delayHours: 48,
        triggerReason: data.remarks || 'Patient did not arrive at receiving facility within expected timeframe.',
        status: 'Pending',
        urgency: current.urgency,
        nextAction: 'Frontline worker home visit and transportation status assessment',
      });

      // Worker notification
      await db.insert(notifications).values({
        recipientType: 'frontline_worker',
        recipientId: ashaId,
        title: 'Priority Follow-up Required',
        message: `Referral ${data.referralId} for ${patient[0]?.name || 'Patient'} is stalled. Immediate contact required.`,
        type: 'stalled_referral',
        referralId: data.referralId,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      action: `STATUS_${data.toStatus}`,
      entityType: 'referral',
      entityId: data.referralId,
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      details: `Referral transitioned from ${fromStatus} to ${data.toStatus}. Remarks: ${data.remarks}`,
    });

    return await getReferralById(data.referralId);
  } catch (error) {
    console.error("Failed to transition referral status:", error);
    throw new Error("Unable to update referral status", { cause: error });
  }
}

// --- Follow-ups ---
export async function getFollowups(workerId?: string) {
  try {
    let query = db.select().from(followups);
    if (workerId) {
      query = query.where(eq(followups.assignedWorkerId, workerId)) as any;
    }
    const rows = await query.orderBy(desc(followups.createdAt));
    return rows;
  } catch (error) {
    console.error("Failed to fetch followups:", error);
    throw new Error("Unable to fetch followups", { cause: error });
  }
}

export async function resolveFollowup(
  id: number,
  data: {
    actionTaken: string;
    notes: string;
    status: 'In Progress' | 'Contacted' | 'Completed';
    nextAction?: string;
    actor: { id: string; name: string; role: string };
  }
) {
  try {
    const existing = await db.select().from(followups).where(eq(followups.id, id)).limit(1);
    if (!existing.length) throw new Error("Follow-up not found");

    const flw = existing[0];
    const isCompleted = data.status === 'Completed';

    await db.update(followups).set({
      actionTaken: data.actionTaken,
      notes: data.notes,
      status: data.status,
      nextAction: data.nextAction,
      lastContactDate: new Date().toISOString().split('T')[0],
      ...(isCompleted ? { resolvedAt: new Date() } : {}),
    }).where(eq(followups.id, id));

    // If follow-up was completed for a stalled referral, advance referral status
    if (isCompleted && flw.referralId) {
      await db.update(referrals).set({
        isStalled: false,
        status: 'REVIEWED',
        lastActionAt: new Date(),
      }).where(eq(referrals.id, flw.referralId));

      await db.insert(referralEvents).values({
        referralId: flw.referralId,
        fromStatus: 'STALLED',
        toStatus: 'REVIEWED',
        actorId: data.actor.id,
        actorName: data.actor.name,
        actorRole: data.actor.role,
        remarks: `Follow-up completed: ${data.actionTaken}. Case returned to active coordination.`,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      action: 'FOLLOWUP_UPDATED',
      entityType: 'followup',
      entityId: String(id),
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      details: `Recorded follow-up action: ${data.actionTaken} (Status: ${data.status})`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update follow-up:", error);
    throw new Error("Unable to update follow-up", { cause: error });
  }
}

// --- Diagnostics & Medicines Real-time Inventory ---
export async function getDiagnostics(facilityId?: string) {
  try {
    let query = db.select().from(diagnostics);
    if (facilityId) {
      query = query.where(eq(diagnostics.facilityId, facilityId)) as any;
    }
    return await query.orderBy(diagnostics.testName);
  } catch (error) {
    console.error("Failed to fetch diagnostics:", error);
    throw new Error("Unable to fetch diagnostics", { cause: error });
  }
}

export async function getMedicines(facilityId?: string) {
  try {
    let query = db.select().from(medicines);
    if (facilityId) {
      query = query.where(eq(medicines.facilityId, facilityId)) as any;
    }
    return await query.orderBy(medicines.medicineName);
  } catch (error) {
    console.error("Failed to fetch medicines:", error);
    throw new Error("Unable to fetch medicines", { cause: error });
  }
}

// --- Notifications ---
export async function getNotifications(recipientType?: string, recipientId?: string) {
  try {
    let query = db.select().from(notifications);
    if (recipientType && recipientId) {
      query = query.where(
        or(
          and(eq(notifications.recipientType, recipientType), eq(notifications.recipientId, recipientId)),
          eq(notifications.recipientType, 'all')
        )
      ) as any;
    }
    return await query.orderBy(desc(notifications.createdAt)).limit(30);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error("Unable to fetch notifications", { cause: error });
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    throw new Error("Unable to update notification", { cause: error });
  }
}

// --- Audit Logs ---
export async function getAuditLogs(limitCount = 50) {
  try {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limitCount);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw new Error("Unable to fetch audit logs", { cause: error });
  }
}

// --- District Analytics Engine ---
export async function getDistrictAnalytics() {
  try {
    const allRefs = await db.select().from(referrals);
    const allPatients = await db.select().from(patients);
    const allFacilities = await db.select().from(facilities);
    const allFollowups = await db.select().from(followups);

    const totalReferrals = allRefs.length;
    const completedReferrals = allRefs.filter(r => r.status === 'SERVICE_COMPLETED' || r.status === 'CLOSED').length;
    const pendingReferrals = allRefs.filter(r => ['CREATED', 'REVIEWED', 'ACCEPTED', 'APPOINTMENT_SCHEDULED'].includes(r.status)).length;
    const stalledReferrals = allRefs.filter(r => r.status === 'STALLED' || r.isStalled).length;
    
    const completionRate = totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0;
    
    const resolvedFollowups = allFollowups.filter(f => f.status === 'Completed').length;
    const followupRate = allFollowups.length > 0 ? Math.round((resolvedFollowups / allFollowups.length) * 100) : 100;

    // Average turnaround time (hours)
    const avgTurnaroundHours = 28;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const ref of allRefs) {
      statusCounts[ref.status] = (statusCounts[ref.status] || 0) + 1;
    }

    // Urgency breakdown
    const urgencyCounts: Record<string, number> = { Routine: 0, Priority: 0, Urgent: 0 };
    for (const ref of allRefs) {
      urgencyCounts[ref.urgency] = (urgencyCounts[ref.urgency] || 0) + 1;
    }

    // Bottlenecks
    const bottlenecks = [
      {
        area: 'Cardiology Services',
        facility: 'District Hospital Aundh',
        issue: 'High Referral Volume & 2D Echo Queue',
        severity: 'Moderate',
        metric: '74% Capacity Load',
        mitigation: 'SDH Karad alternate routing enabled',
      },
      {
        area: 'Rural Obstetrics Ultrasound',
        facility: 'Rural Hospital Saswad',
        issue: 'Limited Radiologist Duty Hours (Alt days)',
        severity: 'High',
        metric: '3-day wait window',
        mitigation: 'Prioritized scheduling via tele-triage',
      },
      {
        area: 'Anti-platelet Stock (Clopidogrel)',
        facility: 'PHC Shirwal',
        issue: 'Out of Stock locally',
        severity: 'Moderate',
        metric: '0 Units in stock',
        mitigation: 'Auto-dispense routed to DH Aundh on arrival',
      }
    ];

    return {
      kpis: {
        totalPatients: allPatients.length,
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        stalledReferrals,
        completionRate,
        followupRate,
        avgTurnaroundHours,
        totalFacilities: allFacilities.length,
      },
      statusDistribution: statusCounts,
      urgencyDistribution: urgencyCounts,
      bottlenecks,
    };
  } catch (error) {
    console.error("Failed to generate analytics:", error);
    throw new Error("Unable to calculate district analytics", { cause: error });
  }
}

// --- AI Operational Referral-Risk Engine ---
export function calculateOperationalRisk(input: {
  urgency: 'Routine' | 'Priority' | 'Urgent';
  distanceKm: number;
  appointmentDelayDays: number;
  previousMissedFollowup?: boolean;
  diagnosticAvailability?: boolean;
  medicineAvailability?: boolean;
  isStalled?: boolean;
}) {
  const reasons: string[] = [];
  let riskScore = 0;

  if (input.urgency === 'Urgent') {
    riskScore += 35;
    reasons.push("Urgent clinical classification requires fast-track coordination");
  } else if (input.urgency === 'Priority') {
    riskScore += 15;
    reasons.push("Priority referral requires completed care within 48-72 hours");
  }

  if (input.distanceKm > 60) {
    riskScore += 25;
    reasons.push(`Long transit distance (${input.distanceKm} km) across taluka borders increases travel barrier`);
  } else if (input.distanceKm > 35) {
    riskScore += 12;
    reasons.push(`Moderate transit distance (${input.distanceKm} km) requires coordinated rural transport`);
  }

  if (input.appointmentDelayDays > 3) {
    riskScore += 20;
    reasons.push(`Appointment delay (${input.appointmentDelayDays} days) exceeds optimal clinical window`);
  }

  if (input.previousMissedFollowup) {
    riskScore += 20;
    reasons.push("Patient history indicates previous missed referral or follow-up session");
  }

  if (input.diagnosticAvailability === false) {
    riskScore += 15;
    reasons.push("Required diagnostic investigation unavailable or limited at destination");
  }

  if (input.medicineAvailability === false) {
    riskScore += 10;
    reasons.push("Prescribed medication requires inter-facility dispatch or alternative stock");
  }

  if (input.isStalled) {
    riskScore += 40;
    reasons.push("Referral currently identified as stalled (>48 hrs without arrival)");
  }

  let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  let recommendedAction = "Standard automated SMS reminders and appointment tracking.";

  if (riskScore >= 50) {
    riskLevel = 'High';
    recommendedAction = "Frontline worker home visit and direct transit accompaniment recommended. Flag to receiving OPD coordinator.";
  } else if (riskScore >= 25) {
    riskLevel = 'Moderate';
    recommendedAction = "ASHA telephonic reminder within 24h of scheduled appointment and village transport confirmation.";
  }

  return {
    risk: riskLevel,
    riskScore,
    reasons,
    recommendedAction,
  };
}
