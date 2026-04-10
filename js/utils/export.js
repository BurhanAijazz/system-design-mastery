/* ============================================
   EXPORT / DOWNLOAD UTILITIES
   ============================================ */

const ExportUtils = {
  downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this._download(blob, filename);
  },

  downloadJSON(filename, obj) {
    const content = JSON.stringify(obj, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    this._download(blob, filename);
  },

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importJSON(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          callback(data, null);
        } catch (err) {
          callback(null, err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};
