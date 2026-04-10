/* ============================================
   STUDY TRACKER MODULE (used by dashboard & progress)
   ============================================ */

const StudyTracker = {
  logStudy(minutes = 0) {
    Store.logStudyToday(minutes);
  },

  getStreak() {
    return Store.getStreak();
  },

  getTodayLog() {
    const log = Store.getStudyLog();
    return log[TimeUtils.todayStr()] || { studied: false, minutes: 0 };
  },

  getWeeklyStats() {
    const log = Store.getStudyLog();
    const weekDates = TimeUtils.getWeekDates();
    let totalMinutes = 0;
    let daysStudied = 0;

    for (const date of weekDates) {
      if (log[date] && log[date].studied) {
        daysStudied++;
        totalMinutes += log[date].minutes || 0;
      }
    }

    return { totalMinutes, daysStudied, weekDates };
  },

  renderHeatmap(containerId, days = 365) {
    const container = DOM.$(containerId);
    if (!container) return;

    const studyLog = Store.getStudyLog();
    const allDays = TimeUtils.getLast365Days().slice(-days);

    let html = '<div class="heatmap-grid">';
    for (const day of allDays) {
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
    html += `
      <div class="heatmap-legend">
        <span>Less</span>
        <div class="heatmap-cell" style="width:12px;height:12px;min-width:12px"></div>
        <div class="heatmap-cell level-1" style="width:12px;height:12px;min-width:12px"></div>
        <div class="heatmap-cell level-2" style="width:12px;height:12px;min-width:12px"></div>
        <div class="heatmap-cell level-3" style="width:12px;height:12px;min-width:12px"></div>
        <div class="heatmap-cell level-4" style="width:12px;height:12px;min-width:12px"></div>
        <span>More</span>
      </div>
    `;
    container.innerHTML = html;
  }
};
