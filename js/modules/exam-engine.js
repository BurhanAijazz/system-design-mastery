/* ============================================
   EXAM ENGINE MODULE
   ============================================ */

const ExamEngine = {
  state: 'loading',
  questions: [],
  currentIndex: 0,
  answers: {},
  startedAt: null,
  examData: null,
  timeLimit: 0,
  timerInterval: null,
  timeRemaining: 0,

  init(examData) {
    this.examData = examData;
    this.questions = examData.questions || [];
    this.timeLimit = examData.timeLimit || 3600;
    this.timeRemaining = this.timeLimit;
    this.currentIndex = 0;
    this.answers = {};
    this.state = 'ready';
    this.renderReady();
  },

  renderReady() {
    const c = DOM.$('#exam-container');
    if (!c) return;

    c.innerHTML = `
      <div class="quiz-start card">
        <h2>${this.examData.title}</h2>
        <p class="text-muted">${this.examData.description || ''}</p>
        <div class="quiz-details">
          <div class="quiz-detail-item">
            <div class="quiz-detail-value">${this.questions.length}</div>
            <div class="quiz-detail-label">Questions</div>
          </div>
          <div class="quiz-detail-item">
            <div class="quiz-detail-value">${TimeUtils.formatDuration(this.timeLimit)}</div>
            <div class="quiz-detail-label">Time Limit</div>
          </div>
          <div class="quiz-detail-item">
            <div class="quiz-detail-value">${this.examData.passingScore || 70}%</div>
            <div class="quiz-detail-label">Passing Score</div>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="ExamEngine.start()">Start Exam</button>
      </div>
    `;
  },

  start() {
    this.state = 'in_progress';
    this.startedAt = Date.now();
    this.startTimer();
    this.renderExam();
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      if (this.timeRemaining <= 0) {
        this.submit();
      }
    }, 1000);
  },

  updateTimerDisplay() {
    const el = DOM.$('#exam-timer');
    if (!el) return;
    el.textContent = TimeUtils.formatDuration(this.timeRemaining);
    const pct = this.timeRemaining / this.timeLimit;
    el.className = 'exam-timer' + (pct <= 0.1 ? ' danger' : pct <= 0.25 ? ' warning' : '');
  },

  renderExam() {
    const c = DOM.$('#exam-container');
    if (!c) return;

    const q = this.questions[this.currentIndex];

    c.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-info">
          <h2>${this.examData.title}</h2>
          <div class="quiz-meta">Question ${this.currentIndex + 1} of ${this.questions.length}</div>
        </div>
        <div class="exam-timer" id="exam-timer">${TimeUtils.formatDuration(this.timeRemaining)}</div>
      </div>

      <div class="exam-layout">
        <div>
          <div class="question-card">
            <div class="question-number">Question ${this.currentIndex + 1}</div>
            <div class="question-text">${q.question}</div>
            ${q.code ? `<div class="question-code">${CodeHighlight.wrapCodeBlock(q.code)}</div>` : ''}
            ${this.renderOptions(q)}
          </div>

          <div class="question-nav">
            <button class="btn btn-secondary" ${this.currentIndex === 0 ? 'disabled' : ''}
              onclick="ExamEngine.prev()">&#8592; Previous</button>
            ${this.currentIndex < this.questions.length - 1 ? `
              <button class="btn btn-primary" onclick="ExamEngine.next()">Next &#8594;</button>
            ` : `
              <button class="btn btn-success" onclick="ExamEngine.confirmSubmit()">Submit Exam</button>
            `}
          </div>
        </div>

        <div class="exam-sidebar">
          <div class="card">
            <h4 class="mb-md">Questions</h4>
            <div class="question-grid">
              ${this.questions.map((_, i) => `
                <div class="question-grid-item ${this.answers[this.questions[i].id] !== undefined ? 'answered' : ''} ${i === this.currentIndex ? 'current' : ''}"
                  onclick="ExamEngine.goTo(${i})">${i + 1}</div>
              `).join('')}
            </div>
            <p class="text-xs text-muted mt-md">
              ${Object.keys(this.answers).length}/${this.questions.length} answered
            </p>
            <button class="btn btn-danger btn-sm mt-md" style="width:100%" onclick="ExamEngine.confirmSubmit()">Submit Exam</button>
          </div>
        </div>
      </div>
    `;
  },

  renderOptions(q) {
    const currentAnswer = this.answers[q.id];

    if (q.type === 'true-false') {
      return `<div class="tf-options">
        <div class="tf-btn ${currentAnswer === true ? 'selected' : ''}" onclick="ExamEngine.answer('${q.id}', true)">True</div>
        <div class="tf-btn ${currentAnswer === false ? 'selected' : ''}" onclick="ExamEngine.answer('${q.id}', false)">False</div>
      </div>`;
    }

    if (q.type === 'multi-select') {
      const selected = currentAnswer || [];
      return `<div class="options-list">
        ${q.options.map((opt, i) => `
          <div class="option-item multi-select ${selected.includes(i) ? 'selected' : ''}"
            onclick="ExamEngine.answerMulti('${q.id}', ${i})">
            <div class="option-marker">${selected.includes(i) ? '&#10003;' : ''}</div>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>`;
    }

    return `<div class="options-list">
      ${q.options.map((opt, i) => `
        <div class="option-item ${currentAnswer === i ? 'selected' : ''}"
          onclick="ExamEngine.answer('${q.id}', ${i})">
          <div class="option-marker">${String.fromCharCode(65 + i)}</div>
          <span>${opt}</span>
        </div>
      `).join('')}
    </div>`;
  },

  answer(qId, value) {
    this.answers[qId] = value;
    this.renderExam();
  },

  answerMulti(qId, optIndex) {
    if (!this.answers[qId]) this.answers[qId] = [];
    const arr = [...this.answers[qId]];
    const idx = arr.indexOf(optIndex);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(optIndex);
    this.answers[qId] = arr;
    this.renderExam();
  },

  prev() {
    if (this.currentIndex > 0) { this.currentIndex--; this.renderExam(); }
  },

  next() {
    if (this.currentIndex < this.questions.length - 1) { this.currentIndex++; this.renderExam(); }
  },

  goTo(index) {
    this.currentIndex = index;
    this.renderExam();
  },

  confirmSubmit() {
    const unanswered = this.questions.length - Object.keys(this.answers).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    this.submit();
  },

  submit() {
    clearInterval(this.timerInterval);
    this.state = 'complete';
    const timeUsed = this.timeLimit - this.timeRemaining;

    let correct = 0;
    for (const q of this.questions) {
      const ua = this.answers[q.id];
      if (q.type === 'true-false') {
        if (ua === q.correct) correct++;
      } else if (q.type === 'multi-select') {
        const a = (ua || []).sort();
        const b = [...q.correct].sort();
        if (a.length === b.length && a.every((v, i) => v === b[i])) correct++;
      } else {
        if (ua === q.correct) correct++;
      }
    }

    const total = this.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percentage >= (this.examData.passingScore || 70);

    Store.saveExamResult({
      examId: this.examData.id,
      score: correct,
      total,
      percentage,
      passed,
      timeUsed,
      answers: this.answers
    });

    const c = DOM.$('#exam-container');
    if (!c) return;

    c.innerHTML = `
      <div class="quiz-results card">
        <h2>Exam Complete!</h2>
        <div class="results-score">
          <div class="score-circle ${passed ? 'pass' : 'fail'}">
            <div class="score-value">${percentage}%</div>
            <div class="score-label">${passed ? 'PASSED' : 'FAILED'}</div>
          </div>
        </div>
        <div class="results-breakdown">
          <div class="stat-card">
            <div class="stat-value">${correct}/${total}</div>
            <div class="stat-label">Correct</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${TimeUtils.formatDuration(timeUsed)}</div>
            <div class="stat-label">Time Used</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.examData.passingScore}%</div>
            <div class="stat-label">Required</div>
          </div>
        </div>
        <div class="results-actions">
          <button class="btn btn-primary" onclick="QuizEngine.questions = ExamEngine.questions; QuizEngine.answers = ExamEngine.answers; QuizEngine.quizData = ExamEngine.examData; QuizEngine.containerId = '#exam-container'; QuizEngine.showReview()">Review Answers</button>
          <a href="exam.html" class="btn btn-secondary">Back to Exams</a>
        </div>
      </div>
    `;
  }
};

/* ============================================
   EXAM PAGE (wrapper)
   ============================================ */

const ExamPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const examId = Router.getParam('exam');

    if (!examId) {
      this.renderExamList(container);
      return;
    }

    const exam = await Data.getExam(examId);
    if (!exam) {
      container.innerHTML = '<div class="empty-state"><p>Exam not found.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Dashboard</a>
        <span class="separator">/</span>
        <a href="exam.html">Exams</a>
        <span class="separator">/</span>
        <span>${exam.title}</span>
      </div>
      <div id="exam-container"></div>
    `;

    ExamEngine.init(exam);
  },

  async renderExamList(container) {
    const data = await Data.getExams();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Exams</h1>
        <p class="page-subtitle">Test your comprehensive knowledge</p>
      </div>
      <div class="grid-2">
        ${data && data.exams ? data.exams.map(exam => {
          const results = Store.getExamResults().filter(r => r.examId === exam.id);
          const bestResult = results.length > 0 ? results.reduce((a, b) => a.percentage > b.percentage ? a : b) : null;

          return `
            <div class="card card-clickable" onclick="location.href='${Router.buildUrl('exam.html', { exam: exam.id })}'">
              <h3>${exam.title}</h3>
              <p class="text-sm text-muted mt-sm">${exam.description || ''}</p>
              <div class="flex gap-md mt-md text-xs text-muted">
                <span>${exam.questionCount} questions</span>
                <span>${TimeUtils.formatDuration(exam.timeLimit)}</span>
                <span>Pass: ${exam.passingScore}%</span>
              </div>
              ${bestResult ? `
                <div class="mt-md">
                  <span class="badge ${bestResult.passed ? 'badge-success' : 'badge-danger'}">
                    Best: ${bestResult.percentage}% (${bestResult.passed ? 'Passed' : 'Failed'})
                  </span>
                </div>
              ` : '<div class="mt-md"><span class="badge badge-neutral">Not attempted</span></div>'}
            </div>
          `;
        }).join('') : '<div class="empty-state"><p>No exams available.</p></div>'}
      </div>
    `;
  }
};
