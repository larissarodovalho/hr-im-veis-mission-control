## Selecionar responsável dentro do lead

Hoje o responsável (`corretor_id`) só pode ser alterado via Kanban ou ao criar/editar manualmente. Dentro do detalhe do lead não há esse controle.

### Mudança

No `src/pages/LeadDetail.tsx`, adicionar um `Select` "Responsável" na barra superior de ações do lead (ao lado de Temperatura / Etapa), listando todos os perfis ativos e atualizando `corretor_id` via `updateLead({ corretor_id: ... })`.

- Opções: "Sem responsável" + lista de `profiles` (mesmo mapa `brokers` já carregado, complementado com `ativo=true` para filtrar a UI do dropdown).
- Largura/estilo: mesmo padrão dos outros selects desta seção (`w-full sm:w-52 lg:w-56`).
- Sem mudanças de schema/RLS. `updateLead` já existe e persiste alterações no lead.

A linha de informação textual "Responsável: X · Criado por: Y" continua refletindo o valor selecionado automaticamente quando o `lead` recarregar.