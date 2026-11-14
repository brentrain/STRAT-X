#!/usr/bin/env python3
"""
STRAT-X Flight Medical Telemetry Server
Simulates a condensed 210-day Earth-to-Mars transit mission lifecycle:
  1. Day 0   - Pre-Launch Terminal Count (1.0g)
  2. Day 0   - Liftoff & Trans-Mars Injection (+3.5g)
  3. Days 1-14   - Early 0g Cephalad Fluid Shift (0.0g)
  4. Days 15-209 - Deep-Space Mars Transit Settled (0.0g)
  5. Day 210 - Mars Entry, Descent & Landing / EDL (+2.8g)
  6. Day 210+ - Mars Surface Operations (0.38g)
"""

from __future__ import annotations

import json
import math
import mimetypes
import random
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 5050

BASE_DIR = Path(__file__).resolve().parent
UI_DIR = BASE_DIR / "telemetry_ui"
REPORT_DIR = BASE_DIR / "QCC"

SINUS_RHYTHM_OPTIONS = [
    "Normal Sinus Rhythm",
    "Sinus Bradycardia",
    "Sinus Tachycardia",
]

# Accelerated 210-day Mars mission timeline (simSec runs 0 to 120s)
MISSION_PHASES = [
    {
        "id": "prelaunch",
        "name": "1. Pre-Launch (Day 0)",
        "gLoad": 1.0,
        "gravityLabel": "1.0g (Earth Pad)",
        "cardTheme": "prelaunch",
        "startSec": 0.0,
        "endSec": 10.0,
        "startDay": 0.0,
        "endDay": 0.0,
        "summary": "Day 0 Pre-Launch: Crew strapped in supine; mild pre-ignition sympathetic anticipation on 1.0g baseline.",
        "hrDelta": 14.0,
        "hrvDelta": -12.0,
        "sbpDelta": 12.0,
        "dbpDelta": 10.0,
        "rrDelta": 1.0,
        "tWaveFlat": False,
    },
    {
        "id": "launch",
        "name": "2. Liftoff & TMI Burn (Day 0)",
        "gLoad": 3.5,
        "gravityLabel": "+3.5g Gx Ascent",
        "cardTheme": "high-g",
        "startSec": 10.0,
        "endSec": 26.0,
        "startDay": 0.0,
        "endDay": 0.5,
        "summary": "Day 0 Max-Q & Trans-Mars Injection: +3.5g acceleration & catecholamine surge drive sinus tachycardia and elevated BP.",
        "hrDelta": 68.0,
        "hrvDelta": -36.0,
        "sbpDelta": 38.0,
        "dbpDelta": 24.0,
        "rrDelta": 7.0,
        "tWaveFlat": False,
    },
    {
        "id": "fluid_shift",
        "name": "3. Fluid Shift (Days 1–14)",
        "gLoad": 0.0,
        "gravityLabel": "0.0g (Early Shift)",
        "cardTheme": "fluid-shift",
        "startSec": 26.0,
        "endSec": 46.0,
        "startDay": 1.0,
        "endDay": 14.0,
        "summary": "Days 1–14 Cephalad Fluid Shift: ~1.8L fluid shifts headward; carotid baroreceptors trigger vagal HR drop & T-wave flattening.",
        "hrDelta": 8.0,
        "hrvDelta": -4.0,
        "sbpDelta": 6.0,
        "dbpDelta": 4.0,
        "rrDelta": 2.0,
        "tWaveFlat": True,
    },
    {
        "id": "transit_0g",
        "name": "4. Mars Transit (Days 15–209)",
        "gLoad": 0.0,
        "gravityLabel": "0.0g (Adapted)",
        "cardTheme": "nominal-0g",
        "startSec": 46.0,
        "endSec": 86.0,
        "startDay": 15.0,
        "endDay": 209.5,
        "summary": "Days 15–209 Settled 0g Transit: ~12% plasma volume contraction yields resting sinus bradycardia, lower BP, high HRV, flat T-waves.",
        "hrDelta": 0.0,
        "hrvDelta": 0.0,
        "sbpDelta": 0.0,
        "dbpDelta": 0.0,
        "rrDelta": 0.0,
        "tWaveFlat": True,
    },
    {
        "id": "mars_edl",
        "name": "5. Mars EDL (Day 210)",
        "gLoad": 2.8,
        "gravityLabel": "+2.8g Aerobraking",
        "cardTheme": "high-g",
        "startSec": 86.0,
        "endSec": 104.0,
        "startDay": 210.0,
        "endDay": 210.0,
        "summary": "Day 210 Atmospheric Entry: Deconditioned crew hits Martian atmosphere at +2.8g—brisk sinus tachycardia & BP surge.",
        "hrDelta": 74.0,
        "hrvDelta": -38.0,
        "sbpDelta": 34.0,
        "dbpDelta": 21.0,
        "rrDelta": 8.0,
        "tWaveFlat": True,
    },
    {
        "id": "mars_surface",
        "name": "6. Mars Surface (Day 210+)",
        "gLoad": 0.38,
        "gravityLabel": "0.38g (Mars Surface)",
        "cardTheme": "mars-surface",
        "startSec": 104.0,
        "endSec": 999999.0,
        "startDay": 210.2,
        "endDay": 215.0,
        "summary": "Day 210+ Mars Touchdown: 0.38g pulls fluid back toward lower limbs; mild orthostatic HR lift during surface adaptation.",
        "hrDelta": 22.0,
        "hrvDelta": -14.0,
        "sbpDelta": 9.0,
        "dbpDelta": 7.0,
        "rrDelta": 2.0,
        "tWaveFlat": False,
    },
]

CREW_ROSTER = [
    {
        "id": 1,
        "displayId": "CM-01",
        "name": "Cmdr. Elena Vance",
        "age": 33,
        "role": "Mission Commander",
        "baseHr": 55,
        "baseHrv": 72,
        "baseSbp": 108,
        "baseDbp": 65,
        "baseRr": 17,
        "baseSpo2": 98.5,
        "baseTemp": 36.7,
    },
    {
        "id": 2,
        "displayId": "CM-02",
        "name": "Marcus Chen",
        "age": 29,
        "role": "Flight Engineer",
        "baseHr": 60,
        "baseHrv": 65,
        "baseSbp": 106,
        "baseDbp": 66,
        "baseRr": 18,
        "baseSpo2": 98.4,
        "baseTemp": 36.8,
    },
    {
        "id": 3,
        "displayId": "CM-03",
        "name": "Dr. Priya Nair",
        "age": 31,
        "role": "Crew Medical Officer",
        "baseHr": 58,
        "baseHrv": 67,
        "baseSbp": 110,
        "baseDbp": 68,
        "baseRr": 17,
        "baseSpo2": 98.7,
        "baseTemp": 36.6,
    },
    {
        "id": 4,
        "displayId": "CM-04",
        "name": "Lucas Morales",
        "age": 28,
        "role": "EVA & Descent Specialist",
        "baseHr": 62,
        "baseHrv": 62,
        "baseSbp": 112,
        "baseDbp": 69,
        "baseRr": 18,
        "baseSpo2": 98.6,
        "baseTemp": 36.9,
    },
    {
        "id": 5,
        "displayId": "CM-05",
        "name": "Hannah Lindqvist",
        "age": 27,
        "role": "Payload Specialist",
        "baseHr": 53,
        "baseHrv": 75,
        "baseSbp": 105,
        "baseDbp": 64,
        "baseRr": 17,
        "baseSpo2": 98.5,
        "baseTemp": 36.7,
    },
    {
        "id": 6,
        "displayId": "CM-06",
        "name": "Devon Brooks",
        "age": 30,
        "role": "Avionics & ECLSS Lead",
        "baseHr": 61,
        "baseHrv": 64,
        "baseSbp": 111,
        "baseDbp": 67,
        "baseRr": 18,
        "baseSpo2": 98.3,
        "baseTemp": 36.8,
    },
    {
        "id": 7,
        "displayId": "CM-07",
        "name": "Dr. Kenji Takahashi",
        "age": 26,
        "role": "Astrobiologist",
        "baseHr": 59,
        "baseHrv": 68,
        "baseSbp": 104,
        "baseDbp": 64,
        "baseRr": 18,
        "baseSpo2": 98.8,
        "baseTemp": 36.7,
    },
    {
        "id": 8,
        "displayId": "CM-08",
        "name": "Sofia Alverez",
        "age": 32,
        "role": "Systems Navigator",
        "baseHr": 56,
        "baseHrv": 70,
        "baseSbp": 109,
        "baseDbp": 66,
        "baseRr": 17,
        "baseSpo2": 98.5,
        "baseTemp": 36.6,
    },
]


def get_phase_for_sec(sim_sec: float) -> dict[str, Any]:
    for ph in MISSION_PHASES:
        if ph["startSec"] <= sim_sec < ph["endSec"]:
            return ph
    return MISSION_PHASES[-1]


def compute_mission_day_and_comms(sim_sec: float, phase_obj: dict[str, Any]) -> tuple[float, float, str]:
    """Maps simulation seconds to Mission Day (0 to 210+), Earth distance (M km), and one-way light delay."""
    span_sec = max(1.0, min(phase_obj["endSec"], 125.0) - phase_obj["startSec"])
    frac = min(1.0, max(0.0, (sim_sec - phase_obj["startSec"]) / span_sec))
    mission_day = phase_obj["startDay"] + frac * (phase_obj["endDay"] - phase_obj["startDay"])

    # Distance grows from 0.0M km at Earth to 225.0M km at Mars arrival (Day 210)
    progress_ratio = min(1.0, max(0.0, mission_day / 210.0))
    distance_m_km = round(progress_ratio * 225.0, 1)

    # Speed of light: ~18M km per light-minute -> 225M km = ~12m 30s one-way delay
    total_delay_sec = int(round((distance_m_km * 1_000_000.0) / 299_792.458))
    if total_delay_sec <= 1:
        latency_str = "0.0s (Direct Pad Link)"
    else:
        mins, secs = divmod(total_delay_sec, 60)
        latency_str = f"+{mins}m {secs:02d}s One-Way ({distance_m_km}M km)"

    return round(mission_day, 1), distance_m_km, latency_str


class SpaceTelemetryState:
    """Thread-safe 210-day Mars mission simulator with smooth physiological transitions."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.sim_sec = 0.0
            self.time_step = 0
            self.total_packets = 0
            self.paused = False
            self.rng = random.Random(42)
            self.human_reviews: dict[int, dict[str, Any]] = {
                c["id"]: {
                    "rhythmAgreesWithMonitor": None,
                    "humanRecordedRhythm": None,
                    "updatedAt": None,
                }
                for c in CREW_ROSTER
            }
            self.hr_trends: dict[int, list[float]] = {
                c["id"]: [float(c["baseHr"] + 14) for _ in range(30)] for c in CREW_ROSTER
            }

    def jump_to_phase(self, phase_id: str) -> tuple[bool, str]:
        with self._lock:
            for ph in MISSION_PHASES:
                if ph["id"] == phase_id:
                    self.sim_sec = float(ph["startSec"] + 1.5)
                    return True, f"Jumped to {ph['name']}"
            return False, f"Unknown phase: {phase_id}"

    def toggle_pause(self) -> bool:
        with self._lock:
            self.paused = not self.paused
            return self.paused

    def _blended_offsets(self, sec: float) -> tuple[dict[str, Any], float, float, float, float, float]:
        current = get_phase_for_sec(sec)
        idx = MISSION_PHASES.index(current)
        prev = MISSION_PHASES[idx - 1] if idx > 0 else current

        elapsed_in_phase = sec - current["startSec"]
        blend_window = 4.5
        alpha = min(1.0, max(0.0, elapsed_in_phase / blend_window))
        smooth = alpha * alpha * (3.0 - 2.0 * alpha)

        def lerp(a: float, b: float) -> float:
            return a + (b - a) * smooth

        hr_off = lerp(prev["hrDelta"], current["hrDelta"])
        hrv_off = lerp(prev["hrvDelta"], current["hrvDelta"])
        sbp_off = lerp(prev["sbpDelta"], current["sbpDelta"])
        dbp_off = lerp(prev["dbpDelta"], current["dbpDelta"])
        rr_off = lerp(prev["rrDelta"], current["rrDelta"])
        return current, hr_off, hrv_off, sbp_off, dbp_off, rr_off

    def step_simulation(self) -> dict[str, Any]:
        with self._lock:
            if not self.paused:
                self.time_step += 1
                self.sim_sec += 1.15
                if self.sim_sec > 124.0:
                    self.sim_sec = 0.0

            self.total_packets += len(CREW_ROSTER)
            sec = self.sim_sec
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            phase_obj, hr_off, hrv_off, sbp_off, dbp_off, rr_off = self._blended_offsets(sec)
            mission_day, distance_m_km, latency_str = compute_mission_day_and_comms(sec, phase_obj)

            patients_payload: list[dict[str, Any]] = []
            pending_review_count = 0

            for crew in CREW_ROSTER:
                cid = crew["id"]
                wave = sec * 0.25 + cid * 1.15
                jitter = self.rng.uniform(-0.8, 0.8)
                sensitivity = 0.90 + (cid % 4) * 0.07

                hr = round(
                    max(46.0, crew["baseHr"] + hr_off * sensitivity + math.sin(wave) * 2.2 + jitter),
                    1,
                )
                hrv = round(
                    max(18.0, crew["baseHrv"] + hrv_off * sensitivity - math.sin(wave) * 2.8),
                    1,
                )
                sbp = round(
                    crew["baseSbp"] + sbp_off * sensitivity + math.cos(wave * 0.8) * 2.3 + jitter,
                    1,
                )
                dbp = round(
                    crew["baseDbp"] + dbp_off * sensitivity + math.sin(wave * 0.7) * 1.6 + jitter * 0.5,
                    1,
                )
                rr = round(
                    crew["baseRr"] + rr_off * sensitivity + abs(math.sin(wave * 0.6)) * 1.1,
                    1,
                )
                g_spo2_dip = -0.7 if phase_obj["gLoad"] >= 2.5 else 0.0
                spo2 = round(
                    min(99.6, max(96.5, crew["baseSpo2"] + g_spo2_dip + math.cos(wave * 0.5) * 0.3)),
                    1,
                )
                temp = round(
                    crew["baseTemp"] + (0.2 if phase_obj["gLoad"] >= 2.5 else 0.0) + math.sin(wave * 0.3) * 0.1,
                    1,
                )

                trend = self.hr_trends[cid]
                trend.append(hr)
                if len(trend) > 36:
                    trend.pop(0)

                if hr < 60:
                    detected_rhythm = "Sinus Bradycardia"
                elif hr > 100:
                    detected_rhythm = "Sinus Tachycardia"
                else:
                    detected_rhythm = "Normal Sinus Rhythm"

                review = self.human_reviews[cid]
                has_review = (
                    review["rhythmAgreesWithMonitor"] is True
                    or bool(review["humanRecordedRhythm"])
                )
                if not has_review:
                    pending_review_count += 1

                display_rhythm = review["humanRecordedRhythm"] or detected_rhythm

                patients_payload.append(
                    {
                        "id": cid,
                        "displayId": crew["displayId"],
                        "name": crew["name"],
                        "age": crew["age"],
                        "role": crew["role"],
                        "diagnosis": phase_obj["summary"],
                        "cardTheme": phase_obj["cardTheme"],
                        "gLoad": phase_obj["gLoad"],
                        "gravityLabel": phase_obj["gravityLabel"],
                        "tWaveFlat": phase_obj["tWaveFlat"],
                        "status": "ok",
                        "rhythm": detected_rhythm,
                        "displayRhythm": display_rhythm,
                        "vitals": {
                            "heartRate": hr,
                            "hrv": hrv,
                            "systolicBP": sbp,
                            "diastolicBP": dbp,
                            "respiratoryRate": rr,
                            "spo2": spo2,
                            "temperature": temp,
                        },
                        "hrTrend": list(trend),
                        "humanReview": dict(review),
                    }
                )

            eclss = {
                "co2Percent": round(0.37 + math.sin(sec * 0.08) * 0.02, 2),
                "co2MmHg": round((0.37 + math.sin(sec * 0.08) * 0.02) * 7.6, 1),
                "pressureKpa": round(101.2 + math.cos(sec * 0.05) * 0.1, 1),
                "o2Kpa": round(21.3 + math.sin(sec * 0.04) * 0.1, 1),
                "radiationMsvDay": 0.12 if phase_obj["id"] == "prelaunch" else round(0.64 + math.cos(sec * 0.03) * 0.02, 2),
                "spaceWeather": "Earth Magnetosphere Shielded" if phase_obj["id"] == "prelaunch" else "GCR Nominal (No SPE)",
                "earthLatency": latency_str,
                "distanceMillionKm": distance_m_km,
            }

            return {
                "ok": True,
                "mission": "STRAT-X 210-Day Mars Transit",
                "timestamp": now_iso,
                "timeStep": self.time_step,
                "missionDay": mission_day,
                "totalTransitDays": 210,
                "paused": self.paused,
                "phase": {
                    "id": phase_obj["id"],
                    "name": phase_obj["name"],
                    "gLoad": phase_obj["gLoad"],
                    "gravityLabel": phase_obj["gravityLabel"],
                    "cardTheme": phase_obj["cardTheme"],
                    "summary": phase_obj["summary"],
                    "tWaveFlat": phase_obj["tWaveFlat"],
                },
                "rhythmOptions": SINUS_RHYTHM_OPTIONS,
                "eclss": eclss,
                "patients": patients_payload,
                "events": [],
                "stats": {
                    "patientsCritical": 0,
                    "patientsWarning": 0,
                    "totalEvents": self.total_packets,
                    "hil": {
                        "bedsPendingRhythmReview": pending_review_count,
                    },
                },
            }

    def adjudicate_patient(
        self, patient_id: int, action: str, human_rhythm: str | None = None
    ) -> tuple[bool, str]:
        with self._lock:
            if patient_id not in self.human_reviews:
                return False, f"Unknown crew ID: {patient_id}"

            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            rev = self.human_reviews[patient_id]

            if action == "confirm_monitor":
                rev["rhythmAgreesWithMonitor"] = True
                rev["humanRecordedRhythm"] = None
                rev["updatedAt"] = now_iso
                return True, "Confirmed sinus baseline"

            if action == "correct_rhythm":
                if not human_rhythm:
                    return False, "Missing humanRhythm value"
                rev["rhythmAgreesWithMonitor"] = False
                rev["humanRecordedRhythm"] = human_rhythm
                rev["updatedAt"] = now_iso
                return True, f"Recorded rhythm override: {human_rhythm}"

            if action == "clear":
                rev["rhythmAgreesWithMonitor"] = None
                rev["humanRecordedRhythm"] = None
                rev["updatedAt"] = None
                return True, "Cleared crew rhythm baseline review"

            return False, f"Unsupported action: {action}"

    def generate_flight_surgeon_report(self) -> dict[str, Any]:
        snapshot = self.step_simulation()
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"STRAT-X_FlightSurgeon_Log_Day{int(snapshot['missionDay'])}_{stamp}.txt"
        filepath = REPORT_DIR / filename

        phase = snapshot["phase"]
        eclss = snapshot["eclss"]
        lines = [
            "==========================================================================",
            "STRAT-X AUTONOMOUS FLIGHT MEDICAL TELEMETRY — FLIGHT SURGEON SUMMARY LOG",
            "==========================================================================",
            f"Generated (UTC) : {snapshot['timestamp']}",
            f"Mission Elapsed : Day {snapshot['missionDay']} of {snapshot['totalTransitDays']}-Day Mars Transit",
            f"Mission Phase   : {phase['name']} ({phase['gravityLabel']})",
            f"Physiology Note : {phase['summary']}",
            f"Comms Delay     : {eclss['earthLatency']}",
            "",
            "--- HABITAT ECLSS & RADIATION ENVIRONMENT ---",
            f"Cabin pCO2      : {eclss['co2Percent']}% ({eclss['co2MmHg']} mmHg)",
            f"Cabin Pressure  : {eclss['pressureKpa']} kPa (14.7 psi)",
            f"Cabin pO2       : {eclss['o2Kpa']} kPa",
            f"Dosimetry       : {eclss['radiationMsvDay']} mSv/day | {eclss['spaceWeather']}",
            "",
            "--- CREW TELEMETRY SNAPSHOT (8/8 SINUS RHYTHM) ---",
        ]

        for p in snapshot["patients"]:
            v = p["vitals"]
            lines.extend(
                [
                    f"{p['displayId']} | {p['name']} ({p['age']}y) | {p['role']}",
                    f"   Rhythm : {p['displayRhythm']} | Gravity: {p['gravityLabel']}",
                    f"   Vitals : HR {v['heartRate']} bpm | BP {v['systolicBP']}/{v['diastolicBP']} mmHg | "
                    f"SpO2 {v['spo2']}% | RR {v['respiratoryRate']}/min | HRV {v['hrv']} ms | Temp {v['temperature']} C",
                    "",
                ]
            )

        report_text = "\n".join(lines)
        filepath.write_text(report_text, encoding="utf-8")

        return {
            "ok": True,
            "filename": filename,
            "path": str(filepath),
            "characters": len(report_text),
        }


STATE = SpaceTelemetryState()


class TelemetryRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler serving static UI files and JSON telemetry endpoints."""

    def log_message(self, format: str, *args: Any) -> None:
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(format, *args)

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _serve_static(self, url_path: str) -> None:
        rel_path = "index.html" if url_path in ("", "/") else url_path.lstrip("/")
        target = (UI_DIR / rel_path).resolve()

        if not str(target).startswith(str(UI_DIR.resolve())) or not target.is_file():
            self.send_error(404, f"File not found: {rel_path}")
            return

        content = target.read_bytes()
        mime_type, _ = mimetypes.guess_type(str(target))
        self.send_response(200)
        self.send_header("Content-Type", f"{mime_type or 'text/html'}; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/snapshot":
            self._send_json(200, STATE.step_simulation())
            return

        if path == "/api/health":
            self._send_json(200, {"ok": True, "service": "STRAT-X Flight Medical Telemetry"})
            return

        self._serve_static(path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()
        except Exception as exc:
            self._send_json(400, {"ok": False, "error": f"Invalid JSON payload: {exc}"})
            return

        if path == "/api/mission/phase":
            phase_id = str(body.get("phaseId") or "")
            ok, msg = STATE.jump_to_phase(phase_id)
            self._send_json(200 if ok else 400, {"ok": ok, "message": msg, "error": None if ok else msg})
            return

        if path == "/api/mission/pause":
            paused = STATE.toggle_pause()
            self._send_json(200, {"ok": True, "paused": paused})
            return

        if path == "/api/adjudicate/patient":
            raw_pid = body.get("patientId")
            action = str(body.get("action") or "")
            human_rhythm = body.get("humanRhythm")
            try:
                pid = int(raw_pid)
            except (TypeError, ValueError):
                self._send_json(400, {"ok": False, "error": "Invalid patientId"})
                return

            ok, msg = STATE.adjudicate_patient(pid, action, human_rhythm)
            status = 200 if ok else 400
            self._send_json(status, {"ok": ok, "message": msg, "error": None if ok else msg})
            return

        if path == "/api/session/reset":
            STATE.reset()
            self._send_json(200, {"ok": True, "message": "Mission telemetry epoch reset"})
            return

        if path == "/api/report/generate":
            try:
                result = STATE.generate_flight_surgeon_report()
                self._send_json(200, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})
            return

        self._send_json(404, {"ok": False, "error": f"Unknown endpoint: {path}"})


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), TelemetryRequestHandler)
    print(f"STRAT-X Flight Medical Telemetry running at http://{HOST}:{PORT}")
    print(f"Serving UI from: {UI_DIR}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down STRAT-X server.")
        server.server_close()


if __name__ == "__main__":
    main()