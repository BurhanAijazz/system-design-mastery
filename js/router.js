/* ============================================
   ROUTER - Query Parameter Handler
   ============================================ */

const Router = {
  _params: null,

  init() {
    this._params = new URLSearchParams(window.location.search);
  },

  getParam(key) {
    if (!this._params) this.init();
    return this._params.get(key);
  },

  getAllParams() {
    if (!this._params) this.init();
    const obj = {};
    this._params.forEach((value, key) => { obj[key] = value; });
    return obj;
  },

  buildUrl(page, params = {}) {
    const query = new URLSearchParams(params).toString();
    return query ? `${page}?${query}` : page;
  },

  navigate(page, params = {}) {
    window.location.href = this.buildUrl(page, params);
  },

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
  },

  buildLessonKey(courseId, weekId, lessonId) {
    return `${courseId}::${weekId}::${lessonId}`;
  },

  parseLessonKey(key) {
    const [courseId, weekId, lessonId] = key.split('::');
    return { courseId, weekId, lessonId };
  }
};
