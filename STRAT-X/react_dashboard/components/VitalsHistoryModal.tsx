
import React, { useState, useMemo } from 'react';
import { LoggedVitalSign, AlarmFeedbackEntry } from '../types';
import { METRIC_UNITS } from '../constants';

interface VitalsHistoryModalProps {
  patientName: string;
  loggedVitals: LoggedVitalSign[];
  alarmFeedbackLog: AlarmFeedbackEntry[]; 
  onClose: () => void;
}

const RECALL_INTERVALS_MINUTES = [5, 10, 15, 30, 60, 120, 240]; 

const VitalsHistoryModal: React.FC<VitalsHistoryModalProps> = ({ patientName, loggedVitals, alarmFeedbackLog, onClose }) => {
  const [selectedIntervalMinutes, setSelectedIntervalMinutes] = useState<number>(RECALL_INTERVALS_MINUTES[2]); 

  const filteredVitals = useMemo(() => {
    if (!loggedVitals || loggedVitals.length === 0) {
      return [];
    }
    const now = Date.now();
    const cutoffTime = now - selectedIntervalMinutes * 60 * 1000;
    return loggedVitals
      .filter(log => log.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp); 
  }, [loggedVitals, selectedIntervalMinutes]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vitals-history-modal-title"
    >
      <div 
        className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl max-h-[85vh] flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="vitals-history-modal-title" className="text-lg sm:text-xl font-semibold text-sky-400">
            Vitals History: {patientName}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close vitals history modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="recallInterval" className="block text-sm font-medium text-slate-300 mb-1">
            Show vitals from last:
          </label>
          <select
            id="recallInterval"
            value={selectedIntervalMinutes}
            onChange={(e) => setSelectedIntervalMinutes(Number(e.target.value))}
            className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
          >
            {RECALL_INTERVALS_MINUTES.map(interval => (
              <option key={interval} value={interval}>{interval} minutes</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto flex-grow">
          <div className="min-w-full overflow-y-auto max-h-[calc(85vh-220px)] sm:max-h-[calc(85vh-250px)] pr-1"> 
            {filteredVitals.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No vitals logged in the selected period.</p>
            ) : (
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">HR ({METRIC_UNITS.heartRate})</th>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">BP ({METRIC_UNITS.bloodPressure})</th>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">SpO₂ ({METRIC_UNITS.spo2})</th>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">RR ({METRIC_UNITS.respiratoryRate.split('/')[0]})</th>
                    <th scope="col" className="px-2 py-2 sm:px-3 sm:py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Temp ({METRIC_UNITS.temperature})</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700/50">
                  {filteredVitals.map((log) => (
                    <tr key={log.timestamp} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-300 font-mono">{formatTime(log.timestamp)}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-200 text-center">{log.metrics.heartRate}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-200 text-center">{`${log.metrics.bloodPressure.systolic}/${log.metrics.bloodPressure.diastolic}`}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-200 text-center">{log.metrics.spo2}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-200 text-center">{log.metrics.respiratoryRate}</td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-slate-200 text-center">{log.metrics.temperature.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
         <div className="mt-4 sm:mt-6 text-right">
            <button
                onClick={onClose}
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-sky-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default VitalsHistoryModal;