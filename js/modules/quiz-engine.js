/* ============================================
   QUIZ ENGINE MODULE
   ============================================ */

const QuizEngine = {
  state: 'loading',    // loading | ready | in_progress | review | complete
  questions: [],
  currentIndex: 0,
  answers: {},
  startedAt: null,
  quizData: null,
  containerId: '#quiz-container',

  init(quizData, containerId = '#quiz-container') {
    this.quizData = quizData;
    this.questions = quizData.questions || [];
    this.containerId = containerId;
    this.currentIndex = 0;
    this.answers = {};
    this.startedAt = null;
    this.state = 'ready';
    this.renderReady();
  },

  renderReady() {
    const c = DOM.$(this.containerId);
    if (!c) return;

    c.innerHTML = `
      <div class="quiz-start card">
        <h2>${this.quizData.title || 'Quiz'}</h2>
        <p class="text-muted">${this.quizData.description || ''}</p>
        <div class="quiz-details">
          <div class="quiz-detail-item">
            <div class="quiz-detail-value">${this.questions.length}</div>
            <div class="quiz-detail-label">Questions</div>
          </div>
          <div class="quiz-detail-item">
            <div class="quiz-detail-value">${this.quizData.passingScore || 70}%</div>
            <div class="quiz-detail-label">Passing Score</div>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="QuizEngine.start()">Start Quiz</button>
      </div>
    `;
  },

  start() {
    this.state = 'in_progress';
    this.startedAt = Date.now();
    this.renderQuestion();
  },

  renderQuestion() {
    const c = DOM.$(this.containerId);
    if (!c || this.currentIndex >= this.questions.length) return;

    const q = this.questions[this.currentIndex];
    const answered = this.answers[q.id] !== undefined;
    const progress = ((this.currentIndex + 1) / this.questions.length) * 100;

    c.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-info">
          <h2>${this.quizData.title || 'Quiz'}</h2>
          <div class="quiz-meta">Question ${this.currentIndex + 1} of ${this.questions.length}</div>
        </div>
        <div class="quiz-progress-bar">
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-number">Question ${this.currentIndex + 1}</div>
        <div class="question-text">${q.question}</div>

        ${q.code ? `<div class="question-code">${CodeHighlight.wrapCodeBlock(q.code)}</div>` : ''}

        ${this.renderOptions(q)}
      </div>

      <div class="question-nav">
        <button class="btn btn-secondary" ${this.currentIndex === 0 ? 'disabled' : ''}
          onclick="QuizEngine.prev()">&#8592; Previous</button>
        <span class="question-counter">${this.currentIndex + 1} / ${this.questions.length}</span>
        ${this.currentIndex < this.questions.length - 1 ? `
          <button class="btn btn-primary" onclick="QuizEngine.next()">Next &#8594;</button>
        ` : `
          <button class="btn btn-success" onclick="QuizEngine.submit()">Submit Quiz</button>
        `}
      </div>
    `;
  },

  renderOptions(q) {
    const currentAnswer = this.answers[q.id];

    if (q.type === 'true-false') {
      return `
        <div class="tf-options">
          <div class="tf-btn ${currentAnswer === true ? 'selected' : ''}"
            onclick="QuizEngine.answer('${q.id}', true)">True</div>
          <div class="tf-btn ${currentAnswer === false ? 'selected' : ''}"
            onclick="QuizEngine.answer('${q.id}', false)">False</div>
        </div>
      `;
    }

    if (q.type === 'multi-select') {
      const selected = currentAnswer || [];
      return `<div class="options-list">
        ${q.options.map((opt, i) => `
          <div class="option-item multi-select ${selected.includes(i) ? 'selected' : ''}"
            onclick="QuizEngine.answerMulti('${q.id}', ${i})">
            <div class="option-marker">${selected.includes(i) ? '&#10003;' : ''}</div>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>`;
    }

    // Default: MCQ
    return `<div class="options-list">
      ${q.options.map((opt, i) => `
        <div class="option-item ${currentAnswer === i ? 'selected' : ''}"
          onclick="QuizEngine.answer('${q.id}', ${i})">
          <div class="option-marker">${String.fromCharCode(65 + i)}</div>
          <span>${opt}</span>
        </div>
      `).join('')}
    </div>`;
  },

  answer(qId, value) {
    this.answers[qId] = value;
    this.renderQuestion();
  },

  answerMulti(qId, optIndex) {
    if (!this.answers[qId]) this.answers[qId] = [];
    const arr = this.answers[qId];
    const idx = arr.indexOf(optIndex);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(optIndex);
    this.answers[qId] = [...arr];
    this.renderQuestion();
  },

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuestion();
    }
  },

  next() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    }
  },

  submit() {
    this.state = 'complete';
    const result = this.score();

    // Save result
    Store.saveQuizResult({
      quizId: this.quizData.weekId || this.quizData.title,
      score: result.correct,
      total: result.total,
      percentage: result.percentage,
      answers: this.answers
    });

    this.renderResults(result);
  },

  score() {
    let correct = 0;
    const details = [];

    for (const q of this.questions) {
      const userAnswer = this.answers[q.id];
      let isCorrect = false;

      if (q.type === 'true-false') {
        isCorrect = userAnswer === q.correct;
      } else if (q.type === 'multi-select') {
        const ua = (userAnswer || []).sort();
        const ca = [...q.correct].sort();
        isCorrect = ua.length === ca.length && ua.every((v, i) => v === ca[i]);
      } else {
        isCorrect = userAnswer === q.correct;
      }

      if (isCorrect) correct++;
      details.push({ question: q, userAnswer, isCorrect });
    }

    const total = this.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percentage >= (this.quizData.passingScore || 70);

    return { correct, total, percentage, passed, details };
  },

  renderResults(result) {
    const c = DOM.$(this.containerId);
    if (!c) return;

    c.innerHTML = `
      <div class="quiz-results card">
        <h2>Quiz Complete!</h2>
        <div class="results-score">
          <div class="score-circle ${result.passed ? 'pass' : 'fail'}">
            <div class="score-value">${result.percentage}%</div>
            <div class="score-label">${result.passed ? 'PASSED' : 'FAILED'}</div>
          </div>
        </div>
        <div class="results-breakdown">
          <div class="stat-card">
            <div class="stat-value">${result.correct}</div>
            <div class="stat-label">Correct</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.total - result.correct}</div>
            <div class="stat-label">Wrong</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${result.total}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
        <div class="results-actions">
          <button class="btn btn-primary" onclick="QuizEngine.showReview()">Review Answers</button>
          <button class="btn btn-secondary" onclick="QuizEngine.retake()">Retake Quiz</button>
        </div>
      </div>
    `;
  },

  showReview() {
    const c = DOM.$(this.containerId);
    if (!c) return;
    const result = this.score();

    let html = '<h2 class="mb-lg">Answer Review</h2>';

    for (const detail of result.details) {
      const q = detail.question;
      html += `
        <div class="question-card" style="border-left: 4px solid ${detail.isCorrect ? 'var(--success)' : 'var(--danger)'}">
          <div class="question-number">
            ${detail.isCorrect ? '&#10003; Correct' : '&#10007; Incorrect'}
          </div>
          <div class="question-text">${q.question}</div>
          ${q.code ? `<div class="question-code">${CodeHighlight.wrapCodeBlock(q.code)}</div>` : ''}
          ${this.renderReviewOptions(q, detail.userAnswer)}
          <div class="explanation visible">
            <strong>Explanation:</strong> ${q.explanation || 'No explanation provided.'}
          </div>
        </div>
      `;
    }

    html += `
      <div class="results-actions mt-lg">
        <button class="btn btn-secondary" onclick="QuizEngine.renderResults(QuizEngine.score())">Back to Results</button>
        <button class="btn btn-primary" onclick="QuizEngine.retake()">Retake Quiz</button>
      </div>
    `;

    c.innerHTML = html;
  },

  renderReviewOptions(q, userAnswer) {
    if (q.type === 'true-false') {
      const correctVal = q.correct;
      return `<div class="tf-options">
        <div class="tf-btn ${userAnswer === true ? (correctVal === true ? 'correct' : 'incorrect') : ''} ${correctVal === true && userAnswer !== true ? 'correct' : ''}">True</div>
        <div class="tf-btn ${userAnswer === false ? (correctVal === false ? 'correct' : 'incorrect') : ''} ${correctVal === false && userAnswer !== false ? 'correct' : ''}">False</div>
      </div>`;
    }

    if (q.type === 'multi-select') {
      const selected = userAnswer || [];
      const correctSet = new Set(q.correct);
      return `<div class="options-list">
        ${q.options.map((opt, i) => {
          const isSelected = selected.includes(i);
          const isCorrect = correctSet.has(i);
          let cls = '';
          if (isSelected && isCorrect) cls = 'correct';
          else if (isSelected && !isCorrect) cls = 'incorrect';
          else if (!isSelected && isCorrect) cls = 'correct';
          return `<div class="option-item multi-select ${cls}">
            <div class="option-marker">${isCorrect ? '&#10003;' : isSelected ? '&#10007;' : ''}</div>
            <span>${opt}</span>
          </div>`;
        }).join('')}
      </div>`;
    }

    // MCQ
    return `<div class="options-list">
      ${q.options.map((opt, i) => {
        let cls = '';
        if (i === q.correct) cls = 'correct';
        else if (i === userAnswer) cls = 'incorrect';
        return `<div class="option-item ${cls}">
          <div class="option-marker">${String.fromCharCode(65 + i)}</div>
          <span>${opt}</span>
        </div>`;
      }).join('')}
    </div>`;
  },

  retake() {
    this.answers = {};
    this.currentIndex = 0;
    this.state = 'ready';
    this.renderReady();
  }
};

/* ============================================
   QUIZ PAGE (wrapper)
   ============================================ */

const QuizPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const courseId = Router.getParam('course');
    const weekId = Router.getParam('week');

    if (!courseId || !weekId) {
      // Show quiz selection
      this.renderQuizList(container);
      return;
    }

    const quiz = await Data.getQuizForWeek(courseId, weekId);
    if (!quiz) {
      container.innerHTML = '<div class="empty-state"><p>No quiz found for this week.</p></div>';
      return;
    }

    const course = await Data.getCourse(courseId);
    const week = course ? Data.getWeek(course, weekId) : null;

    container.innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Dashboard</a>
        <span class="separator">/</span>
        <a href="course.html?course=${courseId}">${course ? course.title : courseId}</a>
        <span class="separator">/</span>
        <a href="week.html?course=${courseId}&week=${weekId}">${week ? `Week ${week.number}` : weekId}</a>
        <span class="separator">/</span>
        <span>Quiz</span>
      </div>
      <div id="quiz-container"></div>
    `;

    QuizEngine.init(quiz, '#quiz-container');
  },

  async renderQuizList(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Quizzes</h1>
        <p class="page-subtitle">Test your knowledge</p>
      </div>
      <div class="grid-2" id="quiz-list">Loading...</div>
    `;

    const list = DOM.$('#quiz-list');
    let html = '';

    for (const courseId of ['lld', 'hld']) {
      const course = await Data.getCourse(courseId);
      const quizData = await Data.getQuizzes(courseId);
      if (!course || !quizData) continue;

      for (const quiz of quizData.quizzes) {
        const week = Data.getWeek(course, quiz.weekId);
        const results = Store.getQuizResults().filter(r => r.quizId === quiz.weekId);
        const bestScore = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : null;

        html += `
          <div class="card card-clickable" onclick="location.href='${Router.buildUrl('quiz.html', { course: courseId, week: quiz.weekId })}'">
            <span class="badge ${courseId === 'lld' ? 'badge-success' : 'badge-info'}">${courseId.toUpperCase()}</span>
            <h3 class="mt-sm">${quiz.title}</h3>
            <p class="text-sm text-muted">${week ? `Week ${week.number}: ${week.title}` : quiz.weekId}</p>
            <div class="flex justify-between items-center mt-md">
              <span class="text-xs text-muted">${quiz.questions.length} questions</span>
              ${bestScore !== null ?
                `<span class="badge ${bestScore >= 70 ? 'badge-success' : 'badge-danger'}">Best: ${bestScore}%</span>` :
                '<span class="badge badge-neutral">Not taken</span>'}
            </div>
          </div>
        `;
      }
    }

    list.innerHTML = html || '<div class="empty-state"><p>No quizzes available.</p></div>';
  }
};
