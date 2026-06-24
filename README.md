# Portal Felipe Tommy — Painel Unificado

Painel de publicação e distribuição do [Portal Felipe Tommy](https://felipetommy.com.br).

No ar em: https://felipetommy-create.github.io/portal-felipe-tommy/

## O que faz
- Carrega o JSON gerado pelo Claude e revisa os campos (com botão Copiar).
- Publica a matéria no WordPress via API REST.
- Gera roteiro de vídeo, legenda para redes sociais e conteúdo para o canal do WhatsApp.
- Gera link curto do próprio domínio (`felipetommy.com.br/r/{id}`).
- Gerencia os grupos de WhatsApp e o progresso de encaminhamento (sincronizado via Supabase).

## Estrutura
- `index.html` — a aplicação inteira (HTML + CSS + JS em um arquivo só).

Banco de dados: Supabase. Hospedagem: GitHub Pages.
