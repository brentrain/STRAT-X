
/**
 * @file ConnectMonitorModal.tsx
 * @description
 * This component provides a modal interface for simulating the connection to in-hospital monitors.
 * It features a multi-phase process: searching, displaying found devices, and confirming connection.
 * It has been updated to support two types of scanning: traditional network monitors and
 * wireless Bluetooth devices, allowing for a more comprehensive connectivity simulation.
 *
 * @component
 */
import React, { useState, useEffect } from 'react';
import { MOCK_NETWORK_MONITORS, MOCK_BLUETOOTH_MONITORS, MockMonitor } from '../constants';

interface ConnectMonitorModalProps {
  onConnect: (monitor: MockMonitor, connectionType: 'Network' | 'Bluetooth') => void;
  onClose: () => void;
}

const ConnectMonitorModal: React.FC<ConnectMonitorModalProps> = ({ onConnect, onClose }) => {
  // --- STATE MANAGEMENT ---
  const [phase, setPhase] = useState<'searching' | 'found' | 'success'>('searching');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'network' | 'bluetooth'>('network');

  // --- EFFECTS ---
  // Effect to automatically advance the simulation phase.
  useEffect(() => {
    if (phase === 'searching') {
      const timer = setTimeout(() => setPhase('found'), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 'success') {
      const timer = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onClose]);
  
  // Reset search animation when scan type changes
  useEffect(() => {
    setPhase('searching');
  }, [scanType]);

  // --- HANDLERS ---
  const handleConnectClick = (monitor: MockMonitor) => {
    if (monitor.status !== 'Online - Ready to Connect' || connectingId) return;
    setConnectingId(monitor.id);
    setTimeout(() => {
      onConnect(monitor, scanType === 'network' ? 'Network' : 'Bluetooth');
      setPhase('success');
    }, 1500);
  };

  // --- RENDER LOGIC ---
  const renderContent = () => {
    const monitorsToShow = scanType === 'network' ? MOCK_NETWORK_MONITORS : MOCK_BLUETOOTH_MONITORS;
    const activeMonitorsCount = monitorsToShow.filter(m => m.status !== 'Offline').length;

    switch(phase) {
      case 'searching':
        return (
          <div className="text-center py-10">
            <div className="relative w-16 h-16 mx-auto">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${scanType === 'network' ? 'bg-sky-500' : 'bg-blue-500'}`}></div>
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${scanType === 'network' ? 'bg-sky-600' : 'bg-blue-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={scanType === 'bluetooth' ? 1.5 : 2}>
                  {scanType === 'network' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a7.5 7.5 0 0110.606 0M15.89 9.172a4 4 0 010 5.656" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6 18.25m0-4.421l-1.558-1.558a1.5 1.5 0 010-2.121l6.828-6.828a1.5 1.5 0 012.121 0l1.558 1.558m-8.388 6.829l1.558 1.558m0 0l6.828 6.828a1.5 1.5 0 002.121 0l1.558-1.558m-8.388-6.829l-6.828-6.828a1.5 1.5 0 00-2.121 0L4.5 9.75" />
                  )}
                </svg>
              </div>
            </div>
            <p className="mt-6 text-slate-300 font-medium">
              Scanning for {scanType === 'network' ? 'network monitors' : 'wireless Bluetooth devices'}...
            </p>
          </div>
        );
      case 'found':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-3">Found {activeMonitorsCount} active {scanType === 'network' ? 'monitors' : 'devices'}. Select one to link to HeartSenseAI.</p>
            {monitorsToShow.map(monitor => (
              <div key={monitor.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${monitor.status === 'Offline' ? 'bg-slate-700/50' : 'bg-slate-700'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${monitor.status === 'Online - Ready to Connect' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                  <div>
                    <p className={`font-semibold ${monitor.status === 'Offline' ? 'text-slate-500' : 'text-slate-100'}`}>{monitor.model}</p>
                    <p className="text-xs text-slate-400">ID: {monitor.id} | Location: {monitor.location}</p>
                  </div>
                </div>
                {monitor.status === 'Online - Ready to Connect' && (
                  <button
                    onClick={() => handleConnectClick(monitor)}
                    disabled={!!connectingId}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-slate-600 disabled:cursor-wait"
                  >
                    {connectingId === monitor.id ? (
                       <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                    ) : 'Connect'}
                  </button>
                )}
                 {monitor.status === 'Offline' && (
                    <span className="text-xs font-medium text-slate-500">Offline</span>
                )}
              </div>
            ))}
          </div>
        );
      case 'success':
         return (
           <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
              </div>
              <p className="mt-6 text-slate-200 font-medium">Device connected successfully!</p>
              <p className="text-sm text-slate-400">A new patient profile has been created.</p>
           </div>
         );
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-monitor-modal-title"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="connect-monitor-modal-title" className="text-xl font-semibold text-sky-400">
            Connect Device
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close connect monitor modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {phase !== 'success' && phase !== 'searching' && (
            <div className="mb-4 flex justify-center bg-slate-700/50 p-1 rounded-lg">
                <button 
                    onClick={() => setScanType('network')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md w-1/2 transition-colors ${scanType === 'network' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
                >
                    Network Monitors
                </button>
                <button 
                    onClick={() => setScanType('bluetooth')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md w-1/2 transition-colors ${scanType === 'bluetooth' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600/50'}`}
                >
                    Bluetooth Devices
                </button>
            </div>
        )}

        <div className="flex-grow overflow-y-auto pr-2">
            {renderContent()}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
                This feature simulates connecting to Windows/non-Windows systems via network protocols (HL7/FHIR) and wireless devices via Bluetooth LE. Compatibility is ensured through a simulated gateway.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectMonitorModal;
