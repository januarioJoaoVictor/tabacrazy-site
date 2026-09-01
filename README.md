# Tabacrazy — Site Oficial

Smoke shop em Piumhi/MG. Site estático, sem dependências, deploy em um clique.

---

## Estrutura de Arquivos

```
tabacrazy_site/
├── index.html              ← home (hero, vitrine, kits, O Rolê, jogo, localização)
├── store.html              ← loja  → rota pública /store
├── adega.html              ← adega → rota pública /adega
├── 404.html                ← página de erro da Vercel
├── robots.txt · sitemap.xml
├── vercel.json             ← cleanUrls (rotas sem .html)
├── css/style.css           ← tokens de design, atmosfera, componentes
├── js/
│   ├── main.js             ← loader, burger, ano, status aberto/fechado, reveals
│   ├── shop.js             ← catálogo, filtros, carrinho, checkout no WhatsApp
│   ├── game.js             ← minigame do arcade
│   ├── env.js              ← config pública (Supabase)
│   └── supabase.js         ← client singleton (ranking do jogo)
├── logo/                   ← logo animada, favicon, apple-touch-icon
└── assets/
    ├── produtos/           ← 208 fotos de produtos em WebP
    ├── marcas/             ← logos OCB e Lion (SVG)
    ├── role/               ← fotos dos painéis de "O Rolê"
    └── og/                 ← imagem de preview de link (1200×630)
```

---

## Deploy

O site está na **Vercel**, ligado ao branch `main` deste repo: todo push pra `main`
publica automaticamente. Não há build — a Vercel serve os arquivos como estão.

- **Produção:** https://www.tabacrazy.com.br
- O apex (`tabacrazy.com.br`) faz 308 para `www`; `www` é o domínio canônico.
- `vercel.json` liga `cleanUrls`, então as rotas públicas são `/`, `/store` e `/adega`
  (sem `.html`). Os links internos já apontam pra essas rotas.

### Preview local

Como as rotas são sem extensão, **abrir `index.html` via `file://` quebra a navegação
entre páginas**. Use um servidor que resolva clean URLs:

```sh
npx serve .          # resolve /store -> store.html  ✅
```

`python -m http.server` **não** resolve clean URLs (`/store` dá 404) — serve só pra
conferir a home isolada.

---

## Otimização de imagens

Os produtos já estão todos em WebP. Ao adicionar novos, converta antes de commitar —
JPG/PNG de câmera tem alguns MB e o site é servido como está, sem build.

```bash
cwebp -q 82 foto.jpg -o foto.webp
```

Sem `cwebp` à mão, [squoosh.app](https://squoosh.app) → WebP, qualidade 82.

---

## Conteúdo a Atualizar no HTML

- [x] **Número do endereço** — Rua Dom Pedro II, 568-A · Centro · Piumhi/MG
- [x] **Link WhatsApp** — `5537976010739`, em `index.html`, `store.html`, `adega.html` e em `WA_NUMBER` (`js/shop.js`)
- [x] **Número do WhatsApp visível** — os links aparecem como “WhatsApp”; não há número formatado na tela
- [x] **Fotos dos produtos** — 208 WebPs em `assets/produtos/`

### Ainda em aberto

- [x] **Domínio** — `og:url`, `canonical`, `robots.txt` e `sitemap.xml` usam `https://www.tabacrazy.com.br`.
- [ ] **Supabase** — o projeto de `js/env.js` não existe mais (DNS NXDOMAIN). O ranking do jogo cai no fallback `localStorage`, então cada visitante vê só o próprio placar.

---

## Paleta de Cores

| Token CSS | Hex | Uso |
|---|---|---|
| `--neon` | `#a8ff1f` | CTAs, títulos, destaques |
| `--purple` | `#9b2fe0` | Blobs, acentos, stickers |
| `--black` | `#0b0a0f` | Background principal |
| `--surface` | `#13111a` | Seções alternadas (.sec--alt) |
| `--panel` | `#1a1726` | Cards, painéis internos |
| `--text` | `#e8e4f0` | Texto principal |
| `--muted` | `#7a718e` | Texto secundário, labels |

## Fontes

Carregadas via Google Fonts — sem instalação necessária.

| Família | Variável CSS | Uso |
|---|---|---|
| Anton | `--f-head` | Títulos, números de seção, HUD arcade |
| Permanent Marker | `--f-hand` | Subtítulos, taglines, stickers do mural |
| Space Grotesk | `--f-body` | Corpo de texto |
| Space Mono | `--f-mono` | Labels, nav links, UI técnica |

---

## Seções da home

| ID | Conteúdo |
|---|---|
| `#hero` | Logo animada, título TABA/CRAZY, CTAs |
| `#store` | Vitrine — novidades, promoções, kits e prévia da adega |
| `#role` | Carrossel horizontal: intro, sinuca, PS5, drinks, kit |
| `#consciencia` | Aviso de consumo consciente |
| `#jogo` | Minigame do arcade (canvas) |
| `#vem` | Status aberto/fechado + endereço + mapa |

Loja e adega vivem em páginas próprias: `/store` e `/adega`.

---

*Site sem frameworks ou dependências de build. Deploy automático na Vercel a cada push na `main`.*
