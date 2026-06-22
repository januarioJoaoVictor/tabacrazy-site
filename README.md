# Tabacrazy — Site Oficial

Smoke shop em Piumhi/MG. Site estático, sem dependências, deploy em um clique.

---

## Estrutura de Arquivos

```
tabacrazy_site/
├── index.html              ← marcação semântica, todas as seções
├── css/
│   └── style.css           ← tokens de design, atmosfera, componentes
├── js/
│   └── main.js             ← nav scroll, burger, arcade, reveals
├── assets/
│   ├── logo.webp           ← logo recortada (fundo transparente)
│   ├── favicon.webp        ← ícone da aba do navegador
│   ├── apple-touch.webp    ← ícone para iOS/Android (salvar na tela inicial)
│   └── produtos/           ← fotos dos produtos em WebP
│       ├── narguile.webp
│       ├── fumos.webp
│       ├── cargas.webp
│       ├── acessorios.webp
│       └── descartaveis.webp
└── README.md               ← você está aqui
```

---

## Deploy

### Netlify (recomendado — mais fácil)

1. Acesse [netlify.com](https://netlify.com) e crie uma conta gratuita
2. No dashboard, clique em **Add new site → Deploy manually**
3. Arraste a pasta `tabacrazy_site/` inteira para o campo de drop
4. Pronto — URL pública gerada em ~30 segundos
5. Para domínio próprio: **Site settings → Domain management → Add custom domain**

### GitHub Pages (alternativa gratuita)

1. Crie um repositório público no GitHub
2. Faça upload de todos os arquivos (mantendo a estrutura de pastas)
3. Vá em **Settings → Pages → Source: Deploy from branch → main → / (root)**
4. Site disponível em `https://seuusuario.github.io/nome-do-repo`

---

## Assets Pendentes

| Arquivo | Pasta | Dimensões recomendadas | Observação |
|---|---|---|---|
| `logo.webp` | `assets/` | 240 × 96 px | Fundo transparente, polvo completo |
| `favicon.webp` | `assets/` | 64 × 64 px | Cabeça do polvo, fundo transparente |
| `apple-touch.webp` | `assets/` | 180 × 180 px | Fundo `#0b0a0f` (não transparente) |
| `narguile.webp` | `assets/produtos/` | 800 × 600 px | Item principal do Arsenal (maior) |
| `fumos.webp` | `assets/produtos/` | 600 × 450 px | — |
| `cargas.webp` | `assets/produtos/` | 600 × 450 px | — |
| `acessorios.webp` | `assets/produtos/` | 600 × 450 px | — |
| `descartaveis.webp` | `assets/produtos/` | 600 × 450 px | — |

**Converter para WebP (linha de comando):**
```bash
cwebp -q 82 foto.jpg -o foto.webp
```

**Converter online:** [squoosh.app](https://squoosh.app) → escolha WebP, qualidade 82

---

## Conteúdo a Atualizar no HTML

- [ ] **Número do endereço** — buscar `nº 00` em `index.html` (aparece 2×) e trocar pelo número real
- [ ] **Link WhatsApp** — buscar `55XXXXXXXXXXX` (aparece 2×) e trocar pelo número real no formato `55DDD9XXXXXXXX`
- [ ] **Número do WhatsApp visível** — buscar `(00) 00000-0000` e trocar pelo número formatado
- [ ] **Fotos dos produtos** — adicionar WebPs em `assets/produtos/` e referenciar como `background-image` nos `.ar-thumb` (via CSS ou atributo `style`)

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

## Seções

| Nº | ID | Conteúdo |
|---|---|---|
| — | `#hero` | Título TABA/CRAZY, hero full-height |
| 01 | `#manifesto` | Texto de marca + citação |
| 02 | `#role` | 6 cards de diferenciais |
| 03 | `#arsenal` | Grid assimétrico de produtos (aguardando fotos) |
| 04 | `#mural` | Stickerbomb com 12 adesivos |
| 05 | `#arcade` | Mini-game canvas "Pega o Rolê" |
| 06 | `#vem` | Status aberto/fechado + endereço + mapa |

---

*Site desenvolvido sem frameworks ou dependências externas.*  
*Hospedagem gratuita disponível via Netlify ou GitHub Pages.*
