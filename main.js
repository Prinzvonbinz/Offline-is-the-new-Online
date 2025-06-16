let data;

function formatTime(ms, level = "hours") {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (level === "hours") return `${hours}h`;
  if (level === "minutes") return `${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function loadData() {
  const stored = localStorage.getItem("offlineDataV2");
  if (stored) return JSON.parse(stored);

  const now = Date.now();
  return {
    startTime: now,
    lastOnline: now,
    lastDailyCheck: now,
    days: 1,
    points: 0,
    multiplier: 1,
    upgradeCost: 10,
    offlineTimeTotal: 0,
    mode: "offline", // 'offline' 
    onlinePoints: 0,
    endTriggered: false
  };
}

function saveData() {
  localStorage.setItem("offlineDataV2", JSON.stringify(data));
}

function updateDisplay() {
  const dayDisplay = document.getElementById("dayDisplay");
  const pointsDisplay = document.getElementById("pointsDisplay");
  const offlineTimeDisplay = document.getElementById("offlineTime");
  const multiplierDisplay = document.getElementById("multiplierDisplay");
  const upgradeCost = document.getElementById("upgradeCost");
  const toggleBtn = document.getElementById("toggleModeBtn");

  dayDisplay.textContent = `Tag ${data.days}`;
  pointsDisplay.textContent = `${data.mode === "offline" ? "Punkte" : "Online-Punkte"}: ${Math.floor(data.mode === "offline" ? data.points : data.onlinePoints)}`;
  multiplierDisplay.textContent = `${data.multiplier}x`;
  upgradeCost.textContent = data.upgradeCost;


  const lastDuration = data.mode === "offline"
    ? Date.now() - data.lastOnline
    : Date.now() - data.lastDailyCheck;

  let timeStr = "";
  if (data.points >= 1000000000 || data.onlinePoints >= 1000000000) {
    timeStr = formatTime(lastDuration, "seconds");
  } else if (data.points >= 100000) {
    timeStr = formatTime(lastDuration, "minutes");
  } else if (data.points >= 10000) {
    timeStr = formatTime(lastDuration, "hours");
  }

  if (timeStr) {
    offlineTimeDisplay.textContent = `Letzter ${data.mode === "offline" ? "Offline" : "Online"}-Zeitraum: ${timeStr}`;
  } else {
    offlineTimeDisplay.textContent = "";
  }

  // Check for End
  if (data.mode === "online" && data.onlinePoints >= 10000000 && !data.endTriggered) {
    triggerEnd();
  }

  const toggleButton = document.getElementById("toggleModeBtn");
  if (toggleButton) {
    toggleButton.textContent = `Wechsle zu ${data.mode === "offline" ? "Online" : "Offline"}`;
  }
}

function handleProgression() {
  const now = Date.now();
  const offlineDuration = now - data.lastOnline;

  const daysPassed = Math.floor((now - data.lastDailyCheck) / 86400000);
  if (daysPassed > 0) {
    data.days += daysPassed;
    data.lastDailyCheck += daysPassed * 86400000;
  }

  const earned = (offlineDuration / 3600000) * 10 * data.multiplier;

  if (data.mode === "offline") {
    data.points += earned;
    data.offlineTimeTotal += offlineDuration;
  } else {
    data.onlinePoints += earned;
    data.onlineTimeTotal += offlineDuration;
  }

  updateDisplay();
  saveData();
}

function toggleMode() {
  data.mode = data.mode === "offline" ? "online" : "offline";
  data.lastOnline = Date.now();
  updateDisplay();
  saveData();
}

function buyUpgrade() {
  if (data.mode !== "offline") return;

  if (data.points >= data.upgradeCost) {
    data.points -= data.upgradeCost;
    data.multiplier *= 2;
    data.upgradeCost *= 2;
    saveData();
    updateDisplay();
  }
}

function triggerEnd() {
  data.endTriggered = true;
  saveData();

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "black";
  overlay.style.zIndex = 9999;
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.flexDirection = "column";
  overlay.style.color = "white";
  overlay.style.fontSize = "2rem";
  document.body.appendChild(overlay);

  let fontSize = 2;
  const clock = document.createElement("div");
  clock.textContent = new Date().toLocaleTimeString();
  overlay.appendChild(clock);

  const interval = setInterval(() => {
    fontSize += 0.5;
    clock.style.fontSize = `${fontSize}rem`;
    if (fontSize >= 20) {
      clearInterval(interval);
      overlay.innerHTML = "<div style='font-size:3rem;'>Ende.</div>";
    }
  }, 500);
}

window.addEventListener("load", () => {
  data = loadData();
  handleProgression();
  updateDisplay();
  data.lastOnline = Date.now();
  saveData();
});

window.addEventListener("beforeunload", () => {
  data.lastOnline = Date.now();
  saveData();
});

document.getElementById("buyUpgradeBtn").addEventListener("click", buyUpgrade);
