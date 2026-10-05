import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { 
  getFacilities, getFacilityById, calculateFacilityReadiness,
  getPatients, getPatientById, createPatient, createTriage,
  getReferrals, getReferralById, createReferral, transitionReferralStatus,
  getFollowups, resolveFollowup,
  getDiagnostics, getMedicines,
  getNotifications, markNotificationAsRead,
  getAuditLogs, getDistrictAnalytics, calculateOperationalRisk
} from './src/db/services.ts';
import { getOrCreateUser, getUsers, getUserByUid } from './src/db/users.ts';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini if key exists
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('Gemini AI Client init error (using deterministic fallback):', err);
  }
}

// ----------------- API ENDPOINTS -----------------

// Health & System
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    service: 'SwasthyaSetu CareLoop Core',
    timestamp: new Date().toISOString(),
    standard: 'ABDM/FHIR Interoperability-Ready',
  });
});

// Users & Session
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const list = await getUsers();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

app.post('/api/auth/sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, name, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email required' });
    }
    const user = await getOrCreateUser(uid, email, name, role);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Facilities & Readiness
app.get('/api/facilities', async (req: Request, res: Response) => {
  try {
    const list = await getFacilities();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch facilities' });
  }
});

app.get('/api/facilities/:id', async (req: Request, res: Response) => {
  try {
    const facility = await getFacilityById(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    res.json(facility);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch facility' });
  }
});

app.post('/api/facilities/:id/readiness', async (req: Request, res: Response) => {
  try {
    const { requiredSpecialty, requiredDiagnostics, requiredMedicines } = req.body;
    const readiness = await calculateFacilityReadiness(
      req.params.id,
      requiredSpecialty || 'General Medicine',
      requiredDiagnostics || [],
      requiredMedicines || []
    );
    if (!readiness) return res.status(404).json({ error: 'Facility not found' });
    res.json(readiness);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate facility readiness' });
  }
});

// Compare Facilities
app.post('/api/facilities/compare', async (req: Request, res: Response) => {
  try {
    const { facilityIds, requiredSpecialty, requiredDiagnostics, requiredMedicines } = req.body;
    const list = await getFacilities();
    const targetFacilities = facilityIds?.length 
      ? list.filter((f) => facilityIds.includes(f.id))
      : list.filter((f) => f.type !== 'PHC'); // Default compare receiving facilities

    const comparisons = await Promise.all(
      targetFacilities.map(async (fac) => {
        const readiness = await calculateFacilityReadiness(
          fac.id,
          requiredSpecialty || 'Cardiology',
          requiredDiagnostics || [],
          requiredMedicines || []
        );
        return {
          facility: fac,
          readiness,
        };
      })
    );

    res.json(comparisons);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compare facilities' });
  }
});

// Patients
app.get('/api/patients', async (req: Request, res: Response) => {
  try {
    const list = await getPatients();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch patients' });
  }
});

app.get('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch patient' });
  }
});

app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const { abhaId, name, age, gender, phone, village, taluka, district, bloodGroup, allergies, chronicConditions, preferredLanguage } = req.body;
    if (!name || !phone || !village) {
      return res.status(400).json({ error: 'Name, phone, and village are mandatory' });
    }
    const created = await createPatient({
      abhaId: abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      age: Number(age) || 35,
      gender: gender || 'Female',
      phone,
      village,
      taluka: taluka || 'Khandala',
      district: district || 'Satara',
      bloodGroup,
      allergies,
      chronicConditions,
      preferredLanguage: preferredLanguage || 'mr',
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to register patient' });
  }
});

// Assisted Triage
app.post('/api/triage', async (req: Request, res: Response) => {
  try {
    const { patientId, assessmentBy, symptoms, durationDays, vitals, urgency, requiredService, triageNotes, redFlagIdentified } = req.body;
    if (!patientId || !symptoms || !requiredService) {
      return res.status(400).json({ error: 'Patient, symptoms, and required service are mandatory' });
    }
    const record = await createTriage({
      patientId,
      assessmentBy: assessmentBy || 'Frontline Healthcare Worker',
      symptoms,
      durationDays: Number(durationDays) || 1,
      vitals: vitals || { bp: '120/80', pulse: 76, temp: '98.4', spo2: 98 },
      urgency: urgency || 'Routine',
      requiredService,
      triageNotes: triageNotes || 'Operational triage assessment completed at primary point of care.',
      redFlagIdentified: !!redFlagIdentified,
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record triage' });
  }
});

// Referrals
app.get('/api/referrals', async (req: Request, res: Response) => {
  try {
    const { status, patientId, sourceFacilityId, destinationFacilityId, isStalled } = req.query;
    const list = await getReferrals({
      status: status as string,
      patientId: patientId as string,
      sourceFacilityId: sourceFacilityId as string,
      destinationFacilityId: destinationFacilityId as string,
      isStalled: isStalled !== undefined ? isStalled === 'true' : undefined,
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch referrals' });
  }
});

app.get('/api/referrals/:id', async (req: Request, res: Response) => {
  try {
    const ref = await getReferralById(req.params.id);
    if (!ref) return res.status(404).json({ error: 'Referral not found' });
    res.json(ref);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch referral' });
  }
});

app.post('/api/referrals', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      sourceFacilityId,
      destinationFacilityId,
      referringDoctorId,
      referringDoctorName,
      requiredService,
      requiredSpecialty,
      requiredDiagnostics,
      requiredMedicines,
      clinicalSummary,
      urgency,
      readinessScore,
      readinessBreakdown,
      riskLevel,
      riskReasons,
      distanceKm,
    } = req.body;

    if (!patientId || !sourceFacilityId || !destinationFacilityId || !requiredService) {
      return res.status(400).json({ error: 'Missing required referral parameters' });
    }

    const created = await createReferral({
      patientId,
      sourceFacilityId,
      destinationFacilityId,
      referringDoctorId: referringDoctorId || 'DOC-MH-01',
      referringDoctorName: referringDoctorName || 'Dr. Rajesh Kulkarni',
      requiredService,
      requiredSpecialty: requiredSpecialty || 'General Medicine',
      requiredDiagnostics,
      requiredMedicines,
      clinicalSummary: clinicalSummary || 'Referral generated for specialized care coordination.',
      urgency: urgency || 'Routine',
      readinessScore,
      readinessBreakdown,
      riskLevel,
      riskReasons,
      distanceKm: Number(distanceKm) || 25,
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create referral' });
  }
});

app.post('/api/referrals/:id/transition', async (req: Request, res: Response) => {
  try {
    const { toStatus, actor, remarks, appointmentData } = req.body;
    if (!toStatus || !actor) {
      return res.status(400).json({ error: 'toStatus and actor are required' });
    }

    const updated = await transitionReferralStatus({
      referralId: req.params.id,
      toStatus,
      actor,
      remarks: remarks || `Status transitioned to ${toStatus}`,
      appointmentData,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to transition referral' });
  }
});

// AI Referral-Risk Decision Support
app.post('/api/risk/referral', async (req: Request, res: Response) => {
  try {
    const { urgency, distanceKm, appointmentDelayDays, previousMissedFollowup, diagnosticAvailability, medicineAvailability, isStalled, clinicalSummary } = req.body;

    // Fast deterministic rules evaluation
    const fallbackResult = calculateOperationalRisk({
      urgency: urgency || 'Routine',
      distanceKm: Number(distanceKm) || 25,
      appointmentDelayDays: Number(appointmentDelayDays) || 1,
      previousMissedFollowup: !!previousMissedFollowup,
      diagnosticAvailability: diagnosticAvailability !== false,
      medicineAvailability: medicineAvailability !== false,
      isStalled: !!isStalled,
    });

    // If Gemini is available, supplement with operational nuance (strictly no medical diagnosis)
    if (aiClient) {
      try {
        const prompt = `You are the CareLoop Operational Risk Analysis module for a rural public health referral system in India.
Analyze this operational context to evaluate referral completion risk (strictly operational barriers, transit, delay, and frontline action - DO NOT provide clinical diagnosis or drug recommendations):
- Urgency: ${urgency}
- Travel Distance: ${distanceKm} km
- Expected Appointment Delay: ${appointmentDelayDays} days
- Previous Missed Followup: ${previousMissedFollowup}
- Diagnostic Availability at Destination: ${diagnosticAvailability}
- Medicine Stock Availability: ${medicineAvailability}
- Stalled State: ${isStalled}

Return ONLY valid JSON matching this structure:
{
  "risk": "Low" | "Moderate" | "High",
  "riskScore": number between 0 and 100,
  "reasons": string[],
  "recommendedAction": string
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            ...parsed,
            engine: 'Gemini Operational Risk Model',
          });
        }
      } catch (aiErr) {
        console.warn('Gemini risk generation error, using fallback:', aiErr);
      }
    }

    res.json({
      ...fallbackResult,
      engine: 'Operational Risk Rules Engine',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to calculate risk' });
  }
});

// Follow-ups & Stalled Queue
app.get('/api/followups', async (req: Request, res: Response) => {
  try {
    const { workerId } = req.query;
    const list = await getFollowups(workerId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch followups' });
  }
});

app.post('/api/followups/:id/action', async (req: Request, res: Response) => {
  try {
    const { actionTaken, notes, status, nextAction, actor } = req.body;
    if (!actionTaken || !actor) {
      return res.status(400).json({ error: 'actionTaken and actor are required' });
    }
    const result = await resolveFollowup(Number(req.params.id), {
      actionTaken,
      notes: notes || '',
      status: status || 'Completed',
      nextAction,
      actor,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record follow-up action' });
  }
});

// Diagnostics & Medicines
app.get('/api/diagnostics', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.query;
    const list = await getDiagnostics(facilityId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch diagnostics' });
  }
});

app.get('/api/medicines', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.query;
    const list = await getMedicines(facilityId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch medicines' });
  }
});

// Notifications
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const { recipientType, recipientId } = req.query;
    const list = await getNotifications(recipientType as string, recipientId as string);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const result = await markNotificationAsRead(Number(req.params.id));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// District Analytics & KPIs
app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const data = await getDistrictAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

// Audit Logs
app.get('/api/audit-logs', async (req: Request, res: Response) => {
  try {
    const list = await getAuditLogs(50);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
});

// Offline Sync Queue Endpoint
app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const { clientId, operations } = req.body;
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.json({ syncedCount: 0, pending: 0, status: 'synced' });
    }

    const syncedResults: any[] = [];
    for (const op of operations) {
      // Execute queued offline actions
      if (op.type === 'CREATE_PATIENT') {
        const p = await createPatient(op.payload);
        syncedResults.push({ tempId: op.payload.tempId, realId: p.id });
      } else if (op.type === 'TRANSITION_REFERRAL') {
        await transitionReferralStatus(op.payload);
        syncedResults.push({ referralId: op.payload.referralId, status: 'synced' });
      } else if (op.type === 'RESOLVE_FOLLOWUP') {
        await resolveFollowup(op.payload.id, op.payload);
        syncedResults.push({ followupId: op.payload.id, status: 'synced' });
      }
    }

    res.json({
      syncedCount: syncedResults.length,
      syncedResults,
      serverTime: new Date().toISOString(),
      status: 'synchronized',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Sync operation failed' });
  }
});

// ----------------- VITE MIDDLEWARE SETUP -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
        hmr: process.env.DISABLE_HMR !== 'true' 
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SwasthyaSetu CareLoop] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
