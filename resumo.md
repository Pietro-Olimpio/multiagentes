# Tratamento de vendas da papelaria

## Visão geral e qualidade

- Arquivo de origem: `vendas_papelaria.csv` (preservado, sem alterações).
- Granularidade informada: uma linha por venda; `id_venda` é o identificador.
- Origem: **182 linhas e 8 colunas**.
- Após remover duplicatas exatas: **180 linhas**. A saída tem **9 colunas**, incluindo `valor_venda`.
- Período observado: 2026-01-01 a 2026-03-31.
- Ausências: somente `forma_pagamento`, com 4 valores vazios; nenhum campo estava vazio nas outras colunas.

### Problemas encontrados

- **2 linhas duplicadas exatas**, em 2 grupos. Os IDs repetidos eram `V0010` e `V0020`, cada qual representando a mesma linha duplicada; removida uma cópia de cada.
- **6 cidades com espaços nas extremidades** (2 registros para cada cidade: Campinas, Santos e Sorocaba); espaços removidos.
- **3 categorias** estavam como `acessórios` em minúsculas; padronizadas para `Acessórios`. As categorias finais são Livros, Papelaria e Acessórios.
- **4 pagamentos vazios**, substituídos por `Não informado`.
- `quantidade` e `preco_unitario` estavam preenchidos; ambos sem valores zero ou negativos. Quantidade: 1–5; preço unitário: 3,50–95,00.

## Tratamento aplicado

1. Mantidas as primeiras ocorrências e removidas somente as linhas integralmente idênticas nas colunas de origem; nenhum registro foi removido por divergência de conteúdo.
2. Removidos espaços no início/fim de `cidade`.
3. Padronizada a categoria por texto sem distinção de maiúsculas/minúsculas para `Livros`, `Papelaria` ou `Acessórios`.
4. Valores vazios em `forma_pagamento` preenchidos com `Não informado`.
5. Criada `valor_venda` como `quantidade × preco_unitario`, com duas casas decimais.

## Resultado

- Arquivo gerado: `papelaria_limpa.csv`.
- Total de vendas após limpeza: **R$ 20.059,00**.
- Categorias: Acessórios (65), Livros (54), Papelaria (61).
- Pagamentos: Cartão (52), Dinheiro (56), Não informado (4), Pix (68).
