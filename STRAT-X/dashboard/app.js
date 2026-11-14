const backendUrl = "http://127.0.0.1:5001/stream";
const logPanel = document.getElementById("log");

function updateTime() {
    const now = new Date();
    document.getElementById("time-display").textContent = now.toTimeString().split(' ')[0];
}
setInterval(updateTime, 1000);

function addLog(text) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[${new Date().toTimeString().split(' ')[0]}] ${text}`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
}

async function fetchStream() {
    try {
        const response = await fetch(backendUrl);
        if (!response.ok) throw new Error("Server offline");
        
        const data = await response.json();
        
        document.getElementById("label-a").textContent = data.labels[0].replace(/_/g, ' ');
        document.getElementById("label-b").textContent = data.labels[1].replace(/_/g, ' ');
        
        document.getElementById("val-a").textContent = data.current_metrics[data.labels[0]];
        document.getElementById("val-b").textContent = data.current_metrics[data.labels[1]];
        
        const status = data.status;
        const indicator = document.getElementById("indicator");
        const statusText = document.getElementById("triage-status");
        
        statusText.textContent = status;
        document.getElementById("assessment-text").textContent = data.assessment || "";

        if (status.includes("NOMINAL")) {
            indicator.style.backgroundColor = "#04d361";
            indicator.style.boxShadow = "0 0 12px #04d361";
        } else if (status.includes("NOISE GATE")) {
            indicator.style.backgroundColor = "#ffcd33";
            indicator.style.boxShadow = "0 0 12px #ffcd33";
            addLog(`🛡️ Suppressed transient single-metric artifact.`);
        } else if (status.includes("CRITICAL")) {
            indicator.style.backgroundColor = "#ed4337";
            indicator.style.boxShadow = "0 0 12px #ed4337";
            addLog(`🚨 ALARM TRIPPED: Multi-variable divergence verified!`);
        } else {
            indicator.style.backgroundColor = "#888888";
            indicator.style.boxShadow = "none";
        }

    } catch (error) {
        document.getElementById("triage-status").textContent = "DISCONNECTED";
        document.getElementById("indicator").style.backgroundColor = "#ed4337";
        document.getElementById("indicator").style.boxShadow = "0 0 12px #ed4337";
    }
    
    setTimeout(fetchStream, 1000);
}

fetchStream();
