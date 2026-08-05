# PDF do documento FLUXO-CRM.md (completo, com identidade HR Imóveis)

## Objetivo

Gerar `FLUXO-CRM.pdf` — versão PDF profissional e 100% fiel ao conteúdo de `docs/FLUXO-CRM.md` (282 linhas, todas as 6 seções) — para compartilhar com o time e com a equipe do outro CRM. Entregue em `/mnt/documents` para download.

## Formato do PDF

- **Capa**: título "Fluxo do CRM — HR Imóveis", subtítulo de especificação comercial, logo HR Imóveis e data.
- **Sumário** com as 6 seções numeradas.
- **Conteúdo integral**: todas as seções, tabelas (etapas dos funis, SLA, motivos de perda, modelo de dados), diagrama ASCII da jornada em bloco monoespaçado, listas e checklist final de regras de negócio.
- **Estilo**: tipografia limpa, tabelas com cabeçalho destacado, cabeçalho/rodapé com identidade HR Imóveis (logo preto + número de página), cores da marca (dourado/preto do kit da marca).
- Tamanho A4, margens confortáveis para impressão.

## Detalhes técnicos

- Conversão: markdown → HTML (Python `markdown`) → PDF via Chromium headless (Playwright `page.pdf()`), que renderiza tabelas, emojis e blocos de código com CSS customizado.
- Fontes/assets: logo `Logo_HR_Imoveis_-_Branco.png` (sobre fundo escuro da capa) e letterhead de `src/assets/contratos/` como referência de marca.
- QA obrigatório: converter cada página do PDF em imagem (`pdftoppm`) e inspecionar todas — tabelas sem corte, texto sem overflow, capa e rodapés corretos, nenhuma página em branco. Corrigir e re-gerar até limpo.
- Nenhuma alteração em código, banco ou no arquivo `docs/FLUXO-CRM.md` — apenas o artefato PDF novo.
