# Relatório final — dashboard Órbita

## Status conjunto: **BLOQUEADO**

A rodada 07 acrescentou navegação e movimento cinematográfico em SVG/CSS nativos. Na rodada 08, o encerramento foi atualizado com a mensagem “O seu próximo projeto pode começar aqui.” e os links foram rotulados como “Meu GitHub”, “Meu LinkedIn” e “Meu número para contato”. Os testes locais passaram; a aprovação conjunta permanece bloqueada porque não foi possível obter revisão independente desta rodada.

## Versão examinada

| Arquivo | SHA-256 |
|---|---|
| `site/index.html` | `4DF531C513E32F8BE26E5B632219092BB0787A36E252B3777F9BD4CF846B438E` |
| `site/styles.css` | `A0611222B0B92CCD3AFD01F02BF6090F82E9720952A9BFDD8E21C9C00108ABDB` |
| `site/dashboard.js` | `0E9D55AF9C48F42F146DD9EB80287036D825A4686064DC43DF9D2CF2F0022766` |
| `tests/test_dashboard_browser.cjs` | `1A39A072E70952779D72F7E48B7C14CB15A40768553059851F677EF1A7B8880C` |

## Entrega e testes locais

- Preservada a stack estática HTML/CSS/JS e a funcionalidade do painel. SVG/CSS entregam profundidade; não foi adicionado WebGL/dependência pesada.
- Links finais: `https://github.com/Pietro-Olimpio`, `https://www.linkedin.com/in/pietro-correa` e `https://wa.me/551999572812`.
- Suíte executada pelo Coordenador na rodada 08: **6/6 passaram**, incluindo Chrome/CDP. O teste verifica também o texto da chamada e os três rótulos de contato. HTTP, teclado, movimento reduzido e viewports 1440/390/320 passaram.
- Capturas visuais da versão atual estão em `%TEMP%\orbita-round08-evidence\`.
- Relatório desta alteração: `relatorios/rodada-08/coordenador.md`. Revisão independente desta rodada e aprovação conjunta: **PENDENTES**.

## Abrir o site

O servidor HTTP já iniciado responde em <http://localhost:8000>. Para iniciar novamente, na raiz do workspace e no PowerShell:

```powershell
& '.\.venv\Scripts\python.exe' -m http.server 8000 --directory .\projeto-dashboard\site
```

A pasta publicável é `projeto-dashboard/site/`.
