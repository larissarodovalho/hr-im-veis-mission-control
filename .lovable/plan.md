# Documentar a sequência do CRM (Leads → Contas → Oportunidades)

## Objetivo

Criar um documento completo em português, `docs/FLUXO-CRM.md`, descrevendo o fluxo comercial do CRM — etapas, ações, regras de negócio e automações de cada aba — para servir de especificação na implantação de outro CRM. Nenhuma alteração de código ou banco: apenas um arquivo de documentação novo.

## Conteúdo do documento

### 1. Visão geral da jornada
```text
LEAD (entrada)            CONTA (relacionamento)           OPORTUNIDADE (negócio)
Novo Lead ──────────────► A contatar ──────────────────► (qualificação) Nova
Pré-atendimento           Contatado                        Buscando imóvel
Em Contato ─────────────► Sem retorno                      Visita agendada
Conversa Ativa            Contato estabelecido ──────────► Proposta
Perdido                   Contato cancelado                Ganha / Perdida
     conversão (com verificação de duplicidade e Unificar)
     destino "Captação/Reunião" cria card no funil de Captação (Imóveis)
```
Diagrama da sequência completa com os pontos de transição entre abas.

### 2. Aba Leads
- Funil Kanban de 5 etapas: Novo Lead → Pré-atendimento → Em Contato → Conversa Ativa → Perdido.
- Fluxo de atendimento com SLA de 3 tentativas ancorado na entrada do lead: 1ª mensagem imediata, 2ª áudio em +24h, 3ª ligação em +48h; status por tentativa (feita/vencida/pendente), pontualidade (adiantada/no prazo/atrasada, tolerância 1h) e situação consolidada (sem tentativa / no prazo / atrasado / concluído) no painel Atendimento.
- Ações de etapa: "Sucesso no contato" (atribui corretor, move para Conversa Ativa) e "Sem contato" (cria tarefa de retorno em +24h).
- Atributos: temperatura (frio/morno/quente), tipo de acompanhamento (IA/manual/corretor), origem (Meta Ads, Google Ads, Chat IA, WhatsApp, site, indicação, manual, webhook), interesse, responsável e criador.
- Tag de tarefa futura com contagem regressiva no card; leads com tarefa futura não aparecem como "sem atendimento".
- Filtros: busca, "Precisam nutrição" (≥4 dias sem contato e sem tarefa futura), ordenação por ociosidade.
- Conversão em Conta: verificação de duplicidade na base de contas (telefone/e-mail/CPF bloqueiam; nome apenas avisa), botão Unificar (migra histórico para a conta existente) ou Editar; histórico de interações migra automaticamente na conversão.
- Desclassificação com 9 motivos; follow-up por IA via WhatsApp; exclusão restrita a admin.

### 3. Aba Contas
- Categorias: Carteira e Marketing (Kanban com visões Carteira / Marketing / Todos; abre por padrão na Carteira).
- Funil de 5 etapas: A contatar → Contatado → Sem retorno → Contato estabelecido → Contato cancelado (etapas comerciais antigas preservadas como legado).
- Fluxo de atendimento por etapa: 1º contato (mensagem), 2º contato (áudio/ligação) com desfechos (respondeu → contato estabelecido; sem resposta → sem retorno; inválido → cancelamento com motivo).
- Destino comercial em Contato estabelecido (ação, não coluna): Captação/Reunião (cria card automático no funil de Captação de Imóveis), Comprar — Oportunidade (abre qualificação), Vender — HRX Produções, Oportunidade futura.
- Qualificação → Oportunidade: gerar agora (com campos mínimos), oportunidade futura (próxima ação + tarefa) ou não qualificado (cancela com motivo); selos de status de qualificação.
- Detalhe da conta: fluxo de atendimento, agenda, tarefas, propostas, fechamentos, linha do tempo de interações, imóveis vinculados e documentos.
- Temperatura, tag de tarefa countdown, alteração de categoria com motivo; exclusão restrita a admin.

### 4. Aba Oportunidades
- Funil de 6 etapas: Nova → Buscando imóvel → Visita agendada → Proposta → Ganha / Perdida.
- Diagnóstico mínimo para sair de Nova: conta vinculada, descrição da busca, tipo de imóvel, cidade/região, valor-alvo e corretor; alerta de diagnóstico atrasado (>5 dias).
- Prioridade (alta/média/baixa), tempo na etapa, dias sem ação; KPIs de ativas, paradas e vínculo pendente.
- Ganha: dialog obrigatório (imóvel negociado, valor final, data, corretor) que gera registro de fechamento na conta e pode marcar o imóvel como vendido.
- Perdida: dialog obrigatório com 11 motivos e destino da conta (oportunidade futura / continuar relacionamento / contato cancelado), sempre com tarefa de retorno e nota no histórico.
- Sub-recursos: visitas (6 status), propostas (8 status), vínculo de imóveis (vinculado/apresentado/rejeitado).
- Filtros: corretor, categoria, tipo de imóvel, origem, vínculo com conta, prioridade, período, permuta, finalizadas.

### 5. Automações e integrações transversais
- Conversão lead → conta com migração automática de interações (trigger) e RPC de unificação (interações, tarefas e reuniões).
- Destino Captação/Reunião → criação automática de card na Captação de Imóveis (com reversão segura).
- Notificação por e-mail a cada novo lead (por usuário, com toggle).
- WhatsApp integrado (caixa de entrada, follow-up com IA, envio direto).
- Tarefas com contagem regressiva em Leads e Contas; relatórios espelhando os funis; Dashboard com KPIs de ociosidade alinhados.
- Regras transversais: fuso America/Cuiaba em todos os prazos, edição/exclusão de interações apenas para admin, papéis admin/gestor/corretor/marketing/secretaria.

### 6. Modelo de dados essencial
Tabelas e campos-chave por entidade (leads, contas, oportunidades, interações, tarefas, visitas, propostas, fechamentos, captações) e lista de regras de negócio numeradas para checklist de implantação.

## Detalhes técnicos
- Único arquivo novo: `docs/FLUXO-CRM.md` (markdown, PT-BR), sem mudanças em código, banco ou migrations.
- Conteúdo baseado no código atual: `src/lib/leads.ts`, `src/lib/contasFunil.ts`, `src/lib/oportunidadesFunil.ts`, `src/lib/captacaoFunil.ts`, `src/lib/tarefas.ts` e telas correspondentes.
