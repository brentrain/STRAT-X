# Cardiac Monitoring         🩺

**Cardiac Monitoring** is an advanced cardiac monitoring simulator designed for clinical education and demonstration. It features a sleek, intuitive, and responsive interface for real-time patient assessment and predictive analysis of cardiac decompensation, running entirely in your browser with no build process.

## ✨ Core Features

-   **Multi-Patient Dashboard:** Monitor multiple patients simultaneously from a single, clean interface. Each patient has a dedicated, expandable row displaying all critical information.
-   **Real-Time Waveform Visualization:**
    -   Live, streaming **ECG waveform** that dynamically changes based on the selected cardiac rhythm.
    -   Continuous **SpO₂ plethysmograph** and **Respiration waveforms** for comprehensive physiological monitoring.
-   **Comprehensive Vital Signs Panel:** View key metrics at a glance, including Heart Rate (HR), Blood Pressure (BP), Oxygen Saturation (SpO₂), Respiratory Rate (RR), and Temperature. Values are color-coded based on alert thresholds.
-   **AI-Powered Risk Stratification (HeartSenseAI):**
    -   Utilizes a sophisticated, **built-in simulation engine** to mimic the predictive capabilities of a real AI model. This feature operates entirely offline and requires **no external API keys**.
    -   Provides a short-term cardiac **risk score** (0-100), a clinical **risk level** (e.g., Stable, Moderate, Critical), and concise **simulated AI reasoning** for its assessment.
-   **Interactive Cardiac Rhythm Simulation:**
    -   An intuitive, categorized menu allows for instant switching between **over a dozen cardiac rhythms**, from normal sinus to complex AV blocks and lethal arrhythmias.
    -   Rhythms include NSR, Atrial Fibrillation, VT, VF, Asystole, and various degrees of AV block.
-   **Advanced Device Simulation:**
    -   **Pacemaker Controls:** Simulate demand pacing with adjustable modes and rates.
    -   **Connect Monitor:** Add new patients by simulating connections to mock hospital monitors, with options for both **Network (HL7/FHIR)** and **Bluetooth LE** devices.
-   **Data Persistence & Authentication:**
    -   A secure, device-specific login system allows for multiple "organizations."
    -   All patient data, vitals history, and AI analysis results are **persisted locally** in the browser's `localStorage`, ensuring data is retained between sessions for each organization.
-   **Clinical Workflow Tools:**
    -   **Vitals History:** Review trends and historical data with a detailed, filterable vitals log for each patient.
    -   **Alarm Feedback:** Simulate clinical validation by marking alarms as "True Positive" or "False Positive."
    -   **Code Status Management:** Assign and clearly display patient code statuses (e.g., DNR, DNI, Full Code).

## 🚀 How to Use the Application

### 1. Login & Account Creation
-   On the first launch, you are presented with a login screen.
-   You can use the **pre-filled demo account** for immediate access.
-   Alternatively, you can create a new, device-specific account by clicking **"Create one"**. All data for this new account will be stored separately and locally on your device.

### 2. Adding Patients
There are two ways to add patients to the dashboard:
1.  **Manual Entry:** Click the **`Add Patient`** button in the header to open a modal and manually input patient demographics and clinical details.
2.  **Simulated Connection:** Click the **`Connect Monitor`** button to simulate finding and linking to a pre-existing hospital monitor, which will automatically create a new patient profile from the monitor's "data."

### 3. Using the Simulator (SIM Panel)
The simulator allows you to control the physiological state of the currently selected patient.
1.  Click the **`SIM`** button in the header to open the control panel.
2.  **Select a Patient:** In the "Patient Selection" card, click on any patient to make them the active target for simulation controls.
3.  **Change Cardiac Rhythm:** In the "Rhythm & Pacing" card, expand the rhythm categories and click any button to instantly change the selected patient's ECG rhythm and heart rate.
4.  **Control the Pacemaker:** Adjust the pacer mode and rate for the selected patient.

### 4. Monitoring & AI Analysis
-   Vitals and waveforms will update automatically based on the selected rhythm and internal simulation logic.
-   Alerts will trigger if vitals breach their thresholds.
-   The **HeartSenseAI** analysis runs periodically in the background. The display will update from "Pending" to show the patient's risk level and score. Hover over the display to read the simulated AI's reasoning.

## 💻 Local Setup & Installation

**No API Keys Required:** This application is fully self-contained. The AI-powered features are simulated locally, so you do not need any API keys or an internet connection to use all the features.

This application is designed to be run locally without a complex build setup. All you need is a local web server to serve the files.

### Prerequisites
-   A modern web browser (Chrome, Firefox, Edge, Safari).
-   Node.js installed on your machine to use `npx`.

### Instructions
1.  **Download Files:** Place all the project files (`index.html`, `index.tsx`, `App.tsx`, etc.) into a single directory on your computer.

2.  **Start a Local Server:** Open a terminal or command prompt, navigate to the directory where you saved the files, and run the following command:
    ```bash
    npx serve
    ```
    This command uses `npx` (a package runner tool that comes with npm) to temporarily download and run the `serve` package, which is a simple, powerful static file server.

3.  **Access the Application:** The `serve` command will output a local URL, typically `http://localhost:3000`. Open this URL in your web browser to start using HeartSenseAI.

> **Note:** You must use a local server because modern browsers have security policies (CORS) that prevent web pages from loading modules (`import` statements) directly from the local file system (`file:///...`). The server provides the correct environment.

## 🛠️ Technology Stack

-   **Frontend:** React, TypeScript
-   **Styling:** Tailwind CSS
-   **Charting:** Recharts
-   **AI/ML:** Simulated AI Engine (no API key required)
-   **Module Loading:** ES Modules with Import Maps (no bundler like Webpack needed)

## ⚠️ Disclaimer

This application is for **demonstration and educational purposes only**. It is a simulation and does not represent a real medical device. The data generated is not real patient data, and the AI analysis is a rule-based simulation. **Do not use this application for actual clinical diagnosis, monitoring, or treatment decisions.**
