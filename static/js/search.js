/* search.js — Command Palette para o blog
 *
 * Atalhos:
 *   Cmd+K / Ctrl+K — abre/fecha o modal
 *   /              — abre (somente fora de campos de texto)
 *   Escape         — fecha
 *
 * Dependências carregadas sob demanda (geradas pelo Zola):
 *   elasticlunr.min.js — biblioteca de busca
 *   search_index.en.js — define window.searchIndex (JSON serializado)
 */
(function () {
  'use strict';

  console.log('[search] Search script loaded');

  /* BASE_URL é injetada no <head> pelo base.html com | safe para evitar
   * que o Tera HTML-escape '/' → '&#x2F;' dentro da tag <script>.
   *
   * Normalização: remove barras finais extras e garante exatamente uma.
   * Usa new URL() para construção de caminhos — nunca concatenação de strings. */
  var baseUrl = (function () {
    /* window.BASE_URL é injetado pelo base.html com | safe */
    var raw = (typeof window.BASE_URL !== 'undefined')
      ? window.BASE_URL
      : window.location.origin + '/';
    /* strip trailing slashes, add exactly one */
    return raw.replace(/\/+$/, '') + '/';
  }());

  console.log('[search] BASE_URL normalizada:', baseUrl);

  var modal      = null;
  var inputEl    = null;
  var resultsEl  = null;
  var indexReady = false;
  var searchIdx  = null;

  /* ── Utilitários ─────────────────────────────────────────── */

  function esc(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  function loadScript(absoluteUrl) {
    return new Promise(function (resolve, reject) {
      var s     = document.createElement('script');
      s.src     = absoluteUrl;
      s.onload  = resolve;
      s.onerror = function () { reject(new Error('Erro ao carregar: ' + absoluteUrl)); };
      document.head.appendChild(s);
    });
  }

  /* ── Índice de busca ─────────────────────────────────────── */

  async function ensureIndex() {
    if (indexReady) return;
    try {
      /* new URL() resolve o caminho em relação à raiz do site,
       * ignorando em qual sub-página o visitante está */
      var elasticlunrUrl = new URL('elasticlunr.min.js', baseUrl).href;
      var searchIndexUrl = new URL('search_index.en.js',  baseUrl).href;

      console.log('[search] Carregando:', elasticlunrUrl);
      await loadScript(elasticlunrUrl);
      console.log('[search] elasticlunr.min.js OK');

      console.log('[search] Carregando:', searchIndexUrl);
      await loadScript(searchIndexUrl);
      console.log('[search] search_index.en.js OK');

      if (typeof window.elasticlunr !== 'function' && typeof window.elasticlunr !== 'object') {
        throw new Error('elasticlunr não definido após carregamento');
      }
      if (typeof window.searchIndex === 'undefined') {
        throw new Error('window.searchIndex não definido após carregamento');
      }

      /* window.searchIndex é JSON serializado — precisa ser carregado
       * no elasticlunr para criar o objeto com .search() */
      searchIdx  = window.elasticlunr.Index.load(window.searchIndex);
      indexReady = true;
      console.log('[search] Search index loaded successfully —',
        Object.keys(searchIdx.documentStore.docs).length, 'docs');

    } catch (e) {
      console.error('[search] Search index failed to load:', e.message);
    }
  }

  /* ── Modal ───────────────────────────────────────────────── */

  function openModal() {
    if (!modal) {
      console.warn('[search] openModal: #search-modal não encontrado');
      return;
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (inputEl) inputEl.focus();
    ensureIndex();
  }

  /* Expõe para uso via onclick no navbar */
  window.openSearchModal = openModal;

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    if (inputEl)   inputEl.value       = '';
    if (resultsEl) resultsEl.innerHTML = '';
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
      fields: { title: { boost: 2 }, body: { boost: 1 } },
      expand: true,
      bool:   'OR',
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
      /* subtítulo: path relativo para exibição */
      var sub   = hit.ref.replace(baseUrl, '/').replace(/\/+$/, '') || hit.ref;

      return (
        '<a href="' + esc(hit.ref) + '"' +
        ' onclick="(function(){document.getElementById(\'search-modal\').classList.add(\'hidden\');})()"' +
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
  /* Quando o script está no final do <body>, DOMContentLoaded pode já ter
   * disparado. Verificamos readyState para evitar o callback nunca executar. */

  function init() {
    modal     = document.getElementById('search-modal');
    inputEl   = document.getElementById('search-input');
    resultsEl = document.getElementById('search-results');

    if (!modal) {
      console.warn('[search] #search-modal não encontrado no DOM');
      return;
    }
    console.log('[search] DOM pronto, modal encontrado');

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

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    var closeBtn = document.getElementById('search-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (inputEl) {
      var timer;
      inputEl.addEventListener('input', function () {
        clearTimeout(timer);
        var q = this.value.trim();
        timer = setTimeout(function () { doSearch(q); }, 120);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
