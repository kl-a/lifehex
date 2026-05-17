// localStorage persistence helpers

const LS_SESSIONS = 'lifehex_sessions';
const LS_CYCLES   = 'lifehex_cycles';
const LS_SETTINGS = 'lifehex_settings';

const DEFAULT_SETTINGS = { cycleLen: 28, periodLen: 5, driveConnected: false, lastSyncedAt: null };

function lsLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function lsSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function loadSessions() { return lsLoad(LS_SESSIONS, []); }
function saveSessions(s) { lsSave(LS_SESSIONS, s); }

function loadCycles() { return lsLoad(LS_CYCLES, []); }
function saveCycles(c) { lsSave(LS_CYCLES, c); }

function loadSettings() { return { ...DEFAULT_SETTINGS, ...lsLoad(LS_SETTINGS, {}) }; }
function saveSettings(s) { lsSave(LS_SETTINGS, s); }

function exportData(sessions, cycles, settings) {
  const payload = { version: 1, exportedAt: new Date().toISOString(), sessions, cycles, settings };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `lifehex-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

Object.assign(window, { loadSessions, saveSessions, loadCycles, saveCycles, loadSettings, saveSettings, exportData });
