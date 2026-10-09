# Corrigir imóveis que sumiram do site

## Causa confirmada
O site lista imóveis pela visão pública `imoveis_public`, que filtra apenas imóveis com status "Disponível" e publicados. Essa visão passou a exigir que o visitante anônimo tenha permissão de leitura direta na tabela `imoveis` — e essa permissão não existe. Resultado: o banco responde "permission denied" e a página fica vazia, mesmo havendo 64 imóveis disponíveis e publicados.

A proteção por linha (RLS) já existe e está correta: visitantes anônimos só enxergam imóveis "Disponível" + publicados. Falta apenas a permissão de leitura em nível de tabela para que essa regra possa ser aplicada.

## O que será feito
1. **Migração no banco:** conceder leitura (`GRANT SELECT`) da tabela `imoveis` ao papel anônimo (visitantes do site). A segurança continua garantida pela política RLS existente, que limita as linhas visíveis a Disponível + publicado — imóveis não publicados, inativos e vendidos seguem invisíveis.
2. **Verificação:** repetir o teste de acesso anônimo (que hoje retorna "permission denied") e confirmar que retorna os 64 imóveis; conferir a página de imóveis do site e a página de detalhe de um imóvel no preview.

## Detalhes técnicos
- Arquivo: nova migração em `supabase/migrations/` com `GRANT SELECT ON public.imoveis TO anon;`
- A política RLS "Public can view available imoveis" (`status = 'Disponível' AND publicado = true`, papel `anon`) já existe e não será alterada.
- A visão `imoveis_public` usa `security_invoker=true`, por isso depende do grant na tabela base.
- Nenhum dado sensível é exposto: a visão já exclui campos internos (proprietário, corretor, etc.).
