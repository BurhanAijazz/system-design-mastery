/* ============================================
   BOOKMARKS MODULE
   ============================================ */

const Bookmarks = {
  toggle(lessonKey) {
    return Store.toggleBookmark(lessonKey);
  },

  getAll() {
    return Store.getBookmarks();
  },

  isBookmarked(key) {
    return Store.isBookmarked(key);
  },

  toggleDifficult(lessonKey) {
    return Store.toggleDifficult(lessonKey);
  },

  getDifficult() {
    return Store.getDifficult();
  },

  isDifficult(key) {
    return Store.isDifficult(key);
  }
};
