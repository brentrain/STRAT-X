#!/usr/bin/env python3
"""
ICU Telemetry Simulator - Simulates a busy ICU unit with 8 patients
Generates realistic cardiac vitals with fluctuations, arrhythmias, and technical artifacts
"""

import random
import time
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Tuple
from enum import Enum
import math
import sys
from collections import deque

# When True, rhythms cycle only among NSR, sinus tach, sinus brady, and atrial fibrillation
# (no PVC runs, VFib, or asystole as intrinsic rhythms from the state machine).
SINUS_RHYTHM_VARIANTS_ONLY = True


def _configure_stdout_utf8() -> None:
    """Make Windows consoles accept UTF-8 so symbols like warning markers print correctly."""
    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:
            pass
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is None:
            continue
        try:
            reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError, AttributeError, TypeError):
            pass


class CardiacRhythm(Enum):
    """Types of cardiac rhythms that can occur"""
    NORMAL_SINUS = "Normal Sinus Rhythm"
    TACHYCARDIA = "Sinus Tachycardia"
    BRADYCARDIA = "Sinus Bradycardia"
    ASYSTOLE = "Asystole"
    VENTRICULAR_FIBRILLATION = "Ventricular Fibrillation"
    ATRIAL_FIBRILLATION = "Atrial Fibrillation"
    PREMATURE_VENTRICULAR_CONTRACTIONS = "PVCs"


# Rhythms used when SINUS_RHYTHM_VARIANTS_ONLY is True (sim + HIL dropdown).
RESTRICTED_RHYTHM_ALLOWLIST = frozenset(
    {
        CardiacRhythm.NORMAL_SINUS,
        CardiacRhythm.TACHYCARDIA,
        CardiacRhythm.BRADYCARDIA,
        CardiacRhythm.ATRIAL_FIBRILLATION,
    }
)


def rhythm_choices_for_human_ui() -> List[str]:
    """Rhythm labels to show in the dashboard human-correction dropdown (matches profile)."""
    if SINUS_RHYTHM_VARIANTS_ONLY:
        return [
            CardiacRhythm.NORMAL_SINUS.value,
            CardiacRhythm.TACHYCARDIA.value,
            CardiacRhythm.BRADYCARDIA.value,
            CardiacRhythm.ATRIAL_FIBRILLATION.value,
        ]
    return [r.value for r in CardiacRhythm]


class TechnicalArtifact(Enum):
    """Technical issues that can occur"""
    LOOSE_LEAD = "Loose Lead"
    ELECTRICAL_INTERFERENCE = "Electrical Interference"
    MUSCLE_TREMOR = "Muscle Tremor"
    BASELINE_WANDER = "Baseline Wander"
    MOTION_ARTIFACT = "Motion Artifact"
    NONE = "None"


@dataclass
class VitalSigns:
    """Represents a patient's vital signs"""
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    o2_saturation: float
    respiratory_rate: float
    temperature: float


@dataclass
class PatientEvent:
    """Represents a logged event for a patient"""
    timestamp: str
    patient_id: int
    event_type: str
    description: str
    vital_signs: VitalSigns


@dataclass
class Patient:
    """Represents an ICU patient"""
    patient_id: int
    name: str
    age: int
    diagnosis: str
    
    # Current vital signs
    vitals: VitalSigns = field(default_factory=lambda: VitalSigns(
        heart_rate=72, systolic_bp=120, diastolic_bp=80, 
        o2_saturation=98, respiratory_rate=16, temperature=37.0
    ))
    
    # Baseline vitals (used for fluctuations)
    baseline_hr: float = 72
    baseline_sbp: float = 120
    baseline_dbp: float = 80
    baseline_o2: float = 98
    
    # Current state
    current_rhythm: CardiacRhythm = CardiacRhythm.NORMAL_SINUS
    current_artifact: TechnicalArtifact = TechnicalArtifact.NONE
    rhythm_duration: int = 0
    artifact_duration: int = 0
    
    # History for trend analysis
    vital_history: deque = field(default_factory=lambda: deque(maxlen=60))
    events: List[PatientEvent] = field(default_factory=list)


class ICUTelemetrySimulator:
    """Main ICU telemetry simulator"""
    
    def __init__(self, num_patients: int = 8):
        self.num_patients = num_patients
        self.patients = self._initialize_patients()
        self.time_step = 0
        self.event_log: List[PatientEvent] = []
        self.all_events_log: List[str] = []
        
    def _initialize_patients(self) -> List[Patient]:
        """Initialize patient cohort with realistic diagnoses"""
        diagnoses = [
            "Acute MI",
            "Sepsis",
            "Heart Failure",
            "Pneumonia",
            "Post-operative",
            "Stroke",
            "COPD Exacerbation",
            "Respiratory Failure"
        ]
        
        names = [
            "John Smith", "Mary Johnson", "Robert Brown", "Patricia Davis",
            "Michael Wilson", "Jennifer Moore", "William Taylor", "Linda Anderson"
        ]
        
        patients = []
        for i in range(self.num_patients):
            baseline_hr = random.randint(60, 90) if i % 3 != 0 else random.randint(45, 65)
            
            patient = Patient(
                patient_id=i + 1,
                name=names[i],
                age=random.randint(45, 85),
                diagnosis=diagnoses[i],
                baseline_hr=baseline_hr,
                baseline_sbp=random.randint(110, 130),
                baseline_dbp=random.randint(70, 85),
                baseline_o2=random.uniform(95, 99)
            )
            patient.vitals.heart_rate = patient.baseline_hr
            patient.vitals.systolic_bp = patient.baseline_sbp
            patient.vitals.diastolic_bp = patient.baseline_dbp
            patient.vitals.o2_saturation = patient.baseline_o2
            
            patients.append(patient)
        
        return patients
    
    def _log_event(self, patient: Patient, event_type: str, description: str):
        """Log an event with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        event = PatientEvent(
            timestamp=timestamp,
            patient_id=patient.patient_id,
            event_type=event_type,
            description=description,
            vital_signs=VitalSigns(
                heart_rate=patient.vitals.heart_rate,
                systolic_bp=patient.vitals.systolic_bp,
                diastolic_bp=patient.vitals.diastolic_bp,
                o2_saturation=patient.vitals.o2_saturation,
                respiratory_rate=patient.vitals.respiratory_rate,
                temperature=patient.vitals.temperature
            )
        )
        patient.events.append(event)
        self.event_log.append(event)
        self.all_events_log.append(
            f"[{timestamp}] Patient {patient.patient_id:02d} ({patient.name}): {event_type} - {description}"
        )
    
    def _generate_normal_fluctuation(self, baseline: float, variance: float = 0.1) -> float:
        """Generate natural vital sign fluctuations using sine wave + noise"""
        sine_component = math.sin(self.time_step * 0.1) * baseline * variance * 0.5
        noise = random.gauss(0, baseline * variance * 0.3)
        return baseline + sine_component + noise
    
    def _update_vitals_normal(self, patient: Patient):
        """Update vitals for normal sinus rhythm"""
        patient.vitals.heart_rate = max(50, min(110, 
            self._generate_normal_fluctuation(patient.baseline_hr, 0.12)))
        
        patient.vitals.systolic_bp = max(80, min(160,
            self._generate_normal_fluctuation(patient.baseline_sbp, 0.10)))
        
        patient.vitals.diastolic_bp = max(50, min(100,
            self._generate_normal_fluctuation(patient.baseline_dbp, 0.10)))
        
        patient.vitals.o2_saturation = max(92, min(100,
            self._generate_normal_fluctuation(patient.baseline_o2, 0.05)))
        
        patient.vitals.respiratory_rate = max(12, min(24,
            self._generate_normal_fluctuation(16, 0.15)))
        
        patient.vitals.temperature = 37.0 + random.gauss(0, 0.3)
    
    def _induce_tachycardia(self, patient: Patient):
        """Simulate tachycardia (elevated heart rate)"""
        severity = random.uniform(0.7, 1.0)
        patient.vitals.heart_rate = min(180,
            patient.baseline_hr + random.randint(40, 80) * severity)
        
        # Compensatory changes
        patient.vitals.o2_saturation = max(92, patient.baseline_o2 - random.uniform(1, 4))
        patient.vitals.systolic_bp = min(160,
            patient.baseline_sbp + random.randint(10, 25))
    
    def _induce_bradycardia(self, patient: Patient):
        """Simulate bradycardia (slow heart rate)"""
        severity = random.uniform(0.6, 1.0)
        patient.vitals.heart_rate = max(35,
            patient.baseline_hr - random.randint(20, 45) * severity)
        
        # Compensatory changes
        patient.vitals.systolic_bp = max(85,
            patient.baseline_sbp - random.randint(5, 20))
        patient.vitals.diastolic_bp = max(50,
            patient.baseline_dbp - random.randint(5, 15))
    
    def _induce_asystole(self, patient: Patient):
        """Simulate asystole (flatline)"""
        patient.vitals.heart_rate = 0
        patient.vitals.systolic_bp = 0
        patient.vitals.diastolic_bp = 0
        patient.vitals.o2_saturation = max(80, patient.vitals.o2_saturation - 15)
    
    def _induce_atrial_fibrillation(self, patient: Patient):
        """Simulate atrial fibrillation with irregular rate"""
        # Irregular heart rate
        patient.vitals.heart_rate = random.randint(80, 180)
        
        # Slightly elevated BP
        patient.vitals.systolic_bp = patient.baseline_sbp + random.randint(-10, 20)
        
        # Decreased O2
        patient.vitals.o2_saturation = max(92, patient.baseline_o2 - random.uniform(1, 3))
    
    def _induce_pvcs(self, patient: Patient):
        """Simulate premature ventricular contractions"""
        # Random spikes in heart rate
        if random.random() < 0.3:  # Occasional extra beat
            patient.vitals.heart_rate += random.randint(15, 40)
        else:
            patient.vitals.heart_rate = self._generate_normal_fluctuation(patient.baseline_hr, 0.15)
    
    def _induce_ventricular_fibrillation(self, patient: Patient):
        """Simulate ventricular fibrillation"""
        patient.vitals.heart_rate = random.randint(0, 30)  # Chaotic, ineffective rhythm
        patient.vitals.systolic_bp = random.randint(20, 40)
        patient.vitals.o2_saturation = max(70, patient.vitals.o2_saturation - 25)
    
    def _apply_loose_lead_artifact(self, patient: Patient):
        """Simulate loose lead artifact"""
        if random.random() < 0.6:
            patient.vitals.heart_rate += random.randint(-15, 15)
        else:
            patient.vitals.heart_rate = 0  # Temporary loss of signal
    
    def _apply_electrical_interference(self, patient: Patient):
        """Simulate electrical interference (50/60 Hz noise)"""
        patient.vitals.heart_rate += random.randint(-20, 20)
        patient.vitals.systolic_bp += random.randint(-10, 10)
        patient.vitals.diastolic_bp += random.randint(-8, 8)
    
    def _apply_muscle_tremor(self, patient: Patient):
        """Simulate muscle tremor artifact"""
        patient.vitals.heart_rate += random.randint(-25, 25)
        patient.vitals.o2_saturation += random.uniform(-2, 2)
    
    def _apply_baseline_wander(self, patient: Patient):
        """Simulate baseline wander (slow drift)"""
        drift = math.sin(self.time_step * 0.05) * 5
        patient.vitals.systolic_bp += drift
        patient.vitals.diastolic_bp += drift * 0.7
    
    def _apply_motion_artifact(self, patient: Patient):
        """Simulate motion artifact"""
        patient.vitals.heart_rate += random.randint(-30, 30)
        patient.vitals.o2_saturation += random.uniform(-3, 2)
    
    def _decide_rhythm_change(self, patient: Patient):
        """Probabilistically change cardiac rhythm"""
        if SINUS_RHYTHM_VARIANTS_ONLY and patient.current_rhythm not in RESTRICTED_RHYTHM_ALLOWLIST:
            patient.current_rhythm = CardiacRhythm.NORMAL_SINUS
            patient.rhythm_duration = random.randint(25, 75)

        if patient.rhythm_duration <= 0:
            if SINUS_RHYTHM_VARIANTS_ONLY:
                rhythm_probs = {
                    CardiacRhythm.NORMAL_SINUS: 0.58,
                    CardiacRhythm.TACHYCARDIA: 0.15,
                    CardiacRhythm.BRADYCARDIA: 0.12,
                    CardiacRhythm.ATRIAL_FIBRILLATION: 0.15,
                }
                if "Failure" in patient.diagnosis:
                    rhythm_probs[CardiacRhythm.ATRIAL_FIBRILLATION] += 0.08
                    rhythm_probs[CardiacRhythm.NORMAL_SINUS] -= 0.08
            else:
                rhythm_probs = {
                    CardiacRhythm.NORMAL_SINUS: 0.65,
                    CardiacRhythm.TACHYCARDIA: 0.10,
                    CardiacRhythm.BRADYCARDIA: 0.08,
                    CardiacRhythm.ATRIAL_FIBRILLATION: 0.08,
                    CardiacRhythm.PREMATURE_VENTRICULAR_CONTRACTIONS: 0.07,
                    CardiacRhythm.ASYSTOLE: 0.01,
                    CardiacRhythm.VENTRICULAR_FIBRILLATION: 0.01,
                }

                if "MI" in patient.diagnosis or "Sepsis" in patient.diagnosis:
                    rhythm_probs[CardiacRhythm.TACHYCARDIA] += 0.05
                    rhythm_probs[CardiacRhythm.ATRIAL_FIBRILLATION] += 0.03
                    rhythm_probs[CardiacRhythm.NORMAL_SINUS] -= 0.08

                if "Failure" in patient.diagnosis:
                    rhythm_probs[CardiacRhythm.ATRIAL_FIBRILLATION] += 0.05
                    rhythm_probs[CardiacRhythm.NORMAL_SINUS] -= 0.05

            rand_val = random.random()
            cumulative = 0
            for rhythm, prob in rhythm_probs.items():
                cumulative += prob
                if rand_val < cumulative:
                    if rhythm != patient.current_rhythm:
                        self._log_event(patient, "RHYTHM_CHANGE",
                                        f"Rhythm changed to {rhythm.value}")
                    patient.current_rhythm = rhythm
                    patient.rhythm_duration = random.randint(20, 100)
                    break

        patient.rhythm_duration -= 1
    
    def _decide_artifact(self, patient: Patient):
        """Probabilistically introduce technical artifacts"""
        if patient.artifact_duration <= 0:
            if SINUS_RHYTHM_VARIANTS_ONLY:
                artifact_probs = {
                    TechnicalArtifact.NONE: 0.88,
                    TechnicalArtifact.LOOSE_LEAD: 0.04,
                    TechnicalArtifact.ELECTRICAL_INTERFERENCE: 0.03,
                    TechnicalArtifact.MUSCLE_TREMOR: 0.03,
                    TechnicalArtifact.BASELINE_WANDER: 0.015,
                    TechnicalArtifact.MOTION_ARTIFACT: 0.015,
                }
            else:
                artifact_probs = {
                    TechnicalArtifact.NONE: 0.70,
                    TechnicalArtifact.LOOSE_LEAD: 0.08,
                    TechnicalArtifact.ELECTRICAL_INTERFERENCE: 0.08,
                    TechnicalArtifact.MUSCLE_TREMOR: 0.08,
                    TechnicalArtifact.BASELINE_WANDER: 0.04,
                    TechnicalArtifact.MOTION_ARTIFACT: 0.02,
                }
            
            rand_val = random.random()
            cumulative = 0
            for artifact, prob in artifact_probs.items():
                cumulative += prob
                if rand_val < cumulative:
                    if artifact != patient.current_artifact and artifact != TechnicalArtifact.NONE:
                        self._log_event(patient, "ARTIFACT_DETECTED", 
                                      f"Technical artifact: {artifact.value}")
                    patient.current_artifact = artifact
                    patient.artifact_duration = random.randint(5, 30)
                    break
        
        patient.artifact_duration -= 1
    
    def _apply_rhythm_to_vitals(self, patient: Patient):
        """Apply cardiac rhythm to vital signs"""
        if patient.current_rhythm == CardiacRhythm.NORMAL_SINUS:
            self._update_vitals_normal(patient)
        elif patient.current_rhythm == CardiacRhythm.TACHYCARDIA:
            self._induce_tachycardia(patient)
        elif patient.current_rhythm == CardiacRhythm.BRADYCARDIA:
            self._induce_bradycardia(patient)
        elif patient.current_rhythm == CardiacRhythm.ASYSTOLE:
            self._induce_asystole(patient)
        elif patient.current_rhythm == CardiacRhythm.ATRIAL_FIBRILLATION:
            self._induce_atrial_fibrillation(patient)
        elif patient.current_rhythm == CardiacRhythm.PREMATURE_VENTRICULAR_CONTRACTIONS:
            self._induce_pvcs(patient)
        elif patient.current_rhythm == CardiacRhythm.VENTRICULAR_FIBRILLATION:
            self._induce_ventricular_fibrillation(patient)
    
    def _apply_artifact_to_vitals(self, patient: Patient):
        """Apply technical artifacts to vital signs"""
        if patient.current_artifact == TechnicalArtifact.LOOSE_LEAD:
            self._apply_loose_lead_artifact(patient)
        elif patient.current_artifact == TechnicalArtifact.ELECTRICAL_INTERFERENCE:
            self._apply_electrical_interference(patient)
        elif patient.current_artifact == TechnicalArtifact.MUSCLE_TREMOR:
            self._apply_muscle_tremor(patient)
        elif patient.current_artifact == TechnicalArtifact.BASELINE_WANDER:
            self._apply_baseline_wander(patient)
        elif patient.current_artifact == TechnicalArtifact.MOTION_ARTIFACT:
            self._apply_motion_artifact(patient)
    
    def _detect_critical_events(self, patient: Patient):
        """Detect and log critical events"""
        # Asystole alert
        if patient.vitals.heart_rate == 0:
            self._log_event(patient, "ALERT_CRITICAL", "ASYSTOLE - No heartbeat detected!")
        
        # Severe tachycardia
        elif patient.vitals.heart_rate > 140:
            self._log_event(patient, "ALERT_WARNING", f"Severe tachycardia: HR {patient.vitals.heart_rate:.0f}")
        
        # Severe bradycardia
        elif patient.vitals.heart_rate < 40:
            self._log_event(patient, "ALERT_WARNING", f"Severe bradycardia: HR {patient.vitals.heart_rate:.0f}")
        
        # Critical oxygen desaturation
        if patient.vitals.o2_saturation < 90:
            self._log_event(patient, "ALERT_CRITICAL", f"Desaturation: SpO2 {patient.vitals.o2_saturation:.1f}%")
        
        # Hypotension
        if patient.vitals.systolic_bp < 90:
            self._log_event(patient, "ALERT_WARNING", 
                           f"Hypotension: SBP {patient.vitals.systolic_bp:.0f}")
        
        # Hypertension
        if patient.vitals.systolic_bp > 180:
            self._log_event(patient, "ALERT_WARNING", 
                           f"Hypertension: SBP {patient.vitals.systolic_bp:.0f}")
    
    def update_step(self):
        """Execute one time step of simulation"""
        self.time_step += 1
        
        for patient in self.patients:
            # Decide on rhythm changes
            self._decide_rhythm_change(patient)
            
            # Decide on technical artifacts
            self._decide_artifact(patient)
            
            # Apply rhythm effects to vitals
            self._apply_rhythm_to_vitals(patient)
            
            # Apply artifacts to vitals
            self._apply_artifact_to_vitals(patient)
            
            # Ensure vitals stay in reasonable ranges
            patient.vitals.heart_rate = max(0, min(200, patient.vitals.heart_rate))
            patient.vitals.systolic_bp = max(0, min(250, patient.vitals.systolic_bp))
            patient.vitals.diastolic_bp = max(0, min(150, patient.vitals.diastolic_bp))
            patient.vitals.o2_saturation = max(50, min(100, patient.vitals.o2_saturation))
            patient.vitals.respiratory_rate = max(5, min(50, patient.vitals.respiratory_rate))
            patient.vitals.temperature = max(35, min(40, patient.vitals.temperature))
            
            # Store in history
            patient.vital_history.append(patient.vitals)
            
            # Detect critical events
            self._detect_critical_events(patient)
    
    def display_current_state(self):
        """Display current state of all patients"""
        clear_screen()
        print("=" * 150)
        print("ICU TELEMETRY MONITORING SYSTEM".center(150))
        print(f"Time Step: {self.time_step} | Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(150))
        print("=" * 150)
        print()
        
        # Header
        print(f"{'Patient':<15} {'Name':<18} {'Age':<5} {'Diagnosis':<20} {'HR':<8} {'BP':<15} {'SpO2':<8} {'RR':<5} {'Rhythm':<30} {'Artifact':<20}")
        print("-" * 150)
        
        # Patient data
        for patient in self.patients:
            hr_str = f"{patient.vitals.heart_rate:.0f}" if patient.vitals.heart_rate > 0 else "---"
            bp_str = f"{patient.vitals.systolic_bp:.0f}/{patient.vitals.diastolic_bp:.0f}" if patient.vitals.systolic_bp > 0 else "---/---"
            o2_str = f"{patient.vitals.o2_saturation:.1f}%"
            rr_str = f"{patient.vitals.respiratory_rate:.0f}"
            rhythm_str = patient.current_rhythm.value
            artifact_str = patient.current_artifact.value if patient.current_artifact != TechnicalArtifact.NONE else "---"
            
            # Color warnings for critical values
            if patient.vitals.heart_rate == 0 or patient.vitals.heart_rate > 140 or patient.vitals.heart_rate < 40:
                hr_str = f"⚠ {hr_str}"
            if patient.vitals.o2_saturation < 90:
                o2_str = f"⚠ {o2_str}"
            if patient.vitals.systolic_bp < 90 or patient.vitals.systolic_bp > 180:
                bp_str = f"⚠ {bp_str}"
            
            print(f"Patient {patient.patient_id:02d}".ljust(15) + 
                  f"{patient.name:<18} {patient.age:<5} {patient.diagnosis:<20} " +
                  f"{hr_str:<8} {bp_str:<15} {o2_str:<8} {rr_str:<5} {rhythm_str:<30} {artifact_str:<20}")
        
        print()
        print("=" * 150)
        print("RECENT EVENTS LOG (Latest 20)".center(150))
        print("-" * 150)
        
        # Display recent events
        recent_events = self.all_events_log[-20:] if self.all_events_log else ["No events yet"]
        for event in recent_events:
            print(event)
        
        print("=" * 150)


def clear_screen():
    """Clear the console screen"""
    import os
    os.system('cls' if os.name == 'nt' else 'clear')


def run_simulation(duration_seconds: int = 120, update_interval: float = 1.0):
    """Run the ICU telemetry simulation"""
    _configure_stdout_utf8()
    simulator = ICUTelemetrySimulator(num_patients=8)
    
    print("Initializing ICU Telemetry Simulator with 8 patients...")
    time.sleep(2)
    
    start_time = time.time()
    
    try:
        while time.time() - start_time < duration_seconds:
            simulator.update_step()
            simulator.display_current_state()
            time.sleep(update_interval)
    
    except KeyboardInterrupt:
        print("\nSimulation interrupted by user.")
    
    # Generate final report
    generate_report(simulator)


def generate_report(simulator: ICUTelemetrySimulator):
    """Generate a detailed event report"""
    clear_screen()
    print("=" * 120)
    print("ICU TELEMETRY EVENT REPORT".center(120))
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(120))
    print("=" * 120)
    print()
    
    for patient in simulator.patients:
        print(f"\n{'PATIENT ' + str(patient.patient_id).upper():^120}")
        print(f"Name: {patient.name} | Age: {patient.age} | Diagnosis: {patient.diagnosis}")
        print("-" * 120)
        
        if patient.events:
            print(f"{'Timestamp':<25} {'Event Type':<20} {'Description':<50} {'HR':<8} {'BP':<15} {'SpO2':<8}")
            print("-" * 120)
            
            for event in patient.events[-50:]:  # Show last 50 events per patient
                hr = f"{event.vital_signs.heart_rate:.0f}" if event.vital_signs.heart_rate > 0 else "---"
                bp = f"{event.vital_signs.systolic_bp:.0f}/{event.vital_signs.diastolic_bp:.0f}" if event.vital_signs.systolic_bp > 0 else "---"
                o2 = f"{event.vital_signs.o2_saturation:.1f}%"
                
                print(f"{event.timestamp:<25} {event.event_type:<20} {event.description:<50} {hr:<8} {bp:<15} {o2:<8}")
        else:
            print("No events recorded for this patient.")
    
    print("\n" + "=" * 120)
    print(f"Total Events Logged: {len(simulator.all_events_log)}")
    print("=" * 120)
    
    # Save detailed log to file
    log_filename = f"icu_telemetry_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(log_filename, 'w') as f:
        f.write(f"ICU TELEMETRY EVENT LOG\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 120 + "\n\n")
        
        for event_str in simulator.all_events_log:
            f.write(event_str + "\n")
    
    print(f"\nDetailed log saved to: {log_filename}")


if __name__ == "__main__":
    duration = 120  # Default 2 minutes
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except ValueError:
            print("Usage: python icu_telemetry_simulator.py [duration_in_seconds]")
            sys.exit(1)
    
    print(f"Starting ICU Telemetry Simulation for {duration} seconds...")
    run_simulation(duration_seconds=duration, update_interval=1.0)
