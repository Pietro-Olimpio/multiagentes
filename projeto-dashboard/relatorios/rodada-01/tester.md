# Relatório do Tester — rodada 01

## Versão examinada

- Repositório sem commit Git disponível.
- CSV solicitado `papelaria_limpa.csv`: SHA-256 `54B3DC935F673DFADAE68B2313186948F5C35A0FDC9A54DE81537BDF5F837621`.
- Teste `tests/test_source_baseline.py`: SHA-256 `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441`.
- Ainda não existe entrega do produto em `projeto-dashboard/`; por isso não há hashes de produto a examinar.

## Conferido/construído

- Criado `projeto-dashboard/tests/test_source_baseline.py` com verificações independentes da integridade do CSV, schema, 180 linhas, campos preenchidos, formatos/tipos parseáveis, unicidade de IDs, ausência de linhas duplicadas, total e totais por categoria recalculados por `quantidade × preco_unitario`, além de um pequeno caso de resultado conhecido.
- Verificações de integração com artefatos do construtor ainda não foram implementadas, pois os nomes, formatos e interfaces não foram entregues. Não foram presumidos contratos.
- As skills `.agents/skills/explore-data/SKILL.md`, `.agents/skills/data-visualization/SKILL.md` e `.agents/skills/validate-data/SKILL.md` estão ausentes; não foram utilizadas.

## Comandos, resultados e evidências

- `python -m unittest discover -s projeto-dashboard/tests -v` — **5 testes passaram**, 0 falharam. Evidência: saída do comando nesta execução; teste em `projeto-dashboard/tests/test_source_baseline.py`.
- Reexecução após ajuste cosmético: `$env:PYTHONDONTWRITEBYTECODE='1'; python -m unittest discover -s projeto-dashboard/tests -v` — **5 testes passaram**, 0 falharam.
- `Get-FileHash papelaria_limpa.csv -Algorithm SHA256` — hash igual ao baseline registrado no teste.
- Inspeção do ambiente: Python 3.14.7 e pandas 3.0.6 disponíveis; módulos `playwright` e `selenium` não encontrados.

## Problemas / próximos encaminhamentos

- **Construtor:** entregar produto e documentação/contratos. Após isso, adaptar e executar testes do pipeline, dados preparados, JSON/site, KPIs, gráficos, tabela, filtros isolados/combinados/vazios/limpar e HTTP/JavaScript.
- **Interface:** testes reais de navegador, responsividade e teclado estão **PENDENTES**. Playwright/Selenium não estão instalados; se não houver alternativa de navegador acessível após a entrega, registrar o bloqueio e o próximo passo.
- Ausência das skills informada ao coordenador.

## Status

**BLOQUEADO** — apenas os testes de baseline do CSV foram executados e passaram. A suíte obrigatória de produto, site e interação permanece **PENDENTE** até a entrega do construtor; nenhum status de aprovação é atribuído à versão do dashboard.
