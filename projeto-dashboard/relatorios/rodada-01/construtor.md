# Relatório do Construtor — rodada 01

## Versão examinada

Entrega da rodada 01 (sem commit; workspace não é repositório Git). SHA-256 dos arquivos de produto:

| Arquivo | SHA-256 |
|---|---|
| `projeto-dashboard/preparar_dados.py` | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `projeto-dashboard/README.md` | `56DB20E1A05BB180DD280C4574FB90BA1FA79207B9F71FB644BB21E6603F27FF` |
| `projeto-dashboard/site/index.html` | `820CBB6D1B04FCAC11E2A285CD6737A90E04F3E817A64B1A8D401472E0070C84` |
| `projeto-dashboard/site/styles.css` | `3A25E5440A7BBC651A4FB122703D3B46D13E2E8B3C896C2E59AB443BC2FCA80E` |
| `projeto-dashboard/site/dashboard.js` | `094FC0AA1EFDA0C82DB88523780CE66510F60701C80C9499A9011F6B711CECE9` |
| `projeto-dashboard/site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |

Fonte escolhida: `papelaria_limpa.csv` na raiz. Original e cópia limpa foram preservados. Consulta a `resumo.md` e `verificacao.md`: granularidade de uma linha por venda, 180 IDs únicos, total vendido de R$ 20.059,00, 548 itens (não confundir com vendas), duplicatas previamente removidas na limpeza e limitações de escopo documentadas. A busca por `.agents/skills/*/SKILL.md` não encontrou os arquivos das skills `explore-data`, `data-visualization` e `validate-data`; portanto, elas não foram declaradas como utilizadas.

## Construído

- `preparar_dados.py` lê o CSV limpo por caminho relativo à raiz, valida colunas/campos/tipos/IDs e `quantidade × preco_unitario`, recalcula `valor_venda` e grava `site/data/vendas.json`. Não altera a fonte nem remove linhas.
- `site/index.html`, `styles.css` e `dashboard.js`: painel estático em português com os três KPIs definidos, dois gráficos de barras comparativos (categoria/cidade, base zero), tabela, filtros combináveis, ação para limpar, estado sem resultados, formato pt-BR, uso por teclado e layout adaptável. Valores vendidos não são chamados de lucro.
- `README.md`: comandos PowerShell para preparar dados, rodar a suíte destinada a `projeto-dashboard/tests` e servir `site/` via HTTP local; identifica `site/` como pasta publicável.

## Comandos executados e evidências

1. `& '.venv/Scripts/python.exe' '.\projeto-dashboard\preparar_dados.py'` — sucesso: 180 vendas preparadas; total exibido R$ 20.059,00. Evidência: `site/data/vendas.json`.
2. Leitura independente do JSON com Python: confirmou 180 registros, 180 IDs únicos, soma 20.059,00 e igualdade de cada valor com quantidade × preço — sucesso.
3. `node --check '.\projeto-dashboard\site\dashboard.js'` — sucesso, sem erro de sintaxe.
4. Servidor HTTP temporário iniciado com `ThreadingHTTPServer` e requisições a `/` e `/data/vendas.json` — ambos HTTP 200; HTML e JSON recebidos. Servidor encerrado ao fim do comando.

## Pendências e encaminhamento

- Testes formais da suíte, recalculações independentes do tester, filtros no navegador, estado combinado/vazio, ausência de `NaN`, acessibilidade com teclado, responsividade visual em dispositivos reais e revisão independente: **PENDENTES**, para Tester e Revisor. O teste HTTP foi apenas smoke test, não substitui interação real no navegador.
- O README já documenta o comando de testes que o Tester deve disponibilizar em `projeto-dashboard/tests`; até lá, esse comando ainda não foi executado.
- Após qualquer ajuste de produto, regenerar dados se necessário e atualizar hashes; repetir verificações afetadas.

## Status

**BLOQUEADO** para aprovação conjunta: implementação e smoke checks concluídos, mas testes obrigatórios de interface e aprovações do Tester/Revisor ainda estão pendentes. Próximo passo: entregar esta versão ao Tester para execução da suíte e, após aprovação, ao Revisor.

## Revisão visual profissional

Refinamento visual aplicado após a primeira entrega, sem alterar estrutura HTML, IDs, eventos ou lógica de dados. A revisão ficou concentrada em `site/styles.css`: paleta noturna mais coesa com acentos contidos, hierarquia tipográfica e espaçamento mais claros, painéis com profundidade sutil, controles e estados de foco mais visíveis, KPIs e gráficos com melhor distinção, tabela mais legível e ajustes de breakpoint para celular. Mantidos movimento reduzido, navegação por teclado e rótulos/ARIA existentes. O markup e o JavaScript foram lidos e preservados.

### Hashes da versão após a revisão visual

| Arquivo | SHA-256 |
|---|---|
| `projeto-dashboard/site/index.html` | `820CBB6D1B04FCAC11E2A285CD6737A90E04F3E817A64B1A8D401472E0070C84` |
| `projeto-dashboard/site/styles.css` | `89C6EE66B2045D25740FC8B9E3866F185E6C8372E4E1D8D25B5736FE8460B1A4` |
| `projeto-dashboard/site/dashboard.js` | `094FC0AA1EFDA0C82DB88523780CE66510F60701C80C9499A9011F6B711CECE9` |
| `projeto-dashboard/site/data/vendas.json` | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |

### Checagens desta revisão

- `node --check '.\projeto-dashboard\site\dashboard.js'` — sucesso. A lógica JS não foi alterada.
- Smoke test com servidor HTTP Python temporário para `/`, `/styles.css`, `/dashboard.js` e `/data/vendas.json` — todos responderam HTTP 200; a checagem confirmou regras de breakpoint mobile e `:focus-visible` no CSS. Servidor encerrado ao fim do comando.
- Checagem Python via here-string no PowerShell — sucesso: 11 IDs essenciais continuam no HTML e seus seletores continuam no JS; breakpoint mobile, foco visível e movimento reduzido continuam declarados. Duas tentativas anteriores do mesmo check em `-c` falharam por escape de aspas do PowerShell, não por falha do produto; a checagem foi repetida com here-string.
- Inspeção visual automatizada em navegador, teclado real e testes funcionais após mudança de CSS: **PENDENTES**; não há evidência de navegador nesta execução.
- Skills em `.agents/skills/` continuam ausentes; nenhuma foi declarada como usada.

### Status desta revisão

**PENDENTE DE RE-TESTE.** A alteração foi visual/CSS e preserva estrutura e lógica, mas a versão atual deve retornar ao Tester para reexecutar os testes responsivos e de acessibilidade/teclado; a inspeção do Revisor também deve considerar estes novos hashes. A aprovação conjunta continua bloqueada até a conclusão dessas verificações.
