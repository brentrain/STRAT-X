import React, { useState, useEffect } from 'react';
import { Patient, PatientCodeStatus } from '../types';

interface ModifyPatientModalProps {
  patient: Patient;
  onSave: (patientData: Patient) => void;
  onClose: () => void;
}

const ModifyPatientModal: React.FC<ModifyPatientModalProps> = ({ patient, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [room, setRoom] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [codeStatus, setCodeStatus] = useState<PatientCodeStatus>('FULL_CODE');
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setAge(patient.age.toString());
      setGender(patient.gender);
      setRoom(patient.room);
      setDiagnosis(patient.diagnosis || '');
      setNotes(patient.notes || '');
      setCodeStatus(patient.codeStatus || 'FULL_CODE');
    }
  }, [patient]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNumber = parseInt(age, 10);
    if (!name.trim() || !room.trim() || !age.trim()) {
      setError('Name, Age, and Room are required fields.');
      return;
    }
    if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 130) {
      setError('Please enter a valid age.');
      return;
    }
    
    onSave({
      ...patient,
      name,
      age: ageNumber,
      gender,
      room,
      diagnosis,
      notes,
      codeStatus
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modify-patient-modal-title"
    >
      <div 
        className="bg-slate-800 text-slate-200 p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modify-patient-modal-title" className="text-xl font-semibold text-sky-400">
            Modify Patient
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modify patient modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
          
          <div>
            <label htmlFor="patientName-modify" className="block text-sm font-medium text-slate-300">Name</label>
            <input type="text" id="patientName-modify" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="patientAge-modify" className="block text-sm font-medium text-slate-300">Age</label>
              <input type="number" id="patientAge-modify" value={age} onChange={e => setAge(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label htmlFor="patientGender-modify" className="block text-sm font-medium text-slate-300">Gender</label>
              <select id="patientGender-modify" value={gender} onChange={e => setGender(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="patientRoom-modify" className="block text-sm font-medium text-slate-300">Room</label>
            <input type="text" id="patientRoom-modify" value={room} onChange={e => setRoom(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
          </div>

          <div>
            <label htmlFor="codeStatus-modify" className="block text-sm font-medium text-slate-300">Code Status</label>
            <select id="codeStatus-modify" value={codeStatus} onChange={e => setCodeStatus(e.target.value as PatientCodeStatus)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 py-2">
                <option value="FULL_CODE">Full Code</option>
                <option value="DNR">DNR (Do Not Resuscitate)</option>
                <option value="DNI">DNI (Do Not Intubate)</option>
                <option value="CCO">Comfort Care Only</option>
                <option value="NC">No Change / Not Specified</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="patientDiagnosis-modify" className="block text-sm font-medium text-slate-300">Diagnosis (Optional)</label>
            <input type="text" id="patientDiagnosis-modify" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
          </div>
          
          <div>
            <label htmlFor="patientNotes-modify" className="block text-sm font-medium text-slate-300">Notes (Optional)</label>
            <textarea id="patientNotes-modify" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-y" />
          </div>
        </form>
        
        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end space-x-3">
            <button onClick={onClose} type="button" className="py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 bg-slate-600 hover:bg-slate-500 border-slate-500 text-slate-200">
                Cancel
            </button>
            <button onClick={handleSubmit} type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500">
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyPatientModal;