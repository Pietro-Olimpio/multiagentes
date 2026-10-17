# Relatório do Tester — rodada 04

## Versão examinada

Workspace sem commit Git. Os hashes de produto abaixo conferem com `relatorios/rodada-04/construtor.md`. O Tester alterou somente `tests/test_dashboard_browser.cjs` para adaptar e ampliar a integração com o novo gate; nenhum arquivo de produto foi editado.

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `5BBD0CD0588A6CF514F6EBDA9C1F2363FF5755065304D46A8F8829082A519CDD` |
| `site/styles.css` | `51819819365905C6FFBAD08587272FB9559EF0342D91246350593C1B14F6FE78` |
| `site/dashboard.js` | `164AAB3D45D3E8F2D3B95839F1C97CF967FF98EE4EE3268935040EA53164E526` |
| `README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |
| `site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `preparar_dados.py` | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `tests/test_dashboard_browser.cjs` (atualizado pelo Tester) | `48CB515CD8E45635AF2DE1F358B2B50912EE3961B400D1FBE419ACD89EF9931C` |

## Testes e alterações

O teste anterior ia direto aos KPIs, portanto falhava corretamente quando a nova tela de boas-vindas ocultava o painel. Atualizei o percurso para começar pelo gate, ler as credenciais demonstrativas visíveis e entrar usando `demo@orbita.com` / `orbita2026`. **Não removi nem afrouxei os critérios anteriores**; acrescentei verificações de login, armazenamento da sessão, refresh/logout e movimento reduzido.

No Chrome real via CDP, o teste confirmou:

- As credenciais exibidas são exatamente `demo@orbita.com` e `orbita2026`, e ficam logo após o formulário. Tentativas com formulário vazio, e-mail inválido e senha vazia não liberam o dashboard, não criam sessão nem requisitam o JSON. As credenciais de exemplo permitem entrar pelo botão.
- Após entrar, `sessionStorage` contém somente `orbita-demo-access=1`; `localStorage` permanece vazio e a senha é limpa. Refresh mantém a sessão da aba; logout limpa o marcador e os campos; refresh após logout volta ao gate sem requisitar dados.
- O JSON HTTP alimenta os KPIs, todos os totais de barras e todas as células da tabela; cálculos esperados são recalculados separadamente no teste. Filtros de categoria e cidade isolados, combinados, estado vazio e ambas as ações de limpar sincronizam o painel. Não aparece `NaN`/`Infinity`.
- Barras respondem a clique, `Enter` e `Espaço`, atualizam `aria-pressed` e alternam o filtro. Os selects respondem a seta e ordem de foco por `Tab`.
- `Runtime.exceptionThrown` e erros da API `console.error` permaneceram vazios. `index`, CSS, JS e JSON carregam por HTTP.
- Chrome emula `prefers-reduced-motion: reduce`; o teste confirma `matchMedia` e durações reduzidas na tela de entrada, nas barras e nos cartões.
- Viewports emulados: gate e painel em 1440×1100 e 390×844. Sem overflow horizontal: painel desktop `documentWidth=1425` para viewport de 1440; mobile `documentWidth=390` para viewport de 390.
- Revisei capturas da tela de entrada e do dashboard em desktop e celular; textos dos filtros, KPIs e rótulos dos gráficos estão visíveis nas capturas. Evidências PNG temporárias: `%TEMP%\orbita-round04-evidence\gate-desktop.png`, `gate-mobile.png`, `dashboard-desktop.png`, `dashboard-mobile.png` e `dashboard-mobile-chart.png`.

Há registros em todas as 9 combinações das 3 categorias e 3 cidades. Portanto, para cobrir a renderização sem resultados, o teste acrescenta uma opção sintética temporária ao select; o dado preparado e os arquivos não são alterados. A interface lida com o estado vazio, mas essa seleção não é alcançável com opções válidas nesta amostra.

## Comandos e resultados

Ambiente real: Python 3.14.7, pandas 3.0.6, Node v24.21.0 e Chrome instalado em `C:\Program Files\Google\Chrome\Application\chrome.exe` (também há Edge instalado). Chrome não está no `PATH`; foi usado pelo caminho absoluto via CDP/WebSocket nativo do Node. Playwright e Selenium não estão instalados e nenhum pacote foi instalado.

1. Comando de preparação do README, `& '.\.venv\Scripts\python.exe' .\projeto-dashboard\preparar_dados.py` — sucesso: 180 vendas e R$ 20.059,00. O hash do JSON permaneceu igual ao da versão entregue.
2. Comando de testes do README, `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram, 0 falhas**. O teste de navegador executou dentro da suíte; o baseline independente também passou.
3. Comando do servidor do README, `-m http.server 8000 --directory .\projeto-dashboard\site`, iniciado com o Python virtual e encerrado ao final — `/`, `/styles.css`, `/dashboard.js` e `/data/vendas.json` retornaram HTTP 200 com conteúdo.
4. `node .\projeto-dashboard\tests\test_dashboard_browser.cjs` — passou diretamente, com evidência detalhada na saída do comando.
5. `node --check .\projeto-dashboard\site\dashboard.js` e `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — ambos sem erro de sintaxe.
6. `Get-FileHash` — hashes acima conferidos; hashes da interface, JSON e README correspondem à entrega do Construtor.

## Problemas, pendências e encaminhamento

- O teste vazio precisa da opção sintética porque nenhuma combinação real de filtros resulta vazia; limitação de dados, não falha do produto. Informada ao Revisor para considerar ao verificar os estados vazios.
- Os documentos `.agents/skills/explore-data/SKILL.md`, `.agents/skills/data-visualization/SKILL.md` e `.agents/skills/validate-data/SKILL.md` continuam ausentes; nenhuma skill foi declarada como utilizada.
- Revisão independente do Revisor e aprovação conjunta continuam pendentes.
- Teste em aparelhos físicos: **PENDENTE**; viewports desktop/mobile e `prefers-reduced-motion` foram emulados no Chrome via CDP, cobrindo os critérios responsivos possíveis neste ambiente. A revisão visual independente do Revisor também permanece pendente.

## Status

**APROVADO — Tester para os hashes de produto acima.** Comandos corrigidos do README foram executados, a suíte inteira passou e as novas verificações do gate foram executadas no Chrome. A aprovação do Tester não substitui a revisão do Revisor nem a aprovação conjunta/final.
