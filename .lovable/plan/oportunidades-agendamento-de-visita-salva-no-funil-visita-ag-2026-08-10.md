# Oportunidades: agendamento de visita salva no funil "Visita agendada"

## Problema

Na aba Visitas do detalhe da oportunidade:

- Ao agendar uma visita, a oportunidade só é movida para a coluna "Visita agendada" quando ela está no estágio "Buscando imóvel". Em qualquer outro estágio (ex.: "Nova"), a visita é criada mas o card não muda de coluna — não existe um botão explícito para salvar/mover no funil.
- Os campos de feedback da visita realizada (interesse, próxima ação, feedback, pontos positivos, objeções) só salvam ao sair do campo, sem botão de salvar visível.
- O botão "Avançar p/ Proposta" aparece assim que a visita é marcada como realizada, incentivando pular a etapa antes de registrar o resultado da visita.

## O que muda

### 1. Botão de salvar que move para o funil "Visita agendada"
- O botão do formulário passa a ser "Agendar e mover p/ Visita agendada".
- Ao salvar, a oportunidade é movida para o estágio "Visita agendada" a partir de qualquer estágio ativo (não só de "Buscando imóvel"), com registro no histórico.
- Se a oportunidade já estiver em "Visita agendada", apenas salva a visita.
- Estágios finais (Ganha/Perdida) continuam sem alteração automática.

### 2. Salvar o resultado da visita
- No bloco da visita realizada, incluir um botão "Salvar resultado da visita" que grava interesse, próxima ação, feedback, pontos positivos e objeções de uma vez, com confirmação visual e registro no histórico.
- Manter o salvamento ao sair do campo como rede de segurança.

### 3. Ordem correta das etapas
- "Avançar p/ Proposta" fica desabilitado (com dica explicando o motivo) enquanto a visita não estiver com status "Realizada" e com o resultado preenchido (interesse do cliente registrado).
- "Voltar p/ Buscando imóvel" permanece disponível.

## Detalhes técnicos

- Arquivo único: `src/components/oportunidades/OportunidadeDetailDialog.tsx`.
- `salvarVisita`: trocar a condição `if (op.estagio === "buscando")` por mover para `visita` sempre que o estágio atual for ativo e diferente de `visita`.
- Novo estado local por visita para o formulário de resultado + handler `salvarResultadoVisita(id)` usando o mesmo `updateVisita`.
- Sem mudanças de banco, RLS ou edge functions.
