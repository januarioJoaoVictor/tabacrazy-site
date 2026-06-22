/* ═══════════════════════════════════════════════════
   TABACRAZY · supabase.js — client SINGLETON no browser
   ───────────────────────────────────────────────────
   Padrão p/ site estático (sem build, sem @supabase/ssr):
   - lê a config de window.TABACRAZY_ENV (js/env.js, carregado antes);
   - carrega o supabase-js (build UMD via CDN) UMA vez, sob demanda;
   - cacheia e devolve sempre a MESMA instância (singleton).

   Uso em qualquer script clássico:
     const supa = await window.Supa.getClient();
     if (supa) { const { data, error } = await supa.from('...').select(); }
   getClient() devolve null se faltar config (sem "client undefined").
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var env = window.TABACRAZY_ENV || {};
  var URL = env.SUPABASE_URL || '';
  var KEY = env.SUPABASE_ANON_KEY || '';

  var _client = null;       // instância cacheada (singleton)
  var _libPromise = null;   // carregamento da lib UMD (uma vez só)
  var _clientPromise = null;

  function isConfigured() { return !!(URL && KEY); }

  function loadLib() {
    if (window.supabase) return Promise.resolve(window.supabase);
    if (_libPromise) return _libPromise;
    _libPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async = true;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error('Supabase: lib carregou sem createClient.'));
      };
      s.onerror = function () { reject(new Error('Supabase: falha ao carregar a lib (rede/CDN).')); };
      document.head.appendChild(s);
    });
    return _libPromise;
  }

  /* Retorna o client singleton (Promise<client|null>). */
  function getClient() {
    if (_client) return Promise.resolve(_client);
    if (!isConfigured()) {
      console.warn('[Supabase] sem config em window.TABACRAZY_ENV — operando sem backend (fallback local).');
      return Promise.resolve(null);
    }
    if (_clientPromise) return _clientPromise;
    _clientPromise = loadLib().then(function (lib) {
      if (!_client) _client = lib.createClient(URL, KEY);
      return _client;
    }).catch(function (e) {
      console.error('[Supabase] não foi possível criar o client:', e.message);
      _clientPromise = null; // permite nova tentativa depois
      return null;
    });
    return _clientPromise;
  }

  window.Supa = {
    getClient: getClient,
    isConfigured: isConfigured,
    url: URL
  };
})();
