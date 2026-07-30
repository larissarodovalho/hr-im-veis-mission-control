# Estrutura atual do funil da aba Contas — MAPA INFORMATIVO (sem alterações)

Pedido do usuário: visualizar a estrutura do funil da aba Contas (Carteira e Marketing) antes de decidir alterações. Este documento apenas descreve o estado atual — **nenhuma implementação será feita** até o usuário definir o que quer mudar.

## 1. Organização da aba Contas

A aba tem 3 listas, separadas pela **tag** salva na conta (`contas.tags`):

- **Todos** (somente visão de lista)
- **Carteira** (tag `carteira`) — Kanban + Lista
- **Marketing** (tag `marketing`) — Kanban + Lista

Carteira e Marketing usam **exatamente o mesmo funil** (mesmas 12 colunas); o que muda é apenas quais contas aparecem em cada lista.

## 2. As 12 colunas do Kanban (ordem atual)

```text
1. A contatar
2. Contatado
3. Sem retorno
4. Contato estabelecido
5. Captação/Imóvel
6. Reunião
7. Visita
8. Permuta
9. Proposta
10. Fechado
11. Oportunidade futura   (id interno: "perdido")
12. Parceiros
```

- Etapa gravada em `contas.etapa_funil` (campo texto, sem enum no banco).
- Movimentação: arrastar e soltar no Kanban, menu "⋯" do card ("Mover para etapa") ou seletor na edição da conta.
- Conta nova sem etapa cai automaticamente em "A contatar".

## 3. O que aparece no card do Kanban

- Nome (link para o detalhe da conta), telefone/e-mail
- Badge de temperatura (🔥 Quente / 🌤️ Morno / ❄️ Frio)
- Badge de interesse (Compra, Venda, Permuta etc.)
- Badge do responsável e do criador do cadastro
- Badge "Parceiro" (quando `is_partner`)
- Valor total dos imóveis vinculados

## 4. Como as contas entram no funil hoje

| Origem | Onde cai |
|---|---|
| Lead convertido em **Conta Cliente** (aba Leads) | Contas › **Marketing** › A contatar (tag `marketing`) |
| Lead convertido em **Conta Desclassificada** | Fica em A contatar com tag `desclassificado` + motivo registrado (sem tratamento visual próprio ainda) |
| Cadastro manual (botão Nova Conta) | Lista conforme tag escolhida, etapa A contatar |
| Importação de planilha | Conforme tags importadas |

## 5. Regras de visibilidade (banco)

- Corretor vê apenas as próprias contas (responsável/criador) e contas vinculadas às suas oportunidades/captações.
- Admin, gestor e marketing veem todas.

## 6. Relatórios ligados a este funil

- Aba Relatórios usa as etapas de **Contas** (não Leads) para performance de conversão.
- Relatório "Funil de Contas" lê as mesmas 12 etapas.

## 7. Pontos de atenção para futuras alterações

- "Oportunidade futura" é o id `perdido` internamente — renomear exige cuidado com o id, não só o rótulo.
- A coluna "Parceiros" convive com o filtro "Apenas parceiros" (flag `is_partner`) — são dois mecanismos diferentes hoje.
- Contas desclassificadas não têm coluna própria — ficam misturadas em "A contatar".
- As etapas comerciais (Reunião, Visita, Permuta, Proposta, Fechado) hoje vivem aqui em Contas; no funil de Leads elas já foram desativadas e viraram legado.

## Próximo passo

Aguardar o usuário indicar as alterações desejadas (renomear, reordenar, adicionar/remover colunas, tratar desclassificadas, separar funis de Carteira e Marketing etc.). Nenhum arquivo será modificado nesta etapa.
