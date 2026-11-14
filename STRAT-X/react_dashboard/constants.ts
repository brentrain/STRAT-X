

import { Patient, AlertSeverity, CardiacMetrics, ECGDataPoint, CardiacRhythm, HeartSenseAIRiskLevel, HeartSenseAIState, AlarmFeedbackEntry } from './types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PID00123',
    name: 'John Doe',
    age: 68,
    gender: 'Male',
    room: 'ICU-305',
    notes: 'Patient stable, slight arrhythmia observed overnight.',
    diagnosis: 'Atrial Fibrillation (Mild)',
    personalizedThresholds: undefined,
    activeRhythm: 'NSR',
    pacerSettings: { mode: 'Off', rate: 70 },
    noiseSignatures: [],
    codeStatus: 'FULL_CODE',
  },
  {
    id: 'PID00124',
    name: 'Jane Smith',
    age: 74,
    gender: 'Female',
    room: 'ICU-306',
    notes: 'Post-op recovery, vitals within expected range. Monitor for pain.',
    diagnosis: 'Post-Coronary Artery Bypass Graft',
    personalizedThresholds: undefined,
    activeRhythm: 'NSR',
    pacerSettings: { mode: 'Off', rate: 70 },
    noiseSignatures: [],
    codeStatus: 'DNR',
  },
  {
    id: 'PID00125',
    name: 'Robert Jones',
    age: 82,
    gender: 'Male',
    room: 'ICU-307',
    notes: 'CHF Exacerbation. Monitoring fluid status closely.',
    diagnosis: 'Congestive Heart Failure',
    personalizedThresholds: undefined,
    activeRhythm: 'ATRIAL_FIBRILLATION',
    pacerSettings: { mode: 'Demand', rate: 60 },
    noiseSignatures: [],
    codeStatus: 'DNI',
  }
];

export const SIMULATION_VITALS_INTERVAL_MS = 1000; // Interval for checking alerts, logging vitals, and updating HR trend.
export const SIMULATION_ECG_INTERVAL_MS = 25;   // Update ECG, HR, and SpO2 every 25ms for smoother feel (40Hz).
export const BP_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // Update BP every 5 minutes.
export const TEMP_UPDATE_INTERVAL_MS = 10 * 60 * 1000; // Update Temperature every 10 minutes.
export const RR_UPDATE_INTERVAL_MS = 2 * 60 * 1000; // Update RR every 2 minutes.
export const AUTO_LOG_VITALS_INTERVAL_SECONDS = 60; // Log vitals automatically every 60 seconds

export const ECG_TIME_WINDOW_SECONDS = 10; // Display last 10 seconds of ECG
export const MAX_ECG_DATA_POINTS = Math.ceil(ECG_TIME_WINDOW_SECONDS * (1000 / SIMULATION_ECG_INTERVAL_MS));

export const HR_TREND_TIME_WINDOW_MINUTES = 5; // Display last 5 minutes of HR
export const MAX_HR_TREND_DATA_POINTS = HR_TREND_TIME_WINDOW_MINUTES * 60; // Assuming 1 data point per second

// Simplified QRS complex pattern (amplitude, duration implied by points)
export const ECG_BASE_PATTERN: number[] = [0,0,0.1,0.2,0.1,0,-0.1,0.5,1.5,-0.8,0.2,0,0.1,0.2,0.3,0.2,0.1,0,0,0];
export const ECG_VT_PATTERN: number[] = [0.5,1.0,0.5,0,-0.5,-1.0,-0.5,0,0.6,1.1,0.6,0,-0.6,-1.1,-0.6,0];
export const ECG_SINUS_TACHY_PATTERN: number[] = ECG_BASE_PATTERN; // Same pattern, faster rate
export const ECG_SINUS_BRADY_PATTERN: number[] = ECG_BASE_PATTERN; // Same pattern, slower rate
export const ECG_VF_PATTERN: number[] = [0.3,-0.2,0.5,-0.4,0.2,-0.1,0.4,-0.3,0.1,0,0.2,-0.2,0.3,-0.1,0.1,-0.3]; // Chaotic
export const ECG_TDP_PATTERN: number[] = [0.5,1,-0.5,-1.2,0.3,0.8,-0.2,-0.9,0.1,0.5,-0.1,-0.5,0.6,1.1,-0.6,-1.3]; // Twisting points
export const ECG_FIRST_DEGREE_AV_BLOCK_PATTERN: number[] = ECG_BASE_PATTERN; // Logic handles PR
export const ECG_SECOND_DEGREE_AV_BLOCK_TYPE_I_PATTERN: number[] = ECG_BASE_PATTERN; // Logic handles PR & drops
export const ECG_SECOND_DEGREE_AV_BLOCK_TYPE_II_PATTERN: number[] = ECG_BASE_PATTERN; // Logic handles drops
export const ECG_THIRD_DEGREE_AV_BLOCK_PATTERN: number[] = [-0.1,0.5,1.5,-0.8,0.2,0]; // Ventricular escape beat pattern
export const ECG_P_WAVE_PATTERN: number[] = [0,0,0.1,0.2,0.1,0,0,0]; // Isolated P-wave for blocks
export const ECG_ASYSTOLE_PATTERN: number[] = [0,0,0,0,0,0,0,0,0,0]; // Flat line

// Atrial Rhythms Patterns
export const ECG_AFIB_QRS_PATTERN: number[] = [0,-0.1,0.5,1.5,-0.8,0.2,0,0.1,0.2,0.1,0]; // Just QRS-T
export const ECG_AFIB_FIBRILLATORY_WAVE: number[] = [0,0.05,-0.05,0.03,-0.03,0.06,-0.04,0.02,-0.02]; // Small irregular waves
export const ECG_AFLUTTER_PATTERN: number[] = [ // F-wave 1 (sawtooth shape)
  0.0, 0.2, 0.4, 0.2, 0.0, -0.2, -0.4, -0.2, // F-wave 2
  0.0, 0.2, 0.4, 0.2, 0.0, -0.2, -0.4, -0.2, // Narrow QRS complex
  0.0, 0.1, 0.8, 1.5, -0.6, 0.1, 0.0, // Isoelectric segment
  0.0, 0.0, 0.0, 0.0
];
export const ECG_SVT_PATTERN: number[] = [0,0,0.5,1.5,-0.8,0.2,0,0.1,0.1,0,0]; // Rapid narrow QRS, minimal P/T

// Pacing related patterns
export const ECG_PACER_SPIKE_PATTERN: number[] = [0, 2.8, 0]; 
export const ECG_PACED_QRS_PATTERN: number[] = [0, 0.2, 0.6, 1.0, 0.4, -0.3, -0.5, -0.2, 0]; 

// New Waveform Patterns
export const ECG_SPO2_BASELINE_VALUE = 0.2;
export const ECG_SPO2_PULSE_PATTERN: number[] = [0.0, 0.4, 0.8, 1.0, 0.7, 0.5, 0.3, 0.15, 0.0]; // Relative to baseline, scaled amplitude
export const SPO2_PULSE_POINTS_DURATION = 18; // Approx 0.9s at 50ms interval, should be shorter than fastest typical beat cycle
export const RESP_AMPLITUDE = 1.0;
export const RESP_WAVEFORM_COLOR = "#38bdf8"; // sky-400 (Light Blue)
export const SPO2_WAVEFORM_COLOR = "#60a5fa"; // blue-400 (Darker Blue)


interface RhythmParameter {
  displayName: string;
  basePattern: number[];
  simulatedHR: () => number;
  prPoints?: number;
  wenckebachCycleLength?: number;
  blockConductionRatio?: [number, number];
  atrialRate?: number;
  isLethal?: boolean;
  ecgLineColor?: string;
  isIrregular?: boolean; 
  flutterWavePattern?: number[]; 
  qrsPattern?: number[]; 
  generatesQRS: boolean; // Indicates if this rhythm inherently produces a QRS complex for SpO2 pulse triggering
}

const generateRandomInRange = (min: number, max: number, decimalPlaces: number = 0): number => {
  const factor = Math.pow(10, decimalPlaces);
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimalPlaces));
};


export const RHYTHM_PARAMS: Record<CardiacRhythm, RhythmParameter> = {
  NSR: { displayName: 'Normal Sinus Rhythm', basePattern: ECG_BASE_PATTERN, simulatedHR: () => generateRandomInRange(60, 100), ecgLineColor: "#34d399", generatesQRS: true }, // emerald-400
  VT: { displayName: 'Ventricular Tachycardia', basePattern: ECG_VT_PATTERN, simulatedHR: () => 180, isLethal: true, ecgLineColor: "#ef4444", generatesQRS: true }, // red-500
  SINUS_TACHYCARDIA: { displayName: 'Sinus Tachycardia', basePattern: ECG_SINUS_TACHY_PATTERN, simulatedHR: () => generateRandomInRange(101, 150), ecgLineColor: "#34d399", generatesQRS: true },
  SINUS_BRADYCARDIA: { displayName: 'Sinus Bradycardia', basePattern: ECG_SINUS_BRADY_PATTERN, simulatedHR: () => generateRandomInRange(40, 59), ecgLineColor: "#34d399", generatesQRS: true },
  VENTRICULAR_FIBRILLATION: { displayName: 'Ventricular Fibrillation', basePattern: ECG_VF_PATTERN, simulatedHR: () => 300, isLethal: true, ecgLineColor: "#ef4444", generatesQRS: false }, // VF does not have organized QRS
  TORSADES_DE_POINTES: { displayName: 'Torsades de Pointes', basePattern: ECG_TDP_PATTERN, simulatedHR: () => generateRandomInRange(200, 250), isLethal: true, ecgLineColor: "#ef4444", generatesQRS: true },
  FIRST_DEGREE_AV_BLOCK: { displayName: '1st Degree AV Block', basePattern: ECG_FIRST_DEGREE_AV_BLOCK_PATTERN, simulatedHR: () => generateRandomInRange(60, 100), prPoints: 5, ecgLineColor: "#34d399", generatesQRS: true },
  SECOND_DEGREE_AV_BLOCK_TYPE_I: { displayName: '2nd Deg AV Block Type I', basePattern: ECG_SECOND_DEGREE_AV_BLOCK_TYPE_I_PATTERN, simulatedHR: () => generateRandomInRange(50, 90), wenckebachCycleLength: 5, ecgLineColor: "#fbbf24", generatesQRS: true }, // amber-400
  SECOND_DEGREE_AV_BLOCK_TYPE_II: { displayName: '2nd Deg AV Block Type II', basePattern: ECG_SECOND_DEGREE_AV_BLOCK_TYPE_II_PATTERN, simulatedHR: () => generateRandomInRange(40, 70), blockConductionRatio: [3,1], ecgLineColor: "#f97316", generatesQRS: true }, // orange-500
  THIRD_DEGREE_AV_BLOCK: { displayName: '3rd Degree AV Block', basePattern: ECG_THIRD_DEGREE_AV_BLOCK_PATTERN, simulatedHR: () => 40, atrialRate: 70, ecgLineColor: "#f97316", generatesQRS: true }, // Ventricular escape QRS
  ATRIAL_FIBRILLATION: {
    displayName: 'Atrial Fibrillation', basePattern: ECG_AFIB_FIBRILLATORY_WAVE, qrsPattern: ECG_AFIB_QRS_PATTERN,       
    simulatedHR: () => generateRandomInRange(70, 160), isIrregular: true, ecgLineColor: "#fbbf24", generatesQRS: true
  },
  ATRIAL_FLUTTER: {
    displayName: 'Atrial Flutter', basePattern: ECG_AFLUTTER_PATTERN, simulatedHR: () => 150, ecgLineColor: "#f97316", generatesQRS: true
  },
  SVT: {
    displayName: 'Supraventricular Tachycardia', basePattern: ECG_SVT_PATTERN, simulatedHR: () => generateRandomInRange(150, 220),
    ecgLineColor: "#fbbf24", generatesQRS: true
  },
  ASYSTOLE: {
    displayName: 'Asystole', basePattern: ECG_ASYSTOLE_PATTERN, simulatedHR: () => 0, isLethal: true, ecgLineColor: "#9ca3af", generatesQRS: false // gray-400
  },
};

export const ALL_AVAILABLE_RHYTHMS = Object.keys(RHYTHM_PARAMS) as CardiacRhythm[];


export const ALERT_THRESHOLDS = {
  HEART_RATE: { LOW_CRITICAL: 40, LOW_WARNING: 50, HIGH_WARNING: 110, HIGH_CRITICAL: 130, },
  BLOOD_PRESSURE_SYSTOLIC: { LOW_CRITICAL: 80, LOW_WARNING: 90, HIGH_WARNING: 160, HIGH_CRITICAL: 180, },
  BLOOD_PRESSURE_DIASTOLIC: { LOW_CRITICAL: 50, LOW_WARNING: 60, HIGH_WARNING: 100, HIGH_CRITICAL: 110, },
  SPO2: { LOW_CRITICAL: 88, LOW_WARNING: 92, },
  TEMPERATURE: { LOW_CRITICAL: 35.0, LOW_WARNING: 35.8, HIGH_WARNING: 38.0, HIGH_CRITICAL: 39.5, },
  RESPIRATORY_RATE: { LOW_CRITICAL: 8, LOW_WARNING: 10, HIGH_WARNING: 24, HIGH_CRITICAL: 30, }
};

export const STATUS_COLORS: Record<AlertSeverity | 'normal' | 'default', string> = {
  [AlertSeverity.CRITICAL]: 'text-red-500', 
  [AlertSeverity.WARNING]: 'text-amber-400', 
  normal: 'text-emerald-500', 
  default: 'text-slate-300',
};

export const STATUS_BACKGROUNDS: Record<AlertSeverity | 'normal' | 'default', string> = {
  [AlertSeverity.CRITICAL]: 'bg-red-500/10', 
  [AlertSeverity.WARNING]: 'bg-amber-400/10', 
  normal: 'bg-emerald-500/10',
  default: 'bg-slate-700',
};

export const HEART_ICON_COLORS: Record<AlertSeverity | 'normal' | 'default', string> = {
  [AlertSeverity.CRITICAL]: 'fill-red-500', 
  [AlertSeverity.WARNING]: 'fill-amber-400', 
  normal: 'fill-emerald-500', 
  default: 'fill-emerald-500', 
};


export const METRIC_UNITS = {
  heartRate: 'bpm',
  bloodPressure: 'mmHg',
  spo2: '%',
  temperature: '°C',
  respiratoryRate: 'br/min',
};

export const generateUniqueId = (): string => {
  return crypto.randomUUID();
};

export const HEARTSENSE_AI_ANALYSIS_INTERVAL_MS = 10 * 60 * 1000; 
export const HEARTSENSE_LOGGED_VITALS_COUNT = 20; 

export const HEARTSENSE_RISK_LEVEL_TEXT_COLORS: Record<HeartSenseAIRiskLevel, string> = {
  [HeartSenseAIRiskLevel.STABLE]: 'text-emerald-400',
  [HeartSenseAIRiskLevel.LOW]: 'text-sky-400', 
  [HeartSenseAIRiskLevel.MODERATE]: 'text-yellow-400', 
  [HeartSenseAIRiskLevel.HIGH]: 'text-orange-400', 
  [HeartSenseAIRiskLevel.CRITICAL]: 'text-red-500',
  [HeartSenseAIRiskLevel.PENDING]: 'text-slate-400',
  [HeartSenseAIRiskLevel.INSUFFICIENT_DATA]: 'text-slate-400',
  [HeartSenseAIRiskLevel.ERROR]: 'text-red-400',
};

export const HEARTSENSE_RISK_LEVEL_BG_COLORS: Record<HeartSenseAIRiskLevel, string> = {
  [HeartSenseAIRiskLevel.STABLE]: 'bg-emerald-500/10',
  [HeartSenseAIRiskLevel.LOW]: 'bg-sky-500/10',
  [HeartSenseAIRiskLevel.MODERATE]: 'bg-yellow-500/10',
  [HeartSenseAIRiskLevel.HIGH]: 'bg-orange-500/10',
  [HeartSenseAIRiskLevel.CRITICAL]: 'bg-red-500/10',
  [HeartSenseAIRiskLevel.PENDING]: 'bg-slate-700/50',
  [HeartSenseAIRiskLevel.INSUFFICIENT_DATA]: 'bg-slate-700/50',
  [HeartSenseAIRiskLevel.ERROR]: 'bg-red-500/20',
};

export const INITIAL_HEARTSENSE_AI_STATE: HeartSenseAIState = {
  riskScore: 0,
  riskLevel: HeartSenseAIRiskLevel.PENDING,
  predictionReasoning: 'Awaiting initial analysis.',
  confidenceScore: 0, 
  lastAnalyzedTimestamp: 0,
  isLoading: false,
  error: null,
};

export const INITIAL_ALARM_FEEDBACK_LOG: AlarmFeedbackEntry[] = [];


export const getDefaultMetrics = (hr?: number): CardiacMetrics => ({
  heartRate: hr || RHYTHM_PARAMS.NSR.simulatedHR(),
  bloodPressure: { systolic: 120, diastolic: 80 },
  spo2: 98,
  temperature: 37.0,
  respiratoryRate: generateRandomInRange(12,18), // Default RR
});

export const getInitialEcgData = (): ECGDataPoint[] =>
  Array(MAX_ECG_DATA_POINTS).fill(null).map((_, i) => ({ time: i, value: 0 }));

export const getInitialSpo2Data = (): ECGDataPoint[] =>
  Array(MAX_ECG_DATA_POINTS).fill(null).map((_, i) => ({ time: i, value: ECG_SPO2_BASELINE_VALUE }));

export const getInitialRespData = (): ECGDataPoint[] =>
  Array(MAX_ECG_DATA_POINTS).fill(null).map((_, i) => ({ time: i, value: 0 }));


export const stretchPattern = (pattern: number[], targetLength: number): number[] => {
  if (!pattern || pattern.length === 0 || targetLength <= 0) return Array(targetLength).fill(0);
  const stretched: number[] = [];
  if (targetLength >= pattern.length) { 
    const stretchFactor = targetLength / pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      const numRepeats = (i === pattern.length - 1) ?
        targetLength - stretched.length : 
        Math.max(1, Math.round(stretchFactor * (i + 1)) - Math.round(stretchFactor * i));
      for (let j = 0; j < numRepeats && stretched.length < targetLength; j++) {
        stretched.push(pattern[i]);
      }
    }
  } else { 
    for (let i = 0; i < targetLength; i++) {
      stretched.push(pattern[Math.floor(i * pattern.length / targetLength)]);
    }
  }
  while (stretched.length < targetLength) stretched.push(0);
  return stretched.slice(0, targetLength); 
};


// --- MOCK MONITOR DATA FOR CONNECTION SIMULATION ---

interface MockMonitorPatientData {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    diagnosis: string;
}

export interface MockMonitor {
  id: string;
  location: string;
  model: string;
  status: 'Online - Ready to Connect' | 'Offline' | 'Connecting';
  patientData: MockMonitorPatientData;
}

export const MOCK_NETWORK_MONITORS: MockMonitor[] = [
  {
    id: 'GE-CARESCAPE-A1B2C3D4',
    location: 'Room 401-A',
    model: 'GE CARESCAPE B650',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient 401-A', age: 58, gender: 'Female', diagnosis: 'Post-PCI Monitoring' }
  },
  {
    id: 'PHILIPS-IVUE-X3-E5F6G7H8',
    location: 'Room 402-B',
    model: 'Philips IntelliVue X3',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient 402-B', age: 72, gender: 'Male', diagnosis: 'Sepsis Query' }
  },
    {
    id: 'MINDRAY-BENEVISION-T1U2V3W4',
    location: 'PACU-1',
    model: 'Mindray BeneVision N17',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient PACU-1', age: 52, gender: 'Male', diagnosis: 'Post-Anesthesia Care' }
  },
  {
    id: 'DRAGER-INFINITY-I9J0K1L2',
    location: 'ED-Bay-3',
    model: 'Dräger Infinity M540',
    status: 'Offline',
    patientData: { name: 'Patient ED-3', age: 45, gender: 'Male', diagnosis: 'Chest Pain' }
  },
   {
    id: 'NIHON-KOHDEN-BSM-M3N4O5P6',
    location: 'ICU-308',
    model: 'Nihon Kohden BSM-6000',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient ICU-308', age: 66, gender: 'Female', diagnosis: 'Acute Respiratory Failure' }
  },
  {
    id: 'PHILIPS-MX750-L3M4N5O6',
    location: 'CCU-Bed-5',
    model: 'Philips IntelliVue MX750',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient CCU-5', age: 64, gender: 'Male', diagnosis: 'Post-MI Stenting' }
  },
  {
    id: 'GE-SOLAR-8000M-P7Q8R9S0',
    location: 'OR-2',
    model: 'GE Solar 8000M',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Patient OR-2', age: 77, gender: 'Female', diagnosis: 'Pre-Op for CABG' }
  }
];

export const MOCK_BLUETOOTH_MONITORS: MockMonitor[] = [
  {
    id: 'ZEPHYR-BP-XYZ-789',
    location: 'Ambulatory',
    model: 'Zephyr BioPatch',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Ambulatory Patient 1', age: 62, gender: 'Male', diagnosis: 'Holter Monitoring' }
  },
  {
    id: 'MASIMO-RD-ABC-123',
    location: 'Post-Op Ward',
    model: 'Masimo Radius-7',
    status: 'Online - Ready to Connect',
    patientData: { name: 'Post-Op Patient 3', age: 55, gender: 'Female', diagnosis: 'Continuous SpO2' }
  },
  {
    id: 'VITALCONNECT-VT-DEF-456',
    location: 'Telemetry-5',
    model: 'VitalConnect VitalPatch',
    status: 'Offline',
    patientData: { name: 'Telemetry Patient 5', age: 81, gender: 'Male', diagnosis: 'Arrhythmia Detection' }
  },
];