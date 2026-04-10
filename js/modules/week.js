/* ============================================
   WEEK DETAIL PAGE MODULE
   ============================================ */

const WeekPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const courseId = Router.getParam('course');
    const weekId = Router.getParam('week');
    if (!courseId || !weekId) {
      container.innerHTML = '<div class="empty-state"><p>Missing parameters.</p></div>';
      return;
    }

    const course = await Data.getCourse(courseId);
    if (!course) return;

    const week = Data.getWeek(course, weekId);
    if (!week) {
      container.innerHTML = '<div class="empty-state"><p>Week not found.</p></div>';
      return;
    }

    const lessons = Data.getWeekLessons(course, weekId);
    const completed = lessons.filter(l => Store.isLessonComplete(courseId, weekId, l.id)).length;
    const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

    container.innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Dashboard</a>
        <span class="separator">/</span>
        <a href="course.html?course=${courseId}">${course.title}</a>
        <span class="separator">/</span>
        <span>Week ${week.number}: ${week.title}</span>
      </div>

      <div class="page-header">
        <h1 class="page-title">Week ${week.number}: ${week.title}</h1>
        <p class="page-subtitle">${week.description || ''}</p>
        <div class="flex items-center gap-md mt-md">
          <div class="progress-bar" style="width: 200px">
            <div class="progress-bar-fill ${pct === 100 ? 'success' : ''}" style="width: ${pct}%"></div>
          </div>
          <span class="text-sm text-muted">${completed}/${lessons.length} complete</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" id="week-tabs">
        <button class="tab active" data-tab="concepts" onclick="WeekPage.switchTab('concepts')">
          Concepts (${(week.sections.concepts || []).length})
        </button>
        <button class="tab" data-tab="practice" onclick="WeekPage.switchTab('practice')">
          Practice (${(week.sections.practice || []).length})
        </button>
        <button class="tab" data-tab="projects" onclick="WeekPage.switchTab('projects')">
          Projects (${(week.sections.projects || []).length})
        </button>
      </div>

      <div class="tab-panel active" id="panel-concepts">
        ${this.renderLessonList(week.sections.concepts || [], courseId, weekId)}
      </div>
      <div class="tab-panel" id="panel-practice">
        ${this.renderLessonList(week.sections.practice || [], courseId, weekId)}
      </div>
      <div class="tab-panel" id="panel-projects">
        ${this.renderLessonList(week.sections.projects || [], courseId, weekId)}
      </div>

      <div class="flex justify-between mt-lg">
        <a href="quiz.html?course=${courseId}&week=${weekId}" class="btn btn-primary">
          &#10004; Take Week Quiz
        </a>
      </div>
    `;
  },

  renderLessonList(lessons, courseId, weekId) {
    if (lessons.length === 0) {
      return '<div class="empty-state"><p>No items in this section.</p></div>';
    }

    return `<div class="lesson-list">
      ${lessons.map((lesson, i) => {
        const isComplete = Store.isLessonComplete(courseId, weekId, lesson.id);
        const isBookmarked = Store.isBookmarked(Router.buildLessonKey(courseId, weekId, lesson.id));
        const isDifficult = Store.isDifficult(Router.buildLessonKey(courseId, weekId, lesson.id));
        const url = Router.buildUrl('lesson.html', { course: courseId, week: weekId, lesson: lesson.id });

        return `
          <div class="lesson-item" onclick="location.href='${url}'">
            <div class="lesson-status ${isComplete ? 'completed' : ''}">
              ${isComplete ? '&#10003;' : ''}
            </div>
            <div class="lesson-info">
              <div class="lesson-title">${lesson.title}</div>
              <div class="lesson-meta">
                ${lesson.duration ? `${lesson.duration} min` : ''}
                ${(lesson.patterns || []).map(p => `<span class="tag">${p}</span>`).join(' ')}
              </div>
            </div>
            <div class="lesson-actions">
              ${isBookmarked ? '<span class="badge badge-accent" title="Bookmarked">&#9733;</span>' : ''}
              ${isDifficult ? '<span class="badge badge-danger" title="Marked Difficult">!</span>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
  },

  switchTab(tabName) {
    DOM.$$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    DOM.$$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tabName}`));
  }
};
