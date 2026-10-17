# Painel de vendas da papelaria

O painel usa `papelaria_limpa.csv` na raiz do projeto. Cada linha representa uma venda (`id_venda`); quantidade de vendas é a contagem de registros/IDs, e ticket médio é o valor total vendido dividido por essa contagem. Valor vendido não é lucro.

## Preparar os dados

No PowerShell, na pasta raiz do projeto:

```powershell
.\.venv\Scripts\python.exe .\projeto-dashboard\preparar_dados.py
```

O script valida colunas, campos preenchidos, IDs únicos, valores positivos e a relação entre quantidade, preço e valor vendido. Ele não altera o CSV de entrada nem remove linhas; grava os dados processados em `projeto-dashboard/site/data/vendas.json`.

## Testar e abrir

Com o Python do ambiente virtual, execute a suíte disponibilizada na pasta `projeto-dashboard/tests`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s .\projeto-dashboard\tests -v
```

Para servir o site localmente (não abra `index.html` diretamente, pois os dados são carregados por HTTP):

```powershell
.\.venv\Scripts\python.exe -m http.server 8000 --directory .\projeto-dashboard\site
```

Abra <http://localhost:8000>. Para publicar em hospedagem estática, use somente a pasta `projeto-dashboard/site/`; rode primeiro a preparação dos dados.
