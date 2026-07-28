
## Análise de duplicidade — Leads x Contas

Comparei todos os leads com todas as contas por 4 critérios (em ordem de confiança):
1. `lead_id_origem` — conta já foi convertida do lead
2. E-mail normalizado
3. Telefone (últimos 10 dígitos)
4. Nome exato (normalizado)

### Duplicidades encontradas (19)

**Já vinculados via `lead_id_origem` (11) — o lead deveria estar oculto no funil, mas se aparecer é bug de cache:**
- Aguinaldo Luis
- Brasil [Lead HRX]
- Diego Maldonado Vani
- Dra Marine M.Borges
- Kelly Negrão
- Marco Aurelio
- Rafael Francisco De Castilho
- Raphael Bragagnolo
- Rodrigo Watanabe
- Tiago Ramalho da Silva
- (+1 duplicidade extra de Kelly Negrão que tem 2 contas)

**Duplicados por telefone, sem vínculo (5):**
- Denis Fardin (lead) ↔ Denis Fardin (conta carteira / gabriel-souza)
- Elaine Augusta Franco Pedro Pereira (lead) ↔ Elaine Franco (conta carteira / hans-rodovalho)
- Lakis allan (lead) ↔ Allan Lekis (conta carteira / hans-rodovalho)
- Lina Melli (lead) ↔ Lina Melli (conta carteira / gabriel-souza)
- Roberto Alves (lead) ↔ Carlos Roberto Alves (conta marketing)

**Duplicados por nome, sem vínculo (3):**
- Gerson Borges (lead) ↔ Gerson Borges (conta carteira / gabriel-souza)
- Marco Aurelio (lead) ↔ Marco Aurelio (conta carteira / gabriel-souza) — além do vínculo com a outra conta
- Tiago Pacheco (lead) ↔ Tiago Pacheco (conta carteira / hans-rodovalho)

**Conta duplicada dela mesma:**
- Kelly Negrão aparece em 2 contas (marketing + carteira / gabriel-souza) — precisa mesclar

### Plano de ação sugerido

1. **Backfill de vínculo**: para cada par acima sem `lead_id_origem`, gravar `contas.lead_id_origem = lead.id` na conta mais recente/relevante. Isso faz o lead sumir automaticamente do funil (o filtro `convertedIds` já usa esse campo).
2. **Migrar histórico**: rodar o mesmo backfill de interações órfãs (`interacoes.lead_id = X` sem `conta_id`) que já usamos na conversão, para essas 8 contas passarem a ver o histórico do lead.
3. **Kelly Negrão duplicada**: manter a conta de marketing (mais recente / com etapa ativa "visita") e arquivar a segunda — te confirmo qual antes de excluir.
4. **Prevenção**: no cadastro/edição de lead e conta, alertar quando o telefone ou e-mail já existir na outra tabela (aviso não-bloqueante).

Quer que eu aplique os passos 1 e 2 agora e traga a Kelly separada para você decidir? Se preferir só o relatório, sinaliza.
