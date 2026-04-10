/* ============================================
   PROGRESS PAGE MODULE
   ============================================ */

const ProgressPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Progress Tracker</h1>
        <p class="page-subtitle">Track your learning journey</p>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="overview" onclick="ProgressPage.switchTab('overview')">Overview</button>
        <button class="tab" data-tab="calendar" onclick="ProgressPage.switchTab('calendar')">Study Calendar</button>
        <button class="tab" data-tab="goals" onclick="ProgressPage.switchTab('goals')">Goals</button>
      </div>

      <div class="tab-panel active" id="panel-overview">
        <div id="overview-content">Loading...</div>
      </div>

      <div class="tab-panel" id="panel-calendar">
        <div id="calendar-content"></div>
      </div>

      <div class="tab-panel" id="panel-goals">
        <div id="goals-content"></div>
      </div>
    `;

    await this.renderOverview();
    this.renderCalendar();
    this.renderGoals();
  },

  async renderOverview() {
    const el = DOM.$('#overview-content');
    if (!el) return;

    const lld = await Data.getCourse('lld');
    const hld = await Data.getCourse('hld');

    const courses = [
      { id: 'lld', course: lld, label: 'LLD Course' },
      { id: 'hld', course: hld, label: 'HLD Course' }
    ].filter(c => c.course);

    let html = '<div class="grid-2">';

    for (const { id, course, label } of courses) {
      const total = Data.getTotalLessons(course);
      const done = Data.getCompletedLessons(id, course);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      html += `
        <div class="card">
          <div class="flex items-center gap-lg">
            ${App.createProgressRing(100, 6, pct)}
            <div>
              <h3>${label}</h3>
              <p class="text-sm text-muted">${done}/${total} lessons</p>
            </div>
          </div>

          <div class="mt-lg">
            ${course.weeks.map(week => {
              const weekLessons = Data.getWeekLessons(course, week.id);
              const weekDone = weekLessons.filter(l => Store.isLessonComplete(id, week.id, l.id)).length;
              const weekPct = weekLessons.length > 0 ? Math.round((weekDone / weekLessons.length) * 100) : 0;

              return `
                <div style="margin-bottom: var(--space-sm)">
                  <div class="flex justify-between text-xs mb-sm">
                    <span>W${week.number}: ${week.title}</span>
                    <span>${weekPct}%</span>
                  </div>
                  <div class="progress-bar" style="height:4px">
                    <div class="progress-bar-fill ${weekPct === 100 ? 'success' : ''}" style="width:${weekPct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';

    // Quiz stats
    const quizResults = Store.getQuizResults();
    const examResults = Store.getExamResults();

    html += `
      <div class="grid-2 mt-lg">
        <div class="card">
          <h3>Quiz Performance</h3>
          <div class="mt-md">
            <div class="stat-card mb-md">
              <div class="stat-value">${quizResults.length}</div>
              <div class="stat-label">Quizzes Taken</div>
            </div>
            ${quizResults.length > 0 ? `
              <div class="stat-card mb-md">
                <div class="stat-value">${Math.round(quizResults.reduce((s, r) => s + r.percentage, 0) / quizResults.length)}%</div>
                <div class="stat-label">Average Score</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="card">
          <h3>Exams</h3>
          <div class="mt-md">
            ${examResults.length > 0 ? examResults.map(r => `
              <div class="flex justify-between items-center" style="padding: var(--space-xs) 0">
                <span class="text-sm">${r.examId}</span>
                <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">${r.percentage}% ${r.passed ? 'Pass' : 'Fail'}</span>
              </div>
            `).join('') : '<p class="text-sm text-muted">No exams taken yet</p>'}
          </div>
        </div>
      </div>
    `;

    el.innerHTML = html;
  },

  renderCalendar() {
    const el = DOM.$('#calendar-content');
    if (!el) return;

    const studyLog = Store.getStudyLog();
    const streak = Store.getStreak();
    const days = TimeUtils.getLast365Days();

    el.innerHTML = `
      <div class="card mb-lg">
        <div class="flex gap-lg mb-lg">
          <div class="stat-card">
            <div class="stat-value">${streak.current}</div>
            <div class="stat-label">Current Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${streak.longest}</div>
            <div class="stat-label">Longest Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Object.keys(studyLog).filter(k => studyLog[k].studied).length}</div>
            <div class="stat-label">Total Study Days</div>
          </div>
        </div>

        <h4 class="mb-md">Study Heatmap</h4>
        <div class="heatmap-grid">
          ${days.map(day => {
            const log = studyLog[day];
            let level = 0;
            if (log && log.studied) {
              const mins = log.minutes || 1;
              if (mins >= 60) level = 4;
              else if (mins >= 30) level = 3;
              else if (mins >= 15) level = 2;
              else level = 1;
            }
            return `<div class="heatmap-cell level-${level}" title="${day}: ${log ? log.minutes || 0 : 0} min"></div>`;
          }).join('')}
        </div>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="heatmap-cell"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
          <span>More</span>
        </div>
      </div>
    `;
  },

  async renderGoals() {
    const el = DOM.$('#goals-content');
    if (!el) return;

    const goals = Store.getGoals();
    const todayLog = Store.getStudyLog()[TimeUtils.todayStr()] || { minutes: 0 };
    const studyLog = Store.getStudyLog();

    // Compute remaining time for estimation
    const lld = await Data.getCourse('lld');
    const hld = await Data.getCourse('hld');
    const lldRemaining = lld ? Data.getRemainingMinutes('lld', lld) : 0;
    const hldRemaining = hld ? Data.getRemainingMinutes('hld', hld) : 0;
    const totalRemaining = lldRemaining + hldRemaining;
    const totalLessons = (lld ? Data.getTotalLessons(lld) : 0) + (hld ? Data.getTotalLessons(hld) : 0);
    const doneLessons = (lld ? Data.getCompletedLessons('lld', lld) : 0) + (hld ? Data.getCompletedLessons('hld', hld) : 0);
    const remainingLessons = totalLessons - doneLessons;

    // Calculate estimates
    const est = this.calcCompletionEstimate(totalRemaining, remainingLessons, goals, studyLog);

    const inputStyle = 'width:80px;padding:var(--space-sm);border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg-secondary);color:var(--text-primary)';

    el.innerHTML = `
      <!-- Completion Estimate Card -->
      <div class="card mb-lg" style="border-left: 4px solid var(--accent)">
        <h3 style="margin-bottom: var(--space-md)">Estimated Completion</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--space-md);" id="estimate-grid">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--warning)" id="est-days">${est.days}</div>
            <div class="stat-label">Days Remaining</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--info)" id="est-weeks">${est.weeks}</div>
            <div class="stat-label">Weeks Remaining</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--accent)" id="est-date">${est.dateShort}</div>
            <div class="stat-label">Target Date</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="est-hours">${est.hoursLeft}</div>
            <div class="stat-label">Hours Left</div>
          </div>
        </div>
        <p class="text-xs text-muted mt-md" id="est-basis">${est.basis}</p>
      </div>

      <div class="card">
        <h3>Daily Study Goal</h3>
        <p class="text-sm text-muted mt-sm mb-lg">How many minutes will you study each day? The completion estimate updates live as you change this.</p>

        <label class="text-sm font-medium">Minutes per Day</label>
        <div class="flex items-center gap-md mt-sm">
          <input type="range" id="goal-daily-minutes-slider" min="10" max="1440" step="10" value="${goals.daily.minutes}"
            style="flex:1;accent-color:var(--accent)" oninput="ProgressPage.onSliderChange(this.value)">
          <input type="number" id="goal-daily-minutes" value="${goals.daily.minutes}" min="10" max="1440"
            style="${inputStyle}" oninput="ProgressPage.onGoalChange()">
          <span class="text-sm text-muted">min</span>
        </div>
        <div class="text-xs text-muted mt-sm">${this.formatGoalLabel(goals.daily.minutes)}</div>

        <div class="mt-lg">
          <div class="flex justify-between text-sm mb-sm">
            <span>Today's progress</span>
            <span>${todayLog.minutes || 0} / ${goals.daily.minutes} min</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${(todayLog.minutes || 0) >= goals.daily.minutes ? 'success' : ''}" style="width: ${Math.min(100, ((todayLog.minutes || 0) / goals.daily.minutes) * 100)}%"></div>
          </div>
        </div>

        <button class="btn btn-primary mt-lg" onclick="ProgressPage.saveGoals()">Save Goal</button>
      </div>
    `;
  },

  onSliderChange(val) {
    const input = DOM.$('#goal-daily-minutes');
    if (input) input.value = val;
    this.onGoalChange();
  },

  formatGoalLabel(minutes) {
    if (minutes < 60) return `${minutes} minutes per day`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hLabel = h === 1 ? '1 hour' : `${h} hours`;
    return m > 0 ? `${hLabel} ${m} min per day` : `${hLabel} per day`;
  },

  // Live-update estimates as user types new goals
  _goalChangeTimer: null,
  onGoalChange() {
    // Sync slider with number input
    const input = DOM.$('#goal-daily-minutes');
    const slider = DOM.$('#goal-daily-minutes-slider');
    if (input && slider) {
      let val = parseInt(input.value) || 60;
      if (val < 10) val = 10;
      if (val > 1440) val = 1440;
      input.value = val;
      slider.value = val;
    }
    clearTimeout(this._goalChangeTimer);
    this._goalChangeTimer = setTimeout(() => {
      this.updateEstimateDisplay();
    }, 300);
  },

  async updateEstimateDisplay() {
    let dailyMin = parseInt(DOM.$('#goal-daily-minutes')?.value) || 60;
    if (dailyMin < 10) dailyMin = 10;
    if (dailyMin > 1440) dailyMin = 1440;

    const goals = {
      daily: { minutes: dailyMin }
    };

    const lld = await Data.getCourse('lld');
    const hld = await Data.getCourse('hld');
    const totalRemaining = (lld ? Data.getRemainingMinutes('lld', lld) : 0) + (hld ? Data.getRemainingMinutes('hld', hld) : 0);
    const totalLessons = (lld ? Data.getTotalLessons(lld) : 0) + (hld ? Data.getTotalLessons(hld) : 0);
    const doneLessons = (lld ? Data.getCompletedLessons('lld', lld) : 0) + (hld ? Data.getCompletedLessons('hld', hld) : 0);
    const remainingLessons = totalLessons - doneLessons;
    const studyLog = Store.getStudyLog();

    const est = this.calcCompletionEstimate(totalRemaining, remainingLessons, goals, studyLog);

    // Update DOM directly
    const days = DOM.$('#est-days');
    const weeks = DOM.$('#est-weeks');
    const date = DOM.$('#est-date');
    const hours = DOM.$('#est-hours');
    const basis = DOM.$('#est-basis');

    if (days) days.textContent = est.days;
    if (weeks) weeks.textContent = est.weeks;
    if (date) date.textContent = est.dateShort;
    if (hours) hours.textContent = est.hoursLeft;
    if (basis) basis.textContent = est.basis;
  },

  calcCompletionEstimate(remainingMin, remainingLessons, goals, studyLog) {
    if (remainingLessons <= 0) {
      return { days: '0', weeks: '0', dateShort: 'Done!', hoursLeft: '0h', basis: 'All courses completed!' };
    }

    const dailyMin = goals.daily.minutes || 60;

    // Method 1: from daily minute goal
    const daysFromGoal = Math.ceil(remainingMin / dailyMin);

    // Method 2: from actual pace (if user has enough history)
    const studyDays = Object.values(studyLog).filter(d => d.studied);
    let daysFromPace = daysFromGoal;
    let usingActualPace = false;
    if (studyDays.length >= 3) {
      const avgMinPerDay = studyDays.reduce((s, d) => s + (d.minutes || 0), 0) / studyDays.length;
      if (avgMinPerDay > 0) {
        daysFromPace = Math.ceil(remainingMin / avgMinPerDay);
        usingActualPace = true;
      }
    }

    const estDays = usingActualPace ? daysFromPace : daysFromGoal;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + estDays);
    const dateShort = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const basisText = usingActualPace
      ? `Based on your actual avg pace of ${Math.round(studyDays.reduce((s, d) => s + (d.minutes || 0), 0) / studyDays.length)} min/day over ${studyDays.length} study days`
      : `Based on your daily goal of ${dailyMin} min/day`;

    return {
      days: `~${estDays}`,
      weeks: `~${Math.ceil(estDays / 7)}`,
      dateShort: dateShort,
      hoursLeft: `${Math.round(remainingMin / 60)}h`,
      basis: basisText
    };
  },

  saveGoals() {
    let minutes = parseInt(DOM.$('#goal-daily-minutes')?.value) || 60;
    if (minutes < 10) minutes = 10;
    if (minutes > 1440) minutes = 1440;
    Store.setGoals({ daily: { minutes } });
    App.toast('Goal saved!', 'success');
    this.renderGoals();
  },

  switchTab(tabName) {
    DOM.$$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    DOM.$$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tabName}`));
  }
};
