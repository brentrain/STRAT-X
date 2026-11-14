/**
 * @file PatientRowDisplay.tsx
 * @description
 * This component renders a single patient's complete monitoring row in the main dashboard.
 * It's a complex component that visualizes all critical information for a patient at a glance, including:
 * - Patient demographics and status.
 * - Real-time numerical vitals (BP, SpO2, RR, Temp).
 * - Live-streaming waveforms for ECG, SpO2, and Respiration.
 * - The HeartSenseAI risk analysis summary.
 * - Controls for viewing history, deleting the patient, and providing alarm feedback.
 *
 * @component
 */

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Area } from 'recharts';
import { Patient, CardiacMetrics, ECGDataPoint, Alert, AlertSeverity, LoggedVitalSign, PatientSpecificSimData, HeartSenseAIRiskLevel, HeartSenseAIState, AlarmFeedbackType } from '../types';
import { METRIC_UNITS, STATUS_COLORS, ALERT_THRESHOLDS, RHYTHM_PARAMS, HEART_ICON_COLORS, HEARTSENSE_RISK_LEVEL_TEXT_COLORS, HEARTSENSE_RISK_LEVEL_BG_COLORS, INITIAL_HEARTSENSE_AI_STATE, ECG_SPO2_BASELINE_VALUE, RESP_WAVEFORM_COLOR, SPO2_WAVEFORM_COLOR } from '../constants';
import VitalsHistoryModal from '@/components/VitalsHistoryModal';

interface PatientRowDisplayProps {
  patient: Patient;
  patientSimData: PatientSpecificSimData; 
  isSelected: boolean;
  onSelect: () => void;
  onDeletePatient: (patientId: string, patientName: string) => void;
  onAcknowledgeWarnings?: (patientId: string) => void; 
  onProvideFeedback: (patientId: string, feedbackType: Omit<AlarmFeedbackType, 'not_reviewed'>, alertSeverity: AlertSeverity) => void;
  onUpdatePatientNoiseSignatures: (patientId: string, signatures: string[]) => void;
}

/**
 * A compact display for a single vital sign metric.
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the metric (e.g., "BP").
 * @param {string | number} props.value - The value of the metric.
 * @param {string} props.unit - The unit for the metric (e.g., "mmHg").
 * @param {string} props.statusColorClass - Tailwind CSS class for the value's color, based on alert status.
 */
const CompactMetricDisplay: React.FC<{ label: string; value: string | number; unit: string; statusColorClass: string }> = ({ label, value, unit, statusColorClass }) => (
  <div className="text-xs sm:text-sm flex items-baseline">
    <span className="text-slate-400 mr-2 w-5 sm:w-6">{label}:</span>
    <span className={`font-semibold ${statusColorClass} min-w-[28px] sm:min-w-[30px] text-right`}>{value}</span>
    <span className="text-slate-500 ml-0.5 w-7 sm:w-8 text-xs">{unit}</span>
  </div>
);

/**
 * Displays the HeartSenseAI risk analysis output, including risk level, score, and reasoning.
 * Handles loading and error states.
 * @param {object} props - Component props.
 * @param {HeartSenseAIState} [props.aiState] - The current state of the AI analysis for the patient.
 */
const HeartSenseAIDisplay: React.FC<{ aiState?: HeartSenseAIState }> = ({ aiState }) => {
  const state = aiState || INITIAL_HEARTSENSE_AI_STATE;
  const { riskScore, riskLevel, predictionReasoning, isLoading, error } = state;

  const textColor = HEARTSENSE_RISK_LEVEL_TEXT_COLORS[riskLevel] || HEARTSENSE_RISK_LEVEL_TEXT_COLORS[HeartSenseAIRiskLevel.PENDING];
  const bgColor = HEARTSENSE_RISK_LEVEL_BG_COLORS[riskLevel] || HEARTSENSE_RISK_LEVEL_BG_COLORS[HeartSenseAIRiskLevel.PENDING];

  let displayText = `${riskLevel}`;
  if (riskLevel !== HeartSenseAIRiskLevel.PENDING && riskLevel !== HeartSenseAIRiskLevel.INSUFFICIENT_DATA && riskLevel !== HeartSenseAIRiskLevel.ERROR && !error) {
      displayText = `${riskLevel} (${riskScore})`;
  } else if (error && riskLevel === HeartSenseAIRiskLevel.ERROR) {
      displayText = "Error";
  } else if (error) { 
      displayText = "AI Offline"; 
  }

  return (
    <div className={`p-1.5 rounded-md ${bgColor}`} title={predictionReasoning || error || 'HeartSenseAI Analysis'}>
      <p className="text-xs text-sky-400 font-semibold mb-0.5">HeartSenseAI</p>
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin h-3 w-3 mr-1.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-slate-400">Analyzing...</span>
        </div>
      ) : (
        <span className={`text-sm font-bold ${textColor}`}>{displayText}</span>
      )}
      { !isLoading && (predictionReasoning || error) && (
          <p className="text-xs text-slate-400 mt-0.5 truncate" title={predictionReasoning || error}>
              {error ? error : predictionReasoning}
          </p>
      )}
    </div>
  );
};


const PatientRowDisplay: React.FC<PatientRowDisplayProps> = ({
  patient,
  patientSimData,
  isSelected,
  onSelect,
  onDeletePatient,
  onProvideFeedback,
}) => {
  const { metrics, ecgData, spo2WaveData, respWaveData, alerts, loggedVitals, acknowledgedAlertIds = new Set(), lastBeatTimestamp, heartSenseAIState, isLeadOff } = patientSimData;
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isBeating, setIsBeating] = useState(false);
  const lastBeatRef = useRef(lastBeatTimestamp);

  // Effect for the visual heart "beat" animation on the heart rate monitor.
  useEffect(() => {
    if (lastBeatTimestamp && lastBeatTimestamp !== lastBeatRef.current) {
      setIsBeating(true);
      lastBeatRef.current = lastBeatTimestamp;
      const timer = window.setTimeout(() => setIsBeating(false), 150); 
      return () => clearTimeout(timer);
    }
  }, [lastBeatTimestamp]);

  const unacknowledgedAlerts = alerts.filter(alert => !acknowledgedAlertIds.has(alert.id));
  const unacknowledgedWarningAlerts = unacknowledgedAlerts.filter(alert => alert.severity === AlertSeverity.WARNING);
  const unacknowledgedCriticalAlerts = unacknowledgedAlerts.filter(alert => alert.severity === AlertSeverity.CRITICAL);
  
  // Determines the color for a metric's value based on whether it breaches any thresholds.
  const getThresholdForStatus = (metricValue: number, metricType: keyof typeof ALERT_THRESHOLDS, personalizedMetricThresholds?: any): string => {
    const pt = personalizedMetricThresholds;
    const gt = ALERT_THRESHOLDS[metricType] as any;
    const lc = pt?.lowCritical ?? gt?.LOW_CRITICAL;
    const lw = pt?.lowWarning ?? gt?.LOW_WARNING;
    const hc = pt?.highCritical ?? gt?.HIGH_CRITICAL;
    const hw = pt?.highWarning ?? gt?.HIGH_WARNING;
    if ((lc !== undefined && metricValue < lc) || (hc !== undefined && metricValue > hc)) return STATUS_COLORS.critical;
    if ((lw !== undefined && metricValue < lw) || (hw !== undefined && metricValue > hw)) return STATUS_COLORS.warning;
    return STATUS_COLORS.normal;
  };

  const bpSysColor = getThresholdForStatus(metrics.bloodPressure.systolic, 'BLOOD_PRESSURE_SYSTOLIC', patient.personalizedThresholds?.bloodPressureSystolic);
  const bpDiaColor = getThresholdForStatus(metrics.bloodPressure.diastolic, 'BLOOD_PRESSURE_DIASTOLIC', patient.personalizedThresholds?.bloodPressureDiastolic);
  const spo2Color = getThresholdForStatus(metrics.spo2, 'SPO2', patient.personalizedThresholds?.spo2);
  const tempColor = getThresholdForStatus(metrics.temperature, 'TEMPERATURE', patient.personalizedThresholds?.temperature);
  const rrColor = getThresholdForStatus(metrics.respiratoryRate, 'RESPIRATORY_RATE', patient.personalizedThresholds?.respiratoryRate);

  const currentRhythmParams = RHYTHM_PARAMS[patient.activeRhythm];
  const isLethalRhythmActive = currentRhythmParams?.isLethal || false;
  const hasUnacknowledgedCriticalAlert = unacknowledgedCriticalAlerts.length > 0;
  const hasUnacknowledgedWarningAlert = unacknowledgedWarningAlerts.length > 0;
  
  // Determine the color of the central heart icon based on alert severity.
  let heartFillClass = HEART_ICON_COLORS.normal;
  if (isLethalRhythmActive || hasUnacknowledgedCriticalAlert) heartFillClass = HEART_ICON_COLORS.critical;
  else if (hasUnacknowledgedWarningAlert) heartFillClass = HEART_ICON_COLORS.warning;
  
  // Dynamic styling for the row based on selection and risk status.
  const rowBgClass = isSelected ? 'bg-slate-700/80' : 'bg-slate-800/80 hover:bg-slate-700/70';
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
  const handleFeedback = (feedbackType: Omit<AlarmFeedbackType, 'not_reviewed'>, severity: AlertSeverity) => {
    onProvideFeedback(patient.id, feedbackType, severity);
  };

  const ecgLineColor = currentRhythmParams?.ecgLineColor || RHYTHM_PARAMS.NSR.ecgLineColor;
  const isAbnormalRhythm = patient.activeRhythm !== 'NSR';
  const pacerActive = patient.pacerSettings && patient.pacerSettings.mode !== 'Off';
  
  const riskRingClass = 
    heartSenseAIState?.riskLevel === HeartSenseAIRiskLevel.CRITICAL ? 'ring-2 ring-red-500' 
    : heartSenseAIState?.riskLevel === HeartSenseAIRiskLevel.HIGH ? 'ring-1 ring-orange-400' 
    : isSelected ? 'ring-2 ring-sky-500' 
    : 'ring-1 ring-slate-700/80';

  return (
    <>
      <div
        className={`flex flex-col md:flex-row p-3 sm:p-4 rounded-xl shadow-lg transition-all duration-200 cursor-pointer ${rowBgClass} ${riskRingClass}`}
        role="article" 
        aria-labelledby={`patient-name-${patient.id}`}
        onClick={onSelect}
      >
        {/* SECTION: Info & Vitals Column */}
        <div className="flex-shrink-0 w-full md:w-48 lg:w-56 pr-0 md:pr-4 md:border-r md:border-slate-700 mb-3 md:mb-0">
          <p id={`patient-name-${patient.id}`} className="font-semibold text-lg truncate text-sky-400" title={patient.name}>
             {patient.name}
          </p>
          <p className="text-xs text-slate-400 mb-1">Rm: {patient.room} | Age: {patient.age} | {patient.gender.substring(0,1)}</p>
          {patient.source && patient.source !== 'Manual Entry' && (
              <p className="text-[11px] text-slate-500 italic mb-2" title={`Data Source: ${patient.source}`}>
                  Source: {patient.source}
              </p>
          )}

          <div className="space-y-1.5 mb-3">
             <CompactMetricDisplay label="BP" value={`${metrics.bloodPressure.systolic}/${metrics.bloodPressure.diastolic}`} unit={METRIC_UNITS.bloodPressure} statusColorClass={bpSysColor === bpDiaColor ? bpSysColor : 'text-amber-400'} />
             <CompactMetricDisplay label="SpO₂" value={metrics.spo2} unit={METRIC_UNITS.spo2} statusColorClass={spo2Color} />
             <CompactMetricDisplay label="RR" value={metrics.respiratoryRate} unit={METRIC_UNITS.respiratoryRate.split('/')[0]} statusColorClass={rrColor} />
             <CompactMetricDisplay label="Temp" value={metrics.temperature.toFixed(1)} unit={METRIC_UNITS.temperature} statusColorClass={tempColor} />
          </div>

          <div className="flex items-center space-x-2 mt-2">
             <button
               onClick={(e) => { stopPropagation(e); setShowHistoryModal(true); }}
               className="flex-1 p-1.5 text-xs font-medium rounded-md bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
               aria-label={`View vitals history for ${patient.name}`}
             >
               History
             </button>
              <button
               onClick={(e) => { stopPropagation(e); onDeletePatient(patient.id, patient.name); }}
               className="p-1.5 text-xs font-medium rounded-md bg-red-600/80 hover:bg-red-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
               aria-label={`Delete patient ${patient.name}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
             </button>
          </div>
          {patient.codeStatus && patient.codeStatus !== 'FULL_CODE' && (
            <div className="mt-2">
              <span className="font-semibold text-red-500 text-xs sm:text-sm">
                CODE STATUS: {patient.codeStatus}
              </span>
            </div>
          )}
        </div>

        {/* SECTION: Waveforms Column */}
        <div className="flex-grow min-w-0 px-0 md:px-4 mb-3 md:mb-0">
            <div className="relative h-20 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={ecgData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <defs>
                      <filter id={`ecgGlow-${patient.id}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
                          <feFlood floodColor={ecgLineColor} floodOpacity="0.8" result="color" />
                          <feComposite in="color" in2="blur" operator="in" result="glow" />
                          <feMerge>
                              <feMergeNode in="glow" />
                              <feMergeNode in="SourceGraphic" />
                          </feMerge>
                      </filter>
                    </defs>
                   <YAxis domain={[-2.5, 3.5]} hide={true} />
                   <XAxis dataKey="time" hide={true} />
                   <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={ecgLineColor} 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false} 
                    filter={`url(#ecgGlow-${patient.id})`}
                  />
                 </LineChart>
               </ResponsiveContainer>
               <div className="absolute top-1/2 left-2 sm:left-3 transform -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 24 24" className={`w-14 h-14 heart-icon ${heartFillClass} ${isBeating ? 'heart-beating' : ''}`} style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))'}} >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="absolute text-white font-bold text-base pointer-events-none" style={{textShadow: '0px 1px 2px rgba(0,0,0,0.8)'}}>
                    {metrics.heartRate}
                  </span>
               </div>
                <div className="absolute bottom-1 right-2 text-xs text-white/80 font-semibold pointer-events-none" style={{ textShadow: '0 1px 3px #000' }}>
                    {isLeadOff ? (
                        <span className="text-sm sm:text-base font-bold text-red-500 animate-pulse">
                            LEAD OFF
                        </span>
                    ) : (
                        <>
                            {isAbnormalRhythm && !pacerActive && <span>({currentRhythmParams?.displayName || patient.activeRhythm})</span>}
                            {pacerActive && <span className="text-teal-400">(Pacing: {patient.pacerSettings?.mode} @ {patient.pacerSettings?.rate}bpm)</span>}
                        </>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-x-3 mt-1">
              <div className="relative h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={spo2WaveData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                        <defs>
                          <linearGradient id={`spo2Gradient-${patient.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SPO2_WAVEFORM_COLOR} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={SPO2_WAVEFORM_COLOR} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis domain={[0, 1.5]} hide={true} /> 
                        <XAxis dataKey="time" hide={true} />
                        <Area type="monotone" dataKey="value" stroke={SPO2_WAVEFORM_COLOR} strokeWidth={2} fillOpacity={1} fill={`url(#spo2Gradient-${patient.id})`} isAnimationActive={false} />
                      </LineChart>
                  </ResponsiveContainer>
                 <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-blue-300 pointer-events-none" style={{textShadow: '0px 1px 4px rgba(0,0,0,0.9)'}}>SpO₂</span>
              </div>
              <div className="relative h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={respWaveData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                      <defs>
                          <linearGradient id={`respGradient-${patient.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={RESP_WAVEFORM_COLOR} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={RESP_WAVEFORM_COLOR} stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <YAxis domain={[-1.5, 1.5]} hide={true} />
                      <XAxis dataKey="time" hide={true} />
                      <Area type="monotone" dataKey="value" stroke={RESP_WAVEFORM_COLOR} strokeWidth={2} fillOpacity={1} fill={`url(#respGradient-${patient.id})`} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-sky-300 pointer-events-none" style={{textShadow: '0px 1px 4px rgba(0,0,0,0.9)'}}>Resp</span>
              </div>
            </div>
        </div>

        {/* SECTION: AI & Inputs Column */}
        <div className="flex-shrink-0 w-full md:w-64 lg:w-72 pl-0 md:pl-4 md:border-l md:border-slate-700">
           <HeartSenseAIDisplay aiState={heartSenseAIState} />

           {hasUnacknowledgedCriticalAlert && ( 
            <div className="mt-2 space-x-2 flex">
              <button onClick={(e) => { stopPropagation(e); handleFeedback('true_positive', AlertSeverity.CRITICAL); }} className="flex-1 py-1 px-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400" aria-label={`Mark critical alerts as true positive`}>
                Crit True ✔️
              </button>
              <button onClick={(e) => { stopPropagation(e); handleFeedback('false_positive', AlertSeverity.CRITICAL); }} className="flex-1 py-1 px-2 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={`Mark critical alerts as false positive`}>
                Crit False ❌
              </button>
            </div>
           )}

           {hasUnacknowledgedWarningAlert && ( 
            <div className="mt-2 space-x-2 flex">
              <button onClick={(e) => { stopPropagation(e); handleFeedback('true_positive', AlertSeverity.WARNING); }} className="flex-1 py-1 px-2 text-xs font-semibold rounded-md bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400" aria-label={`Mark warnings as true positive`}>
                Warn True ✔️
              </button>
              <button onClick={(e) => { stopPropagation(e); handleFeedback('false_positive', AlertSeverity.WARNING); }} className="flex-1 py-1 px-2 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-400 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label={`Mark warnings as false positive`}>
                Warn False ❌
              </button>
            </div>
          )}
          <div className="space-y-2 mt-2">
            <div>
              <p className="block text-xs font-medium text-sky-400 mb-0.5">Diagnosis</p>
              <p className="w-full bg-slate-700/60 border border-transparent rounded-md py-1 px-2 text-slate-300 text-xs min-h-[26px]">
                {patient.diagnosis || <span className="text-slate-400 italic">Not set</span>}
              </p>
            </div>
            <div>
              <p className="block text-xs font-medium text-sky-400 mb-0.5">Notes</p>
              <p className="w-full bg-slate-700/60 border border-transparent rounded-md py-1 px-2 text-slate-300 text-xs min-h-[26px]">
                {patient.notes || <span className="text-slate-400 italic">No notes</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
      {showHistoryModal && (
        <VitalsHistoryModal
          patientName={patient.name}
          loggedVitals={loggedVitals}
          alarmFeedbackLog={patientSimData.alarmFeedbackLog || []}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
};

export default PatientRowDisplay;