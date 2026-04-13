/* search.js — Command Palette para o blog
 *
 * Atalhos:
 *   Cmd+K / Ctrl+K — abre/fecha o modal
 *   /              — abre (somente fora de campos de texto)
 *   Escape         — fecha
 *
 * Dependências carregadas sob demanda:
 *   elasticlunr.min.js  — biblioteca de busca (gerada pelo Zola)
 *   search_index.en.js  — índice do site       (gerado pelo Zola)
 */
(function () {
  'use strict';

  /* BASE_URL é injetada no <head> pelo base.html como var global */
  var baseUrl = (typeof BASE_URL !== 'undefined') ? BASE_URL : '/';

  var modal      = null;
  var inputEl    = null;
  var resultsEl  = null;
  var indexReady = false;
  var searchIdx  = null;

  /* ── Utilitários ─────────────────────────────────────────── */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s    = document.createElement('script');
      s.src    = src;
      s.onload  = resolve;
      s.onerror = function () { reject(new Error('Erro ao carregar: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ── Índice de busca ─────────────────────────────────────── */

  async function ensureIndex() {
    if (indexReady) return;
    try {
      await loadScript(baseUrl + 'elasticlunr.min.js');
      await loadScript(baseUrl + 'search_index.en.js');
      /* Zola 0.14 expõe o índice como `window.searchIndex` */
      searchIdx  = window.searchIndex;
      indexReady = true;
    } catch (e) {
      console.warn('[search] Índice não carregado:', e.message);
    }
  }

  /* ── Modal ───────────────────────────────────────────────── */

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (inputEl) inputEl.focus();
    ensureIndex();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    if (inputEl)   inputEl.value        = '';
    if (resultsEl) resultsEl.innerHTML  = '';
  }

  function isOpen() {
    return modal && !modal.classList.contains('hidden');
  }

  /* ── Busca e renderização ────────────────────────────────── */

  function doSearch(query) {
    if (!resultsEl) return;
    if (!query || !searchIdx) {
      resultsEl.innerHTML = '';
      return;
    }

    var hits = searchIdx.search(query, {
      fields:  { title: { boost: 2 }, body: { boost: 1 } },
      expand:  true,
      bool:    'OR',
    });

    if (!hits.length) {
      resultsEl.innerHTML =
        '<p class="px-4 py-3 font-code text-xs text-clay-tan/40">' +
        '// SEM_RESULTADOS &gt; "' + esc(query) + '"' +
        '</p>';
      return;
    }

    resultsEl.innerHTML = hits.slice(0, 8).map(function (hit) {
      var doc   = hit.doc  || {};
      var title = doc.title || hit.ref;
      /* exibe o path relativo como subtítulo */
      var sub   = hit.ref.replace(baseUrl, '/').replace(/\/$/, '') || hit.ref;

      return (
        '<a href="' + esc(hit.ref) + '" onclick="(function(){' +
          'document.getElementById(\'search-modal\').classList.add(\'hidden\');' +
        '})()"' +
        ' class="flex flex-col gap-0.5 px-4 py-2.5' +
          ' border-b border-rust-copper/20 last:border-0' +
          ' hover:bg-steel-blue transition-colors duration-100">' +
          '<span class="font-heading text-sm text-clay-tan uppercase tracking-wide leading-tight">' +
            esc(title) +
          '</span>' +
          '<span class="font-code text-xs text-aqua-neon/60">' +
            esc(sub) +
          '</span>' +
        '</a>'
      );
    }).join('');
  }

  /* ── Inicialização ───────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    modal     = document.getElementById('search-modal');
    inputEl   = document.getElementById('search-input');
    resultsEl = document.getElementById('search-results');

    /* Atalhos de teclado globais */
    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement ? document.activeElement.tagName : '';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen() ? closeModal() : openModal();
        return;
      }

      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        openModal();
        return;
      }

      if (e.key === 'Escape') {
        closeModal();
      }
    });

    /* Fechar ao clicar no backdrop */
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    /* Botão [ESC] dentro do modal */
    var closeBtn = document.getElementById('search-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    /* Input de busca com debounce leve */
    if (inputEl) {
      var timer;
      inputEl.addEventListener('input', function () {
        clearTimeout(timer);
        var q = this.value.trim();
        timer = setTimeout(function () { doSearch(q); }, 120);
      });
    }
  });

})();
