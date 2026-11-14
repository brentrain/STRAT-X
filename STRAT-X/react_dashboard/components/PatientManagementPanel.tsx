
import React from 'react';
import { Patient } from '../types';

interface PatientManagementPanelProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onDeletePatient: (patientId: string) => void;
  onSelectPatient: (patientId: string) => void;
}

const PatientManagementPanel: React.FC<PatientManagementPanelProps> = ({
  patients,
  selectedPatientId,
  onDeletePatient,
  onSelectPatient,
}) => {
  const handlePanelDelete = (patientId: string, patientName: string) => {
    if (window.confirm("Are you sure you want to delete this patient? All data will be lost.")) {
      onDeletePatient(patientId);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-xl flex flex-col border border-slate-700/80">
      <h2 className="text-xl font-semibold text-sky-400 mb-3 border-b border-slate-700 pb-2">Patient Selection</h2>
      
      {patients.length === 0 ? (
        <p className="text-slate-400 text-sm">No patients found. Use the 'Add Patient' button in the header to begin.</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-grow pr-1 max-h-60">
          {patients.map((patient) => (
            <li
              key={patient.id}
              className={`p-3 rounded-md transition-all duration-150 ease-in-out border cursor-pointer ${
                patient.id === selectedPatientId ? 'bg-sky-600 shadow-md text-white border-sky-500' : 'bg-slate-700 hover:bg-slate-600/50 border-slate-600'
              }`}
               onClick={() => onSelectPatient(patient.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className={`font-semibold ${patient.id === selectedPatientId ? 'text-white' : 'text-slate-200'}`}>{patient.name}</p>
                  <p className={`text-xs ${patient.id === selectedPatientId ? 'text-sky-100' : 'text-slate-400'}`}>
                    Age: {patient.age} | Room: {patient.room}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePanelDelete(patient.id, patient.name);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-red-600/50 hover:bg-red-500 text-white transition-colors"
                    aria-label={`Delete patient ${patient.name} from management list`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientManagementPanel;