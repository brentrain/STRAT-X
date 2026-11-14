

export type CardiacRhythm =
  | 'NSR'
  | 'VT'
  | 'SINUS_TACHYCARDIA'
  | 'SINUS_BRADYCARDIA'
  | 'VENTRICULAR_FIBRILLATION'
  | 'TORSADES_DE_POINTES'
  | 'FIRST_DEGREE_AV_BLOCK'
  | 'SECOND_DEGREE_AV_BLOCK_TYPE_I'
  | 'SECOND_DEGREE_AV_BLOCK_TYPE_II'
  | 'THIRD_DEGREE_AV_BLOCK'
  | 'ATRIAL_FIBRILLATION'
  | 'ATRIAL_FLUTTER'
  | 'SVT'
  | 'ASYSTOLE'; // Added Asystole

export interface PacerSettings {
  mode: 'Off' | 'Demand'; // Initially VVI-like demand pacing
  rate: number; // beats per minute, e.g., 70
  // output?: number; // mA, for future display/logic
}

export type PatientCodeStatus = 'DNR' | 'DNI' | 'NC' | 'CCO' | 'FULL_CODE';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  room: string;
  notes?: string;
  diagnosis?: string;
  personalizedThresholds?: PersonalizedAlertThresholds;
  activeRhythm: CardiacRhythm;
  pacerSettings?: PacerSettings; // Added for pacemaker configuration
  noiseSignatures?: string[]; // Added for Personalized Noise Signature Filtering
  codeStatus?: PatientCodeStatus; // Added for code status
  source?: string; // e.g., 'Manual Entry', 'Monitor: GE CARESCAPE'
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface CardiacMetrics {
  heartRate: number;
  bloodPressure: BloodPressure;
  spo2: number;
  temperature: number; // in Celsius
  respiratoryRate: number; // Added respiratory rate
}

export interface ECGDataPoint {
  time: number; // timestamp or sequence
  value: number;
}

export interface TrendDataPoint {
  time: string; // Formatted time string for X-axis
  value: number;
}

export enum AlertSeverity {
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface Alert {
  id:string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  metric: string; // e.g., 'Heart Rate', 'SpO2'
  // feedback?: AlarmFeedbackType; // This was considered, but feedback is logged separately for persistence
}

// New types for personalized thresholds
export interface MetricThresholds {
  lowWarning?: number;
  lowCritical?: number;
  highWarning?: number;
  highCritical?: number;
}

export interface PersonalizedAlertThresholds {
  heartRate?: MetricThresholds;
  bloodPressureSystolic?: MetricThresholds;
  bloodPressureDiastolic?: MetricThresholds;
  spo2?: Pick<MetricThresholds, 'lowWarning' | 'lowCritical'>; // SpO2 usually only has low alarms
  temperature?: MetricThresholds; // Added for personalized temperature thresholds
  respiratoryRate?: MetricThresholds; // Added for personalized RR thresholds
}

// For simulated authentication
export interface UserCredentials {
  organizationName: string;
  username: string;
  password?: string; // Password optional for some contexts, but required for login/creation
}

// For Vitals Logging
export interface LoggedVitalSign {
  timestamp: number; // e.g., Date.now()
  metrics: CardiacMetrics;
}

// HeartSenseAI Types
export enum HeartSenseAIRiskLevel {
  STABLE = 'Stable',
  LOW = 'Low Risk',
  MODERATE = 'Moderate Risk',
  HIGH = 'High Risk',
  CRITICAL = 'Critical Risk',
  PENDING = 'Pending Analysis',
  INSUFFICIENT_DATA = 'Insufficient Data',
  ERROR = 'Error Analyzing',
}

export interface HeartSenseAIOutput {
  riskScore: number; // 0-100
  riskLevel: HeartSenseAIRiskLevel;
  predictionReasoning: string;
  confidenceScore?: number; // 0-100 AI's confidence in its assessment
}

export interface HeartSenseAIState extends HeartSenseAIOutput {
  lastAnalyzedTimestamp: number;
  isLoading: boolean;
  error?: string | null; // Store error message if any
}

// For Closed-Loop Feedback Learning
export type AlarmFeedbackType = 'true_positive' | 'false_positive' | 'not_reviewed';

export interface AlarmFeedbackEntry {
  id: string; // Unique ID for the feedback entry itself
  patientId: string;
  // Snapshot of key alert details at the time of feedback
  alertSnapshot: {
    message: string;
    severity: AlertSeverity;
    metric: string;
    originalTimestamp: number; // Timestamp of the original alert
  };
  feedback: Omit<AlarmFeedbackType, 'not_reviewed'>; // Feedback is explicitly true or false positive
  feedbackTimestamp: number; // Timestamp when the feedback was provided
}

export interface PersistentPatientData {
  loggedVitals: LoggedVitalSign[];
  alarmFeedbackLog: AlarmFeedbackEntry[];
  heartSenseAIState?: HeartSenseAIState;
}


// For useCardiacDataSimulator hook
export interface PatientSpecificSimData {
  metrics: CardiacMetrics;
  ecgData: ECGDataPoint[];
  spo2WaveData: ECGDataPoint[]; // Added SpO2 waveform
  respWaveData: ECGDataPoint[]; // Added Respiration waveform
  heartRateTrend: TrendDataPoint[];
  alerts: Alert[];
  ecgPatternBuffer: number[];
  ecgBufferIndex: number;
  ecgCurrentTime: number;
  wenckebachCycleBeat: number;
  currentPRPoints: number;
  mobitzBeatInCycle: number;
  lastPWaveTime: number; 
  lastQRSWaveTime: number; 
  nextRRIntervalPoints: number;
  pWaveCyclePosition: number;
  acknowledgedAlertIds: Set<string>;
  loggedVitals: LoggedVitalSign[];
  timeSinceLastCardiacEventMs: number;
  lastBeatTimestamp?: number; 
  heartSenseAIState?: HeartSenseAIState;
  alarmFeedbackLog: AlarmFeedbackEntry[]; 
  currentTargetHeartRate: number; 
  lastBPUpdate?: number; 
  lastTempUpdate?: number; 
  lastSpo2UpdateAttempt?: number; 
  nonNsrRhythmStartTime?: number | null; 
  isLeadOff: boolean; // Changed from optional for ECG lead off simulation
  // For new waveforms
  spo2PulsePatternBuffer: number[];
  spo2PulseBufferIndex: number;
  spo2NextPulseDue: boolean;
  respirationCyclePosition: number;
  lastRRUpdate?: number; // Timestamp of the last RR update
}

// For CardiacDataSimulator hook return type
export interface CardiacDataSimulator {
  patients: Patient[];
  simulationDataMap: Map<string, PatientSpecificSimData>;
  addPatient: (newPatientData: Omit<Patient, 'id' | 'activeRhythm' | 'pacerSettings' | 'personalizedThresholds' | 'noiseSignatures' | 'source'>, source?: string) => void;
  deletePatient: (patientId: string) => void;
  selectPatient: (patientId: string) => void;
  selectedPatientId: string | null;
  updatePatientDetails: (patientId: string, details: Partial<Patient>) => void;
  setPatientRhythm: (patientId: string, rhythm: CardiacRhythm) => void;
  acknowledgePatientAlerts: (patientId: string, alertTypeToAcknowledge?: AlertSeverity) => void;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  updatePatientPacingSettings: (patientId: string, settings: Partial<PacerSettings>) => void;
  updatePatientNoiseSignatures: (patientId: string, signatures: string[]) => void;
  provideAlarmFeedback: (patientId: string, feedbackType: Omit<AlarmFeedbackType, 'not_reviewed'>, alertSeverity: AlertSeverity) => void;
  toggleEcgLeadOff: (patientId: string) => void; // Added for manual control
}