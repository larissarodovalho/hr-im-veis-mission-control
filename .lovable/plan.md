## Objetivo
Gerar um **PDF de treinamento corporativo** para os corretores da HR Imóveis, cobrindo em detalhe o preenchimento das abas **Leads**, **Contas** e **Imóveis** do CRM, com foco no *porquê* de cada campo/seção e no impacto que ele tem no funil, atribuição, comunicação e relatórios.

## Formato e entrega
- Arquivo único **PDF** em `/mnt/documents/treinamento-preenchimento-crm-hr-imoveis.pdf`.
- Layout profissional em página A4, com capa, sumário, seções por módulo, cards de "Importância", "Boas práticas" e "Impacto se não preenchido", e checklist final.
- Tipografia Unicode (DejaVu Sans) para suportar acentos.
- Paleta discreta alinhada ao CRM (tons neutros + azul primário).
- Sem imagens externas — apenas tipografia, filetes, caixas coloridas e ícones textuais (evita dependência de assets).

## Estrutura do documento

### Capa
- Título: "Treinamento — Preenchimento do CRM"
- Subtítulo: "Padrões e boas práticas para Leads, Contas e Imóveis"
- HR Imóveis · Uso interno · Julho/2026

### 1. Introdução — por que o preenchimento importa
- Qualidade de dado = qualidade de atendimento e de decisão.
- Impacto direto em: distribuição de leads, funil, relatórios de performance, comissionamento, marketing e histórico do cliente.
- Regra geral: campo em branco = informação perdida para sempre.

### 2. Módulo Leads
Explicar cada seção do formulário e do detalhe do lead:
- **Identificação** (nome, telefone, e-mail): base para contato e deduplicação.
- **Origem / Campanha / Meta Ads (form data)**: mede ROI de marketing e alimenta relatório Leads→Contas.
- **Etapa do funil** (novo → em atendimento → reunião → visita → proposta → permuta → fechado / perdido): rege o Kanban, os relatórios e as automações.
- **Responsável**: define visibilidade (RLS) e entra na performance por corretor.
- **Criado por**: rastreabilidade de quem originou o contato.
- **Interesse / observações / qualificações do formulário Meta**: base para o pitch.
- **Histórico de interações**: cada anotação registra o corretor autor — evita cliente atendido em duplicidade.
- **Última interação**: alimenta alertas de follow-up.

### 3. Módulo Contas
- **Dados do cliente** (nome, documento, telefone, e-mail, endereço): necessários para contrato e ClickSign.
- **Responsável x Criado por**: distinção importante para relatórios.
- **Etapa do funil** (Carteira e Marketing): explicar cada coluna, incluindo *Oportunidade futura*, *Permuta*, *Fechado*.
- **Captação de imóvel vinculada**: quando aplicável, ativa o fluxo de captação.
- **Agenda rápida — Reunião, Ligação, Visita, Captação, Proposta**: quando usar cada botão.
- **Propostas**: registrar data, valor, imóvel vinculado, status (pendente/aceita/recusada). Alimenta relatório de Propostas, ranking de imóveis e clientes.
- **Negócios fechados**: data, valor, imóvel — base para o relatório anual de fechamentos e comissionamento.
- **Histórico de interações**: mesmo padrão do Lead.

### 4. Módulo Imóveis
- **Código (HR-XXXX)**: gerado automaticamente — não alterar.
- **Título e descrição**: SEO no site público; primeiro contato do cliente.
- **Tipologia, finalidade, status** (disponível / reservado / vendido).
- **Endereço completo e coordenadas**: essenciais para mapa e filtros do site.
- **Área, quartos, suítes, vagas, valor, condomínio, IPTU**: filtros do site e comparativos.
- **Fotos** (bucket público) e **imagens originais** (bucket restrito): qualidade da vitrine.
- **Documentos do imóvel**: necessários para due diligence e contrato.
- **Captação — funil e etapas**: novo → em análise → documentação → publicado → enviar detalhamento 24h antes → concluído.
- **Vinculação a proprietário (conta)**: garante rastreabilidade.

### 5. Boas práticas transversais
- Sempre atribuir responsável.
- Registrar toda interação relevante (voz, WhatsApp, e-mail) no histórico.
- Preferir atualizar o card no Kanban em vez de manter anotações paralelas.
- Anexar documentos no imóvel/conta em vez de trocar por WhatsApp.
- Revisar campos obrigatórios antes de mover para "Fechado".

### 6. Impacto nos relatórios
Explicar como cada campo alimenta cada relatório:
- Funil de Contas · Leads→Contas · Performance por Corretor · Fechamentos · Propostas · Imóveis · Faturamento.
- Ressaltar que dados faltantes distorcem a análise e o comissionamento.

### 7. Checklist rápido (uma página final)
Lista objetiva "antes de fechar o card" para Lead, Conta e Imóvel.

## Ferramenta
- Python + **reportlab** (Platypus) para gerar o PDF, com estilo consistente, quebras controladas, boxes coloridos e checklists.
- Registro de fonte **DejaVu Sans** para acentuação.
- Após gerar: converter cada página para JPG (`pdftoppm`), inspecionar visualmente todas, corrigir problemas de overflow/quebras e regerar até ficar limpo. QA descrito ao final da entrega.

## Arquivos criados
- Script temporário em `/tmp/build_treinamento_pdf.py` (não persistente).
- Entrega final: `/mnt/documents/treinamento-preenchimento-crm-hr-imoveis.pdf` com `<presentation-artifact>`.
