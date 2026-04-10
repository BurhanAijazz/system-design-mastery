/* ============================================
   DASHBOARD PAGE MODULE
   ============================================ */

const DashboardPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const lld = await Data.getCourse('lld');
    const hld = await Data.getCourse('hld');

    const lldTotal = lld ? Data.getTotalLessons(lld) : 0;
    const hldTotal = hld ? Data.getTotalLessons(hld) : 0;
    const lldDone = lld ? Data.getCompletedLessons('lld', lld) : 0;
    const hldDone = hld ? Data.getCompletedLessons('hld', hld) : 0;
    const totalLessons = lldTotal + hldTotal;
    const doneLessons = lldDone + hldDone;

    // Time calculations
    const lldTotalMin = lld ? Data.getTotalMinutes(lld) : 0;
    const hldTotalMin = hld ? Data.getTotalMinutes(hld) : 0;
    const totalCourseMin = lldTotalMin + hldTotalMin;
    const lldRemainingMin = lld ? Data.getRemainingMinutes('lld', lld) : lldTotalMin;
    const hldRemainingMin = hld ? Data.getRemainingMinutes('hld', hld) : hldTotalMin;
    const totalRemainingMin = lldRemainingMin + hldRemainingMin;
    const completedMin = totalCourseMin - totalRemainingMin;

    const quizResults = Store.getQuizResults();
    const streak = Store.getStreak();
    const studyLog = Store.getStudyLog();
    const totalStudiedMinutes = Object.values(studyLog).reduce((s, d) => s + (d.minutes || 0), 0);
    const lastVisited = Store.getLastVisited();
    const bookmarks = Store.getBookmarks();
    const goals = Store.getGoals();
    const todayLog = studyLog[TimeUtils.todayStr()] || { studied: false, minutes: 0 };

    // Estimate completion
    const estimate = this.calcEstimate(totalRemainingMin, doneLessons, totalLessons, goals, studyLog);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Your learning overview</p>
      </div>

      <!-- Stats Row -->
      <div class="dashboard-stats">
        <div class="card">
          <div class="stat-icon lessons">&#128218;</div>
          <div class="stat-card">
            <div class="stat-value">${doneLessons}/${totalLessons}</div>
            <div class="stat-label">Lessons Done</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-icon quizzes">&#10004;</div>
          <div class="stat-card">
            <div class="stat-value">${quizResults.length}</div>
            <div class="stat-label">Quizzes Taken</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-icon streak">&#128293;</div>
          <div class="stat-card">
            <div class="stat-value">${streak.current} days</div>
            <div class="stat-label">Current Streak</div>
          </div>
        </div>
        <div class="card">
          <div class="stat-icon hours">&#9200;</div>
          <div class="stat-card">
            <div class="stat-value">${TimeUtils.formatMinutes(totalStudiedMinutes)}</div>
            <div class="stat-label">Study Time</div>
          </div>
        </div>
      </div>

      <!-- Time Estimation Banner -->
      <div class="card mb-lg" style="border-left: 4px solid var(--accent)">
        <div class="card-header">
          <h3 class="card-title">Course Time Overview</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-md);">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--accent)">${this.formatHours(totalCourseMin)}</div>
            <div class="stat-label">Total Course Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--success)">${this.formatHours(completedMin)}</div>
            <div class="stat-label">Content Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--warning)">${this.formatHours(totalRemainingMin)}</div>
            <div class="stat-label">Remaining</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--info)">${estimate.daysText}</div>
            <div class="stat-label">Est. Days Left</div>
          </div>
        </div>
        <div class="progress-bar mt-md" style="height: 10px">
          <div class="progress-bar-fill success" style="width: ${totalCourseMin > 0 ? (completedMin / totalCourseMin * 100) : 0}%"></div>
        </div>
        <div class="flex justify-between text-xs text-muted mt-sm">
          <span>${Math.round(completedMin / totalCourseMin * 100 || 0)}% of content covered</span>
          <span>${estimate.dateText}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-light)">
          <div>
            <div class="text-xs text-muted mb-sm">LLD Course</div>
            <div class="flex justify-between text-sm mb-sm">
              <span>${this.formatHours(lldTotalMin)} total</span>
              <span style="color:var(--warning)">${this.formatHours(lldRemainingMin)} left</span>
            </div>
            <div class="progress-bar" style="height:4px">
              <div class="progress-bar-fill" style="width:${lldTotalMin > 0 ? ((lldTotalMin - lldRemainingMin) / lldTotalMin * 100) : 0}%"></div>
            </div>
          </div>
          <div>
            <div class="text-xs text-muted mb-sm">HLD Course</div>
            <div class="flex justify-between text-sm mb-sm">
              <span>${this.formatHours(hldTotalMin)} total</span>
              <span style="color:var(--warning)">${this.formatHours(hldRemainingMin)} left</span>
            </div>
            <div class="progress-bar" style="height:4px">
              <div class="progress-bar-fill" style="width:${hldTotalMin > 0 ? ((hldTotalMin - hldRemainingMin) / hldTotalMin * 100) : 0}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Goals Note -->
      <div class="flex items-center gap-sm mb-lg" style="padding: var(--space-sm) var(--space-md); background: var(--accent-bg); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text-secondary)">
        <span style="font-size: 16px">&#9432;</span>
        <span>Estimates based on your daily goal of <strong>${goals.daily.minutes} min/day</strong>.
        <a href="progress.html" style="color: var(--accent); font-weight: 500">Change goal in Progress &#8594; Goals</a></span>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Continue Learning -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Continue Learning</h3>
          </div>
          <div class="card-body">
            ${lastVisited ? `
              <p style="margin-bottom: var(--space-md)">
                <strong>${lastVisited.course.toUpperCase()}</strong> &gt;
                ${lastVisited.week} &gt;
                ${lastVisited.lesson}
              </p>
              <a href="${Router.buildUrl('lesson.html', { course: lastVisited.course, week: lastVisited.week, lesson: lastVisited.lesson })}"
                 class="btn btn-primary">Resume &#8594;</a>
            ` : `
              <p>Start your first lesson!</p>
              <div class="flex gap-sm mt-md">
                <a href="course.html?course=lld" class="btn btn-primary">Start LLD</a>
                <a href="course.html?course=hld" class="btn btn-secondary">Start HLD</a>
              </div>
            `}
          </div>
        </div>

        <!-- Today's Goals -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Today's Goals</h3>
          </div>
          <div class="card-body">
            <div style="margin-bottom: var(--space-md)">
              <div class="flex justify-between text-sm mb-sm">
                <span>Study time</span>
                <span>${todayLog.minutes || 0}/${goals.daily.minutes} min</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${Math.min(100, ((todayLog.minutes || 0) / goals.daily.minutes) * 100)}%"></div>
              </div>
            </div>
            ${!todayLog.studied ? `
              <button class="btn btn-success" onclick="DashboardPage.markStudied()">
                Mark Studied Today &#10003;
              </button>
            ` : `
              <span class="badge badge-success">&#10003; Studied today</span>
            `}
          </div>
        </div>

        <!-- Course Progress -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Course Progress</h3>
          </div>
          <div class="card-body">
            <div style="margin-bottom: var(--space-md)">
              <div class="flex justify-between text-sm mb-sm">
                <span>LLD Course</span>
                <span>${lldTotal > 0 ? Math.round((lldDone / lldTotal) * 100) : 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${lldTotal > 0 ? (lldDone / lldTotal) * 100 : 0}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-sm">
                <span>HLD Course</span>
                <span>${hldTotal > 0 ? Math.round((hldDone / hldTotal) * 100) : 0}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${hldTotal > 0 ? (hldDone / hldTotal) * 100 : 0}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Quizzes -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Quiz Scores</h3>
          </div>
          <div class="card-body">
            ${quizResults.length > 0 ? quizResults.slice(-5).reverse().map(r => `
              <div class="flex justify-between items-center" style="padding: var(--space-xs) 0">
                <span class="text-sm">${r.quizId}</span>
                <span class="badge ${r.percentage >= 70 ? 'badge-success' : 'badge-danger'}">${r.percentage}%</span>
              </div>
            `).join('') : '<p class="text-muted text-sm">No quizzes taken yet</p>'}
          </div>
        </div>

        <!-- Bookmarks -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Bookmarked Lessons</h3>
          </div>
          <div class="card-body">
            ${bookmarks.length > 0 ? bookmarks.slice(0, 5).map(bk => {
              const parts = Router.parseLessonKey(bk);
              return `<div class="text-sm" style="padding: var(--space-xs) 0">
                <a href="${Router.buildUrl('lesson.html', { course: parts.courseId, week: parts.weekId, lesson: parts.lessonId })}">${parts.lessonId}</a>
                <span class="text-xs text-muted">${parts.courseId.toUpperCase()} / ${parts.weekId}</span>
              </div>`;
            }).join('') : '<p class="text-muted text-sm">No bookmarks yet</p>'}
          </div>
        </div>

        <!-- Heatmap -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Study Activity</h3>
          </div>
          <div class="card-body">
            <div id="mini-heatmap"></div>
          </div>
        </div>

        <!-- Revision Needed -->
        <div class="card full-width">
          <div class="card-header">
            <h3 class="card-title">Revision Needed</h3>
          </div>
          <div class="card-body">
            <span class="text-sm text-muted">
              ${bookmarks.length} bookmarked &middot;
              ${Store.getDifficult().length} marked difficult
            </span>
            <a href="revision.html" class="btn btn-secondary btn-sm" style="margin-left: var(--space-md)">
              Go to Revision &#8594;
            </a>
          </div>
        </div>
      </div>
    `;

    this.renderMiniHeatmap(studyLog);
  },

  calcEstimate(remainingMin, doneLessons, totalLessons, goals, studyLog) {
    if (totalLessons - doneLessons <= 0) {
      return { daysText: '0', dateText: 'Course complete!' };
    }

    const dailyGoalMin = goals.daily.minutes || 60;
    const daysFromGoal = Math.ceil(remainingMin / dailyGoalMin);

    const studyDays = Object.values(studyLog).filter(d => d.studied);
    let estDays = daysFromGoal;
    let basis = 'at your daily goal';

    if (studyDays.length >= 3) {
      const avgMinPerDay = studyDays.reduce((s, d) => s + (d.minutes || 0), 0) / studyDays.length;
      if (avgMinPerDay > 0) {
        estDays = Math.ceil(remainingMin / avgMinPerDay);
        basis = 'at your pace';
      }
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + estDays);
    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      daysText: `~${estDays}`,
      dateText: `Est. finish: ${dateStr} (${basis})`
    };
  },

  formatHours(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  renderMiniHeatmap(studyLog) {
    const container = DOM.$('#mini-heatmap');
    if (!container) return;
    const days = TimeUtils.getLast365Days().slice(-90);
    let html = '<div style="display:grid;grid-template-columns:repeat(13,1fr);gap:2px">';
    for (const day of days) {
      const log = studyLog[day];
      let level = 0;
      if (log && log.studied) {
        const mins = log.minutes || 1;
        if (mins >= 60) level = 4;
        else if (mins >= 30) level = 3;
        else if (mins >= 15) level = 2;
        else level = 1;
      }
      html += `<div class="heatmap-cell level-${level}" title="${day}"></div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  },

  markStudied() {
    Store.logStudyToday();
    App.toast('Study logged for today!', 'success');
    this.init();
  }
};
