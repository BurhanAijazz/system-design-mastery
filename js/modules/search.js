/* ============================================
   SEARCH PAGE MODULE
   ============================================ */

const SearchPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const query = Router.getParam('q') || '';

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Search Results</h1>
        <p class="page-subtitle" id="search-status">Searching for "${query}"...</p>
      </div>
      <div id="search-results"></div>
    `;

    // Pre-fill search bar
    const input = DOM.$('#search-input');
    if (input) input.value = query;

    if (query) {
      await this.search(query);
    }
  },

  async search(query) {
    const index = await Data.getSearchIndex();
    const results = this.query(index, query);

    const status = DOM.$('#search-status');
    const container = DOM.$('#search-results');

    if (status) {
      status.textContent = `${results.length} result(s) for "${query}"`;
    }

    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state card">
          <p>No results found for "${query}".</p>
          <p class="text-sm text-muted mt-sm">Try different keywords.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="search-results-list">
        ${results.map(r => `
          <div class="card card-clickable search-result-item mb-sm"
            onclick="location.href='${Router.buildUrl('lesson.html', { course: r.courseId, week: r.weekId, lesson: r.lessonId })}'">
            <div class="result-path">${r.courseId.toUpperCase()} / ${r.weekTitle} / ${r.section}</div>
            <div class="result-title">${this.highlightMatch(r.title, query)}</div>
            <div class="result-snippet">
              ${r.keywords.length > 0 ? `Keywords: ${r.keywords.join(', ')}` : ''}
              ${r.patterns.length > 0 ? ` | Patterns: ${r.patterns.join(', ')}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  query(index, queryStr) {
    const terms = queryStr.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return index
      .map(item => {
        let score = 0;
        const searchable = [
          item.title,
          item.weekTitle,
          item.section,
          ...item.keywords,
          ...item.patterns,
          item.courseTitle
        ].join(' ').toLowerCase();

        for (const term of terms) {
          if (item.title.toLowerCase().includes(term)) score += 10;
          if (item.keywords.some(k => k.toLowerCase().includes(term))) score += 5;
          if (item.patterns.some(p => p.toLowerCase().includes(term))) score += 5;
          if (item.weekTitle.toLowerCase().includes(term)) score += 3;
          if (searchable.includes(term)) score += 1;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  },

  highlightMatch(text, query) {
    const terms = query.split(/\s+/).filter(Boolean);
    let result = text;
    for (const term of terms) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<strong>$1</strong>');
    }
    return result;
  }
};
