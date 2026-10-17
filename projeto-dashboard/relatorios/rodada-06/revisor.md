# Relatório do Revisor — rodada 06

## Versão examinada

Workspace sem repositório Git/commit. Recalculei SHA-256 depois da suíte; os arquivos do produto coincidem com os relatórios do Construtor e do Tester. O teste CJS coincide com a versão ampliada pelo Tester. Assim, esta revisão e o reteste referem-se aos mesmos hashes de produto.

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `B0D305870B0045FF04EEEDBE25CC771F7A134EC465AE5A8C3C693993344D6B34` |
| `site/styles.css` | `E7643BBE41CF73E69F2B5F755E335D515AFFFE6221B89782D45BA4BA3EDAFB11` |
| `site/dashboard.js` | `2485BB7695336FAFA100DAF25AB2BEE900012C39A607AAA049352E1CE297AD32` |
| `site/favicon.svg` | `4D72C801BD9DC781A93B2C1E6EF02B6B9EA221F2FECC12A41FD1831160C5EB9A` |
| `site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `preparar_dados.py` | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `tests/test_dashboard_browser.cjs` | `E623C2EDF4433688755287CEC970AC2C78A0EE389210A100211C1B0FF4AD4DE3` |
| `tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |

## O que foi conferido

- Revisei o HTML, CSS, JavaScript, favicon, pipeline, dados preparados, os três testes e os relatórios do Construtor/Tester das rodadas 05 e 06. Não editei produto nem testes.
- Consultei diretamente `https://lusion.co/` por HTTP. A referência apresenta experiências interativas com hierarquia tipográfica expressiva, luz, movimento e narrativa visual. A entrega usa princípios gerais compatíveis, preserva marca/conteúdo próprios da Órbita e não replica assets ou composição específica. `httpslusionco.txt` está ausente; isso não impediu a consulta direta.
- Login demonstrativo: o HTML explica que não há autenticação real e que qualquer e-mail válido/senha não vazia permite acesso. O teste em Chrome confirma credenciais exibidas, recusas para campos vazios/e-mail inválido, ausência de busca dos dados antes do login, armazenamento somente do marcador em `sessionStorage`, refresh e logout.
- Filtros e busca: confirmei no código e na suíte que busca é combinada com categoria/cidade e filtros acionados por barras; atualizar seleção mantém os demais critérios. Estados vazios e ações de limpar recalculam juntos KPIs, gráficos, contagem e tabela.
- Moeda e gráficos: texto visível nas barras corresponde ao total BRL exato, inclusive centavos; no mobile o `R$` e o valor integral são apresentados em linhas empilhadas. `title` e `aria-label` também preservam o total exato. Os ticks usam abreviação legível com prefixo/unidade BRL (por exemplo `R$ 10,5 mil`), não uma moeda sem identificação. A suíte testa texto, geometria, alinhamento, corte e sobreposição em desktop, mobile e largura estreita.
- Favicon: declarado no HTML, servido em HTTP como `image/svg+xml`, parseável e com a marca vetorial esperada.
- Teclado/acessibilidade: barras são controles focáveis com nome acessível, `aria-pressed` e ativação por Enter/Espaço; filtros nativos funcionam por teclado e há foco visível nos controles. Busca tem label, instrução de campos pesquisáveis e `aria-controls`; tabela tem cabeçalhos de coluna. O estado vazio usa região de status. Movimento normal/reduzido foi exercitado no Chrome; conteúdo não fica oculto no modo reduzido.
- Contraste: conferi as cores de texto em fundos representativos definidos no CSS. Pares observados: texto suave `#91a1a8`/painel `#111c26` = 6,46:1; rótulos de gráfico `#c2cdd1`/painel = 10,63:1; ticks `#b3c2c6`/painel = 9,40:1; placeholder `#74858d`/campo `#0b141c` = 4,85:1; texto discreto do rodapé `#778891`/fundo `#0b121a` = 5,12:1. Os pares de texto pequeno amostrados atendem AA; isso não substitui auditoria completa com leitor de tela.
- Inspecionei as capturas do Tester em `%TEMP%\orbita-round06-evidence\`: gate mobile, dashboard desktop e gráficos em 390/320 px. Rótulos exatos estão legíveis e dentro da área dos gráficos; não observei corte ou overflow nas capturas.
- Integridade dos dados: suíte confirmou hash do CSV original, esquema, 180 linhas, campos presentes, IDs e exemplo conhecido. Checagem independente somente de leitura comparou linha a linha CSV e JSON preparado: 180 registros, 9 colunas, sem valores ausentes, IDs únicos e valores preservados. Recalculei a partir de quantidade × preço: total `R$ 20.059,00`; categorias Acessórios `R$ 10.517,00`, Livros `R$ 7.438,00`, Papelaria `R$ 2.104,00`.

## Comandos, resultados e evidências

- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram, 0 falhas**. Executou o baseline independente e o teste de integração em Chrome real/CDP. Evidência inclui login/sessão, busca e filtros combinados, botões/barras por teclado, precisão monetária, favicon, viewports e console.
- `node --check .\projeto-dashboard\site\dashboard.js` e `node --check .\projeto-dashboard\tests\test_dashboard_browser.cjs` — ambos passaram.
- Checagem Python independente CSV↔JSON (somente leitura) — passou; comando executado via `.venv\Scripts\python.exe`, saída `JSON↔CSV: 180 linhas/9 colunas ... total independente=20059.00`.
- O teste browser verificou HTTP 200 para HTML/CSS/JS/JSON/favicon, dimensões 1440/390/320 px (sem overflow), ausência de exceções JavaScript e `console.error`, além de movimento normal/reduzido. Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Capturas disponíveis: `%TEMP%\orbita-round06-evidence\dashboard-desktop.png`, `dashboard-mobile-chart.png`, `dashboard-mobile-320-chart.png`, `dashboard-mobile.png`, `gate-desktop.png` e `gate-mobile.png`.
- `Get-FileHash ... -Algorithm SHA256` após os testes — confirmou os hashes da tabela; versão sem commit.

## Problemas, limitações e encaminhamento

- Não encontrei bug reproduzível nesta versão; nenhuma correção é encaminhada ao Construtor ou Tester.
- Testes em aparelhos físicos e auditoria com tecnologia assistiva/leitor de tela não foram executados; ficam **PENDENTES** como verificações adicionais. Não são bloqueadores dos critérios obrigatórios verificados em Chrome real, teclado, emulação responsiva e conferência de contraste.
- Os arquivos `.agents/skills/{explore-data,data-visualization,validate-data}/SKILL.md` não existem neste workspace e não foram declarados como utilizados.
- O status deste relatório é somente a revisão independente; não representa aprovação conjunta nem altera `relatorios/FINAL.md`.

## Status

**APROVADO — Revisor, para os hashes listados.** Hashes conferidos na mesma versão retestada; suíte obrigatória disponível executada integralmente, com sucesso. Sem pendência bloqueadora identificada nesta revisão.
