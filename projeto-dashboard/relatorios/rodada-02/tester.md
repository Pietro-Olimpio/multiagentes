# Relatório do Tester — rodada 02

## Versão examinada

Sem commit Git neste workspace. A interface examinada corresponde aos hashes entregues pelo Construtor na rodada 02:

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `CE99C0FDDE1DE7F154C2D024AEF4E882584969679FAF11C8B356945CF3562E3F` |
| `site/styles.css` | `D84D8BC899FA2216DDAA2E18273866B0003A2FCBDBD0311CD8B23094E5E7BF36` |
| `site/dashboard.js` | `FD04B866D6E52827D15F3CDFFBDDD8FD373CC87BA362A2325432EF94C0039897` |
| `site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `README.md` | `56DB20E1A05BB180DD280C4574FB90BA1FA79207B9F71FB644BB21E6603F27FF` |
| `tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `tests/test_dashboard_browser.cjs` | `FAD3FDEF7B9DD97B518D15EAB5DD9E75A7C6B043230F77AE9C4A8E5693C32FCA` |

Os três hashes da interface e o JSON coincidem com `relatorios/rodada-02/construtor.md`. O CSV original e o pipeline não foram alterados. Acrescentei somente os dois testes em `tests/`; nenhum arquivo de produto foi editado.

## Conferido e testado

- A suíte Python original verifica hash e preservação da fonte, schema, 180 registros, campos preenchidos, IDs/duplicatas, total e agrupamentos independentes e um exemplo pequeno conhecido.
- Acrescentei `test_dashboard_browser.py` e `test_dashboard_browser.cjs`. O teste usa Chrome DevTools Protocol (CDP) com WebSocket nativo do Node, sem Playwright/Selenium e sem instalar pacotes.
- No Chrome real, pelo servidor HTTP local, conferi carga dos dados, KPIs, barras comparadas com agregação independente, tabela, filtros de categoria/cidade isolados e combinados, botões Limpar, estado vazio, ausência de `NaN`/`Infinity` e de exceções JavaScript, clique nas barras, `Enter`, `Espaço`, `aria-pressed` e uso de filtros por seta/Tab.
- Examinei capturas da versão redesignada em 1440×1100 e 390×844. No teste de viewport: desktop 1440 px sem overflow horizontal (documento 1425 px, incluindo a diferença da barra vertical); celular 390 px sem overflow (documento e corpo 390 px).
- Recalculei com `Decimal`, independentemente, `quantidade × preco_unitario`: R$ 20.059,00; categorias R$ 10.517,00, R$ 7.438,00 e R$ 2.104,00. Cruzei os 180 registros preparados com o CSV pelo ID e confirmei campos e valores. A soma por cidade também fecha em R$ 20.059,00.

## Comandos e resultados

Executados da raiz do workspace:

1. `& '.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram**, 0 falhas; inclui a integração no navegador. Evidência: saída desta execução e os dois testes em `projeto-dashboard/tests/`.
2. `node .\projeto-dashboard\tests\test_dashboard_browser.cjs` — **passou**; Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`; interações, teclado e viewports descritos acima.
3. `node --check .\projeto-dashboard\site\dashboard.js` e `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — ambos sem erro de sintaxe.
4. Smoke HTTP temporário — `/`, `/styles.css`, `/dashboard.js` e `/data/vendas.json` responderam HTTP 200. A execução CDP também carregou a página por HTTP.
5. Hashes da interface e dos testes conferidos com `Get-FileHash` e comparados ao relatório do Construtor.

Ambiente: Python 3.14.7, pandas 3.0.6, Node v24.21.0; Chrome, Edge e Firefox estão instalados em caminhos absolutos, embora não estejam no `PATH`. Playwright, Selenium e Pyppeteer não estão instalados. O Chrome encontrado e o WebSocket nativo do Node permitiram os testes sem instalação. Isso corrige a observação do Construtor de que não encontrou navegador via `Get-Command`.

## Limitações e encaminhamentos

- Todas as 9 combinações entre as 3 categorias e as 3 cidades têm registros nesta base. Para exercitar a renderização vazia e o botão correspondente, o teste adiciona temporariamente uma opção sintética sem correspondência; não altera arquivos nem dados. Portanto, o estado vazio foi exercitado, mas não é alcançável por combinações válidas dos filtros com os dados atuais.
- O wrapper Python pula o teste de navegador se Node/Chrome/Edge não estiverem disponíveis; nesse ambiente, o teste deve ser registrado como **PENDENTE**, não aprovado. O README não descreve esse requisito ambiental do teste automatizado; **Construtor** deve documentá-lo.
- **Defeito de documentação para o Construtor:** no README, os comandos de teste (linha 20) e servidor HTTP (linha 26) começam com `\.venv\...`, que é caminho absoluto da raiz da unidade no PowerShell e não existe (`Test-Path` falso). O comando de preparação na linha 10 usa corretamente `.\.venv\...` como caminho relativo. Corrigir os dois comandos para `.\.venv\...` e repetir a verificação usando os comandos documentados. Não editei o README, conforme o escopo do Tester.
- As três documentações `.agents/skills/explore-data/SKILL.md`, `.agents/skills/data-visualization/SKILL.md` e `.agents/skills/validate-data/SKILL.md` estão ausentes. Não foram utilizadas.
- Revisão independente do Revisor e aprovação conjunta permanecem pendentes.

## Status

**REPROVADO — Tester, por comandos inválidos no README.** Os testes de dados e navegador da versão identificada pelos hashes acima passaram quando executados com o caminho correto, mas as instruções documentadas para testar e iniciar o servidor não funcionam como escritas. Reencaminhado ao **Construtor** para corrigir README e devolver para nova validação. Ainda não representa aprovação do Revisor nem aprovação final do dashboard.
