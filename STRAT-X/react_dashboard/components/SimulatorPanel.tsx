
/**
 * @file SimulatorPanel.tsx
 * @description
 * This component acts as a slide-out side panel that houses the core simulator controls.
 * It serves as a container for the `PatientManagementPanel` and `RhythmControlPanel`,
 * allowing the user to select patients, change cardiac rhythms, and adjust pacer settings.
 * It manages its own visibility and closing animations.
 *
 * @component
 */
import React, { useState } from 'react';
import PatientManagementPanel from './PatientManagementPanel';
import RhythmControlPanel from './RhythmControlPanel';
import { Patient, CardiacRhythm, PacerSettings, PatientSpecificSimData } from '../types';

interface SimulatorPanelProps {
    patients: Patient[];
    selectedPatientId: string | null;
    selectedPatient: Patient | null;
    selectedPatientSimData: PatientSpecificSimData | null;
    allRhythms: CardiacRhythm[];
    onDeletePatient: (patientId: string) => void;
    onSelectPatient: (patientId: string) => void;
    onSetRhythm: (rhythm: CardiacRhythm) => void;
    onUpdatePacerSettings: (settings: Partial<PacerSettings>) => void;
    onToggleEcgLeadOff: () => void;
    onClose: () => void;
}

const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
    patients,
    selectedPatientId,
    selectedPatient,
    selectedPatientSimData,
    allRhythms,
    onDeletePatient,
    onSelectPatient,
    onSetRhythm,
    onUpdatePacerSettings,
    onToggleEcgLeadOff,
    onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // This handler adds a small delay to allow the rhythm selection to register
  // before the panel starts its closing animation, providing better UX.
  const handleRhythmSelectionAndClose = (rhythm: CardiacRhythm) => {
    onSetRhythm(rhythm);
    handleClose();
  };

  // Triggers the closing animation before calling the actual `onClose` callback.
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        onClose(); 
    }, 300); // This duration should match the CSS animation duration.
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
      onClick={handleClose}
      style={{
          animation: isClosing ? 'fade-out 0.3s ease forwards' : 'fade-in 0.3s ease forwards'
      }}
    >
      <style>
      {`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slide-in-right {
           from { transform: translateX(100%); }
           to { transform: translateX(0); }
        }
        @keyframes slide-out-right {
           from { transform: translateX(0); }
           to { transform: translateX(100%); }
        }
      `}
      </style>
      
      <div
          className="fixed top-0 right-0 h-full w-full max-w-sm lg:max-w-md bg-slate-900/95 shadow-2xl border-l border-sky-500/30 overflow-y-auto"
          onClick={e => e.stopPropagation()} // Prevent clicks inside the panel from closing it
          style={{
             animation: isClosing ? 'slide-out-right 0.3s ease-in-out forwards' : 'slide-in-right 0.3s ease-in-out forwards'
          }}
      >
          <div className="p-4 sm:p-6 relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors z-50"
                aria-label="Close simulator controls"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>

              <div className="flex flex-col space-y-4 lg:space-y-6">
                <PatientManagementPanel
                  patients={patients}
                  selectedPatientId={selectedPatientId}
                  onDeletePatient={onDeletePatient}
                  onSelectPatient={onSelectPatient}
                />
                <RhythmControlPanel
                  selectedPatient={selectedPatient}
                  selectedPatientSimData={selectedPatientSimData}
                  allRhythms={allRhythms}
                  onSetRhythm={handleRhythmSelectionAndClose}
                  onUpdatePacerSettings={onUpdatePacerSettings}
                  onToggleEcgLeadOff={onToggleEcgLeadOff}
                />
              </div>
          </div>
      </div>
    </div>
  );
};

export default SimulatorPanel;