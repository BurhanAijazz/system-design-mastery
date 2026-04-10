/* ============================================
   COURSE OVERVIEW PAGE MODULE
   ============================================ */

const CoursePage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const courseId = Router.getParam('course') || 'lld';
    const course = await Data.getCourse(courseId);

    if (!course) {
      container.innerHTML = '<div class="empty-state"><p>Course not found.</p></div>';
      return;
    }

    const totalLessons = Data.getTotalLessons(course);
    const doneLessons = Data.getCompletedLessons(courseId, course);
    const percentage = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

    container.innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Dashboard</a>
        <span class="separator">/</span>
        <span>${course.title}</span>
      </div>

      <div class="course-header">
        ${App.createProgressRing(120, 8, percentage)}
        <div>
          <h1 class="page-title">${course.title}</h1>
          <p class="page-subtitle">${course.description}</p>
          <p class="text-sm text-muted mt-sm">${doneLessons} of ${totalLessons} lessons completed</p>
        </div>
      </div>

      <h2 style="margin-bottom: var(--space-lg)">Weeks</h2>
      <div class="week-grid" id="week-grid"></div>

      ${course.bonus && course.bonus.length > 0 ? `
        <h2 style="margin: var(--space-xl) 0 var(--space-lg)">Bonus Problems</h2>
        <div class="week-grid" id="bonus-grid"></div>
      ` : ''}
    `;

    this.renderWeeks(course, courseId);
    if (course.bonus) this.renderBonus(course, courseId);
  },

  renderWeeks(course, courseId) {
    const grid = DOM.$('#week-grid');
    if (!grid) return;

    grid.innerHTML = course.weeks.map(week => {
      const lessons = Data.getWeekLessons(course, week.id);
      const completed = lessons.filter(l =>
        Store.isLessonComplete(courseId, week.id, l.id)
      ).length;
      const total = lessons.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return `
        <div class="card card-clickable week-card" onclick="location.href='${Router.buildUrl('week.html', { course: courseId, week: week.id })}'">
          <div class="week-number">Week ${week.number}</div>
          <div class="week-title">${week.title}</div>
          <p class="text-sm text-muted">${week.description}</p>
          <div class="week-meta">
            <span>${lessons.filter(l => l.section === 'concepts').length} concepts</span>
            <span>${lessons.filter(l => l.section === 'projects').length} projects</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${pct === 100 ? 'success' : ''}" style="width: ${pct}%"></div>
          </div>
          <div class="progress-label">
            <span>${completed}/${total} lessons</span>
            <span>${pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderBonus(course, courseId) {
    const grid = DOM.$('#bonus-grid');
    if (!grid) return;

    const groups = { easy: [], medium: [], hard: [] };
    for (const item of course.bonus) {
      const diff = item.difficulty || 'medium';
      if (groups[diff]) groups[diff].push(item);
    }

    let html = '';
    for (const [diff, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      const badgeClass = diff === 'easy' ? 'badge-success' : diff === 'medium' ? 'badge-warning' : 'badge-danger';
      for (const item of items) {
        html += `
          <div class="card card-clickable" onclick="location.href='${Router.buildUrl('lesson.html', { course: courseId, week: 'bonus', lesson: item.id })}'">
            <div class="flex justify-between items-center mb-sm">
              <span class="badge ${badgeClass}">${diff.toUpperCase()}</span>
              ${item.duration ? `<span class="text-xs text-muted">${item.duration} min</span>` : ''}
            </div>
            <div class="week-title">${item.title}</div>
            <div class="flex gap-sm flex-wrap mt-sm">
              ${(item.patterns || []).map(p => `<span class="tag">${p}</span>`).join('')}
            </div>
          </div>
        `;
      }
    }
    grid.innerHTML = html;
  }
};
