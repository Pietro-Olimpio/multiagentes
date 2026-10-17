# Relatório final — dashboard Órbita

## Status conjunto: **BLOQUEADO**

A rodada 07 acrescentou navegação e movimento cinematográfico em SVG/CSS nativos. A rodada 08 refinou o encerramento e a rodada 09 trouxe uma cena orbital SVG animada ao hero do dashboard e reveal tipográfico na entrada. Os testes locais passaram; a aprovação conjunta permanece bloqueada porque não há revisão independente nova desta versão.

## Versão examinada

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `47849282A19488F5D2FF748586695EB22611D9031E10BBBD1A02C1BAA3FA2CC8` |
| `site/styles.css` | `E5397BFE12A8D61849509D9269100C8187FC04667EA1E758E049E4D2D6A08D89` |
| `site/dashboard.js` | `0E9D55AF9C48F42F146DD9EB80287036D825A4686064DC43DF9D2CF2F0022766` |
| `tests/test_dashboard_browser.cjs` | `15E38CBCBCBDE7593D441CDCCE775EC191A1F41BC2BDEF4A875A39E5C1C6CCF6` |

## Entrega e testes locais

- Preservada a stack estática HTML/CSS/JS e a funcionalidade do painel. SVG/CSS entregam profundidade; não foi adicionado WebGL/dependência pesada.
- Links finais: `https://github.com/Pietro-Olimpio`, `https://www.linkedin.com/in/pietro-correa` e `https://wa.me/551999572812`.
- Suíte executada pelo Coordenador na rodada 09: **6/6 passaram**, incluindo Chrome/CDP. Testou o reveal do título, animação orbital com movimento normal e sua redução, além dos fluxos anteriores; viewports 1440/390/320 sem overflow.
- Capturas visuais desktop/mobile estão em `%TEMP%\orbita-round09-evidence\`.
- Relatório desta alteração: `relatorios/rodada-09/coordenador.md`. Revisão independente desta versão e aprovação conjunta: **PENDENTES**.

## Abrir o site

O servidor HTTP já iniciado responde em <http://localhost:8000>. Para iniciar novamente, na raiz do workspace e no PowerShell:

```powershell
& '.\.venv\Scripts\python.exe' -m http.server 8000 --directory .\projeto-dashboard\site
```

A pasta publicável é `projeto-dashboard/site/`.
