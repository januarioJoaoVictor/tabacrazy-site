"""Regenera o espelho de CSS crítico inline no <head> do index.html a partir
do css/style.css. Roda sempre que as seções § TOKENS..§ HERO ou § LOADER SINCE
mudarem. Fica FORA do repo de propósito — é ferramenta, não dependência."""
import io, sys, re
raiz = sys.argv[1] if len(sys.argv) > 1 else '.'
L = io.open(f'{raiz}/css/style.css', encoding='utf-8').read().split('\n')

banner = lambda l, nome: l.lstrip().startswith('/* ── §') and nome in l
fim = next(n for n, l in enumerate(L) if banner(l, '§ SECTIONS (base)'))
bloco1 = '\n'.join(L[:fim]).rstrip()

i = next(n for n, l in enumerate(L) if banner(l, '§ LOADER SINCE'))
j = next(n for n in range(i + 1, len(L)) if 'NOVA LOJA' in L[n])
assert j - i < 40, f'bloco § LOADER SINCE grande demais ({j-i} linhas) — banner errado?'
bloco2 = '\n'.join(L[i:j]).rstrip()
bloco2 = bloco2[:bloco2.rindex('}') + 1]

# fonts.css entra no espelho: com 906 bytes, um <link> proprio custava um
# round-trip bloqueante so pra declarar @font-face. Inline sai de graca.
fontes = io.open(f'{raiz}/css/fonts.css', encoding='utf-8').read()
fontes = fontes.replace("url('../assets/", "url('assets/")
NL = chr(10)
critico = fontes.rstrip() + NL + NL + bloco1 + NL + NL + bloco2

p = f'{raiz}/index.html'
s = io.open(p, encoding='utf-8').read()
ini = s.index('  <style>\n') + len('  <style>\n')
end = s.index('\n  </style>', ini)
novo = s[:ini] + critico + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(novo)
print(f'espelho regenerado: {len(critico)/1024:.1f} KB '
      f'({s[ini:end].count(chr(10))} -> {critico.count(chr(10))} linhas)')
