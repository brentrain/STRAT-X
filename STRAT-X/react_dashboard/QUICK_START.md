# Quick Start Guide - ICU Telemetry Simulator

## 🚀 Get Running in 5 Minutes

### Step 1: Setup (2 minutes)
Open Command Prompt in the `cardiac_monitoring_2.0` directory:

```bash
setup.bat
```

This installs all Python and Node.js dependencies.

### Step 2: Start Backend (1 minute)
Open a new Command Prompt:

```bash
start_backend.bat
```

You should see:
```
Starting ICU Telemetry Simulator Backend
API server running on http://localhost:5000
```

### Step 3: Start Frontend (1 minute)
Open another Command Prompt:

```bash
start_frontend.bat
```

You should see:
```
VITE v6.2.0  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 4: Open Browser (1 minute)
Navigate to: **http://localhost:5173**

### Step 5: Start Monitoring
Click the **"▶ Start Simulator"** button and watch the magic! 🎉

---

## 📊 What You'll See

### Patient Cards (Grid View)
- 8 patient cards with live vital signs
- Color-coded alerts (🟢 Normal, 🟠 Warning, 🔴 Critical)
- Real-time rhythm updates
- Technical artifact indicators

### Patient Detail Panel
- Select a patient to see detailed vitals
- Blood pressure, oxygen saturation, temperature
- Active cardiac rhythm
- Recent alerts (last 5 events)

### Global Event Log
- Timestamps for all events
- Rhythm changes
- Alert triggers
- Technical artifact detection

---

## 🎮 Simulator Controls

| Button | Action |
|--------|--------|
| ▶ Start | Begin real-time simulation |
| ⏹ Stop | Pause simulation |
| Patient Card Click | View detailed patient info |

---

## 🏥 Understanding the Display

### Vital Signs Color Code
| Color | Meaning | Value |
|-------|---------|-------|
| 🟢 Green | Normal | All vitals stable |
| 🟠 Orange | Warning | HR >140 or <40, SpO2 <90% |
| 🔴 Red | Critical | Asystole, severe desaturation |

### Cardiac Rhythms Shown
- **Normal Sinus Rhythm** - Healthy baseline
- **Tachycardia** - Heart rate >100 bpm
- **Bradycardia** - Heart rate <60 bpm
- **Atrial Fibrillation** - Irregular rhythm
- **PVCs** - Extra beats
- **Asystole** - Cardiac flatline (⚠️ Critical!)
- **Ventricular Fibrillation** - Disorganized rhythm

### Technical Artifacts
- **Loose Lead** - Lost signal quality
- **Electrical Interference** - 60Hz noise
- **Muscle Tremor** - Movement artifact  
- **Baseline Wander** - Slow drift
- **Motion Artifact** - Patient movement

---

## 📱 Features

✅ **Real-Time Updates**
- Live vital signs stream at 1Hz
- Automatic alert generation
- Event logging with timestamps

✅ **Patient Management**
- 8 diverse patient scenarios
- Realistic diagnoses
- Variable age ranges (45-85 years)

✅ **Clinical Accuracy**
- Vital sign fluctuations follow medical models
- Arrhythmias trigger appropriate compensation
- Critical thresholds match ICU standards

✅ **Event Tracking**
- Complete audit trail
- Precise timestamps (millisecond accuracy)
- Event history per patient

---

## 🐛 Troubleshooting

### Backend won't start
```
ERROR: Python not found
→ Install Python 3.8+ from python.org
```

### Frontend won't connect
```
Error connecting to simulator
→ Make sure backend is running on localhost:5000
→ Check firewall settings
```

### No data updating
```
Updates: 0 (stuck)
→ Click "Start Simulator" button
→ Check browser console (F12) for errors
```

### Port already in use
```
Address already in use
→ Kill existing process: taskkill /F /IM python.exe
→ Or use different port: edit backend_simulator.py
```

---

## 📚 Files Overview

| File | Purpose |
|------|---------|
| `backend_simulator.py` | Flask REST API server |
| `icu_telemetry_simulator.py` | Core simulation engine |
| `components/ICUPatientMonitoringDashboard.tsx` | React UI component |
| `components/ICUPatientMonitoringDashboard.css` | Dashboard styling |
| `requirements.txt` | Python dependencies |
| `package.json` | Node.js dependencies |
| `start_backend.bat` | Launch backend |
| `start_frontend.bat` | Launch frontend |

---

## 📖 Documentation

- **ICU_SETUP.md** - Detailed installation guide
- **INTEGRATION_GUIDE.md** - Architecture & technical details
- **This file** - Quick start reference

---

## 🎯 Common Tasks

### Change Update Frequency
Edit `backend_simulator.py`:
```python
update_rate = 2.0  # Change from 1.0 to 2.0 seconds
```

### Add More Patients
Edit `backend_simulator.py`:
```python
simulator = ICUTelemetrySimulator(num_patients=16)  # Change from 8 to 16
```

### View Detailed Event Log
In browser DevTools (F12):
```javascript
fetch('http://localhost:5000/api/events')
  .then(r => r.json())
  .then(d => console.log(d.events.recentEvents))
```

### Export Event Data
Backend automatically saves events to log file. Check terminal for filename:
```
Event log saved to: icu_telemetry_log_20260508_133234.txt
```

---

## ⚡ Performance Tips

- **Smooth updates**: Run on modern browser (Chrome/Firefox)
- **Multi-monitor**: Spread dashboard across multiple screens
- **Full screen**: F11 for distraction-free monitoring
- **High resolution**: 1920x1080 minimum recommended

---

## 🔗 API Endpoints (Advanced)

Test directly in browser:

```
# Get all patients
http://localhost:5000/api/patients

# Get specific patient (1-8)
http://localhost:5000/api/patients/1

# Get event log
http://localhost:5000/api/events

# Check health
http://localhost:5000/api/health
```

---

## 📞 Support

### Debug Mode
Check browser console (F12) for errors:
```
Network tab: See all API calls
Console tab: JavaScript errors
Application tab: LocalStorage state
```

### Check Backend Logs
Terminal running `start_backend.bat` shows:
```
[timestamp] POST /api/simulator/start
[timestamp] GET /api/patients
[timestamp] POST /api/simulator/stop
```

---

## 🎓 What You're Simulating

This system realistically simulates a **busy ICU unit**:
- **8 critical patients** with diverse conditions
- **Real cardiac physiology** with appropriate compensatory changes
- **Clinical artifacts** that nurses encounter daily
- **Professional-grade monitoring** interface

Perfect for:
- Clinical training
- Nursing education
- System demonstrations
- Research & development

---

**Ready to monitor? Start with Step 1 above!** 🏥

For technical details, see **INTEGRATION_GUIDE.md**
