# Filtro "Em standby" nos funis e número na Performance

## O que muda
- **Funil de Contas:** novo filtro "Standby" com as opções Todos, Em standby (no prazo), Standby vencido, Sem standby. Fica junto dos filtros atuais e é lembrado na URL como os demais.
- **Funil de Oportunidades:** o mesmo filtro, e o selo "Standby até dd/mm" / "Standby vencido" nos cartões.
- **Relatórios > Performance:** novo indicador "Em standby" por corretor (contas e oportunidades em standby no prazo, e quantas estão vencidas), na tabela, no PDF individual e no "PDF de todos". Atualiza sozinho como o resto da Performance.

## Detalhes técnicos
- `Accounts.tsx`: estado `standbyFilter` (+ rascunho e parâmetro `standby` na URL), aplicado sobre `standby_ate` já carregado.
- `Oportunidades.tsx`: incluir `standby_ate` na consulta, filtro equivalente e `StandbyBadge` no cartão.
- `performancePdf.ts`: `PerformanceCorretor` ganha `emStandby` e `standbyVencido`; `calcularPerformance` conta contas e oportunidades do corretor com `standby_ate` preenchido; exibido na tela da Performance e nos PDFs; teste existente atualizado.
- Sem mudança no banco.
