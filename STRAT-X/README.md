# Strat-X

![Status](https://img.shields.io/badge/status-in_development-F59E0B?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Human in the Loop](https://img.shields.io/badge/human--in--the--loop-7F56D9?style=for-the-badge)

**Strategic Telemetry Reduction and Anomaly Triage**

Strat-X is an experimental cardiac-monitoring software project focused on a difficult question: how can monitoring systems reduce avoidable alarm noise while keeping clinically meaningful events visible and reviewable?

The repository combines the original Strat-X rules engine with the richer simulation, telemetry dashboard, trend views, and human-review workflow developed in Cardiac Monitoring 2.0. Both project histories are preserved here.

> Strat-X is a simulation and research portfolio project. It is not a medical device, has not been clinically validated, and must not be used for diagnosis, treatment, patient monitoring, or clinical decisions.

## What the project explores

- multi-patient ICU telemetry simulation
- cardiac rhythm and vital-sign trend visualization
- technical artifact and alarm-noise scenarios
- explicit, inspectable triage rules
- confidence-aware event prioritization
- human confirmation, correction, and alarm adjudication
- foundations for false-positive analysis and adaptive alerting

## Repository structure

```text
.
├── stratx_core.py                # Lightweight Strat-X rules engine
├── dashboard/                    # Lightweight browser dashboard
├── icu_telemetry_simulator.py    # Multi-patient telemetry simulation
├── icu_telemetry_server.py       # Flask API, triage, events and review state
├── telemetry_ui/                 # Full browser telemetry interface
├── react_dashboard/              # React/TypeScript interface prototype
├── requirements.txt              # Python runtime dependencies
└── start_icu_dashboard.bat       # Windows launcher for the Flask demo
```

## Architecture

```text
Telemetry simulation
        │
        ▼
Strat-X rules + triage layer
        │
        ▼
Flask API and event feed
        │
        ▼
Dashboard + human review
        │
        ▼
Confirmed / corrected / artifact classification
```

## Run the Flask telemetry demo

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python icu_telemetry_server.py
```

Then open the local address printed by Flask.

## Run the React dashboard prototype

```bash
cd react_dashboard
npm install
npm run dev
```

The React interface uses generated demonstration data and browser-local storage. No real patient data is included.

## Development principles

1. **Human judgment remains central.** Automated output supports review; it does not replace it.
2. **Every flag should be inspectable.** Reviewers should be able to understand why an event was elevated.
3. **Uncertainty must be visible.** The interface should communicate confidence and disagreement rather than conceal them.
4. **Simulation before claims.** Features are evaluated with synthetic data until appropriate validation becomes possible.
5. **Safety boundaries are product requirements.** Clinical-use claims are intentionally excluded.

## Roadmap

- unify the Python core and full telemetry simulator behind one event schema
- measure alert frequency and simulated false-positive reduction
- add patient-specific baselines and configurable thresholds
- expand rhythm and artifact scenarios
- create repeatable evaluation fixtures
- improve confidence scoring and explanation views
- consolidate the lightweight and React dashboards

## Project status

Strat-X is in active development. Current outputs are simulations intended for software research, education, and portfolio demonstration only.
