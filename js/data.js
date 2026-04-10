/* ============================================
   DATA - JSON Loader & Index Builder
   ============================================ */

const Data = {
  _cache: {},
  _courses: {},
  _quizzes: {},
  _exams: null,
  _interviewPrep: null,
  _searchIndex: null,

  async load(url) {
    if (this._cache[url]) return this._cache[url];
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      this._cache[url] = data;
      return data;
    } catch (e) {
      console.error(`Failed to load ${url}:`, e);
      return null;
    }
  },

  async loadContent(url) {
    if (this._cache[url]) return this._cache[url];
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      this._cache[url] = html;
      return html;
    } catch (e) {
      console.error(`Failed to load content ${url}:`, e);
      return '<p>Content not found.</p>';
    }
  },

  async getCourse(courseId) {
    if (this._courses[courseId]) return this._courses[courseId];
    const data = await this.load(`data/${courseId}-course.json`);
    if (data) {
      this._courses[courseId] = data;
      this._buildCourseIndex(data);
    }
    return data;
  },

  _buildCourseIndex(course) {
    course._weekMap = {};
    course._lessonMap = {};
    course._allLessons = [];

    for (const week of course.weeks) {
      course._weekMap[week.id] = week;
      for (const section of ['concepts', 'practice', 'projects']) {
        if (week.sections[section]) {
          for (const lesson of week.sections[section]) {
            const key = `${course.id}::${week.id}::${lesson.id}`;
            course._lessonMap[key] = { ...lesson, weekId: week.id, section };
            course._allLessons.push({ ...lesson, weekId: week.id, section, key });
          }
        }
      }
    }
  },

  getWeek(course, weekId) {
    return course._weekMap ? course._weekMap[weekId] : null;
  },

  getLesson(course, weekId, lessonId) {
    const key = `${course.id}::${weekId}::${lessonId}`;
    return course._lessonMap ? course._lessonMap[key] : null;
  },

  getAllLessons(course) {
    return course._allLessons || [];
  },

  getWeekLessons(course, weekId) {
    return this.getAllLessons(course).filter(l => l.weekId === weekId);
  },

  async getQuizzes(courseId) {
    if (this._quizzes[courseId]) return this._quizzes[courseId];
    const data = await this.load(`data/${courseId}-quizzes.json`);
    if (data) this._quizzes[courseId] = data;
    return data;
  },

  async getQuizForWeek(courseId, weekId) {
    const data = await this.getQuizzes(courseId);
    if (!data) return null;
    return data.quizzes.find(q => q.weekId === weekId) || null;
  },

  async getExams() {
    if (this._exams) return this._exams;
    const data = await this.load('data/exams.json');
    if (data) this._exams = data;
    return data;
  },

  async getExam(examId) {
    const data = await this.getExams();
    if (!data) return null;
    return data.exams.find(e => e.id === examId) || null;
  },

  async getInterviewPrep() {
    if (this._interviewPrep) return this._interviewPrep;
    const data = await this.load('data/interview-prep.json');
    if (data) this._interviewPrep = data;
    return data;
  },

  async getSearchIndex() {
    if (this._searchIndex) return this._searchIndex;
    // Build from course data
    const lld = await this.getCourse('lld');
    const hld = await this.getCourse('hld');
    const index = [];
    for (const course of [lld, hld]) {
      if (!course) continue;
      for (const lesson of this.getAllLessons(course)) {
        index.push({
          title: lesson.title,
          keywords: lesson.keywords || [],
          patterns: lesson.patterns || [],
          courseId: course.id,
          courseTitle: course.title,
          weekId: lesson.weekId,
          weekTitle: course._weekMap[lesson.weekId]?.title || '',
          lessonId: lesson.id,
          section: lesson.section
        });
      }
    }
    this._searchIndex = index;
    return index;
  },

  // Compute totals
  getTotalLessons(course) {
    return this.getAllLessons(course).length;
  },

  getCompletedLessons(courseId, course) {
    const progress = Store.getProgress();
    const cp = progress[courseId] || {};
    let count = 0;
    for (const weekId of Object.keys(cp)) {
      for (const lessonId of Object.keys(cp[weekId])) {
        if (cp[weekId][lessonId].completed) count++;
      }
    }
    return count;
  },

  // Time estimation helpers
  getTotalMinutes(course) {
    let total = 0;
    for (const lesson of this.getAllLessons(course)) {
      total += lesson.duration || 35;
    }
    for (const bonus of (course.bonus || [])) {
      total += bonus.duration || 35;
    }
    return total;
  },

  getCompletedMinutes(courseId, course) {
    const progress = Store.getProgress();
    const cp = progress[courseId] || {};
    let total = 0;
    for (const lesson of this.getAllLessons(course)) {
      if (cp[lesson.weekId] && cp[lesson.weekId][lesson.id] && cp[lesson.weekId][lesson.id].completed) {
        total += lesson.duration || 35;
      }
    }
    return total;
  },

  getRemainingMinutes(courseId, course) {
    return this.getTotalMinutes(course) - this.getCompletedMinutes(courseId, course);
  }
};
