/* ============================================
   INTERVIEW PREP PAGE MODULE
   ============================================ */

const InterviewPage = {
  async init() {
    const container = DOM.$('#page-content');
    if (!container) return;

    const data = await Data.getInterviewPrep();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Interview Prep</h1>
        <p class="page-subtitle">Frameworks, checklists, and practice</p>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="dersc" onclick="InterviewPage.switchTab('dersc')">DERSC (HLD)</button>
        <button class="tab" data-tab="lld6step" onclick="InterviewPage.switchTab('lld6step')">6-Step (LLD)</button>
        <button class="tab" data-tab="checklists" onclick="InterviewPage.switchTab('checklists')">Checklists</button>
        <button class="tab" data-tab="antipatterns" onclick="InterviewPage.switchTab('antipatterns')">Anti-Patterns</button>
        <button class="tab" data-tab="cheatsheets" onclick="InterviewPage.switchTab('cheatsheets')">Cheat Sheets</button>
        <button class="tab" data-tab="random" onclick="InterviewPage.switchTab('random')">Random Q</button>
      </div>

      <div class="tab-panel active" id="panel-dersc">
        ${data ? this.renderFramework(data.frameworks.dersc) : '<p>Loading...</p>'}
      </div>

      <div class="tab-panel" id="panel-lld6step">
        ${data ? this.renderFramework(data.frameworks.lld6step) : '<p>Loading...</p>'}
      </div>

      <div class="tab-panel" id="panel-checklists">
        ${data ? this.renderChecklists(data.checklists) : '<p>Loading...</p>'}
      </div>

      <div class="tab-panel" id="panel-antipatterns">
        ${data ? this.renderAntiPatterns(data.antiPatterns) : '<p>Loading...</p>'}
      </div>

      <div class="tab-panel" id="panel-cheatsheets">
        ${data ? this.renderCheatSheets(data.cheatSheets) : '<p>Loading...</p>'}
      </div>

      <div class="tab-panel" id="panel-random">
        <div id="random-q-container">
          <button class="btn btn-primary btn-lg" onclick="InterviewPage.generateRandom()">
            Generate Random Question
          </button>
        </div>
      </div>
    `;
  },

  renderFramework(fw) {
    if (!fw) return '<p>Not available.</p>';
    return `
      <div class="card mb-lg">
        <h2>${fw.title}</h2>
        <div class="framework-steps mt-lg">
          ${fw.steps.map((step, i) => `
            <div class="framework-step">
              <div class="step-number">${i + 1}</div>
              <div class="step-content">
                <h4>${step.name}</h4>
                <span class="step-time">${step.time || ''}</span>
                <p class="text-sm text-muted mt-sm">${step.description || ''}</p>
                ${step.tips && step.tips.length > 0 ? `
                  <ul class="mt-sm" style="padding-left: var(--space-md)">
                    ${step.tips.map(t => `<li class="text-sm" style="list-style:disc">${t}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderChecklists(checklists) {
    if (!checklists) return '<p>Not available.</p>';
    let html = '';
    for (const [key, items] of Object.entries(checklists)) {
      html += `
        <div class="card mb-lg checklist-section">
          <h3>${key.toUpperCase()} Interview Checklist</h3>
          <div class="mt-md">
            ${items.map((item, i) => `
              <div class="checkbox-item">
                <input type="checkbox" id="cl-${key}-${i}">
                <label for="cl-${key}-${i}">${item}</label>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    return html;
  },

  renderAntiPatterns(patterns) {
    if (!patterns || patterns.length === 0) return '<p>Not available.</p>';
    return patterns.map(p => `
      <div class="card mb-md" style="border-left: 4px solid var(--danger)">
        <h4 style="color: var(--danger)">${p.name}</h4>
        <p class="text-sm text-muted mt-sm">${p.description}</p>
        ${p.fix ? `<p class="text-sm mt-sm"><strong>Fix:</strong> ${p.fix}</p>` : ''}
      </div>
    `).join('');
  },

  renderCheatSheets(sheets) {
    if (!sheets) return '<p>Not available.</p>';
    let html = '';
    for (const [key, data] of Object.entries(sheets)) {
      html += `<div class="card mb-lg">
        <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</h3>
        <div class="mt-md">`;
      if (typeof data === 'object') {
        for (const [k, v] of Object.entries(data)) {
          html += `<div class="flex justify-between items-center" style="padding: var(--space-xs) 0; border-bottom: 1px solid var(--border-light)">
            <span class="text-sm font-medium">${k}</span>
            <span class="text-sm text-muted">${v}</span>
          </div>`;
        }
      }
      html += '</div></div>';
    }
    return html;
  },

  async generateRandom() {
    const container = DOM.$('#random-q-container');
    if (!container) return;

    // Pull from all quiz pools
    let allQuestions = [];
    for (const courseId of ['lld', 'hld']) {
      const quizData = await Data.getQuizzes(courseId);
      if (quizData) {
        for (const quiz of quizData.quizzes) {
          allQuestions = allQuestions.concat(quiz.questions);
        }
      }
    }

    if (allQuestions.length === 0) {
      container.innerHTML = '<p>No questions available.</p>';
      return;
    }

    const q = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    container.innerHTML = `
      <div class="question-card">
        <div class="question-text">${q.question}</div>
        ${q.code ? `<div class="question-code">${CodeHighlight.wrapCodeBlock(q.code)}</div>` : ''}
        <div class="mt-lg">
          <button class="btn btn-secondary" onclick="DOM.$('#random-answer').style.display='block'">Show Answer</button>
        </div>
        <div id="random-answer" style="display:none" class="mt-md">
          <div class="explanation visible">
            <strong>Answer:</strong>
            ${q.type === 'mcq' ? q.options[q.correct] :
              q.type === 'true-false' ? String(q.correct) :
              q.correct.map(i => q.options[i]).join(', ')}
            <br><br>${q.explanation || ''}
          </div>
        </div>
      </div>
      <button class="btn btn-primary mt-lg" onclick="InterviewPage.generateRandom()">
        Next Random Question &#8594;
      </button>
    `;
  },

  switchTab(tabName) {
    DOM.$$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    DOM.$$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tabName}`));
  }
};
