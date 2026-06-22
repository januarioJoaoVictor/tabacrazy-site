/* ═══════════════════════════════════════════════════
   TABACRAZY · main.js
   IIFEs: loader · burger · footerYear · venueStatus · scrollReveal
   (O jogo "Tabacrazy Flap" + ranking ficam em js/game.js — seção #jogo do index.)
   ═══════════════════════════════════════════════════ */
'use strict';

/* ── § LOADER ─────────────────────────────────────── */
(function loader() {
  const el     = document.getElementById('loader');
  const video  = document.getElementById('loader-video');
  if (!el || !video) return;

  document.body.classList.add('loader-active');

  const VIDEO_DURATION = 1500;  // corta o vídeo em 1.5s
  const GLITCH_DURATION = 450;  // duração do efeito glitch
  let dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    // dispara o glitch
    el.classList.add('glitch-out');

    // ao fim do glitch, remove o loader
    setTimeout(() => {
      document.body.classList.remove('loader-active');
      el.remove();
    }, GLITCH_DURATION);
  }

  // corta o vídeo em 3s independente da duração real
  const cutTimer = setTimeout(dismiss, VIDEO_DURATION);

  // se o vídeo acabar antes dos 3s, sai junto
  video.addEventListener('ended', () => {
    clearTimeout(cutTimer);
    dismiss();
  }, { once: true });

  // fallback: erro de carregamento
  video.addEventListener('error', () => {
    clearTimeout(cutTimer);
    dismiss();
  }, { once: true });

  // hard-stop de segurança
  setTimeout(dismiss, 5000);
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
  var armed = false;
  function ligar() { if (armed) return; armed = true; el.classList.add('lit'); }

  // dispara a ignição quando a Hero entra na viewport (1x por carregamento)
  function arm() {
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

  // IMPORTANTE: só acende DEPOIS que o loader de intro sair — senão a
  // ignição (~1,8s) acontece atrás do loader e a pessoa só vê "já aceso".
  function loaderGone() {
    return !document.getElementById('loader') &&
           !document.body.classList.contains('loader-active');
  }
  if (loaderGone()) {
    setTimeout(arm, 300);                 // pequeno respiro pra ver a palavra apagada
  } else {
    var iv = setInterval(function () {
      if (loaderGone()) { clearInterval(iv); setTimeout(arm, 300); }
    }, 100);
    setTimeout(function () { clearInterval(iv); arm(); }, 6000); // hard-stop
  }
})();
