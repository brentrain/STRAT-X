/**
 * @file App.tsx
 * @description
 * This is the root component of the HeartSenseAI application.
 * It manages the main application state, including:
 * - User authentication and session management.
 * - Visibility of various modals (Add/Modify Patient, Connect Monitor).
 * - Visibility of the simulator control panel.
 * - Orchestrates data flow between the `useCardiacDataSimulator` hook and UI components.
 * It serves as the main entry point for the user interface after login.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCardiacDataSimulator } from './useCardiacDataSimulator'; 
import Header from './components/Header';
import Footer from './components/Footer';
import PatientRowDisplay from '@/components/PatientRowDisplay';
import SimulatorPanel from '@/components/SimulatorPanel';
import LoginScreen from '@/components/LoginScreen';
import CreateAccountScreen from '@/components/CreateAccountScreen';
import AddPatientModal from '@/components/AddPatientModal';
import ModifyPatientModal from '@/components/ModifyPatientModal';
import ConnectMonitorModal from '@/components/ConnectMonitorModal';
import AlertAudioHandler, { playRhythmChangeSound, initAudio } from '@/components/AlertAudioHandler';
import { Patient, CardiacRhythm, UserCredentials, PacerSettings, PatientSpecificSimData, HeartSenseAIRiskLevel, AlarmFeedbackType, AlertSeverity } from './types';
import { getDefaultMetrics, getInitialEcgData, getInitialSpo2Data, getInitialRespData, ALL_AVAILABLE_RHYTHMS, INITIAL_HEARTSENSE_AI_STATE, INITIAL_ALARM_FEEDBACK_LOG, RHYTHM_PARAMS, MockMonitor } from './constants';


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---

  // SECTION: Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loggedInOrganizationName, setLoggedInOrganizationName] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'createAccount'>('login');
  
  // SECTION: UI Visibility State (Modals and Panels)
  const [isSimPanelVisible, setIsSimPanelVisible] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isModifyPatientModalOpen, setIsModifyPatientModalOpen] = useState(false);
  const [isConnectMonitorModalOpen, setIsConnectMonitorModalOpen] = useState(false);

  // --- HOOKS ---
  
  // SECTION: Core Data Simulation Hook
  // This hook manages all patient data, simulation logic, and API interactions.
  const {
    patients,
    simulationDataMap,
    addPatient,
    deletePatient,
    selectPatient,
    selectedPatientId,
    updatePatientDetails,
    setPatientRhythm,
    acknowledgePatientAlerts,
    provideAlarmFeedback,
    updatePatientNoiseSignatures,
    updatePatientPacingSettings,
    toggleEcgLeadOff,
  } = useCardiacDataSimulator(loggedInOrganizationName);

  // --- HARDCODED USER FOR DEMO ---
  const HARDCODED_ORG = "SaaS_Test_Org";
  const HARDCODED_USERNAME = "Brent_Rain";
  const HARDCODED_PASSWORD = "B1j2j3j4";

  // --- EFFECTS ---

  // SECTION: Session Persistence Effect
  // On initial load, this effect checks localStorage for a saved session. If a valid
  // session is found, it automatically logs the user in, providing a seamless experience
  // across browser reloads. This is key to the login retention feature.
  useEffect(() => {
    const storedSession = localStorage.getItem('cardiacMonitorSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.organizationName) {
          // Validate the session. For this demo, we just check if an account for the org exists.
          const storedAccounts = localStorage.getItem('cardiacMonitorAccounts');
          const accounts: UserCredentials[] = storedAccounts ? JSON.parse(storedAccounts) : [];
          const sessionIsValid = 
            (session.isHardcodedUser && session.organizationName === HARDCODED_ORG) ||
            accounts.some(acc => acc.organizationName === session.organizationName);

          if (sessionIsValid) {
            setLoggedInOrganizationName(session.organizationName);
            setIsAuthenticated(true);
          } else {
            // Clear invalid session if the associated account was deleted.
            localStorage.removeItem('cardiacMonitorSession');
          }
        }
      } catch (e) {
        console.error("Error parsing session from localStorage", e);
        localStorage.removeItem('cardiacMonitorSession');
      }
    }
  }, []);

  // SECTION: Audio Initialization Effect
  // This effect sets up a one-time event listener to initialize the Web Audio API
  // on the first user interaction (click), which is required by modern browsers
  // to allow audio playback.
  useEffect(() => {
    const init = () => {
      initAudio();
      document.removeEventListener('click', init);
    };
    document.addEventListener('click', init);
    
    return () => {
      document.removeEventListener('click', init);
    };
  }, []);



  // --- HANDLERS ---

  // SECTION: Authentication Handlers
  // These functions handle the logic for logging in, creating accounts, and logging out.
  // Account data and sessions are persisted to the browser's localStorage to ensure
  // that user accounts and login state are retained between browser sessions.

  /**
   * Handles user login attempts.
   * On successful login, it creates a 'cardiacMonitorSession' item in localStorage,
   * which allows the user to be automatically logged in on their next visit.
   */
  const handleLogin = useCallback((creds: UserCredentials): string | null => {
    const organizationName = creds.organizationName.trim();
    const username = creds.username.trim();
    const password = creds.password.trim();

    // Check 1: Hardcoded demo user for easy access.
    if (
      organizationName === HARDCODED_ORG &&
      username === HARDCODED_USERNAME &&
      password === HARDCODED_PASSWORD
    ) {
      setLoggedInOrganizationName(HARDCODED_ORG);
      setIsAuthenticated(true);
      // PERSISTENCE: A session object is saved to localStorage to remember the user.
      localStorage.setItem('cardiacMonitorSession', JSON.stringify({ organizationName: HARDCODED_ORG, isHardcodedUser: true }));
      setAuthView('login');
      return null; // Success
    }
    
    // Check 2: User-created accounts stored locally.
    const storedAccounts = localStorage.getItem('cardiacMonitorAccounts');
    if (!storedAccounts) {
      return 'No accounts found on this device. Please use "Create one" to start.';
    }

    try {
      const accounts: UserCredentials[] = JSON.parse(storedAccounts);
      const foundAccount = accounts.find(
        acc => acc.organizationName === organizationName && acc.username === username && acc.password === password
      );
      if (foundAccount) {
        setLoggedInOrganizationName(foundAccount.organizationName);
        setIsAuthenticated(true);
        // PERSISTENCE: A session object is saved to localStorage to remember the user.
        localStorage.setItem('cardiacMonitorSession', JSON.stringify({ organizationName: foundAccount.organizationName, isHardcodedUser: false }));
        setAuthView('login');
        return null; // Success
      } else {
        return 'Invalid credentials or account not found. Note: Accounts are device-specific and case-sensitive.';
      }
    } catch (e) {
      console.error("Error parsing accounts from localStorage", e);
      return 'Error accessing account data.';
    }
  }, [HARDCODED_ORG, HARDCODED_USERNAME, HARDCODED_PASSWORD]); 

  /**
   * Handles creation of a new user account.
   * The new account is saved to the 'cardiacMonitorAccounts' item in localStorage,
   * ensuring it's available for future login attempts on the same device.
   */
  const handleCreateAccount = useCallback((creds: UserCredentials): boolean => {
    const organizationName = creds.organizationName.trim();
    const username = creds.username.trim();
    const password = creds.password.trim();

    if (organizationName === HARDCODED_ORG && username === HARDCODED_USERNAME) {
        alert(`The username "${HARDCODED_USERNAME}" for organization "${HARDCODED_ORG}" is reserved.`);
        return false;
    }

    const storedAccounts = localStorage.getItem('cardiacMonitorAccounts');
    let accounts: UserCredentials[] = storedAccounts ? JSON.parse(storedAccounts) : [];

    if (accounts.some(acc => acc.organizationName === organizationName && acc.username === username)) {
      alert('An account with this Organization and Username already exists on this device.');
      return false;
    }
    
    // PERSISTENCE: The new account is added to the list and saved back to localStorage.
    accounts.push({ organizationName, username, password });
    localStorage.setItem('cardiacMonitorAccounts', JSON.stringify(accounts));
    alert('Account created successfully on this device! Please log in.');
    setAuthView('login');
    return true;
  }, [HARDCODED_ORG, HARDCODED_USERNAME]); 

  /**
   * Handles user logout.
   * This function explicitly clears the session from localStorage, logging the user out
   * and requiring them to log in again on their next visit.
   */
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setLoggedInOrganizationName(null);
    localStorage.removeItem('cardiacMonitorSession');
    setAuthView('login');
  }, []);

  // SECTION: Patient Data Handlers
  
  const handleSaveNewPatient = useCallback((patientData: Omit<Patient, 'id' | 'activeRhythm' | 'pacerSettings' | 'personalizedThresholds' | 'noiseSignatures' | 'source'>) => {
    addPatient(patientData);
    setIsAddPatientModalOpen(false);
  }, [addPatient]);
  
  const handleSaveModifiedPatient = useCallback((patientData: Patient) => {
    updatePatientDetails(patientData.id, patientData);
    setIsModifyPatientModalOpen(false);
  }, [updatePatientDetails]);

  const handleConnectAndAddPatient = useCallback((monitor: MockMonitor, connectionType: 'Network' | 'Bluetooth') => {
      addPatient({
        ...monitor.patientData,
        room: monitor.location,
        codeStatus: 'FULL_CODE',
      }, `${connectionType}: ${monitor.model}`);
      setIsConnectMonitorModalOpen(false);
  }, [addPatient]);
  
  const handleDeletePatientInRow = useCallback((patientId: string, patientName: string) => {
    if (window.confirm("Are you sure you want to delete this patient? All data will be lost.")) {
      deletePatient(patientId);
    }
  }, [deletePatient]);

  const handleDeleteSelectedPatient = useCallback(() => {
    if (selectedPatientId) {
        const patient = patients.find(p => p.id === selectedPatientId);
        if (patient && window.confirm("Are you sure you want to delete this patient? All data will be lost.")) {
            deletePatient(selectedPatientId);
        }
    }
  }, [selectedPatientId, patients, deletePatient]);
  
  const handleSetRhythmForSelectedPatient = useCallback((rhythm: CardiacRhythm) => {
    if (selectedPatientId) {
      playRhythmChangeSound();
      setPatientRhythm(selectedPatientId, rhythm);
    }
  }, [selectedPatientId, setPatientRhythm]);

  const handlePacerSettingsChangeForSelectedPatient = useCallback((settings: Partial<PacerSettings>) => {
    if (selectedPatientId) {
      updatePatientPacingSettings(selectedPatientId, settings);
    }
  }, [selectedPatientId, updatePatientPacingSettings]);
  
  const handleAcknowledgeWarningsForPatient = useCallback((patientId: string) => {
    acknowledgePatientAlerts(patientId, AlertSeverity.WARNING);
  }, [acknowledgePatientAlerts]);

  const handleToggleLeadOffForSelectedPatient = useCallback(() => {
      if (selectedPatientId) {
          toggleEcgLeadOff(selectedPatientId);
      }
  }, [selectedPatientId, toggleEcgLeadOff]);

  const toggleSimPanel = useCallback(() => {
    setIsSimPanelVisible(prev => !prev);
  }, []);
  
  // --- DERIVED DATA & DEFAULTS ---
  
  const defaultSimData: PatientSpecificSimData = {
    metrics: getDefaultMetrics(),
    ecgData: getInitialEcgData(),
    spo2WaveData: getInitialSpo2Data(),
    respWaveData: getInitialRespData(),
    heartRateTrend: [],
    alerts: [],
    ecgPatternBuffer: [], ecgBufferIndex: 0, ecgCurrentTime: 0,
    wenckebachCycleBeat: 0, currentPRPoints: 0, mobitzBeatInCycle: 0,
    lastPWaveTime: 0, lastQRSWaveTime: 0, nextRRIntervalPoints: 0,
    pWaveCyclePosition: 0,
    acknowledgedAlertIds: new Set<string>(),
    loggedVitals: [],
    timeSinceLastCardiacEventMs: 0,
    lastBeatTimestamp: 0,
    heartSenseAIState: { ...INITIAL_HEARTSENSE_AI_STATE },
    alarmFeedbackLog: [...INITIAL_ALARM_FEEDBACK_LOG],
    currentTargetHeartRate: RHYTHM_PARAMS.NSR.simulatedHR(), 
    spo2PulsePatternBuffer: [],
    spo2PulseBufferIndex: 0,
    spo2NextPulseDue: false,
    respirationCyclePosition: 0,
    isLeadOff: false,
  };

  const selectedPatientObject = patients.find(p => p.id === selectedPatientId) || null;
  const selectedPatientSimData = simulationDataMap.get(selectedPatientId || '') || null;

  // --- RENDER LOGIC ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
        {authView === 'login' ? (
          <LoginScreen 
            onLogin={handleLogin} 
            onSwitchToCreateAccount={() => setAuthView('createAccount')} 
            demoCredentials={{
                organizationName: HARDCODED_ORG,
                username: HARDCODED_USERNAME,
                password: HARDCODED_PASSWORD
            }}
          />
        ) : (
          <CreateAccountScreen onCreateAccount={handleCreateAccount} onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-200 relative">
      <AlertAudioHandler simulationDataMap={simulationDataMap} />
      <Header 
        organizationName={loggedInOrganizationName} 
        onLogout={handleLogout} 
        onToggleSimPanel={toggleSimPanel}
        isSimPanelVisible={isSimPanelVisible}
        onAddPatient={() => setIsAddPatientModalOpen(true)}
        onModifyPatient={() => setIsModifyPatientModalOpen(true)}
        onDeletePatient={handleDeleteSelectedPatient}
        onConnectMonitor={() => setIsConnectMonitorModalOpen(true)}
        isModifyPatientDisabled={!selectedPatientId}
        isDeletePatientDisabled={!selectedPatientId}
      />
      
      {isSimPanelVisible && (
        <SimulatorPanel
          patients={patients}
          selectedPatientId={selectedPatientId}
          selectedPatient={selectedPatientObject}
          selectedPatientSimData={selectedPatientSimData}
          onDeletePatient={deletePatient}
          onSelectPatient={selectPatient}
          allRhythms={ALL_AVAILABLE_RHYTHMS}
          onSetRhythm={handleSetRhythmForSelectedPatient}
          onUpdatePacerSettings={handlePacerSettingsChangeForSelectedPatient}
          onToggleEcgLeadOff={handleToggleLeadOffForSelectedPatient}
          onClose={toggleSimPanel}
        />
      )}

      {isConnectMonitorModalOpen && (
        <ConnectMonitorModal
          onConnect={handleConnectAndAddPatient}
          onClose={() => setIsConnectMonitorModalOpen(false)}
        />
      )}
      
      {isAddPatientModalOpen && (
        <AddPatientModal
          onSave={handleSaveNewPatient}
          onClose={() => setIsAddPatientModalOpen(false)}
        />
      )}
      
      {isModifyPatientModalOpen && selectedPatientObject && (
        <ModifyPatientModal
          patient={selectedPatientObject}
          onSave={handleSaveModifiedPatient}
          onClose={() => setIsModifyPatientModalOpen(false)}
        />
      )}

      <main className="flex-grow p-2 sm:p-4 lg:p-6" style={{minHeight: `calc(100vh - 128px)`}}>
        <div className="flex flex-col space-y-4">
            {patients.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-slate-800/50 rounded-xl shadow-lg p-6 sm:p-10" style={{minHeight: '300px'}}>
                <div className="text-center">
                  <p className="text-lg sm:text-xl text-slate-400">No patients being monitored.</p>
                  <button 
                    onClick={() => setIsAddPatientModalOpen(true)}
                    className="mt-4 text-sky-400 font-semibold hover:text-sky-300 transition-colors"
                  >
                    Click the <span className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 mx-1">Add Patient</span> button to get started.
                  </button>
                </div>
              </div>
            ) : (
              patients.map((patient) => {
                const patientSimData = simulationDataMap.get(patient.id) || defaultSimData;
                return (
                  <PatientRowDisplay
                    key={patient.id}
                    patient={patient}
                    patientSimData={patientSimData} 
                    isSelected={patient.id === selectedPatientId}
                    onSelect={() => selectPatient(patient.id)}
                    onDeletePatient={handleDeletePatientInRow}
                    onAcknowledgeWarnings={handleAcknowledgeWarningsForPatient}
                    onProvideFeedback={provideAlarmFeedback}
                    onUpdatePatientNoiseSignatures={updatePatientNoiseSignatures}
                  />
                );
              })
            )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;