# Verificação da análise da papelaria

## Avaliação geral: pronta para compartilhar, com ressalvas de escopo

Foram lidos e conferidos localmente `vendas_papelaria.csv`, `papelaria_limpa.csv`, `resumo.md` e `graficos.py`. Os recálculos foram executados com `.venv/Scripts/python.exe`, sem consultar integrações ou fontes externas.

## Recálculos e conferências

- **Arquivo original:** 182 linhas de dados e 8 colunas. Encontrei 2 linhas duplicadas exatas; depois de removê-las restam 180 vendas e 180 `id_venda` distintos.
- **Cópia limpa:** 180 linhas e 9 colunas. Conferi cada linha contra a primeira ocorrência correspondente no original: cidade, categoria, pagamento e `valor_venda` seguem as transformações descritas em `resumo.md`; não encontrei divergências.
- **Quantidade de vendas:** 180 registros (180 IDs distintos) na cópia limpa. Separadamente, a soma do campo `quantidade` é **548 itens**; esse número não é a contagem de vendas.
- **Total vendido:** recalculei linha a linha como `quantidade × preco_unitario`: **R$ 20.059,00**. A soma da coluna `valor_venda` também é R$ 20.059,00; nenhuma linha diverge do recálculo.
- **Efeito das duplicatas:** o total no arquivo original antes da deduplicação é R$ 20.066,00. As duas linhas exatas duplicadas somam R$ 7,00; removê-las reconcilia o total para R$ 20.059,00.
- **Soma por categoria:** Acessórios R$ 10.517,00 + Livros R$ 7.438,00 + Papelaria R$ 2.104,00 = **R$ 20.059,00**, igual ao total geral.
- Como conferência adicional, os totais por cidade também somam R$ 20.059,00: Campinas R$ 8.578,00, Santos R$ 6.937,50 e Sorocaba R$ 4.543,50.

## Código e gráficos

`graficos.py` lê explicitamente `papelaria_limpa.csv` (`CSV_PATH` na linha 9), converte `valor_venda` para número e soma essa métrica por categoria e por cidade. Portanto, usa a cópia limpa, não o original, e os agrupamentos conferem com os recálculos acima. Os gráficos têm títulos e rótulos em português, valores em reais e o eixo vertical começa em zero (`set_ylim(0, ...)`). O próprio código informa que valor vendido não representa lucro.

## Revisão de conclusões e correção

Os totais e as conclusões numéricas de `resumo.md` e dos gráficos estão corretos. Corrigi em `resumo.md` apenas a apresentação do total para o padrão monetário brasileiro: de `R$ 20059.00` para **`R$ 20.059,00`**. Não encontrei erros de cálculo nos gráficos ou na cópia limpa.

## Ressalvas

- “Quantidade de vendas” foi interpretada como número de registros/vendas, conforme a granularidade informada; a soma de `quantidade` representa itens vendidos.
- Os dados permitem conferir vendas registradas, mas não custos ou margem. Assim, **valor vendido não deve ser apresentado como lucro**.
- A verificação foi interna aos arquivos fornecidos; não houve comparação com registros financeiros externos.
