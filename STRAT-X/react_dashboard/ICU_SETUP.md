# ICU Telemetry Simulator - Integrated GUI

This repository contains an integrated ICU telemetry monitoring system combining a Python backend simulator with a React frontend GUI.

## System Architecture

### Backend
- **Python 3.8+** with Flask
- Real-time ICU telemetry simulator with 8 patients
- REST API endpoints for data streaming
- Realistic vital sign fluctuations and cardiac arrhythmias
- Technical artifact simulation (loose leads, electrical interference, etc.)
- Comprehensive event logging with timestamps

### Frontend  
- **React 18** with TypeScript
- **Vite** build tool
- **Recharts** for data visualization
- Real-time patient monitoring dashboard
- Live vital signs display with alerts
- Event timeline and patient detail views

## Features

✅ **8 Realistic ICU Patients** - Various diagnoses including MI, Sepsis, Heart Failure, etc.

✅ **Live Cardiac Rhythms**
- Normal Sinus Rhythm
- Tachycardia / Bradycardia
- Atrial Fibrillation
- Premature Ventricular Contractions
- Asystole (flatline)
- Ventricular Fibrillation

✅ **Technical Artifacts**
- Loose leads (signal dropout)
- Electrical interference (50/60 Hz)
- Muscle tremor
- Baseline wander
- Motion artifact

✅ **Real-time Monitoring**
- Live vital signs: HR, BP, SpO2, Temperature, RR
- Automatic alert generation
- Patient-specific trend data
- Global event timeline

## Quick Start

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server:**
   ```bash
   python backend_simulator.py
   ```
   
   The API will be available at `http://localhost:5000`
   
   **API Endpoints:**
   - `POST /api/simulator/start` - Start the simulator
   - `POST /api/simulator/stop` - Stop the simulator  
   - `GET /api/simulator/status` - Get current status
   - `GET /api/patients` - Get all patients' current state
   - `GET /api/patients/<id>` - Get detailed patient data
   - `GET /api/events` - Get event log
   - `GET /api/health` - Health check

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   The GUI will be available at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. Start the backend: `python backend_simulator.py`
2. Start the frontend: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Click "▶ Start Simulator" button
5. Watch 8 patients' vital signs update in real-time
6. Click on patient cards to view detailed information
7. Monitor the global event log for alerts and rhythm changes

## File Structure

```
cardiac_monitoring_2.0/
├── backend_simulator.py          # Flask API server
├── icu_telemetry_simulator.py   # Core simulator engine
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
├── App.tsx                       # Main React component
├── index.tsx                     # React entry point
├── types.ts                      # TypeScript type definitions
├── constants.ts                  # Constants and defaults
├── components/
│   ├── ICUPatientMonitoringDashboard.tsx  # New integrated GUI
│   ├── ICUPatientMonitoringDashboard.css  # Dashboard styles
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PatientRowDisplay.tsx
│   └── ... (other components)
├── index.html
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Simulator Configuration

### Adjusting Simulation Parameters

Edit `backend_simulator.py`:

```python
# Update rate (seconds between simulator updates)
update_rate = 1  # Default: 1 second

# Number of patients
simulator = ICUTelemetrySimulator(num_patients=8)
```

### Patient Customization

The simulator automatically generates patients with:
- Random ages (45-85 years)
- Realistic diagnoses
- Initial vital signs appropriate to diagnosis
- Varying baseline heart rates

## API Response Examples

### Get All Patients
```bash
curl http://localhost:5000/api/patients
```

Response:
```json
{
  "status": "success",
  "timestamp": "2026-05-08T13:32:34.123456",
  "patients": [
    {
      "id": "P01",
      "name": "John Smith",
      "age": 72,
      "diagnosis": "Acute MI",
      "vitals": {
        "heartRate": 98.5,
        "systolicBP": 122.0,
        "diastolicBP": 80.2,
        "spo2": 96.2,
        "respiratoryRate": 16,
        "temperature": 37.1
      },
      "rhythm": "Tachycardia",
      "artifact": null,
      "alerts": [...]
    }
  ]
}
```

### Get Specific Patient Details
```bash
curl http://localhost:5000/api/patients/1
```

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Ensure Flask and CORS are installed: `pip install -r requirements.txt`
- Check if port 5000 is already in use: `netstat -ano | findstr :5000`

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Ensure both are running on localhost

### No data appearing in GUI
- Click "▶ Start Simulator" button in the dashboard
- Check network tab in browser dev tools
- Verify API endpoints are responding: `curl http://localhost:5000/api/health`

## Performance Notes

- Backend updates: 1 per second (configurable)
- Frontend refresh rate: Matches backend update rate
- Event log keeps last 50 events per patient
- Vital history: Last 60 readings per patient
- Optimal viewing on 1920x1080+ for full patient grid

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Cardiac Rhythms

Edit `icu_telemetry_simulator.py`:

```python
class CardiacRhythm(Enum):
    YOUR_NEW_RHYTHM = "Your Rhythm Name"
    
# Add rhythm behavior in ICUTelemetrySimulator class:
def _induce_your_rhythm(self, patient: Patient):
    # Implementation
```

### Customizing Alert Thresholds

Edit `backend_simulator.py` API responses or `types.ts` in frontend.

## License

This project is provided as-is for educational and clinical training purposes.

## Support

For issues or questions, refer to the component documentation in the code.

---

**Last Updated:** May 8, 2026  
**Version:** 1.0.0
