
/**
 * @file Header.tsx
 * @description
 * This component renders the main application header.
 * It includes the application title, branding, and primary action buttons such as
 * adding a patient, connecting a monitor, modifying a patient, and toggling the
 * simulator control panel. It also displays the logged-in organization and a logout button.
 *
 * @component
 * @param {object} props - The component props.
 * @param {string | null} [props.organizationName] - The name of the logged-in organization.
 * @param {() => void} [props.onLogout] - Callback function to handle user logout.
 * @param {() => void} props.onToggleSimPanel - Callback to toggle the visibility of the SimulatorPanel.
 * @param {boolean} props.isSimPanelVisible - Flag indicating if the simulator panel is currently visible.
 * @param {() => void} props.onAddPatient - Callback to open the 'Add Patient' modal.
 * @param {() => void} props.onModifyPatient - Callback to open the 'Modify Patient' modal for the selected patient.
 * @param {() => void} props.onDeletePatient - Callback to delete the currently selected patient.
 * @param {() => void} props.onConnectMonitor - Callback to open the 'Connect Monitor' modal.
 * @param {boolean} props.isModifyPatientDisabled - Flag to disable the modify button if no patient is selected.
 * @param {boolean} props.isDeletePatientDisabled - Flag to disable the delete button if no patient is selected.
 */

import React from 'react';

interface HeaderProps {
  organizationName?: string | null;
  onLogout?: () => void;
  onToggleSimPanel: () => void;
  isSimPanelVisible: boolean;
  onAddPatient: () => void;
  onModifyPatient: () => void;
  onDeletePatient: () => void;
  onConnectMonitor: () => void;
  isModifyPatientDisabled: boolean;
  isDeletePatientDisabled: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    organizationName, 
    onLogout, 
    onToggleSimPanel, 
    isSimPanelVisible, 
    onAddPatient, 
    onModifyPatient,
    onDeletePatient,
    onConnectMonitor, 
    isModifyPatientDisabled,
    isDeletePatientDisabled
}) => {
  return (
    <header className="bg-slate-800 p-4 shadow-lg border-b border-slate-700/50 flex justify-between items-center z-50 relative">
      {/* SECTION: Branding */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          HeartSenseAI
        </h1>
      </div>

      {/* SECTION: Action Buttons & User Info */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {organizationName && (
          <p className="text-sm text-sky-400 hidden md:block">
            Org: <span className="font-semibold">{organizationName}</span>
          </p>
        )}
        
        <button
          onClick={onAddPatient}
          className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Add New Patient"
        >
          Add Patient
        </button>

        <button
          onClick={onConnectMonitor}
          className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border bg-sky-600 hover:bg-sky-500 text-white border-sky-500 hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Connect Hospital Monitor"
        >
          Connect Monitor
        </button>
        
        <button
          onClick={onModifyPatient}
          disabled={isModifyPatientDisabled}
          className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border bg-slate-600 hover:bg-slate-500 text-slate-200 border-slate-500 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed"
          aria-label="Modify Selected Patient"
        >
          Modify Patient
        </button>

        <button
          onClick={onDeletePatient}
          disabled={isDeletePatientDisabled}
          className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border bg-red-700 hover:bg-red-600 text-white border-red-600 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed"
          aria-label="Delete Selected Patient"
        >
          Delete Patient
        </button>

        <button
          onClick={onToggleSimPanel}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border ${
            isSimPanelVisible 
              ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-800' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500'
          }`}
          aria-label="Toggle Simulator Controls"
          aria-expanded={isSimPanelVisible}
        >
          SIM
        </button>
        {onLogout && organizationName && (
          <button
            onClick={onLogout}
            className="bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs font-semibold py-1.5 px-3 rounded-md transition duration-150 ease-in-out"
            aria-label="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
