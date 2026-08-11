# Reordenar "Distribuição de Carteira" na barra lateral

## Hoje
Na barra lateral, dentro do grupo **CRM — Comercial**, as sub-abas seguem esta ordem:
Leads, Contatos, Kanban, **Distribuição de Carteira**, Minha Carteira, Imóveis, Funil de Vendas, Controle de Criação, Análise de Leads, Oportunidades, Visitas, Agenda, Tarefas, **Relatórios**, Propostas, WhatsApp.

A aba "Distribuição de Carteira" aparece cedo (logo após Kanban), longe do bloco de relatórios/acompanhamento.

## O que será feito
Mover a entrada "Distribuição de Carteira" para logo após "Relatórios" na lista `CRM_SUBTABS` em `src/components/AppSidebar.tsx`. Nova ordem desse trecho:
… Tarefas, **Relatórios, Distribuição de Carteira**, Propostas, WhatsApp.

Nenhuma outra alteração — rota, ícone e permissões continuam iguais. O gestor/admin continua vendo a aba; o corretor continua sem vê-la (já está fora de `CORRETOR_ALLOWED_CRM`).

## Detalhe técnico
- Único arquivo alterado: `src/components/AppSidebar.tsx` (array `CRM_SUBTABS`, linhas ~44–61).
- Trata-se apenas de reordenar o objeto `{ label: "Distribuição de Carteira", value: "carteira", icon: Briefcase }` para a posição seguinte ao item "Relatórios".
