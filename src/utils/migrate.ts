// Runs before any Zustand store initializes — no store imports allowed here.
// Copies lifehex_* localStorage keys to selene_* so existing data survives the rename.
const KEY_MIGRATIONS: [string, string][] = [
  ['lifehex_sessions', 'selene_sessions'],
  ['lifehex_day', 'selene_day'],
  ['lifehex_day_history', 'selene_day_history'],
  ['lifehex_cycles', 'selene_cycles'],
  ['lifehex_settings', 'selene_settings'],
  ['lifehex_drive', 'selene_drive'],
];

for (const [oldKey, newKey] of KEY_MIGRATIONS) {
  const old = localStorage.getItem(oldKey);
  if (old && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, old);
    localStorage.removeItem(oldKey);
  }
}
