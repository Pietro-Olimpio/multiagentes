# Relatório do Construtor — rodada 05

## Versão examinada

Workspace sem repositório Git/commit. SHA-256 da entrega e arquivos de controle:

| Arquivo | SHA-256 |
|---|---|
| `projeto-dashboard/site/index.html` | `B0D305870B0045FF04EEEDBE25CC771F7A134EC465AE5A8C3C693993344D6B34` |
| `projeto-dashboard/site/styles.css` | `1526FC9F888D71ED1A39318458ECEE45FA512694C1CF6BFC2840881CDB415672` |
| `projeto-dashboard/site/dashboard.js` | `DD89FABB34F10E23A15FC0FBFDA4CFD21A4164C4AA1A0FF512912B3C4DBB3F33` |
| `projeto-dashboard/site/favicon.svg` | `4D72C801BD9DC781A93B2C1E6EF02B6B9EA221F2FECC12A41FD1831160C5EB9A` |
| `projeto-dashboard/site/data/vendas.json` (inalterado) | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `projeto-dashboard/README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |
| `projeto-dashboard/preparar_dados.py` (inalterado) | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `projeto-dashboard/tests/test_source_baseline.py` | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `projeto-dashboard/tests/test_dashboard_browser.py` | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `projeto-dashboard/tests/test_dashboard_browser.cjs` | `48CB515CD8E45635AF2DE1F358B2B50912EE3961B400D1FBE419ACD89EF9931C` |

Não alterei CSV, JSON preparado, pipeline, testes ou relatórios anteriores. `relatorios/FINAL.md` não foi modificado.

## Construído e alterado

- Adicionado `site/favicon.svg`: ícone vetorial original da Órbita, com fundo escuro, círculo da marca, letra “ó” e órbita coral/ciano; incluído no HTML como favicon estático.
- Comparativos: removida dependência de `Intl` compact currency. Novo helper explícito em pt-BR apresenta moeda nos ticks e rótulos de barra, por exemplo `R$ 5 mil` ou `R$ 850,00`; a área do eixo foi ampliada e a tipografia ajustada para celular. `title`/tooltip das barras mantém o valor BRL exato. A tabela continua exibindo valores integrais com centavos, sem abreviação. Não foi introduzida linguagem que confunda valor vendido com lucro.
- Detalhamento: adicionado campo de busca acessível, responsivo e operável pelo teclado. Busca por ID, data ISO/localizada, produto, categoria, cidade, quantidade e valor (incluindo formato BRL); remove acentos e ignora maiúsculas/minúsculas. A busca é combinada com categoria/cidade e filtros das barras na mesma seleção de linhas usada por KPIs, gráficos, contagem e tabela. Rerenders preservam a busca; os dois comandos de limpar zeram busca e selects; busca vazia mostra estado sem resultados.
- Direção de movimento: semântica e identidade Órbita preservadas, com luz radial que acompanha levemente o ponteiro no hero, movimento orbital discreto, reveals por `IntersectionObserver`, entrada/animações de dados e hover. Sem WebGL, dependências novas ou assets/conteúdo da Lusion. Efeitos seguem `prefers-reduced-motion`; o JS evita observers/parallax nessa preferência.
- README mantém os comandos de teste e servidor com caminhos relativos PowerShell, corrigidos na rodada 04.

## Referência visual e recursos

- Consultei diretamente `https://lusion.co/` por `webfetch`. A página descreve experiências digitais e narrativas visuais interativas com design, motion e 3D, com alto impacto e tipografia expressiva. Usei apenas esses princípios gerais para luz, movimento e hierarquia; não copiei texto, marca, assets nem efeitos WebGL.
- O arquivo opcional `httpslusionco.txt` não existe na workspace (`Test-Path` retornou `False`). Não bloqueou o trabalho porque a URL direta estava acessível.
- `.agents/skills/**/SKILL.md` não foi encontrado; skills não foram declaradas como utilizadas.

## Comandos e checagens

- `node --check .\projeto-dashboard\site\dashboard.js` — passou.
- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram**, incluindo integração real no Chrome, sem falhas.
- Smoke HTTP em servidor temporário na porta 8769 — `/`, `/styles.css`, `/dashboard.js`, `/data/vendas.json` e `/favicon.svg`: todos HTTP 200; favicon respondeu `image/svg+xml`; servidor encerrado ao fim.
- Chrome real: a suíte existente cobriu login demonstrativo, valores de exemplo, fluxo de sessão, KPIs, totais e tooltips de barra, filtros, estado vazio, teclado, movimento reduzido e viewports desktop/mobile.
- Verificações complementares do detalhamento/comparativos executadas no mesmo teste de navegador com as asserções inseridas somente em memória (arquivos de teste não editados): busca individual por ID, data, produto, categoria, cidade, quantidade e valor; busca combinada com categoria/cidade; seleção preservada no rerender; KPI/contagem/tabela/gráficos coerentes; limpar filtros e limpar estado vazio zeram busca; busca sem resultado; todos os eixos e rótulos de barra começam com prefixo BRL.
- Reexecução do teste de navegador com `prefers-reduced-motion: no-preference` substituído apenas no harness em memória: animações de entrada, gráfico e transição estavam ativas e a suíte manteve desktop/mobile sem overflow. A suíte padrão também passou com movimento reduzido emulado.
- Busca de arquivo e inspeção de hashes confirmaram `httpslusionco.txt` ausente e dados/pipeline/testes fora das alterações do Construtor.

## Pendências e encaminhamento

- **Tester:** retestar a versão/hash desta rodada, especialmente busca por cada campo e combinada com selects/barras, limpar/estado vazio, unidade monetária em telas estreitas, favicon HTTP e movimento normal/reduzido. As verificações de busca/currency acima foram complementares em memória; não alterei a suíte para acrescentar esses casos.
- **Revisor:** revisão independente da hierarquia visual/motion inspirada apenas em princípios gerais da referência, legibilidade/contraste, parallax/reveals, operação acessível da busca e ausência de assets copiados.
- A suíte executada passou, mas as aprovações independentes do Tester e Revisor ainda estão pendentes; não atribuo aprovação conjunta.

## Status

**BLOQUEADO para aprovação conjunta / entregue para reteste e revisão.** `node --check`, seis testes disponíveis e smoke HTTP passaram. Próximo passo: Tester e Revisor examinarem esta mesma versão/hash; depois o coordenador registra o estado conjunto em `FINAL.md`.
