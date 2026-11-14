#!/usr/bin/env python3
"""
Flask backend API for ICU telemetry simulator
Provides REST endpoints for the React frontend to consume real-time cardiac data
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import random
from datetime import datetime
from dataclasses import asdict
from enum import Enum
import math

# Import the simulator classes
import sys
sys.path.append('.')
from icu_telemetry_simulator import (
    ICUTelemetrySimulator, 
    CardiacRhythm, 
    TechnicalArtifact,
    Patient
)

app = Flask(__name__)
CORS(app)

# Global simulator instance
simulator = None
simulator_thread = None
is_running = False
update_rate = 1  # seconds between updates

class SimulatorManager:
    """Manages the simulator lifecycle"""
    def __init__(self):
        self.simulator = ICUTelemetrySimulator(num_patients=8)
        self.is_running = False
        self.thread = None
        
    def start(self):
        """Start the simulator"""
        if not self.is_running:
            self.is_running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
    
    def stop(self):
        """Stop the simulator"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
    
    def _run(self):
        """Main simulation loop"""
        while self.is_running:
            self.simulator.update_step()
            time.sleep(update_rate)
    
    def get_patients_snapshot(self):
        """Get current state of all patients"""
        patients_data = []
        for patient in self.simulator.patients:
            patient_data = {
                'id': f"P{patient.patient_id:02d}",
                'name': patient.name,
                'age': patient.age,
                'diagnosis': patient.diagnosis,
                'vitals': {
                    'heartRate': round(patient.vitals.heart_rate, 1),
                    'systolicBP': round(patient.vitals.systolic_bp, 1),
                    'diastolicBP': round(patient.vitals.diastolic_bp, 1),
                    'spo2': round(patient.vitals.o2_saturation, 1),
                    'respiratoryRate': round(patient.vitals.respiratory_rate, 1),
                    'temperature': round(patient.vitals.temperature, 1),
                },
                'rhythm': patient.current_rhythm.value,
                'artifact': patient.current_artifact.value if patient.current_artifact != TechnicalArtifact.NONE else None,
                'alerts': [
                    {
                        'timestamp': event.timestamp,
                        'type': event.event_type,
                        'description': event.description
                    } for event in patient.events[-5:]  # Last 5 events per patient
                ]
            }
            patients_data.append(patient_data)
        
        return patients_data
    
    def get_patient_detail(self, patient_id: int):
        """Get detailed data for a specific patient"""
        if patient_id < 1 or patient_id > len(self.simulator.patients):
            return None
        
        patient = self.simulator.patients[patient_id - 1]
        
        # Build vital history for trend
        vitals_history = []
        for vitals in list(patient.vital_history)[-30:]:  # Last 30 readings
            vitals_history.append({
                'hr': round(vitals.heart_rate, 1),
                'systolic': round(vitals.systolic_bp, 1),
                'diastolic': round(vitals.diastolic_bp, 1),
                'spo2': round(vitals.o2_saturation, 1),
            })
        
        patient_detail = {
            'id': f"P{patient.patient_id:02d}",
            'name': patient.name,
            'age': patient.age,
            'diagnosis': patient.diagnosis,
            'currentVitals': {
                'heartRate': round(patient.vitals.heart_rate, 1),
                'systolicBP': round(patient.vitals.systolic_bp, 1),
                'diastolicBP': round(patient.vitals.diastolic_bp, 1),
                'spo2': round(patient.vitals.o2_saturation, 1),
                'respiratoryRate': round(patient.vitals.respiratory_rate, 1),
                'temperature': round(patient.vitals.temperature, 1),
            },
            'rhythm': patient.current_rhythm.value,
            'artifact': patient.current_artifact.value if patient.current_artifact != TechnicalArtifact.NONE else None,
            'vitalsTrend': vitals_history,
            'allEvents': [
                {
                    'timestamp': event.timestamp,
                    'type': event.event_type,
                    'description': event.description,
                    'vitals': {
                        'hr': round(event.vital_signs.heart_rate, 1),
                        'systolic': round(event.vital_signs.systolic_bp, 1),
                        'diastolic': round(event.vital_signs.diastolic_bp, 1),
                        'spo2': round(event.vital_signs.o2_saturation, 1),
                    }
                } for event in patient.events
            ]
        }
        
        return patient_detail
    
    def get_event_log(self):
        """Get all logged events across all patients"""
        return {
            'totalEvents': len(self.simulator.all_events_log),
            'recentEvents': self.simulator.all_events_log[-50:],  # Last 50 events
        }


# Initialize simulator manager
manager = SimulatorManager()


# --- API ENDPOINTS ---

@app.route('/api/simulator/start', methods=['POST'])
def start_simulator():
    """Start the simulator"""
    try:
        manager.start()
        return jsonify({'status': 'success', 'message': 'Simulator started'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/simulator/stop', methods=['POST'])
def stop_simulator():
    """Stop the simulator"""
    try:
        manager.stop()
        return jsonify({'status': 'success', 'message': 'Simulator stopped'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/simulator/status', methods=['GET'])
def get_simulator_status():
    """Get simulator status"""
    return jsonify({
        'isRunning': manager.is_running,
        'timeStep': manager.simulator.time_step,
        'timestamp': datetime.now().isoformat(),
    }), 200


@app.route('/api/patients', methods=['GET'])
def get_all_patients():
    """Get snapshot of all patients"""
    try:
        patients = manager.get_patients_snapshot()
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'patients': patients
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/patients/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get detailed data for a specific patient"""
    try:
        patient_detail = manager.get_patient_detail(patient_id)
        if patient_detail is None:
            return jsonify({'status': 'error', 'message': 'Patient not found'}), 404
        
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'patient': patient_detail
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/events', methods=['GET'])
def get_events():
    """Get event log"""
    try:
        events = manager.get_event_log()
        return jsonify({
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'events': events
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    print("Starting ICU Telemetry Simulator Backend...")
    print("API Documentation available at http://localhost:5000/api/health")
    
    # Start in development mode
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        use_reloader=False  # Disable reloader to prevent simulator restart
    )
