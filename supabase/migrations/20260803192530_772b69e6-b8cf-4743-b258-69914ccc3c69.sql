create or replace function public.check_duplicate_conta_name(_name text)
returns table(entidade text, id uuid, nome text, etapa text, responsavel_nome text)
language sql
stable
security definer
set search_path to 'public'
as $$
  with inp as (
    select nullif(lower(trim(regexp_replace(_name, '\s+', ' ', 'g'))), '') as n
  )
  select 'conta'::text, c.id, c.nome, c.etapa_funil,
         coalesce(p.nome, p.email, '—')
    from public.contas c
    left join public.profiles p on p.user_id = c.responsavel_id
    cross join inp
   where public.is_staff()
     and inp.n is not null
     and lower(trim(regexp_replace(c.nome, '\s+', ' ', 'g'))) = inp.n
   limit 10;
$$;

revoke all on function public.check_duplicate_conta_name(text) from public;
revoke all on function public.check_duplicate_conta_name(text) from anon;
grant execute on function public.check_duplicate_conta_name(text) to authenticated;