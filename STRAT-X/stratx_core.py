#!/usr/bin/env python3
import time
import random
import json
import threading
import os
from collections import deque
from http.server import BaseHTTPRequestHandler, HTTPServer

LATEST_STATE = {}

class StratXEngine:
    def __init__(self, mode="clinical", window_size=5):
        self.mode = mode.lower()
        self.window_size = window_size
        self.buffer = deque(maxlen=window_size)
        
        if self.mode == "clinical":
            self.labels = ["Heart_Rate_BPM", "Systolic_BP_mmHg", "Pulse_Oximetry_SpO2"]
            self.baselines = {"A": 75.0, "B": 120.0, "C": 98.0}
        elif self.mode == "aerospace":
            self.labels = ["LoX_Valve_Temp_C", "Chamber_Pressure_PSI", "Structural_Vibration_Hz"]
            self.baselines = {"A": 150.0, "B": 300.0, "C": 45.0}
        else:
            raise ValueError("Target mode must be 'clinical' or 'aerospace'.")

    def ingest_stream_packet(self):
        metric_a = self.baselines["A"] + random.uniform(-1.0, 1.0)
        metric_b = self.baselines["B"] + random.uniform(-2.0, 2.0)
        metric_c = self.baselines["C"] + random.uniform(-0.3, 0.3)
        
        roll = random.random()
        if 0.90 < roll <= 0.95:
            metric_a += self.baselines["A"] * 0.15 
        elif roll > 0.95:
            metric_a += self.baselines["A"] * 0.12
            metric_b -= self.baselines["B"] * 0.12

        return {
            "timestamp": time.time(),
            self.labels[0]: round(metric_a, 2),
            self.labels[1]: round(metric_b, 2),
            self.labels[2]: round(metric_c, 2)
        }

    def process_triage(self, current_packet):
        self.buffer.append(current_packet)
        
        if len(self.buffer) < self.window_size:
            return "BUFFERING", "Filling rolling window buffer..."

        baseline_packet = self.buffer[0]
        lbl_a, lbl_b, _ = self.labels
        
        pct_change_a = ((current_packet[lbl_a] - baseline_packet[lbl_a]) / baseline_packet[lbl_a]) * 100
        pct_change_b = ((current_packet[lbl_b] - baseline_packet[lbl_b]) / baseline_packet[lbl_b]) * 100

        if pct_change_a >= 10.0 and pct_change_b <= -10.0:
            return "🚨 CRITICAL ALARM", f"{lbl_a} shifted {pct_change_a:+.1f}%, {lbl_b} shifted {pct_change_b:+.1f}%."

        if pct_change_a >= 10.0 or pct_change_b <= -10.0:
            return "🛡️ NOISE GATE", f"Suppressed isolated shift on {lbl_a}."

        return "✅ SYSTEM NOMINAL", "Metrics balanced inside safety limits."


class DashboardServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/stream':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(LATEST_STATE).encode('utf-8'))
            return

        base_dir = os.path.dirname(os.path.abspath(__file__))
        dashboard_dir = os.path.join(base_dir, 'dashboard')
        
        if self.path == '/' or self.path == '/index.html':
            target_file = os.path.join(dashboard_dir, 'index.html')
            content_type = 'text/html'
        elif self.path == '/style.css':
            target_file = os.path.join(dashboard_dir, 'style.css')
            content_type = 'text/css'
        elif self.path == '/app.js':
            target_file = os.path.join(dashboard_dir, 'app.js')
            content_type = 'application/javascript'
        else:
            self.send_error(404, "File not found")
            return

        try:
            with open(target_file, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(f.read())
        except FileNotFoundError:
            self.send_error(404, "Dashboard asset missing")

    def log_message(self, format, *args):
        return

def run_web_server():
    server = HTTPServer(('127.0.0.1', 5001), DashboardServerHandler)
    server.serve_forever()


if __name__ == "__main__":
    RUN_MODE = "clinical"
    WINDOW_SECONDS = 5
    
    engine = StratXEngine(mode=RUN_MODE, window_size=WINDOW_SECONDS)
    global_lock = threading.Lock()
    
    web_thread = threading.Thread(target=run_web_server, daemon=True)
    web_thread.start()
    
    print("==================================================================")
    print(f"STRAT-X ENGINE RUNNING [Mode: {RUN_MODE.upper()}]")
    print("🚀 DASHBOARD ONLINE: Open http://127.0.0.1:5001 in your browser")
    print("==================================================================")
    
    try:
        while True:
            packet = engine.ingest_stream_packet()
            status, assessment = engine.process_triage(packet)
            
            with global_lock:
                LATEST_STATE = {
                    "labels": engine.labels,
                    "current_metrics": packet,
                    "status": status,
                    "assessment": assessment
                }
            
            lbl_a, lbl_b, _ = engine.labels
            print(f"[{time.strftime('%H:%M:%S')}] {lbl_a}: {packet[lbl_a]:<7} | {lbl_b}: {packet[lbl_b]:<7} -> {status}")
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down engine safely.")
