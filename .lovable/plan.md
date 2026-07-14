# Exibir autor no histórico de interações (Leads e Contas)

## Situação atual
- **Contas** (`ContaInteracoesTimeline.tsx`): já carrega `authorMap` a partir de `profiles` e mostra `• {autor}` em cada item — **funcionando**.
- **Leads** (`LeadDetail.tsx`, card "Histórico", linhas ~648-664): renderiza tipo, resultado, data, descrição e próxima ação, mas **não mostra quem criou** a interação, mesmo com `created_by` já sendo salvo no insert e o mapa `brokers` já existente na página.

## Mudança
Arquivo único: `src/pages/LeadDetail.tsx`

No card "Histórico", em cada item do `interacoes.map`, adicionar o nome do autor lido de `brokers[i.created_by]` (fallback "—") junto à linha do topo, ao lado da data. Exemplo:

```
[Ligação] atendeu                     Por João Silva · 14/07 09:32
Descrição...
→ Próxima ação
```

Nenhuma mudança de schema, RLS ou lógica de negócio — apenas apresentação. O `brokers` já é populado para o bloco "Criado por" do lead, então basta reutilizar.

## Verificação
- Abrir um lead com histórico e conferir se cada item exibe o nome do corretor.
- Item cujo `created_by` seja nulo (ex.: interações antigas) deve mostrar "—" sem quebrar.
