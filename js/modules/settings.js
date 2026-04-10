/* ============================================
   SETTINGS PAGE MODULE
   ============================================ */

const SettingsPage = {
  init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const theme = Store.getTheme();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Customize your experience</p>
      </div>

      <div class="settings-section card">
        <h3>Appearance</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Dark Mode</h4>
            <p>Toggle between light and dark themes</p>
          </div>
          <label class="toggle">
            <input type="checkbox" id="setting-dark-mode" ${theme === 'dark' ? 'checked' : ''}
              onchange="SettingsPage.toggleDarkMode(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section card">
        <h3>Data Management</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Export Data</h4>
            <p>Download all your progress, notes, and settings as JSON</p>
          </div>
          <button class="btn btn-secondary" onclick="SettingsPage.exportData()">Export</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Import Data</h4>
            <p>Restore from a previously exported JSON file</p>
          </div>
          <button class="btn btn-secondary" onclick="SettingsPage.importData()">Import</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Reset All Data</h4>
            <p>Delete all progress, notes, quiz results, and settings. This cannot be undone.</p>
          </div>
          <button class="btn btn-danger" onclick="SettingsPage.resetData()">Reset Everything</button>
        </div>
      </div>

      <div class="settings-section card">
        <h3>About</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>System Design Mastery</h4>
            <p>A complete learning platform for LLD and HLD interview preparation.
               Built with HTML, CSS, and vanilla JavaScript. All data stored locally in your browser.</p>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Storage Used</h4>
            <p id="storage-size">Calculating...</p>
          </div>
        </div>
      </div>
    `;

    this.calcStorageSize();
  },

  toggleDarkMode(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    Store.setTheme(theme);
    App.updateThemeIcon(theme);
  },

  exportData() {
    const data = Store.exportAll();
    ExportUtils.downloadJSON('sdm-backup.json', data);
    App.toast('Data exported successfully', 'success');
  },

  importData() {
    ExportUtils.importJSON((data, err) => {
      if (err) {
        App.toast('Invalid file format', 'danger');
        return;
      }
      Store.importAll(data);
      App.toast('Data imported! Reloading...', 'success');
      setTimeout(() => location.reload(), 1500);
    });
  },

  resetData() {
    if (!confirm('Are you sure? This will delete ALL your progress, notes, and settings. This cannot be undone.')) return;
    if (!confirm('Really delete everything? Last chance.')) return;
    Store.resetAll();
    App.toast('All data reset. Reloading...', 'info');
    setTimeout(() => location.reload(), 1500);
  },

  calcStorageSize() {
    const el = DOM.$('#storage-size');
    if (!el) return;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('sdm_')) {
        total += localStorage.getItem(key).length * 2; // UTF-16
      }
    }
    const kb = (total / 1024).toFixed(1);
    el.textContent = `${kb} KB used in localStorage`;
  }
};
