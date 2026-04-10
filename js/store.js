/* ============================================
   STORE - localStorage Wrapper
   ============================================ */

const Store = {
  VERSION: 1,
  PREFIX: 'sdm_',

  _key(name) {
    return this.PREFIX + name;
  },

  get(name, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._key(name));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  set(name, value) {
    try {
      localStorage.setItem(this._key(name), JSON.stringify(value));
    } catch (e) {
      console.warn('Store.set failed:', e);
    }
  },

  remove(name) {
    localStorage.removeItem(this._key(name));
  },

  update(name, fn, defaultValue = null) {
    const current = this.get(name, defaultValue);
    const updated = fn(current);
    this.set(name, updated);
    return updated;
  },

  // Specific getters/setters
  getTheme() {
    return this.get('theme', 'light');
  },

  setTheme(theme) {
    this.set('theme', theme);
  },

  getProgress() {
    return this.get('progress', {});
  },

  markLessonComplete(courseId, weekId, lessonId, durationMinutes = 0) {
    this.update('progress', (p) => {
      if (!p[courseId]) p[courseId] = {};
      if (!p[courseId][weekId]) p[courseId][weekId] = {};
      p[courseId][weekId][lessonId] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      return p;
    }, {});
    this.updateLastVisited(courseId, weekId, lessonId);
    this.logStudyToday(durationMinutes || 0);
  },

  markLessonIncomplete(courseId, weekId, lessonId) {
    this.update('progress', (p) => {
      if (p[courseId] && p[courseId][weekId]) {
        delete p[courseId][weekId][lessonId];
      }
      return p;
    }, {});
  },

  isLessonComplete(courseId, weekId, lessonId) {
    const p = this.getProgress();
    return !!(p[courseId] && p[courseId][weekId] && p[courseId][weekId][lessonId] && p[courseId][weekId][lessonId].completed);
  },

  getQuizResults() {
    return this.get('quizResults', []);
  },

  saveQuizResult(result) {
    this.update('quizResults', (results) => {
      results.push({ ...result, takenAt: new Date().toISOString() });
      return results;
    }, []);
  },

  getExamResults() {
    return this.get('examResults', []);
  },

  saveExamResult(result) {
    this.update('examResults', (results) => {
      results.push({ ...result, takenAt: new Date().toISOString() });
      return results;
    }, []);
  },

  // Notes
  getNotes() {
    return this.get('notes', {});
  },

  getNote(key) {
    const notes = this.getNotes();
    return notes[key] || null;
  },

  saveNote(key, content) {
    this.update('notes', (notes) => {
      notes[key] = {
        content,
        createdAt: notes[key] ? notes[key].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return notes;
    }, {});
  },

  deleteNote(key) {
    this.update('notes', (notes) => {
      delete notes[key];
      return notes;
    }, {});
  },

  // Bookmarks
  getBookmarks() {
    return this.get('bookmarks', []);
  },

  toggleBookmark(lessonKey) {
    return this.update('bookmarks', (bm) => {
      const idx = bm.indexOf(lessonKey);
      if (idx >= 0) { bm.splice(idx, 1); } else { bm.push(lessonKey); }
      return bm;
    }, []);
  },

  isBookmarked(lessonKey) {
    return this.getBookmarks().includes(lessonKey);
  },

  // Difficult
  getDifficult() {
    return this.get('difficult', []);
  },

  toggleDifficult(lessonKey) {
    return this.update('difficult', (d) => {
      const idx = d.indexOf(lessonKey);
      if (idx >= 0) { d.splice(idx, 1); } else { d.push(lessonKey); }
      return d;
    }, []);
  },

  isDifficult(lessonKey) {
    return this.getDifficult().includes(lessonKey);
  },

  // Study log
  getStudyLog() {
    return this.get('studyLog', {});
  },

  logStudyToday(minutes = 0) {
    const today = TimeUtils.todayStr();
    this.update('studyLog', (log) => {
      if (!log[today]) {
        log[today] = { studied: true, minutes: 0 };
      }
      log[today].studied = true;
      if (minutes > 0) {
        log[today].minutes = (log[today].minutes || 0) + minutes;
      }
      return log;
    }, {});
    this.updateStreak();
  },

  getStreak() {
    const log = this.getStudyLog();
    return TimeUtils.calcStreak(log);
  },

  updateStreak() {
    const streak = this.getStreak();
    this.set('streak', streak);
  },

  // Goals
  getGoals() {
    const saved = this.get('goals', null);
    return {
      daily: {
        minutes: (saved && saved.daily && saved.daily.minutes) || 60
      }
    };
  },

  setGoals(goals) {
    this.set('goals', goals);
  },

  // Last visited
  getLastVisited() {
    return this.get('lastVisited', null);
  },

  updateLastVisited(course, week, lesson) {
    this.set('lastVisited', { course, week, lesson, timestamp: new Date().toISOString() });
  },

  // Export / Import
  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return data;
  },

  importAll(data) {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(this.PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  },

  resetAll() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
};
