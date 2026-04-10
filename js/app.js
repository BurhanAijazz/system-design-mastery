/* ============================================
   APP - Bootstrap & Global Setup
   ============================================ */

const App = {
  init() {
    Router.init();
    this.initTheme();
    this.initSidebar();
    this.initSearch();
    this.initMobileHelpers();
    this.initPage();
  },

  // --- THEME ---
  initTheme() {
    const theme = Store.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Store.setTheme(next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const btn = DOM.$('#theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  },

  closeSidebar() {
    document.body.classList.remove('sidebar-open');
  },

  // --- SIDEBAR ---
  initSidebar() {
    this.renderSidebar();
    this._addSidebarCloseBtn();

    const hamburger = DOM.$('#hamburger');
    if (hamburger) {
      DOM.on(hamburger, 'click', () => {
        document.body.classList.toggle('sidebar-open');
      });
    }

    const overlay = DOM.$('.sidebar-overlay');
    if (overlay) {
      DOM.on(overlay, 'click', () => this.closeSidebar());
    }

    // Close sidebar on any link click (mobile)
    DOM.delegate('#sidebar', 'click', 'a.sidebar-link', () => {
      if (window.innerWidth <= 1024) {
        this.closeSidebar();
      }
    });

    // Highlight current page
    this.highlightCurrentNav();
  },

  _addSidebarCloseBtn() {
    const header = DOM.$('.sidebar-header');
    if (header && !DOM.$('.sidebar-close', header)) {
      const btn = DOM.el('button', {
        className: 'sidebar-close',
        innerHTML: '&#10005;',
        title: 'Close sidebar',
        onClick: () => this.closeSidebar()
      });
      header.appendChild(btn);
    }
  },

  renderSidebar() {
    const nav = DOM.$('#sidebar-nav');
    if (!nav) return;

    const currentPage = Router.getCurrentPage();
    const courseParam = Router.getParam('course');

    nav.innerHTML = `
      <div class="sidebar-section">
        <a href="dashboard.html" class="sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}">
          <span class="link-icon">&#9632;</span> Dashboard
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Courses</div>
        <div class="sidebar-group ${courseParam === 'lld' ? 'open' : ''}" id="nav-lld">
          <button class="sidebar-group-toggle" onclick="App.toggleNavGroup('nav-lld')">
            <span>&#128215; LLD Course</span>
            <span class="chevron">&#9654;</span>
          </button>
          <div class="sidebar-group-items" id="nav-lld-weeks"></div>
        </div>
        <div class="sidebar-group ${courseParam === 'hld' ? 'open' : ''}" id="nav-hld">
          <button class="sidebar-group-toggle" onclick="App.toggleNavGroup('nav-hld')">
            <span>&#128214; HLD Course</span>
            <span class="chevron">&#9654;</span>
          </button>
          <div class="sidebar-group-items" id="nav-hld-weeks"></div>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Tools</div>
        <a href="interview.html" class="sidebar-link ${currentPage === 'interview' ? 'active' : ''}">
          <span class="link-icon">&#9733;</span> Interview Prep
        </a>
        <a href="quiz.html" class="sidebar-link ${currentPage === 'quiz' ? 'active' : ''}">
          <span class="link-icon">&#10004;</span> Quizzes
        </a>
        <a href="exam.html" class="sidebar-link ${currentPage === 'exam' ? 'active' : ''}">
          <span class="link-icon">&#9200;</span> Exams
        </a>
        <a href="notes.html" class="sidebar-link ${currentPage === 'notes' ? 'active' : ''}">
          <span class="link-icon">&#9998;</span> Notes
        </a>
        <a href="progress.html" class="sidebar-link ${currentPage === 'progress' ? 'active' : ''}">
          <span class="link-icon">&#9632;</span> Progress
        </a>
        <a href="revision.html" class="sidebar-link ${currentPage === 'revision' ? 'active' : ''}">
          <span class="link-icon">&#8635;</span> Revision
        </a>
      </div>

      <div class="sidebar-section">
        <a href="settings.html" class="sidebar-link ${currentPage === 'settings' ? 'active' : ''}">
          <span class="link-icon">&#9881;</span> Settings
        </a>
      </div>
    `;

    // Load course weeks into sidebar
    this.loadSidebarWeeks('lld');
    this.loadSidebarWeeks('hld');
  },

  async loadSidebarWeeks(courseId) {
    const container = DOM.$(`#nav-${courseId}-weeks`);
    if (!container) return;

    const course = await Data.getCourse(courseId);
    if (!course) {
      container.innerHTML = '<span class="sidebar-link text-xs text-muted">Loading...</span>';
      return;
    }

    const currentWeek = Router.getParam('week');
    const currentCourse = Router.getParam('course');

    container.innerHTML = `
      <a href="course.html?course=${courseId}" class="sidebar-link">
        &#9654; Overview
      </a>
      ${course.weeks.map(w => `
        <a href="week.html?course=${courseId}&week=${w.id}"
           class="sidebar-link ${currentCourse === courseId && currentWeek === w.id ? 'active' : ''}">
          W${w.number}: ${w.title}
        </a>
      `).join('')}
    `;
  },

  toggleNavGroup(id) {
    const group = DOM.$(`#${id}`);
    if (group) group.classList.toggle('open');
  },

  highlightCurrentNav() {
    // Already handled inline above
  },

  // --- SEARCH ---
  initSearch() {
    const form = DOM.$('#search-form');
    if (form) {
      DOM.on(form, 'submit', (e) => {
        e.preventDefault();
        const input = DOM.$('#search-input');
        if (input && input.value.trim()) {
          Router.navigate('search.html', { q: input.value.trim() });
        }
      });
    }

    // Mobile search toggle
    const searchToggle = DOM.$('#search-toggle-mobile');
    if (searchToggle) {
      DOM.on(searchToggle, 'click', () => {
        const bar = DOM.$('.search-bar');
        if (bar) {
          bar.classList.toggle('expanded');
          if (bar.classList.contains('expanded')) {
            const input = DOM.$('#search-input');
            if (input) input.focus();
          }
        }
      });
    }
  },

  // --- MOBILE HELPERS ---
  initMobileHelpers() {
    // Swipe to close sidebar
    let touchStartX = 0;
    let touchStartY = 0;
    const sidebar = DOM.$('.sidebar');
    if (sidebar) {
      DOM.on(sidebar, 'touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      DOM.on(sidebar, 'touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        // Swipe left to close
        if (deltaX < -80 && deltaY < 50) {
          this.closeSidebar();
        }
      }, { passive: true });
    }

    // Close sidebar on resize to desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 1024) {
          this.closeSidebar();
          const bar = DOM.$('.search-bar');
          if (bar) bar.classList.remove('expanded');
        }
      }, 150);
    });

    // Prevent body scroll when sidebar open
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('sidebar-open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  },

  // --- PAGE INIT ---
  initPage() {
    const page = Router.getCurrentPage();
    const moduleMap = {
      'index': typeof LandingPage !== 'undefined' ? LandingPage : null,
      'dashboard': typeof DashboardPage !== 'undefined' ? DashboardPage : null,
      'course': typeof CoursePage !== 'undefined' ? CoursePage : null,
      'week': typeof WeekPage !== 'undefined' ? WeekPage : null,
      'lesson': typeof LessonPage !== 'undefined' ? LessonPage : null,
      'quiz': typeof QuizPage !== 'undefined' ? QuizPage : null,
      'exam': typeof ExamPage !== 'undefined' ? ExamPage : null,
      'interview': typeof InterviewPage !== 'undefined' ? InterviewPage : null,
      'notes': typeof NotesPage !== 'undefined' ? NotesPage : null,
      'progress': typeof ProgressPage !== 'undefined' ? ProgressPage : null,
      'revision': typeof RevisionPage !== 'undefined' ? RevisionPage : null,
      'settings': typeof SettingsPage !== 'undefined' ? SettingsPage : null,
      'search': typeof SearchPage !== 'undefined' ? SearchPage : null,
    };
    const mod = moduleMap[page];
    if (mod && mod.init) {
      mod.init();
    }
  },

  // --- TOAST ---
  toast(message, type = 'info') {
    const container = DOM.$('.toast-container') || this._createToastContainer();
    const toast = DOM.el('div', { className: `toast toast-${type}` }, [message]);
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  _createToastContainer() {
    const c = DOM.el('div', { className: 'toast-container' });
    document.body.appendChild(c);
    return c;
  },

  // --- PROGRESS RING HELPER ---
  createProgressRing(size, strokeWidth, percentage, color = 'var(--accent)') {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return `
      <div class="progress-ring" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}">
          <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${strokeWidth}"/>
          <circle class="ring-fill" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${strokeWidth}"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"/>
        </svg>
        <span class="ring-text">${Math.round(percentage)}%</span>
      </div>
    `;
  }
};

// Bootstrap on DOM ready
DOM.ready(() => App.init());
