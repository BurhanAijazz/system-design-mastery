/* ============================================
   REVISION PAGE MODULE
   ============================================ */

const RevisionPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const bookmarks = Store.getBookmarks();
    const difficult = Store.getDifficult();

    // Collect failed quiz topics
    const failedTopics = [];
    const quizResults = Store.getQuizResults();
    for (const result of quizResults) {
      if (result.percentage < 70) {
        failedTopics.push(result.quizId);
      }
    }

    const totalItems = bookmarks.length + difficult.length + failedTopics.length;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Revision List</h1>
        <p class="page-subtitle">Auto-generated from bookmarks, difficult flags, and failed quizzes</p>
      </div>

      ${totalItems === 0 ? `
        <div class="empty-state card">
          <div class="empty-icon">&#10003;</div>
          <h3>All caught up!</h3>
          <p>No items need revision. Bookmark lessons or mark them difficult to build your revision list.</p>
        </div>
      ` : ''}

      ${bookmarks.length > 0 ? `
        <div class="revision-group">
          <h3><span class="badge badge-accent">&#9733;</span> Bookmarked (${bookmarks.length})</h3>
          <div class="lesson-list">
            ${bookmarks.map(key => this.renderRevisionItem(key, 'bookmark')).join('')}
          </div>
        </div>
      ` : ''}

      ${difficult.length > 0 ? `
        <div class="revision-group">
          <h3><span class="badge badge-danger">&#9888;</span> Marked Difficult (${difficult.length})</h3>
          <div class="lesson-list">
            ${difficult.map(key => this.renderRevisionItem(key, 'difficult')).join('')}
          </div>
        </div>
      ` : ''}

      ${failedTopics.length > 0 ? `
        <div class="revision-group">
          <h3><span class="badge badge-warning">&#10007;</span> Failed Quizzes (${failedTopics.length})</h3>
          <div class="lesson-list">
            ${failedTopics.map(topic => `
              <div class="lesson-item" onclick="location.href='quiz.html?course=${topic.includes('hld') ? 'hld' : 'lld'}&week=${topic}'">
                <div class="lesson-status" style="border-color:var(--warning)">&#10007;</div>
                <div class="lesson-info">
                  <div class="lesson-title">${topic} Quiz</div>
                  <div class="lesson-meta">Retake recommended</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  renderRevisionItem(key, type) {
    const parts = Router.parseLessonKey(key);
    const url = Router.buildUrl('lesson.html', {
      course: parts.courseId,
      week: parts.weekId,
      lesson: parts.lessonId
    });

    return `
      <div class="lesson-item" onclick="location.href='${url}'">
        <div class="lesson-status" style="border-color: ${type === 'bookmark' ? 'var(--accent)' : 'var(--danger)'}">
          ${type === 'bookmark' ? '&#9733;' : '&#9888;'}
        </div>
        <div class="lesson-info">
          <div class="lesson-title">${parts.lessonId}</div>
          <div class="lesson-meta">${parts.courseId.toUpperCase()} / ${parts.weekId}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); RevisionPage.removeItem('${key}', '${type}')">
          &#10005;
        </button>
      </div>
    `;
  },

  removeItem(key, type) {
    if (type === 'bookmark') {
      Store.toggleBookmark(key);
    } else {
      Store.toggleDifficult(key);
    }
    this.init();
    App.toast('Removed from revision list', 'info');
  }
};
