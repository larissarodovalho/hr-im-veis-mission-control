## Objetivo
Atualizar a página de detalhes do lead (`/app/leads/:id`) para ter as mesmas especificações visuais e funcionais do projeto Brazil Lands, mantendo o schema atual em português (`nome`, `telefone`, `ultima_interacao`, etc.) e funcionalidades já existentes (conversão com detecção de duplicatas, documentos para assinatura).

## O que será adicionado/ajustado em `src/pages/LeadDetail.tsx`

### 1. Cabeçalho do lead
- Layout responsivo: `flex-col lg:flex-row`, avatar `14x14` no mobile / `16x16` no desktop, nome com `break-words`.
- **Novos badges** ao lado da origem:
  - 📅 Idade na base — `ageLabel(ageInDays(lead.created_at))` com `ageColor`.
  - ⏱️ Tempo sem contato — `idleLabel(idleDays(lead.ultima_interacao))` com `idleColor`.
  - Substitui o badge atual "Hoje sem contato" (slaLabel) por essa dupla mais informativa.
- **Linha de metadados** abaixo dos badges:
  - "Entrou em **DD/MM/AAAA** · Última interação: **DD/MM/AAAA** (ou nunca)" usando `formatDateBR`.
- Ações (direita): empilham no mobile (`w-full sm:w-auto`).

### 2. Botão "Editar lead" + Diálogo
- Novo botão `Pencil` ao lado de "Converter em conta".
- Diálogo com campos: nome, telefone, email, região, valor estimado, interesse — atualiza via `updateLead`.

### 3. Card de Contato
- Adicionar botão verde **"Chamar no WhatsApp"** (largura total) quando houver telefone, substituindo o link inline atual. Reaproveita normalização de telefone já existente em `onlyDigits` (adiciona prefixo 55 se faltar) e abre `https://wa.me/...` em nova aba.
- Mantém: telefone, email, região, observações.

### 4. Registrar interação
- Adicionar opção **"Reunião"** no select de Tipo (além das já existentes).
- Mapear labels amigáveis no histórico via `INTERACTION_TYPE_LABEL`.

### 5. Agendar reunião / ligação
- Substituir o formulário atual por versão com seletor **"Tipo"**:
  - `escritorio` → mostra campo Local
  - `virtual` → mostra campo Link
  - `ligacao` → sem local/link, gera registro do tipo "ligação" (usar coluna `tipo` em `reunioes` que já existe).
- `duracao_min`: 30 para ligação, 60 para reunião.
- Após agendar, atualiza `etapa_funil` do lead para `Visita` (reunião) — mantém compatibilidade com STAGES atuais.
- Lista de reuniões com badge de formato + botão de editar (ícone lápis) abrindo diálogo para alterar data, tipo, local/link, status e notas.

### 6. Histórico
- Mantém estrutura atual; usa labels amigáveis para os tipos.

### 7. Documentos para assinatura
- Mantém o card `EntityDocumentsTab` no final (já existe).

## Arquivos a editar
- `src/pages/LeadDetail.tsx` — refatoração do cabeçalho, novos diálogos (editar lead, editar reunião), botão WhatsApp, formulário de agendar com tipo, badges de idade/inatividade.
- `src/lib/leads.ts` — sem mudanças (helpers `ageInDays`, `ageLabel`, `ageColor`, `idleDays`, `idleLabel`, `idleColor`, `formatDateBR` já existem).

## Fora de escopo
- Integração com WhatsApp interno (Brazil Lands tem página `/app/whatsapp` própria); aqui usamos `wa.me` direto como já fazemos.
- Sessões de chat IA (não há tabelas equivalentes neste projeto).
- AssignSelector (não há sistema de atribuição equivalente aqui).
- Mudanças de schema no banco — todas as colunas necessárias (`tipo`, `duracao_min` em `reunioes`) já existem.

Aprove para eu implementar.