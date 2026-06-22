/* ═══════════════════════════════════════════════════
   TABACRAZY · game.js — Tabacrazy Flap (Flappy-like)
   Canvas 2D puro + leaderboard de temporada no Supabase
   (com fallback localStorage). Script CLÁSSICO (funciona via
   file:// e servidor), carregado na seção #jogo do index.html.
   ═══════════════════════════════════════════════════ */
'use strict';

/* Client Supabase: usa o SINGLETON compartilhado de js/supabase.js
   (window.Supa, carregado antes deste script). Sem config → null e o
   ranking cai no fallback localStorage. */
async function getSupa() {
  if (!window.Supa) return null;
  try { return await window.Supa.getClient(); }
  catch (e) { console.warn('[game] Supabase indisponível:', e.message); return null; }
}

const escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── § PLACAR (recorde pessoal — localStorage, síncrono) ── */
const Placar = (function () {
  const K_REC = 'tabacrazy_voa_recorde', K_NOME = 'tabacrazy_voa_nome';
  const _get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const _set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  return {
    getNome()  { return _get(K_NOME) || ''; },
    setNome(n) { _set(K_NOME, (n || '').trim().slice(0, 14)); },
    getRecorde() {
      const raw = _get(K_REC);
      if (!raw) return { nome: '', score: 0 };
      try { const o = JSON.parse(raw); return { nome: o.nome || '', score: o.score | 0 }; }
      catch { return { nome: '', score: 0 }; }
    },
    salvar(nome, score) {
      const atual = this.getRecorde();
      if (score > atual.score) {
        _set(K_REC, JSON.stringify({ nome: (nome || 'VISITANTE').slice(0, 14), score: score | 0, data: Date.now() }));
        return true;
      }
      return false;
    }
  };
})();

/* ── § LEADERBOARD (Supabase — temporada, assíncrono) ── */
const Leaderboard = {
  /* temporada "AAAA-MM" no fuso BRT → reset mensal sem apagar histórico */
  season() {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  },
  /* INSERT público (validado também no RLS). Retorna true se gravou. */
  async submit(nome, score) {
    const c = await getSupa(); if (!c) return false;
    nome = (nome || '').trim().slice(0, 14);
    score = score | 0;
    if (!nome || score < 0 || score >= 100000) return false;
    const { error } = await c.from('game_scores').insert({ nome, score, temporada: this.season() });
    return !error;
  },
  /* Top 10 da temporada — UMA linha por jogador (o melhor score dele).
     O banco guarda todas as partidas (histórico); a dedupe é só na exibição.
     null = Supabase indisponível (usar fallback). */
  async top10() {
    const c = await getSupa(); if (!c) return null;
    const { data, error } = await c.from('game_scores')
      .select('nome, score')
      .eq('temporada', this.season())
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(200); // lote maior pra sobrar nomes distintos após a dedupe
    if (error) return null;

    // como já vem ordenado por score desc, a 1ª ocorrência de cada nome é o melhor.
    // dedupe por nome normalizado (trim + maiúsculas) → "Polvão" e "POLVÃO" = mesma pessoa.
    const best = new Map();
    (data || []).forEach(function (r) {
      const key = (r.nome || '').trim().toUpperCase();
      if (!best.has(key)) best.set(key, r);
    });
    return Array.from(best.values()).slice(0, 10);
  }
};

/* ── § RENDER DO RANKING ── */
async function renderLeaderboard() {
  const list = document.getElementById('lb-list');
  const note = document.getElementById('lb-note');
  const seas = document.getElementById('lb-season');
  if (!list) return;
  if (seas) seas.textContent = 'Temporada ' + Leaderboard.season();

  let rows = await Leaderboard.top10();
  if (rows === null) {
    const r = Placar.getRecorde();
    rows = r.score > 0 ? [{ nome: r.nome || 'VOCÊ', score: r.score }] : [];
    if (note) note.textContent = 'Ranking local — Supabase não configurado ainda.';
  } else if (note) {
    note.textContent = '';
  }

  if (!rows.length) {
    list.innerHTML = '<li class="lb__empty">Seja o primeiro a pontuar! 🐙</li>';
    return;
  }
  list.innerHTML = rows.map((r, i) => {
    const rank = i < 3 ? ('lb__row--top' + (i + 1)) : 'lb__row--rest';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    return '<li class="lb__row ' + rank + '">' +
             '<span class="lb__pos">' + medal + '</span>' +
             '<span class="lb__name">' + escapeHtml(r.nome) + '</span>' +
             '<span class="lb__score">' + (r.score | 0) + '</span>' +
           '</li>';
  }).join('');
}

/* ── § JOGO ── */
(function tabacrazyFlap() {
  const canvas = document.getElementById('gc');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const overlay   = document.getElementById('gover');
  const scrStart  = document.getElementById('screen-start');
  const scrOver   = document.getElementById('screen-over');
  const inpName   = document.getElementById('pl-name');
  const btnStart  = document.getElementById('btn-start');
  const btnAgain  = document.getElementById('btn-again');
  const btnRename = document.getElementById('btn-rename');
  const elPts     = document.getElementById('g-pts');
  const elRec     = document.getElementById('g-rec');
  const recStart  = document.getElementById('rec-start');
  const recOver   = document.getElementById('rec-over');
  const overMedal = document.getElementById('over-medal');
  const overTitle = document.getElementById('over-title');
  const overSub   = document.getElementById('over-sub');

  const NEON = '#a8ff1f', PURPLE = '#9b2fe0', BG = '#0b0a0f';
  const BASE_W = 600, BASE_H = 360;   // referência de tuning

  /* W/H e tuning recalculados em fitCanvas() — tudo relativo a 600×360.
     Desktop: 600×360 fixo. Mobile: 100% largura × ~80vh (fica retrato). */
  let W = BASE_W, H = BASE_H, sx = 1, sy = 1, s = 1;
  let GRAVITY, FLAP, PIPE_SPEED0, PIPE_W, GAP0, GAP_MIN, SPACING, PLAYER_X, PLAYER_R;

  let player, pipes = [], score = 0, speed, gap, running = false, nextSpawnX;
  let rafId = null, lastTick = 0, scorePop = 0, deathFlash = 0, nome = '';
  let bg = [];

  function buildBg() {
    bg = [];
    for (let i = 0; i < 26; i++) {
      bg.push({ x: Math.random() * W, y: Math.random() * H,
                r: (Math.random() * 1.6 + .4) * s, s: (Math.random() * 16 + 6) * sx,
                c: Math.random() > .5 ? NEON : PURPLE });
    }
  }

  /* dimensiona o canvas e escala TODO o tuning/colisão proporcionalmente */
  function fitCanvas() {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (mobile) {
      const r = canvas.getBoundingClientRect();          // tamanho real (CSS: 100% × ~80vh)
      W = Math.max(240, Math.round(r.width));
      H = Math.max(320, Math.round(r.height));
    } else {
      W = BASE_W; H = BASE_H;
    }
    canvas.width = W; canvas.height = H;                  // buffer = tamanho de exibição
    sx = W / BASE_W; sy = H / BASE_H; s = (sx + sy) / 2;
    GRAVITY     = 1350 * sy;
    FLAP        = -380 * sy;
    PIPE_SPEED0 = 150  * sx;
    PIPE_W      = 62   * sx;
    GAP0        = 140  * sy;
    GAP_MIN     = 108  * sy;
    SPACING     = 230  * sx;
    PLAYER_X    = 140  * sx;
    PLAYER_R    = 17   * s;
    buildBg();
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const fmtNome = n => (n || '').toUpperCase().slice(0, 10) || '—';

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBg(dt) {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(168,255,31,.04)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    bg.forEach(p => {
      if (dt > 0) { p.x -= p.s * dt; if (p.x < -2) { p.x = W + 2; p.y = Math.random() * H; } }
      ctx.globalAlpha = .5; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawPipe(p) {
    const col = p.color, topH = p.gapY - p.gap / 2, botY = p.gapY + p.gap / 2;
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = col;
    ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.fillStyle = col + '14';
    roundRect(p.x, -6, PIPE_W, topH + 6, 8); ctx.fill(); ctx.stroke();
    roundRect(p.x - 4, topH - 16, PIPE_W + 8, 16, 6); ctx.fill(); ctx.stroke();
    roundRect(p.x, botY, PIPE_W, H - botY + 6, 8); ctx.fill(); ctx.stroke();
    roundRect(p.x - 4, botY, PIPE_W + 8, 16, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawPolvo(x, y, vy) {
    const tilt = Math.max(-.5, Math.min(.85, vy / 620));
    const t = performance.now() / 200;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);   // polvo proporcional ao canvas
    ctx.shadowBlur = 16; ctx.shadowColor = PURPLE;
    ctx.strokeStyle = PURPLE; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const off = -12 + i * 6, wob = Math.sin(t + i * .8) * 4;
      ctx.beginPath(); ctx.moveTo(off * .5, 8);
      ctx.quadraticCurveTo(off, 18 + wob, off, 26 + wob); ctx.stroke();
    }
    ctx.shadowBlur = 22; ctx.fillStyle = PURPLE;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = NEON; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6, -3, 5, 0, Math.PI * 2); ctx.arc(7, -3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BG;
    ctx.beginPath(); ctx.arc(-5, -3, 2.3, 0, Math.PI * 2); ctx.arc(8, -3, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.font = '700 ' + (54 * s) + 'px Anton, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const pop = 1 + scorePop * .3;
    ctx.translate(W / 2, 22 * sy); ctx.scale(pop, pop);
    ctx.shadowBlur = 18; ctx.shadowColor = NEON; ctx.fillStyle = NEON;
    ctx.fillText(score, 0, 0);
    ctx.restore();
  }

  function pintarRecorde() {
    const r = Placar.getRecorde();
    elPts.textContent = score;
    if (r.score > 0) {
      elRec.textContent = fmtNome(r.nome) + ' · ' + r.score;
      const html = '🏆 Seu recorde: <strong>' + escapeHtml(r.nome || 'VISITANTE') + '</strong> — ' + r.score + ' pts';
      recStart.innerHTML = html; recOver.innerHTML = html;
    } else {
      elRec.textContent = '—';
      recStart.textContent = 'Faça seu primeiro recorde!';
      recOver.textContent = '';
    }
  }

  function spawnPipe(x) {
    const margin = 46 * sy;
    const gapY = rand(margin + gap / 2, H - margin - gap / 2);
    pipes.push({ x, gapY, gap, color: Math.random() > .5 ? NEON : PURPLE, passed: false });
  }

  function rectHit(cx, cy, r, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }
  function hitPipe(cx, cy, r, p) {
    const topH = p.gapY - p.gap / 2, botY = p.gapY + p.gap / 2;
    return rectHit(cx, cy, r, p.x, -6, PIPE_W, topH + 6) ||
           rectHit(cx, cy, r, p.x, botY, PIPE_W, H - botY + 6);
  }

  function loop(ts) {
    if (!lastTick) lastTick = ts;
    const dt = Math.min((ts - lastTick) / 1000, 1 / 30);
    lastTick = ts;

    if (running) {
      player.vy += GRAVITY * dt;
      player.y  += player.vy * dt;
      if (player.y - PLAYER_R < 0) { player.y = PLAYER_R; player.vy = 0; }

      pipes.forEach(p => p.x -= speed * dt);
      nextSpawnX -= speed * dt;
      if (nextSpawnX <= 0) { spawnPipe(W + 10); nextSpawnX = SPACING; }
      pipes = pipes.filter(p => p.x + PIPE_W > -10);

      for (const p of pipes) {
        if (!p.passed && p.x + PIPE_W < player.x - PLAYER_R) {
          p.passed = true; score++; scorePop = 1;
          speed = PIPE_SPEED0 + score * 4 * sx;
          gap = Math.max(GAP_MIN, GAP0 - score * 1.5 * sy);
          pintarRecorde();
        }
        if (hitPipe(player.x, player.y, PLAYER_R, p)) { die(); break; }
      }
      if (running && player.y + PLAYER_R >= H) { player.y = H - PLAYER_R; die(); }
      if (scorePop > 0) scorePop = Math.max(0, scorePop - dt * 4);
    }

    drawBg(dt);
    pipes.forEach(drawPipe);
    ctx.strokeStyle = 'rgba(168,255,31,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
    if (player) drawPolvo(player.x, player.y, player.vy);
    if (running) drawScore();

    if (deathFlash > 0) {
      ctx.fillStyle = 'rgba(255,59,48,' + (deathFlash * .5) + ')';
      ctx.fillRect(0, 0, W, H);
      deathFlash = Math.max(0, deathFlash - dt * 3);
    }

    if (!running && deathFlash <= 0) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);
  }

  function novoJogo() {
    player = { x: PLAYER_X, y: H / 2, vy: FLAP * .6 };
    pipes = []; score = 0; speed = PIPE_SPEED0; gap = GAP0;
    nextSpawnX = SPACING * .8; scorePop = 0; deathFlash = 0; running = true;
    pintarRecorde();
    overlay.classList.add('off');
    canvas.focus({ preventScroll: true });
    lastTick = 0; cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function flap() { if (running) player.vy = FLAP; }

  function die() {
    if (!running) return;
    running = false; deathFlash = 1;
    const bateu = Placar.salvar(nome, score);
    pintarRecorde();
    overMedal.textContent = bateu ? '🏆' : (score >= 25 ? '🔥' : score >= 10 ? '😎' : '💀');
    overTitle.textContent = bateu ? 'NOVO RECORDE!' : score >= 25 ? 'MITOU!' : score >= 10 ? 'BOA!' : 'CAIU!';
    overSub.textContent = bateu
      ? `${nome}, você fez ${score} e bateu seu recorde!`
      : `Você passou ${score} tubo${score !== 1 ? 's' : ''}. Bora de novo?`;
    scrStart.hidden = true; scrOver.hidden = false;
    overlay.classList.remove('off');

    /* só envia pro ranking quando BATE o recorde pessoal (bateu) — evita
       acumular partidas de score baixo no banco. Score menor que o pessoal
       nunca seria relevante no Top 10 (a dedupe mantém o melhor mesmo). */
    if (bateu && score > 0) {
      Leaderboard.submit(nome, score).then(ok => { if (ok) renderLeaderboard(); });
    }
  }

  function pegarNome() {
    let n = (inpName.value || '').trim();
    if (!n) n = Placar.getNome() || 'VISITANTE';
    nome = n.slice(0, 14);
    Placar.setNome(nome); inpName.value = nome;
  }
  function iniciar() { pegarNome(); novoJogo(); }
  function trocarNome() {
    scrOver.hidden = true; scrStart.hidden = false;
    inpName.value = Placar.getNome() || ''; inpName.focus();
  }

  function flapEvent(e) { if (!running) return; e.preventDefault(); flap(); }
  canvas.addEventListener('mousedown', flapEvent);
  canvas.addEventListener('touchstart', flapEvent, { passive: false });
  document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); flap(); }
  });
  btnStart.addEventListener('click', iniciar);
  btnAgain.addEventListener('click', iniciar);
  btnRename.addEventListener('click', trocarNome);
  inpName.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); iniciar(); } });

  /* desenha o frame parado (boot / idle) */
  function drawIdle() {
    player = { x: PLAYER_X, y: H / 2, vy: 0 };
    drawBg(0);
    ctx.strokeStyle = 'rgba(168,255,31,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
    drawPolvo(player.x, player.y, 0);
  }

  /* ─ boot ─ */
  fitCanvas();                 // dimensiona + escala antes de desenhar
  inpName.value = Placar.getNome() || '';
  pintarRecorde();
  drawIdle();

  // re-ajusta ao girar/redimensionar (só re-desenha o frame parado se não estiver jogando)
  window.addEventListener('resize', function () {
    fitCanvas();
    if (!running) drawIdle();
  }, { passive: true });
})();

renderLeaderboard();

/* ╔══════════════════════════════════════════════════════════╗
   SQL pra rodar no Supabase (SQL Editor) — tabela + RLS:

   create table public.game_scores (
     id uuid primary key default gen_random_uuid(),
     nome text not null check (char_length(nome) between 1 and 14),
     score integer not null check (score >= 0 and score < 100000),
     temporada text not null,
     created_at timestamptz not null default now()
   );
   create index on public.game_scores (temporada, score desc);
   alter table public.game_scores enable row level security;
   create policy "leitura publica" on public.game_scores
     for select to anon using (true);
   create policy "insert publico" on public.game_scores
     for insert to anon with check (
       char_length(nome) between 1 and 14 and score >= 0 and score < 100000
     );
   ╚══════════════════════════════════════════════════════════╝ */
