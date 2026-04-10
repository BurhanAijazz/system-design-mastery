/* ============================================
   NOTES PAGE MODULE
   ============================================ */

const NotesPage = {
  _selectedKey: null,

  init() {
    const container = DOM.$('#page-content');
    if (!container) return;
    this.render(container);
  },

  render(container) {
    const notes = Store.getNotes();
    const noteEntries = Object.entries(notes)
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    container.innerHTML = `
      <div class="page-header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="page-title">Notes</h1>
            <p class="page-subtitle">${noteEntries.length} note(s)</p>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary" onclick="NotesPage.exportAll()">Export All</button>
          </div>
        </div>
      </div>

      <div class="notes-layout">
        <div class="notes-sidebar">
          <input type="text" class="form-textarea" style="min-height:auto;padding:var(--space-sm);margin-bottom:var(--space-md)"
            placeholder="Search notes..." oninput="NotesPage.filterNotes(this.value)">
          <div id="notes-list">
            ${noteEntries.length > 0 ? noteEntries.map(n => `
              <div class="note-list-item ${this._selectedKey === n.key ? 'active' : ''}"
                onclick="NotesPage.selectNote('${n.key}')" data-note-key="${n.key}">
                <div class="font-medium">${this.formatNoteTitle(n.key)}</div>
                <div class="note-date">${TimeUtils.formatDateShort(n.updatedAt)}</div>
              </div>
            `).join('') : '<p class="text-sm text-muted">No notes yet. Add notes from lesson pages.</p>'}
          </div>
        </div>

        <div id="note-editor">
          ${this._selectedKey ? this.renderEditor(this._selectedKey, notes[this._selectedKey]) : `
            <div class="empty-state">
              <p>Select a note to edit</p>
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderEditor(key, note) {
    return `
      <div>
        <h3>${this.formatNoteTitle(key)}</h3>
        <p class="text-xs text-muted mb-md">Last updated: ${note ? TimeUtils.formatDate(note.updatedAt) : 'N/A'}</p>
        <textarea class="form-textarea" id="note-editor-area" style="min-height: 300px"
          oninput="NotesPage.autoSave()">${note ? note.content : ''}</textarea>
        <div class="flex justify-between items-center mt-md">
          <span class="text-xs text-muted" id="note-save-status"></span>
          <button class="btn btn-danger btn-sm" onclick="NotesPage.deleteNote('${key}')">Delete</button>
        </div>
      </div>
    `;
  },

  formatNoteTitle(key) {
    const parts = key.split('::');
    if (parts.length === 3) {
      return `${parts[0].toUpperCase()} / ${parts[1]} / ${parts[2]}`;
    }
    return key;
  },

  selectNote(key) {
    this._selectedKey = key;
    const note = Store.getNote(key);
    const editor = DOM.$('#note-editor');
    if (editor) {
      editor.innerHTML = this.renderEditor(key, note);
    }
    // Update active state
    DOM.$$('.note-list-item').forEach(el => {
      el.classList.toggle('active', el.dataset.noteKey === key);
    });
  },

  _saveTimer: null,
  autoSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      if (!this._selectedKey) return;
      const textarea = DOM.$('#note-editor-area');
      if (textarea) {
        Store.saveNote(this._selectedKey, textarea.value);
        const status = DOM.$('#note-save-status');
        if (status) {
          status.textContent = 'Saved';
          setTimeout(() => { status.textContent = ''; }, 2000);
        }
      }
    }, 800);
  },

  deleteNote(key) {
    if (!confirm('Delete this note?')) return;
    Store.deleteNote(key);
    this._selectedKey = null;
    this.init();
    App.toast('Note deleted', 'info');
  },

  filterNotes(query) {
    const items = DOM.$$('.note-list-item');
    const q = query.toLowerCase();
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  },

  exportAll() {
    const notes = Store.getNotes();
    let text = 'SYSTEM DESIGN MASTERY - NOTES EXPORT\n';
    text += '=' .repeat(50) + '\n\n';

    for (const [key, note] of Object.entries(notes)) {
      text += `--- ${this.formatNoteTitle(key)} ---\n`;
      text += `Updated: ${note.updatedAt}\n\n`;
      text += note.content + '\n\n';
    }

    ExportUtils.downloadText('sdm-notes-export.txt', text);
    App.toast('Notes exported', 'success');
  }
};
