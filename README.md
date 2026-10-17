# Multiagentes — análise e dashboard de vendas

Projeto educacional de análise reproduzível de vendas de papelaria. Contém os relatórios Markdown, as instruções de fluxo de trabalho, três skills reutilizáveis e um dashboard estático em português.

## Estrutura

- `AGENTS.md`: fluxo de trabalho para exploração, construção, testes e revisão.
- `.opencode/skills/`: `explore-data`, `data-visualization` e `validate-data`.
- `resumo.md`, `verificacao.md`: análise e validação da base.
- `projeto-dashboard/relatorios/`: histórico Markdown por rodada e relatório final.
- `projeto-dashboard/site/`: dashboard publicável em hospedagem estática.
- `projeto-dashboard/preparar_dados.py`: transforma `papelaria_limpa.csv` em JSON para o site.
- `projeto-dashboard/tests/`: testes dos dados e integração do dashboard no navegador.

O CSV original `vendas_papelaria.csv`, PNGs de análise, ambientes `.venv` e caches locais não são publicados. O CSV limpo e pequeno é mantido porque a preparação reproduzível depende dele.

## Requisitos

- Windows com PowerShell e Python 3.14.
- Node.js 24 ou superior e Chrome/Edge para a integração automatizada no navegador. Sem esses programas, o teste de navegador fica pendente.

## Preparar e testar

Na raiz do repositório:

```powershell
py -3.14 -m venv .venv
& '.\.venv\Scripts\python.exe' -m pip install -r .\requirements.txt
& '.\.venv\Scripts\python.exe' .\projeto-dashboard\preparar_dados.py
& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v
```

## Executar localmente

```powershell
& '.\.venv\Scripts\python.exe' -m http.server 8000 --directory .\projeto-dashboard\site
```

Abra <http://localhost:8000>. O conteúdo publicável é `projeto-dashboard/site/`.

## Acesso demonstrativo

A tela aceita qualquer e-mail válido e senha não vazia; não há autenticação em servidor. Credenciais de exemplo: `demo@orbita.com` / `orbita2026`. Não use senha real.

## Skills no OpenCode

As skills estão em `.opencode/skills/<nome>/skill.md`. O fluxo em `AGENTS.md` descreve os papéis, critérios e relatórios Markdown usados no projeto.