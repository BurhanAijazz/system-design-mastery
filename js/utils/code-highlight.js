/* ============================================
   PYTHON SYNTAX HIGHLIGHTER (Regex-based)
   ============================================ */

const CodeHighlight = {
  highlight(code, lang = 'python') {
    if (lang !== 'python') return this.escapeHtml(code);
    return this.highlightPython(code);
  },

  highlightPython(code) {
    let html = this.escapeHtml(code);

    // Order matters: comments and strings first (so they don't get re-highlighted)
    const tokens = [];
    let id = 0;

    // Extract docstrings (triple quotes)
    html = html.replace(/(&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, (m) => {
      const key = `__TOK${id++}__`;
      tokens.push({ key, html: `<span class="hljs-docstring">${m}</span>` });
      return key;
    });

    // Extract comments
    html = html.replace(/(#[^\n]*)/g, (m) => {
      const key = `__TOK${id++}__`;
      tokens.push({ key, html: `<span class="hljs-comment">${m}</span>` });
      return key;
    });

    // Extract strings (single and double, including f-strings)
    html = html.replace(/(f?(?:&#39;(?:[^&#]|&#39;(?!&#39;))*?&#39;|&quot;(?:[^&]|&quot;(?!&quot;))*?&quot;))/g, (m) => {
      if (m.startsWith('f')) {
        const key = `__TOK${id++}__`;
        tokens.push({ key, html: `<span class="hljs-fstring">${m}</span>` });
        return key;
      }
      const key = `__TOK${id++}__`;
      tokens.push({ key, html: `<span class="hljs-string">${m}</span>` });
      return key;
    });

    // Decorators
    html = html.replace(/(@\w+)/g, '<span class="hljs-decorator">$1</span>');

    // Keywords
    const keywords = [
      'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import',
      'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield',
      'lambda', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'in',
      'async', 'await', 'global', 'nonlocal', 'assert', 'del'
    ];
    const kwPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    html = html.replace(kwPattern, '<span class="hljs-keyword">$1</span>');

    // Built-ins
    const builtins = [
      'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted',
      'list', 'dict', 'set', 'tuple', 'int', 'str', 'float', 'bool', 'type',
      'isinstance', 'issubclass', 'super', 'property', 'staticmethod',
      'classmethod', 'abstractmethod', 'dataclass', 'input', 'open',
      'hasattr', 'getattr', 'setattr', 'min', 'max', 'sum', 'abs', 'any', 'all'
    ];
    const biPattern = new RegExp(`\\b(${builtins.join('|')})(?=\\()`, 'g');
    html = html.replace(biPattern, '<span class="hljs-built_in">$1</span>');

    // self
    html = html.replace(/\b(self)\b/g, '<span class="hljs-self">$1</span>');

    // None, True, False
    html = html.replace(/\b(None)\b/g, '<span class="hljs-none">$1</span>');
    html = html.replace(/\b(True|False)\b/g, '<span class="hljs-bool">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/g, '<span class="hljs-number">$1</span>');

    // Function definitions
    html = html.replace(
      /(<span class="hljs-keyword">def<\/span>\s+)(\w+)/g,
      '$1<span class="hljs-function">$2</span>'
    );

    // Class definitions
    html = html.replace(
      /(<span class="hljs-keyword">class<\/span>\s+)(\w+)/g,
      '$1<span class="hljs-class">$2</span>'
    );

    // Operators
    html = html.replace(/([+\-*/%=&|^~<>!]+)/g, (m) => {
      // Don't wrap if inside an existing span
      return `<span class="hljs-operator">${m}</span>`;
    });

    // Restore extracted tokens
    for (const { key, html: tokenHtml } of tokens) {
      html = html.replace(key, tokenHtml);
    }

    return html;
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  highlightAll(container = document) {
    const blocks = container.querySelectorAll('pre code');
    blocks.forEach(block => {
      const lang = block.className.replace('language-', '') || 'python';
      block.innerHTML = this.highlight(block.textContent, lang);
    });
  },

  wrapCodeBlock(code, lang = 'python') {
    const highlighted = this.highlight(code, lang);
    return `
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">${lang}</span>
          <button class="copy-btn" onclick="CodeHighlight.copyCode(this)">Copy</button>
        </div>
        <pre><code>${highlighted}</code></pre>
      </div>
    `;
  },

  copyCode(btn) {
    const code = btn.closest('.code-block').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }
};
