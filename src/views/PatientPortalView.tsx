import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, Stethoscope, 
  Phone, CheckCircle2, ChevronRight, FileText, ArrowRight, ShieldCheck, QrCode, Globe
} from 'lucide-react';
import { Patient, Referral, Appointment } from '../types/index.ts';
import { Language, translations } from '../lib/i18n.ts';

interface PatientPortalViewProps {
  patient: Patient;
  activeReferral?: Referral;
  appointments: Appointment[];
  lang: Language;
  onLangChange: (lang: Language) => void;
  onInspectCareJourney: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  patient,
  activeReferral,
  appointments,
  lang,
  onLangChange,
  onInspectCareJourney,
}) => {
  const t = translations[lang];
  const [showSlip, setShowSlip] = useState(false);

  // Localization strings
  const localized = {
    en: {
      greeting: "Good Morning,",
      welcomeSubtitle: "Here is your current public health care journey and next appointment step.",
      nextStep: "Your Next Care Step",
      consultation: "Cardiology Specialist Consultation & 2D Echo",
      dateSlot: "Tomorrow • 10:30 AM",
      hospital: "District Hospital Aundh, Pune",
      doctor: "Dr. Rajesh Shinde (Cardiologist)",
      room: "OPD Room 204 (2nd Floor)",
      token: "OPD Token #14",
      journeyProgress: "Care Journey Progress",
      stepNotice: "Referral accepted. Bed and diagnostic equipment verified functional.",
      viewJourneyBtn: "View Care Journey",
      viewSlipBtn: "View Appointment Slip",
      travelHelp: "Travel & Transit Assistance",
      transitNote: "Direct MSRTC bus runs every 45 mins from Shirwal ST Stand to Swargate / Aundh. Travel time is approx 1 hr 40 mins.",
      ashaContact: "Your Assigned ASHA Worker",
      digitalSlipTitle: "Government Health Referral & Appointment Slip",
      instructions: "Please arrive 15 minutes before the scheduled time with this digital token and previous prescription slips.",
    },
    mr: {
      greeting: "शुभ प्रभात,",
      welcomeSubtitle: "आपला आरोग्य उपचार प्रवास आणि पुढील नियोजित भेट येथे पहा.",
      nextStep: "आपला पुढील उपचार टप्पा",
      consultation: "हृदयरोग तज्ज्ञ तपासणी व २-डी इको",
      dateSlot: "उद्या • सकाळी १०:३० वाजता",
      hospital: "जिल्हा रुग्णालय औंध, पुणे",
      doctor: "डॉ. राजेश शिंदे (हृदयरोग तज्ज्ञ)",
      room: "ओपीडी कक्ष क्रमांक २०४ (दुसरा मजला)",
      token: "ओपीडी टोकन क्रमांक १४",
      journeyProgress: "उपचार प्रवासाची प्रगती",
      stepNotice: "रेफरल स्वीकारले आहे. तपासणी यंत्रणा व खाटांची उपलब्धता तपासली आहे.",
      viewJourneyBtn: "उपचार प्रवास पहा",
      viewSlipBtn: "अपॉइंटमेंट पावती पहा",
      travelHelp: "प्रवास व वाहतूक सहाय्य",
      transitNote: "शिरवळ एसटी स्टँडवरून पुण्याकरिता दर ४५ मिनिटांनी बस उपलब्ध आहे. प्रवासाचा कालावधी अंदाजे १ तास ४० मिनिटे आहे.",
      ashaContact: "आपल्या आशा सेविका",
      digitalSlipTitle: "शासकीय आरोग्य संदर्भ व अपॉइंटमेंट पावती",
      instructions: "कृपया दिलेल्या वेळेच्या १५ मिनिटे आधी या डिजिटल टोकनसह रुग्णालयात उपस्थित राहावे.",
    },
    hi: {
      greeting: "सुप्रभात,",
      welcomeSubtitle: "आपकी स्वास्थ्य देखभाल यात्रा और अगला निर्धारित कदम यहाँ देखें।",
      nextStep: "आपका अगला देखभाल कदम",
      consultation: "हृदयरोग विशेषज्ञ परामर्श एवं 2-डी इको",
      dateSlot: "कल • सुबह 10:30 बजे",
      hospital: "ज़िला अस्पताल औंध, पुणे",
      doctor: "डॉ. राजेश शिंदे (हृदयरोग विशेषज्ञ)",
      room: "ओपीडी कमरा नं. 204 (दूसरी मंज़िल)",
      token: "ओपीडी टोकन नं. 14",
      journeyProgress: "केयर यात्रा की प्रगति",
      stepNotice: "रेफरल स्वीकृत। मशीनें और डॉक्टर की उपलब्धता सुनिश्चित की गई है।",
      viewJourneyBtn: "केयर यात्रा देखें",
      viewSlipBtn: "अपॉइंटमेंट पर्ची देखें",
      travelHelp: "यात्रा एवं परिवहन सहायता",
      transitNote: "शिरवल बस स्टैंड से पुणे के लिए हर 45 मिनट में सरकारी बस उपलब्ध है। यात्रा समय लगभग 1 घंटा 40 मिनट है।",
      ashaContact: "आपकी आशा कार्यकर्ता",
      digitalSlipTitle: "शासकीय स्वास्थ्य रेफरल एवं अपॉइंटमेंट पर्ची",
      instructions: "कृपया निर्धारित समय से 15 मिनट पूर्व इस टोकन के साथ अस्पताल ओपीडी में पहुँचें।",
    }
  }[lang];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Patient Header with Language Switcher */}
      <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-sky-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <span className="text-xs font-semibold tracking-wide text-emerald-300">
              ABHA VERIFIED PATIENT
            </span>
          </div>

          {/* Simple Language Switcher for Patient */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => onLangChange('mr')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${lang === 'mr' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              मराठी
            </button>
            <button
              onClick={() => onLangChange('hi')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${lang === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => onLangChange('en')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${lang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          {localized.greeting} {patient.name}
        </h2>
        <div className="font-mono text-xs text-sky-200 mt-1">
          ABHA ID: {patient.abhaId} • {patient.village}, {patient.taluka}
        </div>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {localized.welcomeSubtitle}
        </p>
      </div>

      {/* Hero "Next Care Step" Card */}
      <div className="bg-white rounded-3xl border-2 border-sky-200 shadow-md p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-sky-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
          {localized.token}
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
          {localized.nextStep}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
          {localized.consultation}
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">Scheduled Time</span>
              <strong className="text-slate-900">{localized.dateSlot}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">Location</span>
              <strong className="text-slate-900">{localized.hospital}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Stethoscope className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">Specialist</span>
              <strong className="text-slate-900">{localized.doctor}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="text-slate-500 text-[11px] block">Designated Room</span>
              <strong className="text-slate-900">{localized.room}</strong>
            </div>
          </div>
        </div>

        {/* Progress Bar & Actions */}
        <div className="mt-5">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-700">{localized.journeyProgress}</span>
            <span className="text-sky-700">75% Complete (Step 4 of 6)</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full w-3/4"></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {localized.stepNotice}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setShowSlip(true)}
            className="w-full sm:w-auto flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl shadow text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>{localized.viewSlipBtn}</span>
          </button>
          <button
            onClick={onInspectCareJourney}
            className="w-full sm:w-auto flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl border border-slate-300 text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <span>{localized.viewJourneyBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Travel & Transit Information */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 text-xs space-y-3">
        <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{localized.travelHelp}</span>
        </h4>
        <p className="text-slate-600 leading-relaxed">
          {localized.transitNote}
        </p>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-800 block font-semibold">{localized.ashaContact}</span>
            <strong className="text-emerald-950 font-bold">Sunita Shinde</strong>
          </div>
          <a
            href="tel:+919822011982"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call ASHA</span>
          </a>
        </div>
      </div>

      {/* Digital Appointment Slip Modal */}
      {showSlip && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 text-xs relative">
            <button
              onClick={() => setShowSlip(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b-2 border-dashed border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Government Public Health System
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {localized.digitalSlipTitle}
              </h3>
              <div className="font-mono text-xs text-sky-700 font-bold mt-1">
                REF-20831 • TOKEN #14
              </div>
            </div>

            <div className="py-4 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ABHA Number:</span>
                <span className="font-mono font-bold text-slate-800">{patient.abhaId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital:</span>
                <span className="font-bold text-slate-900">District Hospital Aundh, Pune</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / OPD:</span>
                <span className="font-bold text-slate-900">Cardiology (Room 204)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-bold text-emerald-700">Oct 01, 2026 at 10:30 AM</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 text-[11px]">
              {localized.instructions}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs"
              >
                Print Official Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
