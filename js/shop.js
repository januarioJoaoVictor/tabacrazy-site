/* ═══════════════════════════════════════════════════
   TABACRAZY · shop.js  — motor COMPARTILHADO Loja + Adega
   IIFEs (na ordem): shopCategories · shopFilter · cartModule
   Requer no HTML: .shop-pill[data-filter] (pills de filtro),
   uma <ul id="shop-grid"> com os <li.shop-card[data-category]>
   (fonte de produtos) e um <div id="shop-cats"> vazio (destino).
   ═══════════════════════════════════════════════════ */
'use strict';

/* ── § AGRUPAR POR CATEGORIA ──────────────────────────
   Lê os cards da grade-fonte e monta, dinamicamente, UMA
   seção por categoria presente nos dados. A ordem e os
   rótulos vêm das próprias pills (fonte única de verdade):
   adicionar um card com categoria nova → seção nova. */
(function shopCategories() {
  var grid = document.getElementById('shop-grid');
  var host = document.getElementById('shop-cats');
  if (!grid || !host) return;

  // rótulo + ordem a partir das pills (ignora "todos")
  var labels = {}, order = [];
  document.querySelectorAll('.shop-pill').forEach(function (p) {
    var f = (p.dataset.filter || '').trim();
    if (f && f !== 'todos') { labels[f] = p.textContent.trim(); order.push(f); }
  });

  // agrupa os cards por data-category
  var byCat = {};
  Array.prototype.slice.call(grid.querySelectorAll('.shop-card')).forEach(function (card) {
    var cat = (card.dataset.category || 'outros').trim();
    (byCat[cat] = byCat[cat] || []).push(card);
  });

  // categorias presentes: ordem das pills primeiro, extras depois
  var cats = order.filter(function (c) { return byCat[c]; });
  Object.keys(byCat).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); });

  // monta <section.shop-cat> > h3 + <ul.shop-grid>
  cats.forEach(function (cat) {
    var sec = document.createElement('section');
    sec.className = 'shop-cat';
    sec.id = 'cat-' + cat;
    sec.dataset.category = cat;

    var h = document.createElement('h3');
    h.className = 'shop-cat__title';
    h.textContent = labels[cat] || cat;

    var ul = document.createElement('ul');
    ul.className = 'shop-grid';
    ul.setAttribute('role', 'list');
    byCat[cat].forEach(function (card) { ul.appendChild(card); }); // move o nó

    sec.appendChild(h);
    sec.appendChild(ul);
    host.appendChild(sec);
  });

  grid.remove(); // grade-fonte agora vazia
})();

/* ── § FILTRO (por seção) ─────────────────────────────
   "Todos" mostra todas as seções; uma categoria mostra só
   a seção dela e rola suavemente até ela. */
(function shopFilter() {
  var pills    = document.querySelectorAll('.shop-pill');
  var sections = document.querySelectorAll('.shop-cat');
  if (!pills.length || !sections.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');

      var f = pill.dataset.filter;
      sections.forEach(function (sec) {
        var show = (f === 'todos' || sec.dataset.category === f);
        sec.classList.toggle('shop-cat--hidden', !show);
      });

      if (f !== 'todos') {
        var target = document.getElementById('cat-' + f);
        if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });
})();

/* ── § CARRINHO (overlay + drawer + checkout WhatsApp) ─
   Injeta "+ Adicionar" em cada card; memória apenas (sem
   persistência). Idêntico ao comportamento original da Loja. */
(function cartModule() {
  var elBtn = document.getElementById('cartBtn');
  if (!elBtn) return; // página sem carrinho → não faz nada

  var WA = '5535999999999';
  var STORE_KEY = 'tabacrazy_cart';
  /* origem desta página (p/ agrupar o pedido único): Adega tem .shop-section--adega */
  var PAGE_ORIGIN = document.querySelector('.shop-section--adega') ? 'Adega' : 'Loja';

  /* ── persistência: carrinho COMPARTILHADO Loja+Adega via localStorage ── */
  function loadCart() {
    try { var arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(arr) ? arr : []; }
    catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  var cart = loadCart(); /* [{ name, price, qty, origin }] — persiste entre Loja e Adega */

  var elCount   = document.getElementById('cartCount');
  var elDrawer  = document.getElementById('cartDrawer');
  var elOverlay = document.getElementById('cartOverlay');
  var elClose   = document.getElementById('cartClose');
  var elBody    = document.getElementById('cartBody');
  var elFoot    = document.getElementById('cartFoot');

  /* ── injetar "+ Adicionar" nos cards ──
     Loja/Adega usam .shop-card; a Vitrine da home usa .drop-card
     (Novidades) e .promo-card (Promoções). Mesmo botão, mesmo
     carrinho (origin = PAGE_ORIGIN, 'Loja' na home). */
  var CARD_TYPES = [
    { card: '.shop-card',  name: '.shop-card__name',  price: '.shop-card__price', body: '.shop-card__body'  },
    { card: '.drop-card',  name: '.drop-card__name',  price: '.drop-card__price', body: '.drop-card__body'  },
    { card: '.promo-card', name: '.promo-card__name', price: '.promo-card__new',  body: '.promo-card__body' },
    /* teaser da Adega na home: força origin 'Adega' mesmo a página sendo Loja */
    { card: '.adega-card', name: '.adega-card__name', price: '.adega-card__price', body: '.adega-card__body', origin: 'Adega' }
  ];

  function addToCart(name, price, origin) {
    origin = origin || PAGE_ORIGIN;
    var found = null;
    for (var k = 0; k < cart.length; k++) {
      if (cart[k].name === name && cart[k].origin === origin) { found = cart[k]; break; }
    }
    if (found) { found.qty++; } else { cart.push({ name: name, price: price, qty: 1, origin: origin }); }
    saveCart();
    syncBadge();
    render();
  }

  CARD_TYPES.forEach(function (t) {
    document.querySelectorAll(t.card).forEach(function (card) {
      var nameEl  = card.querySelector(t.name);
      var priceEl = card.querySelector(t.price);
      var bodyEl  = card.querySelector(t.body);
      if (!nameEl || !priceEl || !bodyEl) return;

      var btn = document.createElement('button');
      btn.type        = 'button';
      btn.className   = 'card-add-btn';
      btn.textContent = '+ Adicionar';

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var price = parseFloat(priceEl.textContent.replace('R$', '').trim().replace(',', '.'));
        if (isNaN(price)) return;
        addToCart(nameEl.textContent.trim(), price, t.origin);

        btn.textContent = '✓ Adicionado';
        btn.classList.add('card-add-btn--added');
        setTimeout(function () {
          btn.textContent = '+ Adicionar';
          btn.classList.remove('card-add-btn--added');
        }, 1400);
      });

      bodyEl.appendChild(btn);
    });
  });

  function syncBadge() {
    var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    elCount.textContent = n;
    if (n > 0) { elCount.removeAttribute('hidden'); }
    else        { elCount.setAttribute('hidden', ''); }
  }

  function fmt(n) { return 'R$ ' + n.toFixed(2).replace('.', ','); }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    if (!cart.length) {
      elBody.innerHTML = '<p class="cart-empty">Carrinho vazio.<br>Adiciona um produto pra começar.</p>';
      elFoot.innerHTML = '';
      return;
    }

    elBody.innerHTML = cart.map(function (item, i) {
      return (
        '<div class="cart-item">' +
          '<div class="cart-item__top">' +
            '<p class="cart-item__name">' + esc(item.name) + '</p>' +
            '<button class="cart-remove" data-i="' + i + '" aria-label="Remover ' + esc(item.name) + '">✕</button>' +
          '</div>' +
          '<div class="cart-item__bottom">' +
            '<span class="cart-item__unit">' + fmt(item.price) + ' / un</span>' +
            '<div class="cart-item__qty">' +
              '<button class="cart-qty-btn" data-i="' + i + '" data-a="dec" aria-label="Diminuir quantidade">−</button>' +
              '<span class="cart-qty-num">' + item.qty + '</span>' +
              '<button class="cart-qty-btn" data-i="' + i + '" data-a="inc" aria-label="Aumentar quantidade">+</button>' +
            '</div>' +
            '<span class="cart-item__sub">' + fmt(item.price * item.qty) + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    elFoot.innerHTML =
      '<div class="cart-total-line">' +
        '<span class="cart-total-label">TOTAL</span>' +
        '<span class="cart-total-val">' + fmt(total) + '</span>' +
      '</div>' +
      '<button class="btn btn--neon cart-checkout" id="cartCheckout">FINALIZAR PEDIDO →</button>';
  }

  elBody.addEventListener('click', function (e) {
    var qb = e.target.closest('.cart-qty-btn');
    if (qb) {
      var i = +qb.dataset.i;
      if (qb.dataset.a === 'inc') {
        cart[i].qty++;
      } else {
        cart[i].qty--;
        if (cart[i].qty <= 0) cart.splice(i, 1);
      }
      saveCart(); syncBadge(); render(); return;
    }
    var rb = e.target.closest('.cart-remove');
    if (rb) { cart.splice(+rb.dataset.i, 1); saveCart(); syncBadge(); render(); }
  });

  elFoot.addEventListener('click', function (e) {
    if (!e.target.closest('#cartCheckout')) return;

    /* agrupa o pedido único por origem (Loja / Adega) */
    var groups = {};
    cart.forEach(function (item) {
      var g = item.origin || 'Loja';
      (groups[g] = groups[g] || []).push(item);
    });
    var blocks = [];
    [['Loja', '🏪'], ['Adega', '🍺']].forEach(function (pair) {
      var items = groups[pair[0]];
      if (!items || !items.length) return;
      var lines = items.map(function (item) {
        return '• ' + item.qty + 'x ' + item.name + ' - ' + fmt(item.price);
      });
      blocks.push(pair[1] + ' ' + pair[0].toUpperCase() + ':\n' + lines.join('\n'));
    });

    var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var msg = 'Olá! Quero fazer o seguinte pedido:\n\n' +
              blocks.join('\n\n') +
              '\n\nTOTAL: ' + fmt(total);
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');

    /* esvazia ao finalizar (em ambas as páginas, via localStorage) */
    cart.length = 0;
    saveCart();
    syncBadge();
    render();
  });

  function openCart() {
    elDrawer.classList.add('cart-drawer--open');
    elOverlay.classList.add('cart-overlay--show');
    elOverlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    elClose.focus();
  }

  function closeCart() {
    elDrawer.classList.remove('cart-drawer--open');
    elOverlay.classList.remove('cart-overlay--show');
    elOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    elBtn.focus();
  }

  elBtn.addEventListener('click', openCart);
  elClose.addEventListener('click', closeCart);
  elOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && elDrawer.classList.contains('cart-drawer--open')) closeCart();
  });

  syncBadge(); /* reflete itens já salvos (ex.: adicionados na outra página) */
  render();    /* estado inicial — pode já ter itens vindos do localStorage */
})();
