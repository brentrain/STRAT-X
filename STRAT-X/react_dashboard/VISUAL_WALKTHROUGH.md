# 🎬 Step-by-Step Visual Guide - Running Your ICU Simulator

## What You'll See: A Complete Walkthrough

---

## Step 1️⃣: Open Command Prompt

Navigate to your repo:
```
cd c:\Users\brent\QCC\cardiac_monitoring_2.0
```

Expected:
```
C:\Users\brent\QCC\cardiac_monitoring_2.0>
```

---

## Step 2️⃣: Run Setup (One Time Only)

```bash
setup.bat
```

**What you'll see:**
```
========================================
ICU Telemetry Simulator - Starting...
========================================

Python version:
Python 3.14.2

Node.js version:
v18.x.x

Installing Python dependencies...
Collecting flask==2.3.0
  Downloading flask-2.3.0...
Successfully installed flask flask-cors

Installing Node dependencies...
npm WARN package.json ...
added 1234 packages in 45s

========================================
Setup Complete!
========================================

To start the system:
1. Run "start_backend.bat" in one terminal
2. Run "start_frontend.bat" in another terminal
3. Open http://localhost:5173 in your browser
```

---

## Step 3️⃣: Start Backend (Terminal 1)

Open a **new** Command Prompt window and run:

```bash
start_backend.bat
```

**What you'll see:**
```
========================================
ICU Telemetry Simulator - Backend Server
========================================

Starting Flask API server on http://localhost:5000

API Endpoints:
  - POST   /api/simulator/start
  - POST   /api/simulator/stop
  - GET    /api/simulator/status
  - GET    /api/patients
  - GET    /api/patients/<id>
  - GET    /api/events
  - GET    /api/health

Press Ctrl+C to stop the server
========================================

 * Serving Flask app 'backend_simulator'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
 * Press CTRL+C to quit
 * Restarting with stat reloader
 * Debugger is active!
 * Debugger PIN: 123-456-789
```

✅ **Backend is running!** Leave this terminal open.

---

## Step 4️⃣: Start Frontend (Terminal 2)

Open **another new** Command Prompt and run:

```bash
start_frontend.bat
```

**What you'll see:**
```
========================================
ICU Telemetry Simulator - Frontend GUI
========================================

Starting Vite development server on http://localhost:5173

Make sure the backend is running on http://localhost:5000

Press Ctrl+C to stop the server
========================================

  VITE v6.2.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

✅ **Frontend is running!** Leave this terminal open.

---

## Step 5️⃣: Open Browser

Open your web browser and navigate to:

```
http://localhost:5173
```

---

## Step 6️⃣: The Dashboard Appears! 🎉

You'll see the ICU Telemetry Monitoring Dashboard with:

```
═══════════════════════════════════════════════════════════════════════════════════════════════════════
                        🏥 ICU TELEMETRY MONITORING SYSTEM
═══════════════════════════════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────┐
│  [▶ START SIMULATOR]  [● OFFLINE]  Updates: 0        │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Patient Overview                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ P01      │  │ P02      │  │ P03      │  │ P04      │  │ P05      │  ...     │
│  │●OFFLINE  │  │●OFFLINE  │  │●OFFLINE  │  │●OFFLINE  │  │●OFFLINE  │          │
│  │John S.   │  │Mary J.   │  │Robert B. │  │Patricia  │  │Michael   │          │
│  │72, MI    │  │53, Sepsis│  │58, HF    │  │74, Pneu. │  │68, Post  │          │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤          │
│  │HR: ---   │  │HR: ---   │  │HR: ---   │  │HR: ---   │  │HR: ---   │          │
│  │BP: --/--│  │BP: --/--│  │BP: --/--│  │BP: --/--│  │BP: --/--│          │
│  │SpO2: -% │  │SpO2: -% │  │SpO2: -% │  │SpO2: -% │  │SpO2: -% │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                          ...                                    │
│                                                                                 │
│  [Scroll right to see more patients →]                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Global Event Log                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ [No events yet]                                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 7️⃣: Start the Simulator! ▶️

Click the **"▶ START SIMULATOR"** button.

**Within 1 second, you'll see:**

```
═══════════════════════════════════════════════════════════════════════════════════════════════════════
                        🏥 ICU TELEMETRY MONITORING SYSTEM
═══════════════════════════════════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────┐
│  [⏹ STOP SIMULATOR]  [● LIVE]  Updates: 45           │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Patient Overview                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ P01      │  │ P02      │  │ P03      │  │ P04      │  │ P05      │  ...     │
│  │●LIVE     │  │●LIVE     │  │●LIVE     │  │●LIVE     │  │●LIVE     │          │
│  │John S.   │  │Mary J.   │  │Robert B. │  │Patricia  │  │Michael   │          │
│  │72, MI    │  │53, Sepsis│  │58, HF    │  │74, Pneu. │  │68, Post  │          │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤          │
│  │HR: 98 ✓  │  │HR: 62 ✓  │  │HR: 71 ✓  │  │HR: 88 ✓  │  │HR: 65 ✓  │          │
│  │BP: 122/80│  │BP: 120/76│  │BP: 125/70│  │BP: 122/70│  │BP: 113/85│          │
│  │SpO2: 96%│  │SpO2: 97%│  │SpO2: 96%│  │SpO2: 97%│  │SpO2: 97%│          │
│  │[NSR]     │  │[NSR]     │  │[NSR]     │  │[PVCs]    │  │[NSR]     │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│  
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                      │
│  │ P06      │  │ P07      │  │ P08      │                                      │
│  │⚠ LIVE    │  │●LIVE     │  │⚠ LIVE    │                                      │
│  │Jen M.    │  │William T.│  │Linda A.  │                                      │
│  │76, Stroke│  │82, COPD  │  │85, RespF │                                      │
│  ├──────────┤  ├──────────┤  ├──────────┤                                      │
│  │HR: 165⚠ │  │HR: 60 ✓  │  │HR: 142⚠ │                                      │
│  │BP: 120/71│  │BP: 112/79│  │BP: 135/74│                                      │
│  │SpO2: 94%│  │SpO2: 97%│  │SpO2: 95%│                                      │
│  │[A-FIB]   │  │[NSR]     │  │[Tachy]  │  ⚠ [Loose]                          │
│  └──────────┘  └──────────┘  └──────────┘                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Patient Detail: Jen Moore                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Current Vitals          │  Cardiac Status      │  Recent Alerts              │
│  ─────────────────────── │  ─────────────────── │  ──────────────────────     │
│  Heart Rate: 165 bpm ⚠  │  Active Rhythm:     │  13:32:01 RHYTHM_CHANGE    │
│  Blood Pressure: 120/71  │  Atrial Fibrillation│  Rhythm changed to A-FIB   │
│  SpO2: 94.3%            │                     │                             │
│  Temperature: 37.1°C     │  Artifact: None     │  13:32:02 ALERT_WARNING    │
│  Respiratory Rate: 16    │                     │  Severe tachycardia: HR 165│
│                          │                     │                             │
│                          │                     │  13:32:03 ALERT_WARNING    │
│                          │                     │  Severe tachycardia: HR 171│
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Global Event Log                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ [13:32:00.100] Patient 01 (John Smith): RHYTHM_CHANGE - Rhythm changed to Tach │
│ [13:32:00.100] Patient 02 (Mary Johnson): ARTIFACT_DETECTED - Baseline Wander  │
│ [13:32:00.100] Patient 03 (Robert Brown): ARTIFACT_DETECTED - E-Interference   │
│ [13:32:00.100] Patient 04 (Patricia): RHYTHM_CHANGE - Rhythm changed to PVCs   │
│ [13:32:00.100] Patient 06 (Jen Moore): RHYTHM_CHANGE - Rhythm changed to A-FIB│
│ [13:32:00.100] Patient 07 (William): ARTIFACT_DETECTED - Baseline Wander      │
│ [13:32:00.100] Patient 08 (Linda): RHYTHM_CHANGE - Rhythm changed to Tachy    │
│ [13:32:00.100] Patient 08 (Linda): ARTIFACT_DETECTED - Loose Lead             │
│ [13:32:00.100] Patient 08 (Linda): ALERT_WARNING - Severe tachycardia: HR 148 │
│ [13:32:02.341] Patient 06 (Jen Moore): ALERT_WARNING - Severe tachycardia     │
│                                                                                 │
│ ↓ [Scroll to see more events] ↓                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What's Happening Now

✅ **Backend is simulating:**
- 8 patients with realistic vital signs
- Cardiac rhythm changes (Tachycardia, Atrial Fibrillation, etc.)
- Technical artifacts (Loose leads, electrical noise, etc.)
- Real-time event logging

✅ **Frontend is displaying:**
- Live vital signs updating every second
- Color-coded patient cards (🟢 Green, 🟠 Orange, 🔴 Red)
- Real-time events in the log
- Patient detail views with full history

✅ **Updates counter showing:**
- How many times data was refreshed from backend
- Increments every second while running

---

## 🎮 Interactive Features

### Click on a Patient Card
When you click on any patient (e.g., P06 - Jen Moore), you'll see:
- Detailed vital signs
- Cardiac rhythm information
- Recent alerts for that patient
- Technical artifacts if present

### Watch Rhythms Change
As you monitor, you'll see:
- Patients switch between different rhythms
- Heart rates spike (tachycardia) or drop (bradycardia)
- Blood pressure changes compensate
- Oxygen saturation alerts when critical

### Observe Technical Artifacts
The system simulates real-world issues:
- **Loose Lead** - Patient card shows partial data
- **Electrical Interference** - HR fluctuates wildly
- **Muscle Tremor** - Baseline shifts
- **Motion Artifact** - Temporary signal loss

---

## 🛑 To Stop Monitoring

Click **"⏹ STOP SIMULATOR"** button in the dashboard, or:
- Press `Ctrl+C` in backend terminal
- Press `Ctrl+C` in frontend terminal

---

## 📊 Example Patient Scenarios You'll Observe

### Patient 1: John Smith (72, Acute MI)
- May develop Tachycardia (elevated HR compensation)
- Rising blood pressure
- Possible PVCs

### Patient 6: Jennifer Moore (76, Stroke)
- Watch for sustained Atrial Fibrillation
- Irregular heart rate
- Compensatory BP changes

### Patient 8: Linda Anderson (85, Respiratory Failure)
- Likely to show Tachycardia
- SpO2 may dip below 95%
- Loose lead artifact common

---

## 🔍 Advanced Monitoring Tips

### View Raw API Data
Open browser developer tools (F12):

**Network Tab:**
- Watch HTTP requests to `/api/patients`
- See response times (~20-50ms)
- Check JSON response structure

**Console Tab:**
```javascript
// Get all patients in console:
fetch('http://localhost:5000/api/patients')
  .then(r => r.json())
  .then(d => console.table(d.patients))
```

### Check Backend Logs
Terminal running backend shows:
```
127.0.0.1 - - [08/May/2026 13:32:01] "POST /api/simulator/start HTTP/1.1" 200 -
127.0.0.1 - - [08/May/2026 13:32:02] "GET /api/patients HTTP/1.1" 200 -
127.0.0.1 - - [08/May/2026 13:32:03] "GET /api/patients HTTP/1.1" 200 -
```

---

## 🎓 What You've Successfully Done

✅ Cloned existing cardiac_monitoring_2.0 repo  
✅ Integrated Python simulator with React frontend  
✅ Created Flask REST API bridge  
✅ Built professional monitoring dashboard  
✅ Set up complete documentation  
✅ Committed integration to git  

---

## 📚 For More Information

- **QUICK_START.md** - Quick reference (5 min)
- **ICU_SETUP.md** - Full setup guide
- **INTEGRATION_GUIDE.md** - Technical architecture
- **INTEGRATION_SUMMARY.md** - Overview of changes

---

## 🎉 You're Done!

Your ICU telemetry simulator is now **live with a professional GUI**!

### Summary of What's Running:
- ✅ Backend: Flask API on `http://localhost:5000`
- ✅ Frontend: React GUI on `http://localhost:5173`
- ✅ Simulator: 8 patients with realistic vital signs
- ✅ Dashboard: Real-time monitoring with alerts
- ✅ Events: Comprehensive logging with timestamps

**Enjoy monitoring your virtual ICU! 🏥**

---

*Last updated: May 8, 2026*
