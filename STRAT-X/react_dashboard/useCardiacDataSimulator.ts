/**
 * @file useCardiacDataSimulator.ts
 * @description
 * This custom React hook is the core of the HeartSenseAI simulation. It manages all patient data,
 * simulates real-time physiological data streams (ECG, vitals), handles alerts, and orchestrates
 * the HeartSenseAI predictive analysis feature.
 *
 * Key Responsibilities:
 * - State management for patients and their detailed simulation data.
 * - Persistence of patient lists and vital sign logs to localStorage.
 * - High-frequency simulation loop (ECG, waveforms) for visual fidelity.
 * - Low-frequency simulation loop (BP, Temp, alerts, vital logging) for periodic updates.
 * - Generation and management of clinical alerts based on configurable thresholds.
 * - Integration with a mock AI for the HeartSenseAI risk prediction feature.
 * - Provides an API for the rest of the application to interact with patient data (add, delete, update, etc.).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CardiacMetrics, ECGDataPoint, TrendDataPoint, Alert, AlertSeverity, Patient, PersonalizedAlertThresholds, CardiacRhythm, LoggedVitalSign, PacerSettings, PatientSpecificSimData, HeartSenseAIState, HeartSenseAIRiskLevel, HeartSenseAIOutput, AlarmFeedbackType, AlarmFeedbackEntry, PersistentPatientData, CardiacDataSimulator } from './types';
import {
  SIMULATION_VITALS_INTERVAL_MS,
  SIMULATION_ECG_INTERVAL_MS,
  BP_UPDATE_INTERVAL_MS,
  TEMP_UPDATE_INTERVAL_MS,
  RR_UPDATE_INTERVAL_MS,
  AUTO_LOG_VITALS_INTERVAL_SECONDS,
  MAX_ECG_DATA_POINTS,
  MAX_HR_TREND_DATA_POINTS,
  ALERT_THRESHOLDS,
  generateUniqueId,
  getDefaultMetrics,
  getInitialEcgData,
  getInitialSpo2Data,
  getInitialRespData,
  RHYTHM_PARAMS,
  ECG_P_WAVE_PATTERN,
  ECG_PACER_SPIKE_PATTERN,
  ECG_PACED_QRS_PATTERN,
  ECG_SPO2_PULSE_PATTERN,
  ECG_SPO2_BASELINE_VALUE,
  SPO2_PULSE_POINTS_DURATION,
  RESP_AMPLITUDE,
  stretchPattern,
  INITIAL_HEARTSENSE_AI_STATE,
  HEARTSENSE_AI_ANALYSIS_INTERVAL_MS,
  HEARTSENSE_LOGGED_VITALS_COUNT,
  INITIAL_ALARM_FEEDBACK_LOG,
  INITIAL_PATIENTS
} from './constants';

// --- HELPER FUNCTIONS ---

// Helper to generate random numbers within a specified range.
const generateRandomInRange = (min: number, max: number, decimalPlaces: number = 0): number => {
  const factor = Math.pow(10, decimalPlaces);
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimalPlaces));
};


const createInitialPatientSimData = (patient: Patient): PatientSpecificSimData => {
    const rhythmParams = RHYTHM_PARAMS[patient.activeRhythm] || RHYTHM_PARAMS.NSR;
    const initialHR = rhythmParams.simulatedHR();
    return {
        metrics: getDefaultMetrics(initialHR),
        ecgData: getInitialEcgData(),
        spo2WaveData: getInitialSpo2Data(),
        respWaveData: getInitialRespData(),
        heartRateTrend: [],
        alerts: [],
        ecgPatternBuffer: [],
        ecgBufferIndex: 0,
        ecgCurrentTime: 0,
        wenckebachCycleBeat: 0,
        currentPRPoints: 0,
        mobitzBeatInCycle: 0,
        lastPWaveTime: 0,
        lastQRSWaveTime: 0,
        nextRRIntervalPoints: 0,
        pWaveCyclePosition: 0,
        acknowledgedAlertIds: new Set(),
        loggedVitals: [],
        timeSinceLastCardiacEventMs: 0,
        lastBeatTimestamp: 0,
        heartSenseAIState: { ...INITIAL_HEARTSENSE_AI_STATE },
        alarmFeedbackLog: [],
        currentTargetHeartRate: initialHR,
        lastBPUpdate: 0,
        lastTempUpdate: 0,
        lastRRUpdate: 0,
        lastSpo2UpdateAttempt: 0,
        nonNsrRhythmStartTime: patient.activeRhythm === 'NSR' ? null : Date.now(),
        isLeadOff: false,
        spo2PulsePatternBuffer: [],
        spo2PulseBufferIndex: 0,
        spo2NextPulseDue: false,
        respirationCyclePosition: 0,
    };
};

/**
 * Simulates an AI analysis of patient data, returning a risk assessment.
 * This function replaces a real API call to provide functionality without needing an API key.
 * @param patient The patient being analyzed.
 * @param simData The patient's current simulation data.
 * @returns A promise that resolves to a `HeartSenseAIOutput` object.
 */
const mockRunHeartSenseAIAnalysis = async (patient: Patient, simData: PatientSpecificSimData): Promise<HeartSenseAIOutput> => {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, generateRandomInRange(1500, 3000)));

    const { metrics, alerts } = simData;
    const rhythmParams = RHYTHM_PARAMS[patient.activeRhythm];

    let riskScore = generateRandomInRange(5, 20);
    let riskLevel = HeartSenseAIRiskLevel.STABLE;
    let predictionReasoning = "Patient vitals are stable and within normal parameters.";
    
    const unacknowledgedAlerts = alerts.filter(a => !simData.acknowledgedAlertIds.has(a.id));
    const hasCriticalAlerts = unacknowledgedAlerts.some(a => a.severity === AlertSeverity.CRITICAL);
    const hasWarningAlerts = unacknowledgedAlerts.some(a => a.severity === AlertSeverity.WARNING);

    // Rule-based logic to determine risk
    if (rhythmParams.isLethal) {
        riskScore = generateRandomInRange(90, 98);
        riskLevel = HeartSenseAIRiskLevel.CRITICAL;
        predictionReasoning = `Lethal rhythm (${rhythmParams.displayName}) detected, immediate intervention required.`;
    } else if (hasCriticalAlerts) {
        riskScore = generateRandomInRange(75, 90);
        riskLevel = HeartSenseAIRiskLevel.HIGH;
        const criticalAlert = unacknowledgedAlerts.find(a => a.severity === AlertSeverity.CRITICAL)!;
        const alertReason = patient.diagnosis === 'Congestive Heart Failure' && criticalAlert.metric.includes('SpO')
            ? `High risk due to critical alert for ${criticalAlert.message}, indicating potential CHF decompensation.`
            : `High risk due to critical alert for ${criticalAlert.metric}: ${criticalAlert.message}.`;
        predictionReasoning = alertReason;
    } else if (patient.activeRhythm !== 'NSR' && !['SINUS_TACHYCARDIA', 'SINUS_BRADYCARDIA', 'FIRST_DEGREE_AV_BLOCK'].includes(patient.activeRhythm)) {
        riskScore = generateRandomInRange(50, 75);
        riskLevel = HeartSenseAIRiskLevel.MODERATE;
        const diagnosisContext = patient.diagnosis ? ` in patient with ${patient.diagnosis}` : '';
        predictionReasoning = `Moderate risk due to sustained abnormal rhythm (${rhythmParams.displayName})${diagnosisContext}.`;
    } else if (hasWarningAlerts) {
        riskScore = generateRandomInRange(30, 50);
        riskLevel = HeartSenseAIRiskLevel.MODERATE;
        const warningAlert = unacknowledgedAlerts.find(a => a.severity === AlertSeverity.WARNING)!;
        predictionReasoning = `Moderate risk due to warning for ${warningAlert.metric}.`;
    } else if (patient.activeRhythm === 'SINUS_TACHYCARDIA' || metrics.heartRate > 100) {
        riskScore = generateRandomInRange(20, 40);
        riskLevel = HeartSenseAIRiskLevel.LOW;
        predictionReasoning = "Low risk, monitoring for sustained tachycardia is advised.";
    } else if (patient.activeRhythm === 'SINUS_BRADYCARDIA' || metrics.heartRate < 60) {
        riskScore = generateRandomInRange(20, 40);
        riskLevel = HeartSenseAIRiskLevel.LOW;
        predictionReasoning = "Low risk, monitoring for symptomatic bradycardia.";
    }

    if (simData.loggedVitals.length < HEARTSENSE_LOGGED_VITALS_COUNT / 2) {
        riskLevel = HeartSenseAIRiskLevel.INSUFFICIENT_DATA;
        riskScore = 0;
        predictionReasoning = "Insufficient historical data for a comprehensive analysis.";
    }
    
    return {
        riskScore,
        riskLevel,
        predictionReasoning,
        confidenceScore: generateRandomInRange(85, 98),
    };
};


export const useCardiacDataSimulator = (organizationName?: string | null): CardiacDataSimulator => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [simulationDataMap, setSimulationDataMap] = useState(new Map<string, PatientSpecificSimData>());
    const isInitialLoad = useRef(true);

    // --- INITIALIZATION ---
    useEffect(() => {
        // No API key initialization needed anymore.
    }, []);

    // --- DATA PERSISTENCE ---
    useEffect(() => {
        if (!organizationName) return;

        try {
            const storedData = localStorage.getItem(`cardiacMonitorData_${organizationName}`);
            if (storedData) {
                const data = JSON.parse(storedData);
                const loadedPatients = data.patients ?? INITIAL_PATIENTS;
                setPatients(loadedPatients);
                
                const newSimMap = new Map<string, PatientSpecificSimData>();
                for (const p of loadedPatients) {
                    const persistentData: PersistentPatientData = data.persistentPatientData?.[p.id] || { loggedVitals: [], alarmFeedbackLog: [] };
                    const simData = createInitialPatientSimData(p);
                    simData.loggedVitals = persistentData.loggedVitals || [];
                    simData.alarmFeedbackLog = persistentData.alarmFeedbackLog || [];
                    if (persistentData.heartSenseAIState) {
                        simData.heartSenseAIState = {
                            ...persistentData.heartSenseAIState,
                            isLoading: false,
                            error: null,
                        };
                    }
                    newSimMap.set(p.id, simData);
                }
                setSimulationDataMap(newSimMap);

                if (loadedPatients.length > 0) {
                     setSelectedPatientId(prevId => loadedPatients.some((p: Patient) => p.id === prevId) ? prevId : loadedPatients[0].id);
                } else {
                    setSelectedPatientId(null);
                }

            } else {
                setPatients(INITIAL_PATIENTS);
                const initialSimMap = new Map<string, PatientSpecificSimData>();
                INITIAL_PATIENTS.forEach(p => initialSimMap.set(p.id, createInitialPatientSimData(p)));
                setSimulationDataMap(initialSimMap);
                if (INITIAL_PATIENTS.length > 0) {
                    setSelectedPatientId(INITIAL_PATIENTS[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            setPatients(INITIAL_PATIENTS); // Fallback
        } finally {
            isInitialLoad.current = false;
        }
    }, [organizationName]);

    useEffect(() => {
        if (!organizationName || isInitialLoad.current) return;
        try {
            const persistentPatientData: Record<string, PersistentPatientData> = {};
            simulationDataMap.forEach((simData, patientId) => {
                persistentPatientData[patientId] = {
                    loggedVitals: simData.loggedVitals,
                    alarmFeedbackLog: simData.alarmFeedbackLog,
                    heartSenseAIState: simData.heartSenseAIState,
                };
            });
            const dataToStore = {
                patients,
                persistentPatientData,
            };
            localStorage.setItem(`cardiacMonitorData_${organizationName}`, JSON.stringify(dataToStore));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }, [patients, simulationDataMap, organizationName]);


    const runHeartSenseAIAnalysis = useCallback(async (patient: Patient, simData: PatientSpecificSimData) => {
        if (simData.heartSenseAIState?.isLoading) return;

        setSimulationDataMap(prev => new Map(prev).set(patient.id, { ...simData, heartSenseAIState: { ...simData.heartSenseAIState!, isLoading: true } }));
        
        try {
            const aiOutput = await mockRunHeartSenseAIAnalysis(patient, simData);
            
            setSimulationDataMap(prev => {
                const currentSimData = prev.get(patient.id);
                if (!currentSimData) return prev;
                return new Map(prev).set(patient.id, {
                    ...currentSimData,
                    heartSenseAIState: {
                        ...aiOutput,
                        lastAnalyzedTimestamp: Date.now(),
                        isLoading: false,
                        error: null,
                    }
                });
            });
        } catch (error) {
            console.error("HeartSenseAI Mock Analysis Error:", error);
            setSimulationDataMap(prev => {
                const currentSimData = prev.get(patient.id);
                if (!currentSimData) return prev;
                const errorMessage = (error as Error).message || "Mock analysis failed.";

                return new Map(prev).set(patient.id, {
                    ...currentSimData,
                    heartSenseAIState: {
                        ...INITIAL_HEARTSENSE_AI_STATE,
                        riskLevel: HeartSenseAIRiskLevel.ERROR,
                        predictionReasoning: "An error occurred during analysis.",
                        lastAnalyzedTimestamp: Date.now(),
                        isLoading: false,
                        error: errorMessage,
                    }
                });
            });
        }
    }, []);


    // --- MAIN SIMULATION LOOPS ---
    useEffect(() => {
        // HIGH-FREQUENCY LOOP: ECG & WAVEFORMS
        const ecgIntervalId = setInterval(() => {
            setSimulationDataMap(prevMap => {
                const newMap = new Map<string, PatientSpecificSimData>();
                for (const [patientId, currentSimData] of prevMap.entries()) {
                    const patient = patients.find(p => p.id === patientId);
                    if (!patient) continue;

                    let newSimData = { ...currentSimData };
                    const now = Date.now();
                    const pointsPerSecond = 1000 / SIMULATION_ECG_INTERVAL_MS;

                    // Handle ECG Lead Off state
                    if (newSimData.isLeadOff) {
                        newSimData.metrics = { ...newSimData.metrics, heartRate: 0 };
                        newSimData.ecgData = [...newSimData.ecgData.slice(1), { time: newSimData.ecgCurrentTime, value: 0 }];
                        
                        const respRateHz = newSimData.metrics.respiratoryRate / 60;
                        const respCycleSeconds = respRateHz > 0 ? 1 / respRateHz : Infinity;
                        const respCyclePoints = respCycleSeconds * pointsPerSecond;
                        newSimData.respirationCyclePosition = (newSimData.respirationCyclePosition + 1) % respCyclePoints;
                        const respValue = Math.sin((newSimData.respirationCyclePosition / respCyclePoints) * 2 * Math.PI) * RESP_AMPLITUDE;
                        newSimData.respWaveData = [...newSimData.respWaveData.slice(1), { time: newSimData.ecgCurrentTime, value: respValue }];

                        let spo2Value = ECG_SPO2_BASELINE_VALUE;
                        if (newSimData.spo2PulseBufferIndex < newSimData.spo2PulsePatternBuffer.length) {
                           const pulseProgress = newSimData.spo2PulseBufferIndex / SPO2_PULSE_POINTS_DURATION;
                           const amplitude = (Math.sin(pulseProgress * Math.PI) * (newSimData.metrics.spo2 / 100));
                           spo2Value += newSimData.spo2PulsePatternBuffer[newSimData.spo2PulseBufferIndex] * 0.5 * Math.max(0.5, amplitude);
                           newSimData.spo2PulseBufferIndex++;
                        } else {
                           newSimData.spo2PulseBufferIndex = 0;
                           newSimData.spo2PulsePatternBuffer = [];
                           newSimData.spo2NextPulseDue = false;
                        }
                        newSimData.spo2WaveData = [...newSimData.spo2WaveData.slice(1), { time: newSimData.ecgCurrentTime, value: spo2Value }];
                        
                        newSimData.ecgCurrentTime++;
                        newMap.set(patientId, newSimData);
                        continue;
                    }
                    
                    const rhythmParams = RHYTHM_PARAMS[patient.activeRhythm];
                    const pacerSettings = patient.pacerSettings || { mode: 'Off', rate: 70 };
                    const pacerOn = pacerSettings.mode !== 'Off';
                    let heartRate = newSimData.metrics.heartRate;
                    let nextBeatDue = false;
                    let isPacedBeat = false;
                    
                    if (newSimData.nextRRIntervalPoints <= 0) {
                        nextBeatDue = true;
                        if (pacerOn && heartRate < pacerSettings.rate) {
                            newSimData.currentTargetHeartRate = pacerSettings.rate;
                            isPacedBeat = true;
                        } else {
                            newSimData.currentTargetHeartRate = rhythmParams.simulatedHR();
                        }
                        const newRate = newSimData.currentTargetHeartRate;
                        newSimData.nextRRIntervalPoints = newRate > 0 ? (60 / newRate) * pointsPerSecond : Infinity;
                    }
                    newSimData.nextRRIntervalPoints--;

                    let currentPattern: number[] = [];
                    let patternIndex = newSimData.ecgBufferIndex;
                    if (patternIndex > 0) {
                        currentPattern = newSimData.ecgPatternBuffer;
                    } else if (nextBeatDue) {
                        let basePattern = rhythmParams.basePattern;
                        if(patient.activeRhythm === 'THIRD_DEGREE_AV_BLOCK'){
                            if(now - newSimData.lastPWaveTime > 60000 / rhythmParams.atrialRate!){
                                newSimData.ecgPatternBuffer = ECG_P_WAVE_PATTERN;
                                newSimData.lastPWaveTime = now;
                            } else {
                                basePattern = rhythmParams.basePattern;
                            }
                        }
                        currentPattern = isPacedBeat ? [...ECG_PACER_SPIKE_PATTERN, ...ECG_PACED_QRS_PATTERN] : basePattern;
                        newSimData.ecgPatternBuffer = currentPattern;
                        newSimData.lastBeatTimestamp = now;
                        newSimData.spo2NextPulseDue = rhythmParams.generatesQRS || isPacedBeat; 
                    }

                    const newValue = currentPattern[patternIndex] || 0;
                    newSimData.ecgData = [...newSimData.ecgData.slice(1), { time: newSimData.ecgCurrentTime, value: newValue }];
                    newSimData.ecgCurrentTime++;
                    newSimData.ecgBufferIndex = patternIndex >= currentPattern.length - 1 ? 0 : patternIndex + 1;
                    if (newSimData.ecgBufferIndex === 0) newSimData.ecgPatternBuffer = [];

                    let spo2Value = ECG_SPO2_BASELINE_VALUE;
                    if(newSimData.spo2NextPulseDue && newSimData.spo2PulseBufferIndex === 0){
                        newSimData.spo2PulsePatternBuffer = ECG_SPO2_PULSE_PATTERN;
                    }
                    if(newSimData.spo2PulseBufferIndex < newSimData.spo2PulsePatternBuffer.length){
                        const pulseProgress = newSimData.spo2PulseBufferIndex / SPO2_PULSE_POINTS_DURATION;
                        const amplitude = (Math.sin(pulseProgress * Math.PI) * (newSimData.metrics.spo2 / 100));
                        spo2Value += newSimData.spo2PulsePatternBuffer[newSimData.spo2PulseBufferIndex] * 0.5 * Math.max(0.5, amplitude);
                        newSimData.spo2PulseBufferIndex++;
                    } else {
                        newSimData.spo2PulseBufferIndex = 0;
                        newSimData.spo2PulsePatternBuffer = [];
                        newSimData.spo2NextPulseDue = false;
                    }
                    newSimData.spo2WaveData = [...newSimData.spo2WaveData.slice(1), { time: newSimData.ecgCurrentTime, value: spo2Value }];
                    
                    const respRateHz = newSimData.metrics.respiratoryRate / 60;
                    const respCycleSeconds = respRateHz > 0 ? 1 / respRateHz : Infinity;
                    const respCyclePoints = respCycleSeconds * pointsPerSecond;
                    newSimData.respirationCyclePosition = (newSimData.respirationCyclePosition + 1) % respCyclePoints;
                    const respValue = Math.sin((newSimData.respirationCyclePosition / respCyclePoints) * 2 * Math.PI) * RESP_AMPLITUDE;
                    newSimData.respWaveData = [...newSimData.respWaveData.slice(1), { time: newSimData.ecgCurrentTime, value: respValue }];

                    newMap.set(patientId, newSimData);
                }
                return newMap;
            });
        }, SIMULATION_ECG_INTERVAL_MS);


        // LOW-FREQUENCY LOOP: VITALS, ALERTS, LOGGING, AI
        const vitalsIntervalId = setInterval(() => {
            const now = Date.now();
            setSimulationDataMap(prevMap => {
                const newMap = new Map<string, PatientSpecificSimData>();
                for (const [patientId, simData] of prevMap.entries()) {
                    const patient = patients.find(p => p.id === patientId);
                    if (!patient) {
                        newMap.set(patientId, simData);
                        continue;
                    };
                    
                    let newSimData = { ...simData };
                    let newMetrics = { ...newSimData.metrics };
                    let newAlerts = [...newSimData.alerts];
                    
                    // NOTE: Random lead off logic is removed. It is now controlled manually via toggleEcgLeadOff.

                    const rhythmParams = RHYTHM_PARAMS[patient.activeRhythm];
                    
                    const hrDiff = newSimData.currentTargetHeartRate - newMetrics.heartRate;
                    newMetrics.heartRate = newMetrics.heartRate + Math.sign(hrDiff) * Math.min(Math.abs(hrDiff), 2);
                    
                    if (now - (newSimData.lastBPUpdate || 0) > BP_UPDATE_INTERVAL_MS) {
                        newMetrics.bloodPressure = {
                            systolic: newMetrics.bloodPressure.systolic + generateRandomInRange(-3, 3),
                            diastolic: newMetrics.bloodPressure.diastolic + generateRandomInRange(-2, 2)
                        };
                        newSimData.lastBPUpdate = now;
                    }
                    if (now - (newSimData.lastTempUpdate || 0) > TEMP_UPDATE_INTERVAL_MS) {
                        newMetrics.temperature = newMetrics.temperature + generateRandomInRange(-0.1, 0.1, 1);
                        newSimData.lastTempUpdate = now;
                    }
                    if (now - (newSimData.lastRRUpdate || 0) > RR_UPDATE_INTERVAL_MS) {
                        let newRR = newMetrics.respiratoryRate + generateRandomInRange(-1, 1);
                        newMetrics.respiratoryRate = Math.max(8, Math.min(35, newRR));
                        newSimData.lastRRUpdate = now;
                    }

                    if (rhythmParams.isLethal) {
                        newMetrics = { ...newMetrics, bloodPressure: { systolic: 0, diastolic: 0 }, spo2: 0, respiratoryRate: 0 };
                    }
                    newSimData.metrics = newMetrics;
                    
                    const checkAlert = (metric: string, value: number, thresholds: any, personalizedThresholds: any, severity: AlertSeverity, type: 'low' | 'high') => {
                        const gt = thresholds;
                        const pt = personalizedThresholds;
                        let threshold;
                        if (type === 'low') threshold = severity === AlertSeverity.WARNING ? (pt?.lowWarning ?? gt.LOW_WARNING) : (pt?.lowCritical ?? gt.LOW_CRITICAL);
                        else threshold = severity === AlertSeverity.WARNING ? (pt?.highWarning ?? gt.HIGH_WARNING) : (pt?.highCritical ?? gt.HIGH_CRITICAL);
                        
                        const isTriggered = type === 'low' ? value < threshold : value > threshold;
                        if (isTriggered) {
                            const message = `${metric} ${type === 'low' ? 'Low' : 'High'}: ${value}`;
                            if (!newAlerts.some(a => a.message === message && a.severity === severity)) {
                                newAlerts.push({ id: generateUniqueId(), message, severity, timestamp: new Date(), metric });
                            }
                        }
                    };
                    
                    checkAlert('Heart Rate', newMetrics.heartRate, ALERT_THRESHOLDS.HEART_RATE, patient.personalizedThresholds?.heartRate, AlertSeverity.CRITICAL, 'low');
                    checkAlert('Heart Rate', newMetrics.heartRate, ALERT_THRESHOLDS.HEART_RATE, patient.personalizedThresholds?.heartRate, AlertSeverity.WARNING, 'low');
                    checkAlert('Heart Rate', newMetrics.heartRate, ALERT_THRESHOLDS.HEART_RATE, patient.personalizedThresholds?.heartRate, AlertSeverity.CRITICAL, 'high');
                    checkAlert('Heart Rate', newMetrics.heartRate, ALERT_THRESHOLDS.HEART_RATE, patient.personalizedThresholds?.heartRate, AlertSeverity.WARNING, 'high');
                    checkAlert('SpO₂', newMetrics.spo2, ALERT_THRESHOLDS.SPO2, patient.personalizedThresholds?.spo2, AlertSeverity.CRITICAL, 'low');
                    checkAlert('SpO₂', newMetrics.spo2, ALERT_THRESHOLDS.SPO2, patient.personalizedThresholds?.spo2, AlertSeverity.WARNING, 'low');
                    newSimData.alerts = newAlerts;

                    if (newSimData.loggedVitals.length === 0 || now - newSimData.loggedVitals[newSimData.loggedVitals.length-1].timestamp > AUTO_LOG_VITALS_INTERVAL_SECONDS * 1000) {
                        const updatedVitals = [...newSimData.loggedVitals, { timestamp: now, metrics: newMetrics }];
                        if(updatedVitals.length > 200) updatedVitals.shift();
                        newSimData.loggedVitals = updatedVitals;
                    }

                    if (now - (newSimData.heartSenseAIState?.lastAnalyzedTimestamp || 0) > HEARTSENSE_AI_ANALYSIS_INTERVAL_MS) {
                        runHeartSenseAIAnalysis(patient, newSimData);
                    }
                    
                    newMap.set(patientId, newSimData);
                }
                return newMap;
            });
        }, SIMULATION_VITALS_INTERVAL_MS);

        return () => {
            clearInterval(ecgIntervalId);
            clearInterval(vitalsIntervalId);
        };
    }, [patients, runHeartSenseAIAnalysis]);
    

    // --- PATIENT MANAGEMENT API ---
    const addPatient = useCallback((newPatientData: Omit<Patient, 'id' | 'activeRhythm' | 'pacerSettings' | 'personalizedThresholds' | 'noiseSignatures' | 'source'>, source = 'Manual Entry') => {
        const newPatient: Patient = {
            ...newPatientData,
            id: `PID${Date.now()}`,
            activeRhythm: 'NSR',
            pacerSettings: { mode: 'Off', rate: 70 },
            noiseSignatures: [],
            source,
        };
        const newSimData = createInitialPatientSimData(newPatient);
        
        setPatients(prev => [...prev, newPatient]);
        setSimulationDataMap(prev => new Map(prev).set(newPatient.id, newSimData));
        setSelectedPatientId(newPatient.id);
    }, []);

    const deletePatient = useCallback((patientId: string) => {
        // Use functional updates to prevent race conditions and stale state.
        setSimulationDataMap(prevMap => {
            const newMap = new Map(prevMap);
            newMap.delete(patientId);
            return newMap;
        });

        setPatients(prevPatients => {
            const newPatients = prevPatients.filter(p => p.id !== patientId);
            
            setSelectedPatientId(prevSelectedId => {
                if (prevSelectedId === patientId) {
                    return newPatients.length > 0 ? newPatients[0].id : null;
                }
                return prevSelectedId;
            });

            return newPatients;
        });
    }, []);

    const selectPatient = useCallback((patientId: string) => {
        setSelectedPatientId(patientId);
    }, []);

    const updatePatientDetails = useCallback((patientId: string, details: Partial<Patient>) => {
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...details } : p));
    }, []);

    const setPatientRhythm = useCallback((patientId: string, rhythm: CardiacRhythm) => {
        setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
                return { ...p, activeRhythm: rhythm };
            }
            return p;
        }));
        setSimulationDataMap(prev => {
             const newMap = new Map(prev);
             const simData = newMap.get(patientId);
             if (simData) {
                 const newSimData = { ...simData, currentTargetHeartRate: RHYTHM_PARAMS[rhythm].simulatedHR() };
                 newMap.set(patientId, newSimData);
             }
             return newMap;
        });
    }, []);
    
    const acknowledgePatientAlerts = useCallback((patientId: string, alertTypeToAcknowledge?: AlertSeverity) => {
        setSimulationDataMap(prev => {
            const newMap = new Map(prev);
            const simData = newMap.get(patientId);
            if (simData) {
                const newAcknowledged = new Set(simData.acknowledgedAlertIds);
                simData.alerts.forEach(alert => {
                    if (!alertTypeToAcknowledge || alert.severity === alertTypeToAcknowledge) {
                        newAcknowledged.add(alert.id);
                    }
                });
                const newSimData = { ...simData, acknowledgedAlertIds: newAcknowledged };
                newMap.set(patientId, newSimData);
            }
            return newMap;
        });
    }, []);
    
    const updatePatientPacingSettings = useCallback((patientId: string, settings: Partial<PacerSettings>) => {
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, pacerSettings: { ...p.pacerSettings!, ...settings } } : p));
    }, []);

    const updatePatientNoiseSignatures = useCallback((patientId: string, signatures: string[]) => {
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, noiseSignatures: signatures } : p));
    }, []);

    const provideAlarmFeedback = useCallback((patientId: string, feedbackType: Omit<AlarmFeedbackType, 'not_reviewed'>, alertSeverity: AlertSeverity) => {
         setSimulationDataMap(prev => {
            const newMap = new Map(prev);
            const simData = newMap.get(patientId);
            if (simData) {
                let newSimData = { ...simData };
                let newAlarmFeedbackLog = [...newSimData.alarmFeedbackLog];
                let newAcknowledgedAlertIds = new Set(newSimData.acknowledgedAlertIds);
                let shouldReconnectLead = false; // Flag to track if we're dealing with a lead off alert
                
                const unacknowledgedAlerts = newSimData.alerts
                    .filter((a: Alert) => a.severity === alertSeverity && !newAcknowledgedAlertIds.has(a.id));

                unacknowledgedAlerts.forEach((alert: Alert) => {
                    // If this is the lead off alert, set the flag.
                    if (alert.message === 'ECG Lead Off') {
                        shouldReconnectLead = true;
                    }

                    const feedbackEntry: AlarmFeedbackEntry = {
                        id: generateUniqueId(),
                        patientId,
                        alertSnapshot: {
                            message: alert.message,
                            severity: alert.severity,
                            metric: alert.metric,
                            originalTimestamp: new Date(alert.timestamp).getTime(),
                        },
                        feedback: feedbackType,
                        feedbackTimestamp: Date.now(),
                    };
                    newAlarmFeedbackLog.push(feedbackEntry);
                    newAcknowledgedAlertIds.add(alert.id);
                });
                
                // Update the feedback log and acknowledged IDs
                newSimData = { ...newSimData, alarmFeedbackLog: newAlarmFeedbackLog, acknowledgedAlertIds: newAcknowledgedAlertIds };
                
                // If the lead off alert was acknowledged, update the simulation state
                if (shouldReconnectLead) {
                    newSimData.isLeadOff = false;
                    // Also remove the alert from the active list for a clean state
                    newSimData.alerts = newSimData.alerts.filter(a => a.message !== 'ECG Lead Off');
                }

                newMap.set(patientId, newSimData);
            }
            return newMap;
        });
    }, []);

    const toggleEcgLeadOff = useCallback((patientId: string) => {
        setSimulationDataMap(prev => {
            const newMap = new Map(prev);
            const simData = newMap.get(patientId);
            if (simData) {
                const newIsLeadOff = !simData.isLeadOff;
                let newAlerts = [...simData.alerts];
                
                if (newIsLeadOff) {
                    // Add lead off alert if it doesn't exist
                    if (!newAlerts.some(a => a.message === 'ECG Lead Off')) {
                        newAlerts.push({
                            id: generateUniqueId(),
                            message: 'ECG Lead Off',
                            severity: AlertSeverity.CRITICAL,
                            timestamp: new Date(),
                            metric: 'ECG'
                        });
                    }
                } else {
                    // Remove lead off alert
                    newAlerts = newAlerts.filter(a => a.message !== 'ECG Lead Off');
                }

                const newSimData = { ...simData, isLeadOff: newIsLeadOff, alerts: newAlerts };
                newMap.set(patientId, newSimData);
            }
            return newMap;
        });
    }, []);


    return {
        patients,
        simulationDataMap,
        addPatient,
        deletePatient,
        selectPatient,
        selectedPatientId,
        updatePatientDetails,
        setPatientRhythm,
        acknowledgePatientAlerts,
        setPatients,
        updatePatientPacingSettings,
        updatePatientNoiseSignatures,
        provideAlarmFeedback,
        toggleEcgLeadOff,
    };
};
