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

  /* pedidos chegam pelo WhatsApp da tabacaria (wa.me aceita texto pré-preenchido).
     Só dígitos, com DDI 55 + DDD — sem +, espaço ou hífen. */
  var WA_NUMBER = '5537976010739';
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
        addToCart(nameEl.textContent.trim(), price, card.dataset.origin || t.origin);

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

  /* ── resumo dos itens agrupados por origem (Loja / Adega) ── */
  function buildItemsBlock() {
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
    return blocks.join('\n\n');
  }

  function cartTotal() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
  function showErr(msg) { var el = document.getElementById('coErr'); if (el) { el.textContent = msg; el.hidden = false; } }

  /* ── tela de checkout: entrega/retirada · pagamento · troco ── */
  function showCheckout() {
    if (!cart.length) return;

    elBody.innerHTML =
      '<form class="checkout" id="checkoutForm">' +
        '<button type="button" class="checkout__back" id="coBack">← voltar ao carrinho</button>' +

        '<fieldset class="checkout__group">' +
          '<legend class="checkout__legend">Entrega ou retirada?</legend>' +
          '<label class="checkout__opt"><input type="radio" name="modo" value="Retirada" checked><span>Retirar na loja</span></label>' +
          '<label class="checkout__opt"><input type="radio" name="modo" value="Entrega"><span>Entrega</span></label>' +
        '</fieldset>' +

        '<div class="checkout__field" id="coAddrWrap" hidden>' +
          '<label class="checkout__lbl" for="coAddr">Endereço de entrega</label>' +
          '<textarea class="checkout__input" id="coAddr" rows="2" placeholder="Rua, número, bairro e um ponto de referência"></textarea>' +
        '</div>' +

        '<fieldset class="checkout__group">' +
          '<legend class="checkout__legend">Forma de pagamento</legend>' +
          '<label class="checkout__opt"><input type="radio" name="pag" value="Pix" checked><span>Pix</span></label>' +
          '<label class="checkout__opt"><input type="radio" name="pag" value="Cartão"><span>Cartão</span></label>' +
          '<label class="checkout__opt"><input type="radio" name="pag" value="Dinheiro"><span>Dinheiro</span></label>' +
        '</fieldset>' +

        '<div class="checkout__field" id="coTrocoWrap" hidden>' +
          '<label class="checkout__opt"><input type="checkbox" id="coTrocoChk"><span>Preciso de troco</span></label>' +
          '<div id="coTrocoBox" hidden>' +
            '<label class="checkout__lbl" for="coTroco">Troco para quanto?</label>' +
            '<input class="checkout__input" type="number" id="coTroco" min="0" step="0.01" inputmode="decimal" placeholder="Ex.: 50,00">' +
            '<p class="checkout__troco" id="coTrocoOut"></p>' +
          '</div>' +
        '</div>' +

        '<p class="checkout__err" id="coErr" hidden></p>' +
      '</form>';

    elFoot.innerHTML =
      '<div class="cart-total-line">' +
        '<span class="cart-total-label">TOTAL</span>' +
        '<span class="cart-total-val">' + fmt(cartTotal()) + '</span>' +
      '</div>' +
      '<button class="btn btn--neon cart-checkout" id="coSend">ENVIAR PELO WHATSAPP →</button>';

    var form = document.getElementById('checkoutForm');
    form.querySelector('#coBack').addEventListener('click', render);

    form.querySelectorAll('input[name="modo"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var ent = form.querySelector('input[name="modo"]:checked').value === 'Entrega';
        document.getElementById('coAddrWrap').hidden = !ent;
      });
    });
    form.querySelectorAll('input[name="pag"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var din = form.querySelector('input[name="pag"]:checked').value === 'Dinheiro';
        document.getElementById('coTrocoWrap').hidden = !din;
      });
    });
    form.querySelector('#coTrocoChk').addEventListener('change', function (e) {
      document.getElementById('coTrocoBox').hidden = !e.target.checked;
      computeTroco();
    });
    form.querySelector('#coTroco').addEventListener('input', computeTroco);

    function computeTroco() {
      var out = document.getElementById('coTrocoOut');
      var v = parseFloat((document.getElementById('coTroco').value || '').replace(',', '.'));
      if (isNaN(v)) { out.textContent = ''; out.className = 'checkout__troco'; return; }
      if (v < cartTotal()) { out.textContent = 'Valor menor que o total (' + fmt(cartTotal()) + ').'; out.className = 'checkout__troco checkout__troco--bad'; }
      else { out.textContent = 'Troco: ' + fmt(v - cartTotal()); out.className = 'checkout__troco checkout__troco--ok'; }
    }
  }

  /* ── monta o pedido completo e abre o WhatsApp já preenchido ── */
  function submitOrder() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;
    var total = cartTotal();
    var modo = form.querySelector('input[name="modo"]:checked').value;
    var pag  = form.querySelector('input[name="pag"]:checked').value;

    var entregaLine;
    if (modo === 'Entrega') {
      var addr = (document.getElementById('coAddr').value || '').trim();
      if (!addr) { showErr('Escreva o endereço para a entrega.'); return; }
      entregaLine = '🛵 Entrega: ' + addr;
    } else {
      entregaLine = '🏬 Retirada na loja';
    }

    var pagLine = '💳 Pagamento: ' + pag;
    if (pag === 'Dinheiro') {
      var chk = document.getElementById('coTrocoChk');
      if (chk && chk.checked) {
        var v = parseFloat((document.getElementById('coTroco').value || '').replace(',', '.'));
        if (isNaN(v) || v < total) { showErr('Informe um valor de troco maior ou igual ao total (' + fmt(total) + ').'); return; }
        pagLine += ' — troco para ' + fmt(v) + ' (levar ' + fmt(v - total) + ' de troco)';
      } else {
        pagLine += ' — não precisa de troco';
      }
    }

    var msg = 'Olá! Quero fazer o seguinte pedido:\n\n' +
              buildItemsBlock() +
              '\n\nTOTAL: ' + fmt(total) +
              '\n\n———\n' + entregaLine + '\n' + pagLine;

    /* wa.me aceita o texto pré-preenchido: o cliente só confirma e envia */
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');

    cart.length = 0;
    saveCart();
    syncBadge();

    elBody.innerHTML =
      '<div class="cart-done">' +
        '<p class="cart-done__title">Pedido enviado! 🎉</p>' +
        '<p class="cart-done__txt">Abrimos o <b>WhatsApp</b> com o resumo já preenchido — é só apertar <b>enviar</b> que a gente confirma tudinho. 💬</p>' +
        '<a class="btn btn--neon cart-done__ig" href="https://wa.me/' + WA_NUMBER + '" target="_blank" rel="noopener noreferrer">ABRIR WHATSAPP ↗</a>' +
      '</div>';
    elFoot.innerHTML = '';
  }

  elFoot.addEventListener('click', function (e) {
    if (e.target.closest('#cartCheckout')) { showCheckout(); return; }
    if (e.target.closest('#coSend'))       { submitOrder(); return; }
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

/* ── § LIGHTBOX (amplia a foto do produto) ────────────
   Clicar na imagem de um .shop-card abre a foto maior num
   modal, com nome, preço e um atalho pra pedir no Instagram
   (por enquanto os pedidos chegam por lá). Sem link "Ver no
   Instagram" — o clique passa a abrir a própria foto. */
(function productLightbox() {
  if (!document.querySelector('.shop-card')) return; // páginas sem grade → ignora

  var IG = 'https://www.instagram.com/taba_crazy/';
  var isAdega = !!document.querySelector('.shop-section--adega');

  var box = document.createElement('div');
  box.className = 'lightbox' + (isAdega ? ' lightbox--adega' : '');
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML =
    '<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Foto do produto" tabindex="-1">' +
      '<button class="lightbox__close" type="button" aria-label="Fechar">✕</button>' +
      '<div class="lightbox__media"><img src="" alt=""></div>' +
      '<div class="lightbox__body">' +
        '<p class="lightbox__name"></p>' +
        '<p class="lightbox__price"></p>' +
        '<a class="lightbox__ig" href="' + IG + '" target="_blank" rel="noopener noreferrer">PEDIR NO INSTAGRAM ↗</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(box);

  var imgEl   = box.querySelector('.lightbox__media img');
  var nameEl  = box.querySelector('.lightbox__name');
  var priceEl = box.querySelector('.lightbox__price');
  var closeB  = box.querySelector('.lightbox__close');
  var lastFocus = null;

  function open(card) {
    var src   = card.querySelector('.shop-card__media img');
    var name  = card.querySelector('.shop-card__name');
    var price = card.querySelector('.shop-card__price');
    if (!src) return;
    imgEl.src = src.currentSrc || src.src;
    imgEl.alt = name ? name.textContent : '';
    nameEl.textContent  = name ? name.textContent : '';
    priceEl.textContent = price ? price.textContent : '';
    lastFocus = document.activeElement;
    box.classList.add('lightbox--open');
    box.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    closeB.focus();
  }

  function close() {
    box.classList.remove('lightbox--open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var media = e.target.closest('.shop-card__media');
    if (media) {                       // clicou na foto (ou no botão "Ver foto")
      e.preventDefault();
      var card = media.closest('.shop-card');
      if (card) open(card);
      return;
    }
    if (e.target === box || e.target.closest('.lightbox__close')) close(); // fundo/✕
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('lightbox--open')) close();
  });
})();
