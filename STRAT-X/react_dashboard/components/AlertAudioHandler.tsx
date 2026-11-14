import React, { useEffect, useRef } from 'react';
import { PatientSpecificSimData, AlertSeverity } from '../types';

// --- Audio Player Logic ---
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      // Use existing context or create a new one.
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.", e);
      return null;
    }
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  const context = getAudioContext();
  if (!context) return;
  
  // Browsers may suspend audio contexts that are not started by user interaction.
  if (context.state === 'suspended') {
    context.resume();
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  // Set gain to avoid clicking sounds at the start and end of the tone.
  gainNode.gain.setValueAtTime(0, context.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01); // Quick fade-in

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  oscillator.start(context.currentTime);
  // Fade out smoothly
  gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration);
  oscillator.stop(context.currentTime + duration);
};

// A high-pitched, urgent beep sequence for critical alerts
export const playCriticalAlertSound = () => {
    playTone(2500, 0.1, 'square');
    setTimeout(() => playTone(2500, 0.1, 'square'), 150);
};

// A medium-pitched, 3-beep sequence for technical alerts like lead off
export const playLeadOffSound = () => {
    playTone(1200, 0.1, 'sawtooth');
    setTimeout(() => playTone(1200, 0.1, 'sawtooth'), 150);
    setTimeout(() => playTone(1200, 0.1, 'sawtooth'), 300);
};

// A softer, single chime for rhythm changes
export const playRhythmChangeSound = () => {
    playTone(880, 0.2, 'sine');
};

// This function must be called from a user-initiated event (like 'click')
// to unlock the AudioContext in browsers with strict autoplay policies.
export const initAudio = () => {
  const context = getAudioContext();
  if (context && context.state === 'suspended') {
    context.resume();
  }
};
// --- End Audio Player Logic ---


interface AlertAudioHandlerProps {
  simulationDataMap: Map<string, PatientSpecificSimData>;
}

/**
 * A non-rendering component that listens to simulation data and plays audio alerts.
 */
const AlertAudioHandler: React.FC<AlertAudioHandlerProps> = ({ simulationDataMap }) => {
  const previousCriticalAlertIds = useRef<Set<string>>(new Set());
  const previousLeadOffAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentCriticalAlertIds = new Set<string>();
    const currentLeadOffAlertIds = new Set<string>();

    // Collect all current, unacknowledged critical alerts from all patients
    simulationDataMap.forEach((simData) => {
      simData.alerts.forEach(alert => {
        if (alert.severity === AlertSeverity.CRITICAL && !simData.acknowledgedAlertIds.has(alert.id)) {
            if (alert.message === 'ECG Lead Off') {
                currentLeadOffAlertIds.add(alert.id);
            } else {
                currentCriticalAlertIds.add(alert.id);
            }
        }
      });
    });

    // Determine if there are any *new* technical alerts (lead off)
    let hasNewLeadOffAlert = false;
    for (const id of currentLeadOffAlertIds) {
      if (!previousLeadOffAlertIds.current.has(id)) {
        hasNewLeadOffAlert = true;
        break;
      }
    }
    if (hasNewLeadOffAlert) {
      playLeadOffSound();
    }

    // Determine if there are any *new* clinical critical alerts
    let hasNewCriticalAlert = false;
    for (const id of currentCriticalAlertIds) {
      if (!previousCriticalAlertIds.current.has(id)) {
        hasNewCriticalAlert = true;
        break;
      }
    }
    if (hasNewCriticalAlert) {
      playCriticalAlertSound();
    }

    // Store the current set of alerts for the next comparison
    previousCriticalAlertIds.current = currentCriticalAlertIds;
    previousLeadOffAlertIds.current = currentLeadOffAlertIds;

  }, [simulationDataMap]);


  // This component does not render any UI elements.
  return null;
};

export default AlertAudioHandler;