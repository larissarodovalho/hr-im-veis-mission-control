# Funil de Captação de Imóveis

Criar um novo funil Kanban dentro da aba **Imóveis** chamado **"Captação"**, que recebe automaticamente os clientes movidos para a etapa **Captação/Imóvel** do funil de Contas. O marketing (e corretores/gestores) acompanha a captação até a publicação do imóvel no sistema.

## Etapas do novo funil (Imóveis › Captação)

```
Novo (recebido)  →  Agendar captação  →  Detalhamento enviado  →  Captação agendada  →  Concluído (imóvel publicado)
```

- **Novo**: criado automaticamente quando a conta entra na etapa Captação/Imóvel no funil de Contas.
- **Agendar captação**: corretor/marketing entra em contato e marca data da visita técnica.
- **Detalhamento enviado**: envio ao cliente do checklist (casa arrumada, documentos, etc.) antes da captação.
- **Captação agendada**: visita confirmada com data/hora.
- **Concluído**: imóvel já cadastrado e publicado; link enviado ao cliente.

## Sincronização com Contas

- Quando uma conta entra em **Captação/Imóvel**, é criado automaticamente um card de captação (estágio "Novo") vinculado à conta. Se já existir um card ativo para aquela conta, não duplica.
- Se a conta sair da etapa Captação/Imóvel, o card permanece (não é apagado) — apenas a criação é automática.
- Ao concluir a captação e vincular um imóvel cadastrado, o card é marcado como Concluído e o imóvel é referenciado.

## Visibilidade e permissões

- **Marketing**: pode visualizar e editar o funil de captação (mesma permissão atual de imóveis para marketing).
- **Admin/Gestor**: acesso total.
- **Corretor**: vê os cards que criou ou em que é responsável.
- RLS reaproveita o padrão já usado em `imoveis` / `oportunidades`.

## Notificações

- Toast no app + entrada em `activity_log` quando um novo card chega ao estágio "Novo" (criado pela sincronização).
- Toast ao mover etapas.
- (Notificação por e-mail/WhatsApp fica fora do escopo desta primeira versão — pode ser adicionada depois.)

## UI

- Nova aba **"Captação"** dentro de `src/pages/Imoveis.tsx` (ao lado de Disponíveis, Em Proposta, Vendidos, Parceiros, Oportunidades).
- Componente `CaptacaoTab.tsx` com Kanban drag-and-drop (mesmo padrão visual de `OportunidadesTab` e `ContasKanban`).
- Card mostra: nome da conta, telefone, responsável, data prevista, badge da etapa, link para a conta.
- Dialog de detalhes do card: data de agendamento, checklist enviado (texto livre), observações, vincular imóvel cadastrado (quando concluído).

## Detalhes técnicos

- Nova tabela `captacoes_imovel`:
  - `conta_id` (uuid, refer. contas)
  - `estagio` (text: `novo`, `agendar`, `detalhamento`, `agendada`, `concluido`)
  - `data_agendada` (timestamptz, opcional)
  - `checklist_enviado` (bool) + `checklist_observacoes` (text)
  - `imovel_id` (uuid, opcional — preenchido no Concluído)
  - `responsavel_id`, `created_by`, `created_at`, `updated_at`, `observacoes`
- Trigger `AFTER UPDATE ON contas`: quando `etapa_funil` muda para `captacao_imovel` e não existe captação ativa para a conta, insere `captacoes_imovel` com estágio `novo`.
- RLS: SELECT para staff (admin/gestor/marketing/corretor responsável/criador), INSERT para staff, UPDATE para admin/gestor/marketing/responsável/criador, DELETE só admin.
- Frontend:
  - `src/lib/captacaoFunil.ts` com tipos e etapas.
  - `src/pages/imoveis/CaptacaoTab.tsx` (Kanban + DnD com `@dnd-kit/core`, igual ao padrão de Oportunidades).
  - Dialog `CaptacaoDetalheDialog.tsx` para editar card.
  - Registrar aba em `src/pages/Imoveis.tsx`.
- Backfill opcional: ao rodar a migração, criar cards "novo" para todas as contas atualmente em `captacao_imovel` que ainda não têm captação.

## Fora de escopo (confirmar depois)

- Notificação por e-mail/WhatsApp ao responsável quando chega um novo card.
- Templates pré-definidos do checklist de detalhamento (por ora é texto livre).
- Automação ao concluir: criar rascunho do imóvel a partir dos dados da conta (por ora o usuário cria pelo botão "Novo Imóvel" e vincula).
