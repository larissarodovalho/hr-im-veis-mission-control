# Plano: Gestão de interações pelo admin + Fuso horário de Cuiabá

## Parte 1 — Administrador edita e exclui interações/tentativas

O banco já permite (política de exclusão para admin e de edição para admin/gestor) — falta só a interface. Hoje a timeline de Contas tem botão de excluir para admin, mas o Histórico do Lead não tem nada, e edição não existe em lugar nenhum.

**Novo componente compartilhado** `src/components/interacoes/EditarInteracaoDialog.tsx`:
- Modal com: tipo da interação, resultado, descrição e **data/hora** (input `datetime-local` no horário de Cuiabá).
- Ao salvar: atualiza a interação. Se for registro de tentativa ("1ª/2ª/3ª tentativa · …"), o selo de **pontualidade é recalculado** automaticamente a partir da nova data/hora.
- Botão **Excluir** com confirmação via `AlertDialog` (substitui o `confirm()` nativo atual).

**Onde aparece (somente para admin):**
- `src/pages/LeadDetail.tsx` — card **Histórico**: lápis (editar) e lixeira (excluir) em cada interação. Após alterar/excluir, o card de Tentativas se atualiza sozinho (excluir uma tentativa a devolve para "pendente").
- `src/components/contas/ContaInteracoesTimeline.tsx` — adiciona botão de editar ao lado do excluir já existente.

## Parte 2 — Fuso horário fixo: America/Cuiaba (UTC-4)

Problemas encontrados na análise:
- Dashboard: gráfico de leads agrupa por data **UTC** — depois das 20h de Cuiabá o "hoje" vira o dia seguinte e leads criados à noite caem no dia errado.
- Visitas do site: função do banco agrupa por data UTC e o card "hoje" compara em UTC — mostra 0 visitas à noite.
- Demais horários (histórico, prazos das tentativas) usam o relógio do navegador, que desanda se alguém acessar de outro fuso.

**Solução:**
- Nova lib `src/lib/datetime.ts` com `CRM_TZ = 'America/Cuiaba'` e funções: `fmtDateTime`, `fmtDate`, `fmtTime`, `dayKeyCRM` (chave AAAA-MM-DD em Cuiabá), `todayCRM`, e conversores para o input de data/hora do modal de edição.
- **Migração no banco**: recria `get_site_visits_daily` agrupando visitas pela data de Cuiabá e ancorando a série no "hoje" de Cuiabá.
- Telas atualizadas para usar a lib: Dashboard (gráficos e cards), prazos/pontualidade das tentativas (`src/lib/leads.ts`), Histórico do Lead, timeline das Contas.
- Resultado: todo o time vê sempre horário de Cuiabá, acessando de onde estiver; agrupamentos diários viram o dia à meia-noite de Cuiabá.

## Verificação
- Build sem erros; teste visual (Playwright) mostrando os botões de admin no histórico e horários exibidos em Cuiabá (ex.: 15:35 quando UTC marca 19:35).

## Detalhes técnicos
- Sem novas políticas RLS: admin já pode excluir/editar `interacoes` no banco.
- Recálculo de pontualidade: mesma função `tentativaPontualidade` (tolerância de 1h) usando `data_entrada` do lead + prazo da tentativa vs. nova `created_at`.
- Conversão do input `datetime-local`: feita com partes do `Intl.DateTimeFormat` em America/Cuiaba, sem nova dependência.
- Migração única: apenas recria a função `get_site_visits_daily` (SECURITY DEFINER preservado).