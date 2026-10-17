# Registro do Coordenador — rodada 08

## Status: **BLOQUEADO para aprovação conjunta**

## Versão examinada

Workspace Git na branch `main`. Hashes do produto atualizado:

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `4DF531C513E32F8BE26E5B632219092BB0787A36E252B3777F9BD4CF846B438E` |
| `site/styles.css` | `A0611222B0B92CCD3AFD01F02BF6090F82E9720952A9BFDD8E21C9C00108ABDB` |
| `site/dashboard.js` (inalterado) | `0E9D55AF9C48F42F146DD9EB80287036D825A4686064DC43DF9D2CF2F0022766` |
| `tests/test_dashboard_browser.cjs` | `1A39A072E70952779D72F7E48B7C14CB15A40768553059851F677EF1A7B8880C` |

## Alteração

- Atualizada a chamada no encerramento para “O seu próximo projeto pode começar aqui.”, acompanhada da frase sobre conhecer o trabalho e conversar sobre oportunidades.
- Os cartões agora dizem “Meu GitHub”, “Meu LinkedIn” e “Meu número para contato”; handles, número, destinos e layout dos três cartões foram mantidos.
- Ajustada a escala tipográfica para apresentar a chamada em duas linhas em telas largas, mantendo o formato responsivo existente.
- Ampliado o teste de navegador para conferir a mensagem e os rótulos junto das URLs anteriores.

## Comandos e evidências

- `& '.\.venv\Scripts\python.exe' -m unittest discover -s .\projeto-dashboard\tests -v` — **6 testes passaram**, incluindo Chrome/CDP.
- O navegador conferiu a chamada, rótulos, links, navegação, filtros, tabela, teclado e responsividade em 1440, 390 e 320 px; sem erros JavaScript/console.
- Capturas desktop/mobile conferidas em `%TEMP%\orbita-round08-evidence\dashboard-desktop-contacts.png` e `dashboard-mobile-contacts.png`.
- O servidor HTTP existente em `http://localhost:8000` continuou respondendo.

## Pendências

- Revisão independente da alteração e aprovação conjunta: **PENDENTES**. A execução dos testes pelo Coordenador não substitui Tester/Revisor.
- O usuário havia autorizado o uso do e-mail Git configurado, que é publicado no commit quando a alteração for enviada.

**Status: BLOQUEADO para aprovação conjunta.**
