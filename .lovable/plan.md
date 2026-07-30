# Plano: Trazer todas as contas legadas para o Kanban (Contato estabelecido)

## O que vai acontecer

As 424 contas paradas em etapas do funil antigo serão movidas de uma vez para a coluna **Contato estabelecido**, passando a aparecer no Kanban de Carteira e Marketing. Nenhuma oportunidade de negócio será criada automaticamente.

## Destino de cada grupo (conforme suas respostas)

| Etapa antiga | Qtd | Destino no Kanban |
|---|---|---|
| Oportunidade futura (antiga perdido) | 351 | Contato estabelecido + selo azul "Oportunidade futura" |
| Captação/Imóvel | 36 | Contato estabelecido + selo "Qualificação pendente" |
| Reunião | 16 | Contato estabelecido + selo "Qualificação pendente" |
| Visita | 5 | Contato estabelecido + selo "Qualificação pendente" |
| Proposta | 3 | Contato estabelecido + selo "Qualificação pendente" |
| Fechado | 12 | Contato estabelecido + selo "Qualificação pendente" |
| Permuta | 1 | Contato estabelecido + selo "Qualificação pendente" |

Detalhes:
- As 351 de "Oportunidade futura" ficam com o selo azul e podem ter próxima ação agendada depois, conta a conta.
- As demais entram como "Qualificação pendente" — o time pode qualificar pelo próprio card do Kanban (botão "Continuar") para gerar oportunidade quando fizer sentido.
- 5 contas de Captação/Imóvel não têm categoria (não aparecem nem em Carteira nem em Marketing): serão marcadas como **Carteira** para ficarem visíveis.
- A mudança é silenciosa: não cria registros no histórico de interações (evita 424 entradas de "etapa alterada" na timeline).

## Limpeza da interface

Como não restará nenhuma conta em etapa antiga:
- Remover o aviso amarelo "N conta(s) em etapas legadas não aparecem no Kanban" da página Contas.
- O Kanban passa a receber todas as contas filtradas, sem exclusão.
- O painel "Migração das etapas legadas" na página Oportunidades ficará zerado (mantido, sem uso).

## Verificação
- Consulta no banco confirmando 0 contas em etapas legadas após a migração.
- Teste visual (Playwright): abas Carteira e Marketing mostrando os cards na coluna Contato estabelecido com os selos corretos.

## Detalhes técnicos
- Migração única (`UPDATE` em `public.contas`):
  1. `categoria = 'carteira'` onde `etapa_funil = 'captacao_imovel'` e `categoria IS NULL` (5 contas).
  2. `etapa_funil = 'contato_estabelecido', qualificacao_status = 'oportunidade_futura'` onde `etapa_funil = 'perdido'` (351).
  3. `etapa_funil = 'contato_estabelecido', qualificacao_status = 'pendente'` onde `etapa_funil IN ('captacao_imovel','reuniao','visita','permuta','proposta','fechado')` (73).
- Sem mudanças de RLS, GRANTs ou estrutura de tabelas — apenas atualização de dados.
- Frontend: edição em `src/pages/Accounts.tsx` (remover banner e filtro de exclusão do Kanban).
