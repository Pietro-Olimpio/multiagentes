# Relatório do Tester — rodada 06

## Versão examinada

Workspace sem commit Git. Os hashes de produto coincidem com `relatorios/rodada-06/construtor.md`. Ampliei somente `tests/test_dashboard_browser.cjs` para verificar de forma explícita a estrutura e geometria dos `.bar-value` com `<tspan>`; nenhum arquivo de produto ou `test_dashboard_browser.py` foi alterado.

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `B0D305870B0045FF04EEEDBE25CC771F7A134EC465AE5A8C3C693993344D6B34` |
| `site/styles.css` | `E7643BBE41CF73E69F2B5F755E335D515AFFFE6221B89782D45BA4BA3EDAFB11` |
| `site/dashboard.js` | `2485BB7695336FAFA100DAF25AB2BEE900012C39A607AAA049352E1CE297AD32` |
| `site/favicon.svg` | `4D72C801BD9DC781A93B2C1E6EF02B6B9EA221F2FECC12A41FD1831160C5EB9A` |
| `README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |
| `site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `preparar_dados.py` | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `tests/test_dashboard_browser.cjs` (ampliado pelo Tester) | `E623C2EDF4433688755287CEC970AC2C78A0EE389210A100211C1B0FF4AD4DE3` |

## Reteste e ampliação

O teste permanente já cobria comparação exata de `.bar-value.textContent` com a moeda BRL do total, tooltips/`aria-label`, ticks, filtros e busca. Ampliei a coleta de geometria para examinar também os `tspan`: conteúdo de cada linha, alinhamento ao centro, `dy`, separação vertical, caixa renderizada e posição em relação à barra. Acrescentei detecção de interseção entre caixas de ticks, rótulos de categoria/cidade e valores. Também verifiquei painel completo, busca com filtro de cidade e busca combinada com filtro/barra em 390 px e 320 px. São asserções adicionais; nenhum critério foi removido ou relaxado.

No Chrome real via CDP, conferi:

- `.bar-value.textContent` é exatamente igual ao valor de `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, inclusive centavos e espaço não separável; em slots estreitos, há dois `tspan` (`R$` e valor) sem alterar o `textContent` concatenado.
- Nos layouts de uma e duas linhas: posição dos `tspan`, alinhamento, espaçamento, clipping fora do `viewBox`, cruzamento do rótulo com a barra e sobreposição entre textos SVG. As asserções foram exercitadas em 1440, 390 e 320 px, no painel completo, categoria filtrada, busca por `santos` combinada com cidade e nos demais estados de filtro/busca já presentes na suíte.
- Todos os ticks têm prefixo BRL e permanecem dentro do SVG; títulos/tooltip e `aria-label` de cada barra mantêm o valor integral exato. As capturas técnicas mostram os valores exatos em uma linha no desktop e empilhados no mobile, sem corte visível.
- Permaneceram cobertos: favicon declarado, HTTP `image/svg+xml` e parse SVG; credenciais/gate, validação, marcador exclusivo em `sessionStorage`, refresh/logout; dados/KPIs/gráficos/tabela/contagem; busca por todos os campos, acentos/case, filtros e barras combinados, vazio/limpar; teclado; modo normal/reduzido; ausência de `NaN`/`Infinity`, exceções JS e erros `console.error`.

Viewports CDP: desktop 1440 px (`documentWidth=1425`), mobile 390 px e estreito 320 px (`documentWidth` igual ao viewport, sem overflow). Capturas temporárias conferidas quanto a valor, tick, posição e corte: `%TEMP%\orbita-round06-evidence\dashboard-desktop.png`, `dashboard-mobile-chart.png` e `dashboard-mobile-320-chart.png`. Esta verificação trata somente de legibilidade e geometria técnica; não é revisão estética independente nem revisão da referência Lusion.

## Comandos e resultados

Ambiente: Python 3.14.7, pandas 3.0.6, Node v24.21.0 e Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`. Playwright/Selenium não estão instalados; nenhum pacote foi instalado.

1. `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram, 0 falhas**, incluindo browser e cinco testes independentes de baseline.
2. `node .\projeto-dashboard\tests\test_dashboard_browser.cjs` — passou diretamente no Chrome/CDP, incluindo textContent/tspan, estados, viewports e console.
3. `node --check .\projeto-dashboard\site\dashboard.js` e `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — ambos passaram.
4. Smoke HTTP executado pelo próprio teste browser: `/`, CSS, JS, JSON e favicon HTTP 200; favicon `image/svg+xml` e SVG válido. Sem erros JS/console.
5. `Get-FileHash` — hashes do produto coincidem com o relatório do Construtor; o hash de `test_dashboard_browser.cjs` acima identifica as novas verificações do Tester.

## Pendências e status

- Não encontrei falha a encaminhar ao Construtor nesta versão.
- Testes em aparelhos físicos: **PENDENTES**; as larguras desktop/mobile foram emuladas no Chrome.
- As documentações `.agents/skills/explore-data/SKILL.md`, `.agents/skills/data-visualization/SKILL.md` e `.agents/skills/validate-data/SKILL.md` continuam ausentes; não foram utilizadas. Revisão independente do Revisor/aprovação conjunta permanece pendente.

**APROVADO — Tester, para os hashes de produto listados.** A suíte README e o CJS direto passaram; a falha de precisão visual da rodada 05 não se reproduziu. Esta aprovação é somente do Tester, não da revisão independente nem da aprovação final conjunta.
