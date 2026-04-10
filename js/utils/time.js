/* ============================================
   TIME & DATE UTILITIES
   ============================================ */

const TimeUtils = {
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  formatMinutes(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  todayStr() {
    return new Date().toISOString().split('T')[0];
  },

  isToday(dateStr) {
    return dateStr === this.todayStr();
  },

  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2 - d1);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  },

  getWeekDates() {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  },

  calcStreak(studyLog) {
    let current = 0;
    let longest = 0;
    let date = new Date();

    // Walk backwards from today
    while (true) {
      const key = date.toISOString().split('T')[0];
      if (studyLog[key] && studyLog[key].studied) {
        current++;
      } else {
        // Allow today to be missing (hasn't studied yet today)
        if (current === 0 && this.isToday(key)) {
          date.setDate(date.getDate() - 1);
          continue;
        }
        break;
      }
      date.setDate(date.getDate() - 1);
    }

    // Calculate longest from all entries
    const sortedDates = Object.keys(studyLog).filter(k => studyLog[k].studied).sort();
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = this.daysBetween(sortedDates[i - 1], sortedDates[i]);
        tempStreak = diff === 1 ? tempStreak + 1 : 1;
      }
      longest = Math.max(longest, tempStreak);
    }

    return { current, longest: Math.max(longest, current) };
  },

  getLast365Days() {
    const days = [];
    for (let i = 364; i >= 0; i--) {
      days.push(this.daysAgo(i));
    }
    return days;
  },

  getDayOfWeek(dateStr) {
    return new Date(dateStr).getDay();
  },

  getMonthLabel(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
  }
};
