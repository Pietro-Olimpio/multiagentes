# Relatório do Construtor — rodada 04

## Versão examinada

Workspace sem repositório Git/commit. SHA-256 dos arquivos relevantes da entrega:

| Arquivo | SHA-256 |
|---|---|
| `projeto-dashboard/site/index.html` | `5BBD0CD0588A6CF514F6EBDA9C1F2363FF5755065304D46A8F8829082A519CDD` |
| `projeto-dashboard/site/styles.css` | `51819819365905C6FFBAD08587272FB9559EF0342D91246350593C1B14F6FE78` |
| `projeto-dashboard/site/dashboard.js` (inalterado) | `164AAB3D45D3E8F2D3B95839F1C97CF967FF98EE4EE3268935040EA53164E526` |
| `projeto-dashboard/README.md` | `6A1D6038A8E63CF1E145FB741F50E2B24C78B07C3E6F306CCBDF7B0F0A9501E1` |
| `projeto-dashboard/site/data/vendas.json` (inalterado) | `0CC873CE9C6E13A6F9DC1D4653C2EE22B5B444E471B07CEBB98EAAF86A66D694` |
| `projeto-dashboard/preparar_dados.py` (inalterado) | `AE049773EEEAAA7299F50107948A38CA7B51E9AECD0F054F7BA17AFA1FD50845` |
| `projeto-dashboard/tests/test_source_baseline.py` (inalterado) | `F2ED0ECD71393463C405DCC3BE948AEFBAD29128178E79536CF1A9E5AF0A4441` |
| `projeto-dashboard/tests/test_dashboard_browser.py` (inalterado) | `54A9BC004ADF6DCC82C6A134D03E599D8FA67B26DB0FD9805D3F2576977B9394` |
| `projeto-dashboard/tests/test_dashboard_browser.cjs` (inalterado) | `FAD3FDEF7B9DD97B518D15EAB5DD9E75A7C6B043230F77AE9C4A8E5693C32FCA` |

## Construído e alterado

- `site/index.html`: adicionado, diretamente abaixo do formulário/botão, bloco visual com as credenciais demonstrativas `demo@orbita.com` e `orbita2026`, em texto selecionável. Não há botão extra.
- `site/styles.css`: estilos integrados ao cartão e tema escuro para o bloco de credenciais; não há regra que impeça seleção de texto.
- `README.md`: corrigidos os caminhos dos comandos de teste e servidor de `\.venv\...` para `\.\.venv\...`, relativos à raiz PowerShell, como já estava no comando de preparação.
- O aviso de demonstração foi mantido: o site estático não valida credenciais em servidor, qualquer e-mail válido/senha não vazia permite entrar e não se deve usar senha real. Os valores de exemplo não são credenciais de servidor e o fluxo `sessionStorage` não foi alterado.
- Não alterei JavaScript, dados, pipeline ou testes. `relatorios/FINAL.md` não foi tocado.

## Comandos e checagens

- `node --check .\projeto-dashboard\site\dashboard.js` — passou.
- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -p test_source_baseline.py -v` — 5 testes passaram.
- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **5 passaram, 1 falhou**. O teste `test_dashboard_interactions_in_real_browser` ainda navega esperando o dashboard sem preencher o gate demonstrativo e falha antes das verificações do painel (`Dashboard/dados não carregaram pelo navegador via HTTP`). Os testes não foram editados.
- Chrome real: executei o teste de navegador existente com um passo de autenticação inserido somente em memória. Verifiquei bloco diretamente abaixo do formulário, valores exatos e seleção/cópia natural do texto; preenchi o formulário usando esses próprios valores. A entrada funcionou e passaram então as verificações do teste para KPIs, tabela, barras, filtros isolados/combinados/vazios, limpar, teclado, ausência de erros JS e viewport desktop/mobile. Esta execução direcionada não substitui a suíte padrão que continua falhando sem o login.
- Smoke test HTTP com servidor temporário na porta 8767 — `/`, `/styles.css`, `/dashboard.js` e `/data/vendas.json`: HTTP 200; servidor encerrado ao final.
- Inspeção do README confirmou que os comandos de preparação, testes e servidor usam o mesmo prefixo relativo PowerShell.
- Busca por `.agents/skills/**/SKILL.md` não encontrou documentação; nenhuma skill foi declarada como utilizada.

## Pendências e encaminhamento

- **Tester:** retestar esta versão/hash e atualizar o percurso do teste de navegador para preencher os valores demonstrativos visíveis antes de validar o dashboard. Manter as verificações existentes; não remover nem enfraquecer critérios. A suíte padrão permanece com uma falha reproduzível até essa integração atravessar o gate.
- **Revisor:** conferir o bloco no tema escuro, seleção/cópia, legibilidade e posição em telas pequenas e grandes; verificar que o aviso de ausência de autenticação real continua claro.
- Não há aprovação conjunta nesta rodada.

## Status

**BLOQUEADO para aprovação conjunta / entregue ao Tester e Revisor.** Os valores foram verificados no Chrome e funcionam com o gate demonstrativo; sintaxe, testes de baseline e smoke HTTP passaram. A suíte completa padrão continua falhando porque o teste de navegador não realiza o login requerido. Próximo passo: Tester atualizar/executar a integração sobre estes hashes e Revisor revisar a mesma versão.
