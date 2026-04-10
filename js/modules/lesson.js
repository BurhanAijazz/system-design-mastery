/* ============================================
   LESSON VIEWER PAGE MODULE
   ============================================ */

const LessonPage = {
  _courseId: null,
  _weekId: null,
  _lessonId: null,
  _lessonKey: null,

  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    this._courseId = Router.getParam('course');
    this._weekId = Router.getParam('week');
    this._lessonId = Router.getParam('lesson');

    if (!this._courseId || !this._weekId || !this._lessonId) {
      container.innerHTML = '<div class="empty-state"><p>Missing parameters.</p></div>';
      return;
    }

    this._lessonKey = Router.buildLessonKey(this._courseId, this._weekId, this._lessonId);

    const course = await Data.getCourse(this._courseId);
    if (!course) return;

    const week = Data.getWeek(course, this._weekId);
    const lesson = Data.getLesson(course, this._weekId, this._lessonId);

    if (!lesson) {
      container.innerHTML = '<div class="empty-state"><p>Lesson not found.</p></div>';
      return;
    }

    // Update last visited
    Store.updateLastVisited(this._courseId, this._weekId, this._lessonId);

    const isComplete = Store.isLessonComplete(this._courseId, this._weekId, this._lessonId);
    const isBookmarked = Store.isBookmarked(this._lessonKey);
    const isDifficult = Store.isDifficult(this._lessonKey);

    // Load content
    let contentHtml = '';
    if (lesson.file) {
      contentHtml = await Data.loadContent(lesson.file);
    } else {
      contentHtml = '<p>Content coming soon.</p>';
    }

    // Find prev/next
    const weekLessons = Data.getWeekLessons(course, this._weekId);
    const currentIdx = weekLessons.findIndex(l => l.id === this._lessonId);
    const prevLesson = currentIdx > 0 ? weekLessons[currentIdx - 1] : null;
    const nextLesson = currentIdx < weekLessons.length - 1 ? weekLessons[currentIdx + 1] : null;

    const weekTitle = week ? `Week ${week.number}: ${week.title}` : this._weekId;

    container.innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Dashboard</a>
        <span class="separator">/</span>
        <a href="course.html?course=${this._courseId}">${course.title}</a>
        <span class="separator">/</span>
        <a href="week.html?course=${this._courseId}&week=${this._weekId}">${weekTitle}</a>
        <span class="separator">/</span>
        <span>${lesson.title}</span>
      </div>

      <div class="lesson-viewer">
        <!-- Toolbar -->
        <div class="lesson-toolbar">
          <div class="lesson-toolbar-left">
            <button class="btn ${isComplete ? 'btn-success' : 'btn-secondary'}" id="btn-complete"
              onclick="LessonPage.toggleComplete()">
              ${isComplete ? '&#10003; Completed' : 'Mark Complete'}
            </button>
          </div>
          <div class="lesson-toolbar-right">
            <button class="btn btn-ghost ${isBookmarked ? 'active' : ''}" id="btn-bookmark"
              onclick="LessonPage.toggleBookmark()" title="Bookmark">
              ${isBookmarked ? '&#9733;' : '&#9734;'}
            </button>
            <button class="btn btn-ghost ${isDifficult ? 'active' : ''}" id="btn-difficult"
              onclick="LessonPage.toggleDifficult()" title="Mark Difficult">
              ${isDifficult ? '&#9888; Difficult' : '&#9888;'}
            </button>
          </div>
        </div>

        <!-- Content -->
        <h1 class="page-title mb-lg">${lesson.title}</h1>
        <div class="lesson-content" id="lesson-content">
          ${contentHtml}
        </div>

        <!-- Notes Panel -->
        <div class="note-panel">
          <div class="note-panel-header" onclick="LessonPage.toggleNotePanel()">
            <h4>&#9998; Notes</h4>
            <span id="note-toggle-icon">&#9660;</span>
          </div>
          <div id="note-body" style="display:none">
            <textarea class="form-textarea" id="lesson-note" placeholder="Write your notes here..."
              oninput="LessonPage.autoSaveNote()">${(Store.getNote(this._lessonKey) || { content: '' }).content}</textarea>
            <div class="flex justify-between items-center mt-sm">
              <span class="text-xs text-muted" id="note-status"></span>
              <button class="btn btn-sm btn-secondary" onclick="LessonPage.deleteNote()">Delete Note</button>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="lesson-nav">
          ${prevLesson ? `
            <a href="${Router.buildUrl('lesson.html', { course: this._courseId, week: this._weekId, lesson: prevLesson.id })}"
               class="btn btn-secondary">&#8592; ${prevLesson.title}</a>
          ` : '<span></span>'}
          ${nextLesson ? `
            <a href="${Router.buildUrl('lesson.html', { course: this._courseId, week: this._weekId, lesson: nextLesson.id })}"
               class="btn btn-primary">${nextLesson.title} &#8594;</a>
          ` : `
            <a href="quiz.html?course=${this._courseId}&week=${this._weekId}" class="btn btn-primary">
              Take Quiz &#8594;
            </a>
          `}
        </div>
      </div>
    `;

    // Highlight code blocks
    CodeHighlight.highlightAll(DOM.$('#lesson-content'));
  },

  async toggleComplete() {
    const isComplete = Store.isLessonComplete(this._courseId, this._weekId, this._lessonId);
    if (isComplete) {
      Store.markLessonIncomplete(this._courseId, this._weekId, this._lessonId);
    } else {
      // Get lesson duration from course data
      const course = await Data.getCourse(this._courseId);
      const lesson = course ? Data.getLesson(course, this._weekId, this._lessonId) : null;
      const duration = (lesson && lesson.duration) || 35; // default 35 min
      Store.markLessonComplete(this._courseId, this._weekId, this._lessonId, duration);
    }
    this.init();
  },

  toggleBookmark() {
    Store.toggleBookmark(this._lessonKey);
    this.init();
  },

  toggleDifficult() {
    Store.toggleDifficult(this._lessonKey);
    this.init();
  },

  _noteTimer: null,
  autoSaveNote() {
    clearTimeout(this._noteTimer);
    this._noteTimer = setTimeout(() => {
      const textarea = DOM.$('#lesson-note');
      if (textarea && textarea.value.trim()) {
        Store.saveNote(this._lessonKey, textarea.value);
        const status = DOM.$('#note-status');
        if (status) status.textContent = 'Saved';
        setTimeout(() => { if (status) status.textContent = ''; }, 2000);
      }
    }, 1000);
  },

  deleteNote() {
    Store.deleteNote(this._lessonKey);
    const textarea = DOM.$('#lesson-note');
    if (textarea) textarea.value = '';
    App.toast('Note deleted', 'info');
  },

  toggleNotePanel() {
    const body = DOM.$('#note-body');
    const icon = DOM.$('#note-toggle-icon');
    if (body) {
      const visible = body.style.display !== 'none';
      body.style.display = visible ? 'none' : 'block';
      if (icon) icon.innerHTML = visible ? '&#9660;' : '&#9650;';
    }
  }
};
