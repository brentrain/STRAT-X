/**
 * ICUPatientMonitoringDashboard.tsx
 * Real-time ICU patient monitoring interface that connects to the Python simulator backend
 */

import React, { useState, useEffect } from 'react';
import './ICUPatientMonitoringDashboard.css';

interface PatientVitals {
    heartRate: number;
    systolicBP: number;
    diastolicBP: number;
    spo2: number;
    respiratoryRate: number;
    temperature: number;
}

interface PatientAlert {
    timestamp: string;
    type: string;
    description: string;
}

interface PatientData {
    id: string;
    name: string;
    age: number;
    diagnosis: string;
    vitals: PatientVitals;
    rhythm: string;
    artifact: string | null;
    alerts: PatientAlert[];
}

interface PatientsResponse {
    status: string;
    timestamp: string;
    patients: PatientData[];
}

const API_BASE_URL = 'http://localhost:5000/api';

const ICUPatientMonitoringDashboard: React.FC = () => {
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [updateCount, setUpdateCount] = useState(0);

    // Fetch patients data
    const fetchPatients = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/patients`);
            const data: PatientsResponse = await response.json();
            if (data.status === 'success') {
                setPatients(data.patients);
                setError(null);
            } else {
                setError('Failed to fetch patients');
            }
        } catch (err) {
            setError(`Error connecting to simulator: ${err}`);
        }
    };

    // Fetch event log
    const fetchEventLog = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            const data = await response.json();
            if (data.status === 'success') {
                setEventLog(data.events.recentEvents);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    // Start simulator
    const startSimulator = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/simulator/start`, {
                method: 'POST',
            });
            if (response.ok) {
                setIsSimulatorRunning(true);
                setError(null);
            }
        } catch (err) {
            setError(`Error starting simulator: ${err}`);
        }
    };

    // Stop simulator
    const stopSimulator = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/simulator/stop`, {
                method: 'POST',
            });
            if (response.ok) {
                setIsSimulatorRunning(false);
            }
        } catch (err) {
            setError(`Error stopping simulator: ${err}`);
        }
    };

    // Poll for updates
    useEffect(() => {
        if (!isSimulatorRunning) return;

        const interval = setInterval(() => {
            fetchPatients();
            fetchEventLog();
            setUpdateCount(c => c + 1);
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [isSimulatorRunning]);

    // Get alert status indicator
    const getAlertStatus = (patient: PatientData) => {
        if (patient.vitals.heartRate === 0 || patient.vitals.spo2 < 90) {
            return 'critical';
        } else if (patient.vitals.heartRate > 140 || patient.vitals.heartRate < 40) {
            return 'warning';
        }
        return 'normal';
    };

    // Get color for alert status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical':
                return '#ff3333';
            case 'warning':
                return '#ffaa00';
            default:
                return '#33cc33';
        }
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    return (
        <div className="icu-dashboard">
            <div className="dashboard-header">
                <h1>🏥 ICU Telemetry Monitoring System</h1>
                <div className="header-controls">
                    {!isSimulatorRunning ? (
                        <button className="btn btn-start" onClick={startSimulator}>
                            ▶ Start Simulator
                        </button>
                    ) : (
                        <button className="btn btn-stop" onClick={stopSimulator}>
                            ⏹ Stop Simulator
                        </button>
                    )}
                    <span className={`status-indicator ${isSimulatorRunning ? 'active' : 'inactive'}`}>
                        {isSimulatorRunning ? '● LIVE' : '○ OFFLINE'}
                    </span>
                    <span className="update-counter">Updates: {updateCount}</span>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="dashboard-content">
                {/* Patients Grid */}
                <div className="patients-grid">
                    <h2>Patient Overview</h2>
                    <div className="patient-cards-container">
                        {patients.map(patient => {
                            const status = getAlertStatus(patient);
                            const isSelected = selectedPatientId === patient.id;
                            return (
                                <div
                                    key={patient.id}
                                    className={`patient-card ${status} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedPatientId(patient.id)}
                                    style={{
                                        borderLeftColor: getStatusColor(status),
                                        boxShadow: isSelected
                                            ? `0 0 20px ${getStatusColor(status)}`
                                            : 'none',
                                    }}
                                >
                                    <div className="patient-header">
                                        <div className="patient-id">{patient.id}</div>
                                        <div className={`alert-dot ${status}`} />
                                    </div>
                                    <div className="patient-info">
                                        <div className="patient-name">{patient.name}</div>
                                        <div className="patient-meta">
                                            {patient.age}y • {patient.diagnosis}
                                        </div>
                                    </div>
                                    <div className="vitals-compact">
                                        <div className="vital-item">
                                            <span className="vital-label">HR</span>
                                            <span className="vital-value">
                                                {patient.vitals.heartRate.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="vital-item">
                                            <span className="vital-label">BP</span>
                                            <span className="vital-value">
                                                {patient.vitals.systolicBP.toFixed(0)}/
                                                {patient.vitals.diastolicBP.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="vital-item">
                                            <span className="vital-label">SpO2</span>
                                            <span className="vital-value">
                                                {patient.vitals.spo2.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="rhythm-badge">{patient.rhythm}</div>
                                    {patient.artifact && (
                                        <div className="artifact-badge">⚠ {patient.artifact}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Patient View */}
                {selectedPatient && (
                    <div className="patient-detail">
                        <h2>Patient Detail: {selectedPatient.name}</h2>
                        <div className="detail-grid">
                            <div className="detail-section">
                                <h3>Current Vitals</h3>
                                <div className="vitals-table">
                                    <div className="vital-row">
                                        <span className="vital-name">Heart Rate</span>
                                        <span className="vital-value">
                                            {selectedPatient.vitals.heartRate.toFixed(0)} bpm
                                        </span>
                                    </div>
                                    <div className="vital-row">
                                        <span className="vital-name">Blood Pressure</span>
                                        <span className="vital-value">
                                            {selectedPatient.vitals.systolicBP.toFixed(0)}/
                                            {selectedPatient.vitals.diastolicBP.toFixed(0)} mmHg
                                        </span>
                                    </div>
                                    <div className="vital-row">
                                        <span className="vital-name">SpO2</span>
                                        <span className="vital-value">
                                            {selectedPatient.vitals.spo2.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="vital-row">
                                        <span className="vital-name">Temperature</span>
                                        <span className="vital-value">
                                            {selectedPatient.vitals.temperature.toFixed(1)}°C
                                        </span>
                                    </div>
                                    <div className="vital-row">
                                        <span className="vital-name">Respiratory Rate</span>
                                        <span className="vital-value">
                                            {selectedPatient.vitals.respiratoryRate.toFixed(0)} breaths/min
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Cardiac Status</h3>
                                <div className="rhythm-info">
                                    <div className="info-item">
                                        <span className="label">Active Rhythm:</span>
                                        <span className="value">{selectedPatient.rhythm}</span>
                                    </div>
                                    {selectedPatient.artifact && (
                                        <div className="info-item">
                                            <span className="label">Artifact:</span>
                                            <span className="value warning">{selectedPatient.artifact}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section full-width">
                                <h3>Recent Alerts ({selectedPatient.alerts.length})</h3>
                                <div className="alerts-list">
                                    {selectedPatient.alerts.length > 0 ? (
                                        selectedPatient.alerts.map((alert, idx) => (
                                            <div key={idx} className={`alert-entry ${alert.type.toLowerCase()}`}>
                                                <span className="timestamp">{alert.timestamp}</span>
                                                <span className="type">{alert.type}</span>
                                                <span className="description">{alert.description}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-alerts">No recent alerts</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Log */}
                <div className="event-log">
                    <h2>Global Event Log</h2>
                    <div className="events-list">
                        {eventLog.slice(0, 20).map((event, idx) => (
                            <div key={idx} className="event-entry">
                                {event}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ICUPatientMonitoringDashboard;
