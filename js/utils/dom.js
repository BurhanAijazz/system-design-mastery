/* ============================================
   DOM UTILITIES
   ============================================ */

const DOM = {
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.assign(element.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    for (const child of Array.isArray(children) ? children : [children]) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
    return element;
  },

  html(target, content) {
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    if (target) {
      target.innerHTML = content;
    }
  },

  on(el, event, handler, options) {
    if (typeof el === 'string') {
      el = document.querySelector(el);
    }
    if (el) {
      el.addEventListener(event, handler, options);
    }
  },

  delegate(parent, event, selector, handler) {
    if (typeof parent === 'string') {
      parent = document.querySelector(parent);
    }
    if (parent) {
      parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
          handler.call(target, e, target);
        }
      });
    }
  },

  show(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.style.display = '';
  },

  hide(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.style.display = 'none';
  },

  toggle(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  },

  empty(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (el) el.innerHTML = '';
  },

  ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
};
