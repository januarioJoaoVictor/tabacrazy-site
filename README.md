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
│   └── game.js             ← minigame do arcade + ranking local
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

### CSS crítico (`tools/sync-critico.py`)

O `<head>` do `index.html` carrega um **espelho inline** do CSS da primeira
dobra, pra pintar o hero sem esperar requisição. O `style.css` completo vem
logo depois, não-bloqueante, e reaplica as mesmas regras.

O espelho é gerado, não escrito à mão. Se você mexer em `css/fonts.css` ou
nas seções `§ TOKENS`…`§ HERO` / `§ LOADER SINCE` do `css/style.css`, rode:

```sh
python tools/sync-critico.py .
```

Não é build step — o site continua sendo servido como está. É manutenção:
sem rodar, o inline fica desatualizado em relação à folha e o hero pode
pintar com o estilo antigo por um instante.

### Cache e headers (`vercel.json`)

O `vercel.json` não aceita comentários (a Vercel valida o schema e rejeita
chaves desconhecidas), então a explicação das regras mora aqui:

| Rota | Cache-Control | Por quê |
|---|---|---|
| `/assets/*`, `/logo/*` | `max-age=31536000, immutable` | Nomes estáveis e conteúdo que não muda no lugar — trocar uma foto significa trocar o arquivo. `immutable` evita até a revalidação 304. |
| `/css/*`, `/js/*` | `max-age=0, must-revalidate` | **Não** levam `immutable`: os nomes não têm hash, então um deploy de correção nunca chegaria em quem já visitou. O navegador confirma com um 304 barato antes de reusar. |

Se um dia CSS/JS ganharem hash no nome, aí sim dá pra passá-los para `immutable`.

Também vão em todas as rotas: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` e `X-Frame-Options: SAMEORIGIN`.
(HSTS não: a Vercel já envia no domínio.)

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
- [x] **Supabase** — removido. O projeto estava morto (NXDOMAIN) e custava 207 KB de JS de terceiro + retentativas condenadas em toda visita à home. O ranking do jogo agora é um top 5 local (`localStorage`), sem rede.

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
