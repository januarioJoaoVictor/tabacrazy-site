/* ═══════════════════════════════════════════════════
   TABACRAZY · main.js
   IIFEs: loader · burger · footerYear · venueStatus · scrollReveal
   (O jogo "Tabacrazy Flap" + ranking ficam em js/game.js — seção #jogo do index.)
   ═══════════════════════════════════════════════════ */
'use strict';

/* ── § LOADER ─────────────────────────────────────── */
(function loader() {
  const el    = document.getElementById('loader');
  const video = document.getElementById('loader-video');
  if (!el) return;

  document.body.classList.add('loader-active');

  const GLITCH_DURATION = 450;
  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    el.classList.add('glitch-out');
    setTimeout(() => {
      document.body.classList.remove('loader-active');
      el.remove();
    }, GLITCH_DURATION);
  }

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (!isMobile && video && video.dataset.src) {
    // DESKTOP: promove o vídeo (data-src → src), toca e sai ao terminar.
    // (No mobile NÃO setamos src → o webm de 3,6MB não é baixado.)
    video.src = video.dataset.src;
    const pr = video.play();
    if (pr && pr.catch) pr.catch(() => {});      // ignora bloqueio de autoplay
    video.addEventListener('ended', dismiss, { once: true });  // agora dispara (sem loop)
    video.addEventListener('error', dismiss, { once: true });
    setTimeout(dismiss, 1800);                   // corta o intro curto
  } else {
    // MOBILE: só PNG estático — entrada CSS (.6s) + pausa, e sai em 1,8s
    // (fade out de .4s → total ~2,2s, sem depender de nenhum evento de vídeo)
    setTimeout(dismiss, 1800);
  }

  // timeout MÁXIMO de segurança — nunca deixa o usuário preso no loader
  setTimeout(dismiss, 4000);
})();

/* ── § HERO VIDEO (promove só no desktop; mobile usa PNG) ── */
(function heroVideo() {
  const v = document.querySelector('.hero__video');
  if (!v || !v.dataset.src) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;  // mobile → PNG (CSS)
  v.src = v.dataset.src;                                        // desktop carrega o webm
})();

/* ── § BURGER ─────────────────────────────────────── */
(function burger() {
  const btn     = document.querySelector('.burger');
  const navlist = document.getElementById('navlist');
  if (!btn || !navlist) return;

  const open = () => {
    navlist.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    navlist.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () =>
    navlist.classList.contains('open') ? close() : open()
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navlist.classList.contains('open')) close();
  });

  document.addEventListener('click', e => {
    if (!navlist.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close();
  });

  navlist.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();


/* ── § FOOTER YEAR ────────────────────────────────── */
(function footerYear() {
  const el = document.getElementById('ano');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ── § VENUE STATUS ───────────────────────────────── */
(function venueStatus() {
  const el = document.getElementById('vstatus');
  if (!el) return;

  // Horário BRT: Seg–Sáb 13h às 01h (dia seguinte)
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
  const day = now.getDay();   // 0=Dom, 1=Seg … 6=Sáb
  const h   = now.getHours();

  // Aberto se:
  // — Seg-Sáb (1-6), hora ≥ 13h          → turno da tarde/noite
  // — 00:xx de qualquer dia exceto Seg    → madrugada do turno anterior
  //   (Seg 00:xx seria Dom→Seg, mas Dom não abre)
  const isOpen =
    (day >= 1 && day <= 6 && h >= 13) ||
    (h < 1 && day !== 1);

  el.className   = 'venue__status ' + (isOpen ? 'open' : 'closed');
  el.textContent = isOpen ? 'Aberto agora' : 'Fechado agora';
})();


/* ── § SCROLL REVEAL ──────────────────────────────── */
(function scrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Usa "translate" (individual transform) para não conflitar com
  // o "transform: rotate()" dos stickers .sk
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      translate: 0 28px;
      transition: opacity .6s cubic-bezier(.22,1,.36,1),
                  translate .6s cubic-bezier(.22,1,.36,1);
    }
    .reveal.in {
      opacity: 1;
      translate: 0 0;
    }
  `;
  document.head.appendChild(style);

 const els = document.querySelectorAll(
  '.rolecard, .arscard, .ars3d, .mural-sticker, .manifesto, .venue__col, .venue__map, .cons-card, .cons-feature, .cons-head, .vitrine__head, .band-head, .drop-card, .promo-card, .kit-card, .adega__head, .adega-card, .role-intro__fig'
);

  els.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Stagger por posição horizontal para cards e stickers
            const delay = entry.target.classList.contains('rolecard') ||
              entry.target.classList.contains('mural-sticker') ||
              entry.target.classList.contains('cons-card') ||
              entry.target.classList.contains('drop-card') ||
              entry.target.classList.contains('promo-card') ||
              entry.target.classList.contains('kit-card') ||
              entry.target.classList.contains('adega-card')
  ? (Array.from(entry.target.parentElement.children).indexOf(entry.target) * 55) + 'ms'
  : '0ms';
      entry.target.style.transitionDelay = delay;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

  els.forEach(el => observer.observe(el));
})();


/* ── § HERO NEON (acende a palavra verde "MAIS LOUCA") ──
   Quebra a palavra em letras, dá delay incremental+aleatório e dispara
   a ignição (1x) quando a Hero entra na viewport. CSS faz o trabalho
   pesado (color/text-shadow/opacity); JS só monta os spans e o trigger. */
(function heroNeon() {
  var el = document.querySelector('.hero__title--neon');
  if (!el) return;
  // reduced-motion: mantém o neon estático (sem split, sem flicker)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var text = el.getAttribute('aria-label') || el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';

  var n = 0;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === ' ') { el.appendChild(document.createTextNode(' ')); continue; }
    var s = document.createElement('span');
    s.className = 'neon-flicker';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    s.style.setProperty('--d', (n * 90 + Math.floor(Math.random() * 60)) + 'ms');
    el.appendChild(s);
    n++;
  }

  var hero = document.getElementById('hero') || el;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var armed = false;
  function ligar() { if (armed) return; armed = true; el.classList.add('lit'); }

  function arm() {
    // MOBILE: a Hero já está visível ao entrar → acende JÁ (sem observer)
    if (isMobile) { ligar(); return; }
    // DESKTOP: dispara quando a Hero entra na viewport (1x por carregamento)
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          ligar();
          obs.disconnect();
        });
      }, { threshold: 0.1 });
      obs.observe(hero);
    } else {
      ligar();
    }
    setTimeout(ligar, 4000); // rede de segurança
  }

  // só acende DEPOIS que o loader de intro sair (senão a ignição roda atrás dele).
  // O efeito é só visual (letras inline) — não bloqueia scroll/clique.
  function loaderGone() {
    return !document.getElementById('loader') &&
           !document.body.classList.contains('loader-active');
  }
  var delay = isMobile ? 150 : 300;   // mobile: dispara quase imediato após o loader
  if (loaderGone()) {
    setTimeout(arm, delay);
  } else {
    var iv = setInterval(function () {
      if (loaderGone()) { clearInterval(iv); setTimeout(arm, delay); }
    }, 100);
    setTimeout(function () { clearInterval(iv); arm(); }, 6000); // hard-stop
  }
})();


/* ── § NAV SCROLL (esconde a navbar ao rolar; mantém o carrinho via FAB) ── */
(function navScroll() {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var fab = document.getElementById('cartFab');
  var lastY = window.scrollY || 0;
  var hidden = false;

  function setHidden(h) {
    if (h === hidden) return;
    hidden = h;
    document.body.classList.toggle('nav-hidden', h);
  }
  function onScroll() {
    var y = window.scrollY || 0;
    if (y <= 80) setHidden(false);              // topo: navbar sempre visível
    else if (y > lastY + 4) setHidden(true);    // rolando p/ baixo: esconde
    else if (y < lastY - 4) setHidden(false);   // rolando p/ cima: mostra
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // o carrinho flutuante abre o MESMO drawer do carrinho da navbar
  if (fab) {
    fab.addEventListener('click', function () {
      var btn = document.getElementById('cartBtn');
      if (btn) btn.click();
    });
  }
})();
