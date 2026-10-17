# Relatório do Tester — rodada 05

## Versão examinada

Workspace sem commit Git. Os hashes do produto coincidem com `relatorios/rodada-05/construtor.md`. Alterei apenas `tests/test_dashboard_browser.cjs`; não editei produto nem `test_dashboard_browser.py` (o wrapper existente já chama o teste CJS na suíte README).

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `B0D305870B0045FF04EEEDBE25CC771F7A134EC465AE5A8C3C693993344D6B34` |
| `site/styles.css` | `1526FC9F888D71ED1A39318458ECEE45FA512694C1CF6BFC2840881CDB415672` |
| `site/dashboard.js` | `DD89FABB34F10E23A15FC0FBFDA4CFD21A4164C4AA1A0FF512912B3C4DBB3F33` |
| `site/favicon.svg` | `4D72C801BD9DC781A93B2C1E6EF02B6B9EA221F2FECC12A41FD1831160C5EB9A` |
| `README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |
| `site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `preparar_dados.py` | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `tests/test_dashboard_browser.cjs` (ampliado pelo Tester) | `B040EEE2D4C5A42D0BF68ECFEF7F3B6BE4F727A62012ACF71EF25BA2897130F3` |

## Ampliação e evidências

Ampliei o teste de navegador porque o roteiro da rodada 04 não cobria favicon, a nova busca nem o requisito explícito de totais não arredondados. Mantive todos os testes de login, sessão, dados, filtros, barras, teclado, acessibilidade e estados anteriores. Não alterei o wrapper Python porque ele já inclui o CJS na suíte padrão.

No Chrome real via CDP, foram executados e passaram:

- Gate e login demonstrativo com os valores apresentados; tentativas vazias/inválidas recusadas; apenas `orbita-demo-access=1` em `sessionStorage`; refresh/logout; validação de que não se requisitam os dados sem sessão.
- Favicon declarado no HTML, buscado pelo navegador, HTTP 200, `Content-Type: image/svg+xml` e XML SVG parseável.
- Movimento normal: animação ativa, reveal via `IntersectionObserver` e luz/orbita respondendo ao ponteiro. Movimento reduzido: reveals sem ocultar conteúdo, animações minimizadas e parallax inativo.
- Busca separada por ID, data ISO/localizada, produto, categoria, cidade, quantidade e valor numérico/BRL; acentos e maiúsculas/minúsculas; busca combinada com categoria/cidade e clique nas barras; preservação da busca ao filtrar; KPIs, gráficos, tabela e contagem recalculados conjuntamente; busca vazia e ambos os comandos de limpeza.
- Totais independentes no painel, conteúdo integral de todas as células da tabela, agrupamentos dos gráficos, filtros isolados/combinados, botões, estado vazio, barras por clique/`Enter`/`Espaço`, selects por seta/`Tab`, sem `NaN`/`Infinity`, exceções JavaScript ou erros `console.error`.
- Viewports emulados: gate e painel em desktop 1440 px, mobile 390 px e mobile estreito 320 px. Sem overflow horizontal (document widths 1425, 390 e 320, respectivamente). Os ticks/rótulos possuem prefixo BRL, fonte mínima de 8 px e caixas SVG dentro da área renderizada, sem corte nas medidas examinadas.

### Defeito encaminhado ao Construtor

O teste de precisão visual falhou em **46 comparações de estado** (repetições do mesmo problema ao longo de filtros/buscas/viewports): os valores visíveis nas barras usam abreviação arredondada, apesar do requisito desta rodada de não arredondar totais. Exemplos no painel sem filtro:

| Grupo | Total exato | Rótulo visível na barra |
|---|---:|---:|
| Acessórios | R$ 10.517,00 | `R$ 10,5 mil` |
| Livros | R$ 7.438,00 | `R$ 7,4 mil` |
| Santos | R$ 6.937,50 | `R$ 6,9 mil` |

Os `title`/tooltip, `aria-label`, KPIs e tabela conservam os valores exatos; os ticks BRL também estão dentro da área e legíveis. Porém, o rótulo numérico diretamente visível sobre a barra arredonda os totais; em mobile o formato cabe, mas continua aproximado. **Construtor:** ajustar a apresentação de valor das barras para satisfazer precisão exata sem corte em larguras estreitas e devolver a mesma versão para reteste. O teste permanente compara o texto visível das barras com os totais independentes e não deve ser enfraquecido.

Capturas técnicas temporárias, conferidas em 1440 px, 390 px e 320 px: `%TEMP%\orbita-round05-evidence\dashboard-desktop.png`, `dashboard-mobile.png`, `dashboard-mobile-chart.png`, `dashboard-mobile-320-chart.png`, `gate-desktop.png` e `gate-mobile.png`. Esta conferência limita-se à legibilidade/unidade/corte; não é uma revisão independente da referência Lusion nem substitui o Revisor.

## Comandos e resultados

Ambiente: Python 3.14.7, pandas 3.0.6, Node v24.21.0 e Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`; Playwright/Selenium não estão instalados e nenhum pacote foi instalado.

1. Comando de preparação do README, `& '.\.venv\Scripts\python.exe' .\projeto-dashboard\preparar_dados.py` — passou: 180 vendas, R$ 20.059,00. O SHA-256 do JSON continuou igual.
2. Comando de teste do README, `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **5 passaram, 1 falhou**. Os cinco baselines da fonte passaram; o teste de browser executou todo o percurso, mas termina em **REPROVADO** pela precisão dos rótulos de barras acima. Não declarar a suíte aprovada.
3. Comando de servidor do README, `-m http.server 8000 --directory .\projeto-dashboard\site`, executado com o Python virtual e encerrado após as requisições — `/`, CSS, JS, JSON e favicon responderam HTTP 200; favicon `image/svg+xml` (599 bytes).
4. `node .\projeto-dashboard\tests\test_dashboard_browser.cjs` — os mesmos cenários passaram até a asserção final de precisão de rótulos; falhou pelos totais abreviados. Chrome/CDP usado em modo headless.
5. `node --check .\projeto-dashboard\site\dashboard.js` e `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — ambos passaram, sem erro de sintaxe.
6. `Get-FileHash` — hashes conferidos com o relatório do Construtor; teste CJS alterado identificado na tabela acima.

## Limitações e status

- Validação em aparelhos físicos: **PENDENTE**; foram usados viewports emulados no Chrome. Skills `.agents/skills/explore-data/SKILL.md`, `.agents/skills/data-visualization/SKILL.md` e `.agents/skills/validate-data/SKILL.md`: **PENDENTES/ausentes**, não utilizadas.
- Revisor independente e aprovação conjunta: **PENDENTES**.

**REPROVADO — Tester.** Os dados, busca, favicon, interação, movimento e geometria responsiva foram testados; a suíte completa não passa porque os totais visíveis das barras são arredondados. Encaminhado ao **Construtor**. Reexecutar a suíte inteira após a correção; não aprovar esta versão como está.
