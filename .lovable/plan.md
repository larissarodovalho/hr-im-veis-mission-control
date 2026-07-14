## Objetivo

Adicionar em cada conta (Carteira e Marketing) uma seção "Negócios fechados" para registrar fechamentos, permitindo relatórios futuros.

## Banco (migration)

Nova tabela `public.conta_fechamentos`:
- `conta_id` (FK → contas, on delete cascade)
- `data_fechamento` (date, NOT NULL)
- `valor` (numeric)
- `imovel_id` (FK → imoveis, nullable)
- `observacoes` (text)
- `created_by`, `created_at`, `updated_at`

RLS + GRANTs:
- SELECT/INSERT/UPDATE/DELETE para `authenticated` cuja política siga as regras de acesso à conta pai (mesma lógica do `interacoes`: admin/gestor sempre, ou usuário com acesso à conta via `contas` — responsavel, criador, marketing com captação etc.). Reaproveita `public.is_admin()` + subquery na `contas`.
- `service_role`: ALL.
- Trigger `update_updated_at_column` para `updated_at`.
- Índice em `conta_id` e `data_fechamento`.

## Frontend

Novo componente `src/components/contas/ContaFechamentos.tsx`:
- Lista fechamentos por `data_fechamento` desc, mostrando data, valor formatado (BRL), imóvel (código/título vinculado) e observações.
- Formulário inline: date picker (shadcn Calendar), input de valor, SearchableSelect de imóveis, textarea de observações.
- Botões editar/excluir por linha (mesmo padrão de `ContaInteracoesTimeline`).
- Zod validation: `data_fechamento` obrigatória; `valor >= 0` opcional; `observacoes` até 2000 chars.

Integração em `src/pages/AccountDetail.tsx`:
- Renderizar `<ContaFechamentos contaId={conta.id} />` abaixo do timeline de interações, para ambas as origens (Carteira e Marketing — a página é a mesma).

## Fora de escopo (para depois)
- Relatório agregado de fechamentos por período — será adicionado em `Reports.tsx` numa próxima etapa quando você pedir.
