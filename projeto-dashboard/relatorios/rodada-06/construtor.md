# Relatório do Construtor — rodada 06

## Versão examinada

Workspace sem repositório Git/commit. SHA-256 da versão corrigida e dos arquivos de controle:

| Arquivo | SHA-256 |
|---|---|
| `projeto-dashboard/site/index.html` (inalterado) | `B0D305870B0045FF04EEEDBE25CC771F7A134EC465AE5A8C3C693993344D6B34` |
| `projeto-dashboard/site/styles.css` | `E7643BBE41CF73E69F2B5F755E335D515AFFFE6221B89782D45BA4BA3EDAFB11` |
| `projeto-dashboard/site/dashboard.js` | `2485BB7695336FAFA100DAF25AB2BEE900012C39A607AAA049352E1CE297AD32` |
| `projeto-dashboard/site/favicon.svg` (inalterado) | `4D72C801BD9DC781A93B2C1E6EF02B6B9EA221F2FECC12A41FD1831160C5EB9A` |
| `projeto-dashboard/site/data/vendas.json` (inalterado) | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `projeto-dashboard/tests/test_dashboard_browser.cjs` (inalterado pelo Construtor) | `B040EEE2D4C5A42D0BF68ECFEF7F3B6BE4F727A62012ACF71EF25BA2897130F3` |
| `projeto-dashboard/tests/test_dashboard_browser.py` (inalterado) | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `projeto-dashboard/tests/test_source_baseline.py` (inalterado) | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `projeto-dashboard/preparar_dados.py` (inalterado) | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `projeto-dashboard/README.md` (inalterado) | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |

## Correção implementada

- `dashboard.js`: o texto visível de cada `.bar-value` agora é produzido por `money.format(total)` sem `chartMoney` ou notação compacta. O conteúdo DOM preserva exatamente o valor BRL com centavos, assim como `title`/tooltip e `aria-label`. Os ticks continuam usando `chartMoney` para abreviação explícita com prefixo BRL/unidade.
- `styles.css` e geometria SVG: acrescentei respiro superior às barras para manter o rótulo acima da barra mais alta. Quando a largura útil por categoria/cidade é estreita (390/320 px e filtros com poucas colunas), o mesmo texto exato é desenhado em duas linhas — prefixo `R$` e valor integral com centavos — mantendo `textContent` idêntico ao `money.format`. Em slots largos, como 1440 px, permanece em uma linha. Fonte mínima de 8 px nos rótulos estreitos; área/ticks monetários permanecem visíveis e sem corte.
- Mantidos busca, filtros combinados, clique/teclado nas barras, seleção ativa, tooltip e cálculos; nenhum teste foi alterado.

## Comandos e checagens

- `node --check .\projeto-dashboard\site\dashboard.js` — passou.
- `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — passou; arquivo do Tester somente verificado.
- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram**, incluindo o teste permanente de exatidão visual do Tester.
- Teste permanente executado também diretamente com Chrome real: `node .\projeto-dashboard\tests\test_dashboard_browser.cjs` — passou nos testes de valores de barras, tooltips/ARIA, busca/filtros, interação por clique/teclado, acessibilidade, movimento reduzido/normal e viewports.
- Viewports Chrome: 1440 px, 390 px e 320 px — sem overflow horizontal; teste de legibilidade confirmou rótulos e ticks dentro dos limites do SVG, fonte mínima e texto visível das barras exatamente igual aos totais BRL independentes. Capturas inspecionadas: `%TEMP%\orbita-round06-evidence\dashboard-desktop.png`, `dashboard-mobile-chart.png` e `dashboard-mobile-320-chart.png`.
- Smoke HTTP temporário na porta 8770 — `/`, `/styles.css`, `/dashboard.js`, `/data/vendas.json` e `/favicon.svg` responderam HTTP 200; favicon `image/svg+xml`. Servidor encerrado ao final.
- `Get-FileHash` confirmou que dados, pipeline e testes mantêm os hashes registrados; `relatorios/FINAL.md` e relatórios anteriores não foram modificados.

## Pendências e encaminhamento

- **Tester:** retestar a versão/hash desta rodada com a suíte permanente, sobretudo textos exatos `.bar-value` e legibilidade em 1440/390/320 px após a mudança para duas linhas em slots estreitos. Nenhum teste foi editado ou enfraquecido.
- **Revisor:** revisão independente permanece pendente.
- Não há aprovação conjunta atribuída pelo Construtor.

## Status

**BLOQUEADO para aprovação conjunta / encaminhado ao Tester.** A suíte disponível e checagens direcionadas passaram nesta execução, mas a reprovação da rodada 05 ainda aguarda reteste independente do Tester e revisão do Revisor. Próximo passo: Tester validar estes mesmos hashes; depois o coordenador atualiza o estado conjunto em `FINAL.md`.
